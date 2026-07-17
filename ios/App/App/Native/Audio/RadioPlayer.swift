import Foundation
import AVFoundation

// Native port of src/lib/radio-fx.ts — makes the ElevenLabs ATC voice sound
// like a real comm radio instead of clean TTS. AVAudioEngine graph:
//   voice → EQ(highpass 320 · lowpass 2700 · presence +6@1800) → distortion → mix
//   noise(looping white) → bandpass 1600 → mix   (static bed + squelch clicks)
// "clean" bypasses the band-squeeze; "busy" narrows the band + more static.
// (The web's party-line chatter clips in busy mode aren't ported.)
enum RadioMode: String, CaseIterable, Identifiable {
    case clean, radio, busy
    var id: String { rawValue }
    var label: String {
        switch self {
        case .clean: return "Clean"
        case .radio: return "Radio"
        case .busy: return "Busy freq"
        }
    }
}

@MainActor
final class RadioPlayer {
    private let engine = AVAudioEngine()
    private let voice = AVAudioPlayerNode()
    private let eq = AVAudioUnitEQ(numberOfBands: 3)
    private let distortion = AVAudioUnitDistortion()
    private let noise = AVAudioPlayerNode()
    private let noiseEQ = AVAudioUnitEQ(numberOfBands: 1)
    private var attached = false
    private var voiceFormat: AVAudioFormat?

    var mode: RadioMode = loadMode()

    private static let staticLevel: [RadioMode: Float] = [.clean: 0, .radio: 0.012, .busy: 0.03]
    private static let squelchLevel: [RadioMode: Float] = [.clean: 0, .radio: 0.09, .busy: 0.16]

    // MARK: graph

    // Attach nodes + wire the (fixed-format) noise bed once.
    private func attachOnce() {
        guard !attached else { return }
        attached = true
        let std = AVAudioFormat(standardFormatWithSampleRate: 44_100, channels: 1)!

        for node in [voice, eq, distortion, noise, noiseEQ] as [AVAudioNode] { engine.attach(node) }

        engine.connect(noise, to: noiseEQ, format: std)
        engine.connect(noiseEQ, to: engine.mainMixerNode, format: std)

        let nb = noiseEQ.bands[0]
        nb.filterType = .bandPass; nb.frequency = 1600; nb.bandwidth = 1.0; nb.bypass = false

        distortion.loadFactoryPreset(.multiDistortedCubed)
        distortion.preGain = -6

        configure(for: mode)
        scheduleNoiseLoop(format: std)
    }

    // Connect the voice chain with the actual file format each play — TTS clips
    // *should* be uniform, but reconnecting avoids a hard format-mismatch assert
    // if they ever aren't.
    private func connectVoice(format: AVAudioFormat) {
        if voiceFormat == format { return }
        voiceFormat = format
        engine.connect(voice, to: eq, format: format)
        engine.connect(eq, to: distortion, format: format)
        engine.connect(distortion, to: engine.mainMixerNode, format: format)
    }

    private func configure(for mode: RadioMode) {
        let hp = eq.bands[0], lp = eq.bands[1], presence = eq.bands[2]
        hp.filterType = .highPass; hp.bypass = false
        lp.filterType = .lowPass; lp.bypass = false
        presence.filterType = .parametric; presence.frequency = 1800; presence.bandwidth = 1.0; presence.bypass = false

        switch mode {
        case .clean:
            hp.frequency = 20; lp.frequency = 20_000; presence.gain = 0
            eq.globalGain = 0; distortion.wetDryMix = 0
        case .radio:
            hp.frequency = 320; lp.frequency = 2700; presence.gain = 6
            eq.globalGain = 1.5; distortion.wetDryMix = 14
        case .busy:
            hp.frequency = 380; lp.frequency = 2500; presence.gain = 8
            eq.globalGain = 2.5; distortion.wetDryMix = 22
        }
    }

    private func scheduleNoiseLoop(format: AVAudioFormat) {
        let frames = AVAudioFrameCount(format.sampleRate * 2)
        guard let buf = AVAudioPCMBuffer(pcmFormat: format, frameCapacity: frames) else { return }
        buf.frameLength = frames
        if let ch = buf.floatChannelData?[0] {
            for i in 0..<Int(frames) { ch[i] = Float.random(in: -1...1) }
        }
        noise.scheduleBuffer(buf, at: nil, options: .loops)
        noise.volume = 0
    }

    // MARK: playback

    /// Plays MP3/AAC bytes through the radio chain. `onFinished` fires on the main
    /// actor when the transmission ends (used to key the recorder open, like a
    /// real radio: you reply after the controller un-keys).
    func play(_ data: Data, onFinished: (() -> Void)? = nil) {
        do {
            let session = AVAudioSession.sharedInstance()
            try session.setCategory(.playback, mode: .default)
            try session.setActive(true)

            let url = FileManager.default.temporaryDirectory
                .appendingPathComponent("atc-\(UUID().uuidString).mp3")
            try data.write(to: url)
            let file = try AVAudioFile(forReading: url)

            attachOnce()
            connectVoice(format: file.processingFormat)
            if !engine.isRunning { engine.prepare(); try engine.start() }

            voice.volume = mode == .clean ? 1.0 : (mode == .busy ? 1.28 : 1.18)
            if mode != .clean { noise.play(); cueSquelch() }
            voice.play()

            voice.scheduleFile(file, at: nil) { [weak self] in
                Task { @MainActor in
                    self?.releaseSquelch()
                    try? FileManager.default.removeItem(at: url)
                    onFinished?()
                }
            }
        } catch {
            onFinished?()   // never strand the caller's state machine on audio failure
        }
    }

    func stop() {
        voice.stop()
        noise.stop()
        if engine.isRunning { engine.stop() }
    }

    func setMode(_ m: RadioMode) {
        mode = m
        Self.saveMode(m)
        if attached { configure(for: m) }
    }

    // MARK: squelch — brief noise bump on key-up / key-down

    private func cueSquelch() {
        let bed = Self.staticLevel[mode] ?? 0
        let peak = Self.squelchLevel[mode] ?? 0
        noise.volume = peak
        DispatchQueue.main.asyncAfter(deadline: .now() + 0.06) { [weak self] in
            self?.noise.volume = bed
        }
    }

    private func releaseSquelch() {
        let peak = Self.squelchLevel[mode] ?? 0
        noise.volume = peak
        DispatchQueue.main.asyncAfter(deadline: .now() + 0.1) { [weak self] in
            self?.noise.volume = 0
        }
    }

    // MARK: persistence
    private static let key = "rc_radio_mode"
    private static func loadMode() -> RadioMode {
        RadioMode(rawValue: UserDefaults.standard.string(forKey: key) ?? "") ?? .radio
    }
    private static func saveMode(_ m: RadioMode) {
        UserDefaults.standard.set(m.rawValue, forKey: key)
    }

    /// The persisted mode, for the settings picker. New players pick it up on init;
    /// applies to the next transmission.
    static var savedMode: RadioMode {
        get { loadMode() }
        set { saveMode(newValue) }
    }
}

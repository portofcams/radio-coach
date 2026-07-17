import Foundation
import AVFoundation

// Fallback voice for when the primary ElevenLabs TTS call fails (quota
// exhaustion or an outage) — speaks the transmission with the device's
// built-in voice instead of leaving the training loop dead. No radio FX:
// AVSpeechSynthesizer owns its own audio output, so there's no PCM buffer to
// route through RadioPlayer's AVAudioEngine graph. Mirrors the web fallback
// (commit b7a9bb2) — an honest degradation, not a silent one.
@MainActor
final class SpeechFallbackPlayer: NSObject, AVSpeechSynthesizerDelegate {
    private let synthesizer = AVSpeechSynthesizer()
    private var onFinished: (() -> Void)?

    override init() {
        super.init()
        synthesizer.delegate = self
    }

    func speak(_ text: String, onFinished: (() -> Void)? = nil) {
        do {
            let session = AVAudioSession.sharedInstance()
            try session.setCategory(.playback, mode: .default)
            try session.setActive(true)
        } catch {
            // Non-fatal — the utterance will still attempt to play on
            // whatever session state already exists.
        }
        self.onFinished = onFinished
        synthesizer.stopSpeaking(at: .immediate)
        let utterance = AVSpeechUtterance(string: text)
        utterance.rate = AVSpeechUtteranceDefaultSpeechRate
        synthesizer.speak(utterance)
    }

    nonisolated func speechSynthesizer(_ synthesizer: AVSpeechSynthesizer, didFinish utterance: AVSpeechUtterance) {
        Task { @MainActor in
            let callback = onFinished
            onFinished = nil
            callback?()
        }
    }

    nonisolated func speechSynthesizer(_ synthesizer: AVSpeechSynthesizer, didCancel utterance: AVSpeechUtterance) {
        Task { @MainActor in
            onFinished = nil
        }
    }
}

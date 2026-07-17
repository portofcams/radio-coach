import Foundation
import AVFoundation

// Replaces the Capacitor capacitor-voice-recorder plugin. Records the readback
// to an m4a file (compact — stays under the STT 4MB/~30s cap). ATC playback
// lives in RadioPlayer (radio FX chain), not here.
@Observable
final class AudioManager {
    private var recorder: AVAudioRecorder?
    private var recordingURL: URL?

    var isRecording = false

    func requestPermission() async -> Bool {
        await withCheckedContinuation { cont in
            AVAudioApplication.requestRecordPermission { granted in cont.resume(returning: granted) }
        }
    }

    func startRecording() throws {
        let session = AVAudioSession.sharedInstance()
        try session.setCategory(.playAndRecord, mode: .default, options: [.defaultToSpeaker])
        try session.setActive(true)

        let url = FileManager.default.temporaryDirectory
            .appendingPathComponent("readback-\(UUID().uuidString).m4a")
        let settings: [String: Any] = [
            AVFormatIDKey: Int(kAudioFormatMPEG4AAC),
            AVSampleRateKey: 16_000,          // plenty for speech; keeps the file small
            AVNumberOfChannelsKey: 1,
            AVEncoderAudioQualityKey: AVAudioQuality.medium.rawValue,
        ]
        let rec = try AVAudioRecorder(url: url, settings: settings)
        rec.record()
        recorder = rec
        recordingURL = url
        isRecording = true
    }

    /// Stops recording and returns the captured audio bytes for upload to /api/stt.
    func stopRecording() -> Data? {
        recorder?.stop()
        recorder = nil
        isRecording = false
        guard let url = recordingURL else { return nil }
        defer { try? FileManager.default.removeItem(at: url) }
        return try? Data(contentsOf: url)
    }
}

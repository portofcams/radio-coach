import Foundation

// Pre-rendered scenario/listen/oral audio (Native/Resources/audio/**), generated
// once and bundled with the app so the fixed call library never depends on a
// live TTS call. Falls through to network TTS (then the on-device voice) for
// anything not yet pre-rendered — see ScenarioViewModel/ListenViewModel/OralViewModel.
enum BundledAudio {
    static func data(for id: String) -> Data? {
        guard let path = Bundle.main.path(forResource: id, ofType: "mp3") else { return nil }
        return try? Data(contentsOf: URL(fileURLWithPath: path))
    }
}

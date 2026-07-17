import Foundation
import UIKit
import ActivityKit

// Drives the core training loop (native port of src/app/train/scenario/page.tsx):
// hear the ATC call → record the readback → transcribe → grade. The web version
// layers on radio FX, hints, duel mode, and score animation; those come in a
// later pass — this is the load-bearing loop first.
@Observable
@MainActor
final class ScenarioViewModel {
    enum Phase: Equatable {
        case idle, loadingATC, playingATC, ready, recording, transcribing, grading, done
    }

    let scenario: Scenario
    private let audio = AudioManager()
    let radio = RadioPlayer()
    private let speech = SpeechFallbackPlayer()
    private let client = NetworkClient.shared

    var phase: Phase = .idle
    var transcript = ""
    var result: GradeResult?
    var errorMessage: String?
    var showPaywall = false
    var usingFallbackVoice = false

    // #97 -- Live Activity mirroring the current step on the Lock Screen /
    // Dynamic Island, so the phase (recording / grading / done) is visible
    // without unlocking the phone. Explicit setPhase() rather than a
    // property observer on `phase`: this class is @Observable, and layering
    // a manual didSet on top of that macro's synthesized storage is the kind
    // of subtle interaction this session has no way to runtime-verify --
    // an explicit call site is simpler to be sure about.
    private var liveActivity: Activity<ScenarioActivityAttributes>?

    init(scenario: Scenario) { self.scenario = scenario }

    private func setPhase(_ p: Phase) {
        phase = p
        updateLiveActivity(for: p)
    }

    private static func phaseLabel(_ p: Phase) -> String {
        switch p {
        case .idle: return "Ready to start"
        case .loadingATC, .playingATC: return "Playing the ATC call"
        case .ready: return "Your turn — key up"
        case .recording: return "Recording your readback"
        case .transcribing: return "Transcribing"
        case .grading: return "Grading"
        case .done: return "Done"
        }
    }

    private func updateLiveActivity(for p: Phase) {
        guard ActivityAuthorizationInfo().areActivitiesEnabled else { return }
        let state = ScenarioActivityAttributes.ContentState(phaseLabel: Self.phaseLabel(p))
        if p == .idle {
            // Reset (Try again / navigated away) -- end promptly, nothing to show.
            if let liveActivity {
                Task { await liveActivity.end(nil, dismissalPolicy: .immediate) }
                self.liveActivity = nil
            }
            return
        }
        if let liveActivity {
            Task { await liveActivity.update(ActivityContent(state: state, staleDate: nil)) }
            if p == .done {
                Task { await liveActivity.end(ActivityContent(state: state, staleDate: nil), dismissalPolicy: .after(.now.addingTimeInterval(20))) }
                self.liveActivity = nil
            }
        } else if p != .done {
            let attrs = ScenarioActivityAttributes(scenarioTitle: scenario.title)
            liveActivity = try? Activity.request(attributes: attrs, content: ActivityContent(state: state, staleDate: nil))
        }
    }

    private struct TTSRequest: Encodable { let text: String }
    private struct STTResponse: Decodable { let text: String }
    private struct GradeRequest: Encodable { let scenarioId: String; let readback: String }

    func playATC() async {
        errorMessage = nil
        usingFallbackVoice = false
        setPhase(.loadingATC)
        if let bundled = BundledAudio.data(for: scenario.id) {
            setPhase(.playingATC)
            radio.play(bundled) { [weak self] in self?.setPhase(.ready) }
            return
        }
        do {
            let bytes = try await client.requestBytes("/api/tts", body: TTSRequest(text: scenario.atcTransmission))
            setPhase(.playingATC)
            // Key the recorder open only after ATC un-keys — like a real radio.
            radio.play(bytes) { [weak self] in self?.setPhase(.ready) }
        } catch {
            // Primary ATC voice unavailable (ElevenLabs quota/outage) — degrade
            // honestly to the device's built-in voice instead of dead-ending on
            // a raw error. Mirrors the web fallback (commit b7a9bb2).
            usingFallbackVoice = true
            setPhase(.playingATC)
            speech.speak(scenario.atcTransmission) { [weak self] in self?.setPhase(.ready) }
        }
    }

    func startRecording() async {
        guard await audio.requestPermission() else {
            errorMessage = "Microphone access is needed to grade your readback."
            return
        }
        do {
            try audio.startRecording()
            setPhase(.recording)
        } catch {
            errorMessage = error.localizedDescription
        }
    }

    func stopAndGrade() async {
        guard let data = audio.stopRecording() else {
            errorMessage = "Recording failed — try again."
            setPhase(.ready)
            return
        }
        setPhase(.transcribing)
        do {
            let stt: STTResponse = try await client.uploadAudio(
                "/api/stt", audio: data, filename: "readback.m4a", mimeType: "audio/mp4"
            )
            transcript = stt.text
            guard !stt.text.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty else {
                errorMessage = "Didn't catch that — try recording again, a little closer to the mic."
                setPhase(.ready)
                return
            }
            setPhase(.grading)
            let grade: GradeResult = try await client.request(
                "/api/grade", method: "POST",
                body: GradeRequest(scenarioId: scenario.id, readback: stt.text)
            )
            result = grade
            setPhase(.done)
            UINotificationFeedbackGenerator().notificationOccurred(grade.passFail == .fail ? .warning : .success)
        } catch let APIError.server(message) where message == "pro_scenario" || message == "daily_limit" {
            // The natural upsell moment: this scenario or today's free grading is Pro-gated.
            showPaywall = true
            setPhase(.ready)
        } catch {
            errorMessage = error.localizedDescription
            setPhase(.ready)
        }
    }

    func reset() {
        transcript = ""
        result = nil
        errorMessage = nil
        setPhase(.idle)
    }
}

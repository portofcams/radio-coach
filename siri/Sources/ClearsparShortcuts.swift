import AppIntents

// Siri / Shortcuts: "Hey Siri, practice radio with Clearspar" → opens the app.
// App Shortcuts are zero-config on iOS 16+ — just ship this file in the App target.
@available(iOS 16.0, *)
struct PracticeRadioIntent: AppIntent {
    static var title: LocalizedStringResource = "Practice radio calls"
    static var description = IntentDescription("Open Clearspar Radio Trainer and practice ATC radio calls.")
    static var openAppWhenRun: Bool = true

    @MainActor
    func perform() async throws -> some IntentResult {
        return .result()
    }
}

@available(iOS 16.0, *)
struct ClearsparShortcuts: AppShortcutsProvider {
    static var appShortcuts: [AppShortcut] {
        AppShortcut(
            intent: PracticeRadioIntent(),
            phrases: [
                "Practice radio with \(.applicationName)",
                "Start a drill in \(.applicationName)",
                "Quiz me on phonetics with \(.applicationName)"
            ],
            shortTitle: "Practice radio",
            systemImageName: "antenna.radiowaves.left.and.right"
        )
    }
}

import ActivityKit

// #97 -- shared shape between this app target (which starts/updates/ends the
// activity from ScenarioViewModel) and WilcoWidget's own copy (which renders
// it). Deliberately DUPLICATED rather than shared across targets: ActivityKit
// serializes ContentState/Attributes across the process boundary anyway (the
// widget extension is a separate process), so two independently-defined but
// structurally-identical types interoperate correctly -- same reasoning
// already used for #98's Phonetics/Numbers duplication across the Watch and
// iOS targets, given this project's own history of real bugs from hand-wired
// Xcode target membership (scripts/embed-watch-app.rb's header comment).
struct ScenarioActivityAttributes: ActivityAttributes {
    public struct ContentState: Codable, Hashable {
        var phaseLabel: String
    }
    var scenarioTitle: String
}

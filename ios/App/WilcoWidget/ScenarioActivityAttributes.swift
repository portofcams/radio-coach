import ActivityKit

// #97 -- deliberately duplicated from App/Native/Scenario/ScenarioActivityAttributes.swift,
// not shared across targets. See that file's header comment for why.
struct ScenarioActivityAttributes: ActivityAttributes {
    public struct ContentState: Codable, Hashable {
        var phaseLabel: String
    }
    var scenarioTitle: String
}

import Foundation

// Backs the Train hub. Scenarios come from the bundled library (offline-capable,
// which is itself a point in favor of App Store guideline 4.2). Completion
// scores are layered in from /api/user/stats when signed in.
@Observable
final class TrainViewModel {
    var facilityFilter: Scenario.Facility?
    var difficultyFilter: Int?
    var heliOnly = false
    var completed: [String: CompletionInfo] = [:]

    struct CompletionInfo { let passed: Bool; let score: Int }

    var callOfTheDay: Scenario? { ScenarioStore.callOfTheDay() }

    var filtered: [Scenario] {
        ScenarioStore.all.filter { s in
            if heliOnly { return s.isHelicopter }
            if let f = facilityFilter, s.facility != f { return false }
            if let d = difficultyFilter, s.difficulty != d { return false }
            return true
        }
    }

    /// Scenarios grouped by phase in canonical order, for the sectioned list.
    var byPhase: [(phase: Scenario.Phase, scenarios: [Scenario])] {
        Scenario.Phase.allCases.compactMap { phase in
            let matches = filtered.filter { $0.phase == phase && !$0.isHelicopter }
            return matches.isEmpty ? nil : (phase, matches)
        }
    }

    var hasActiveFilter: Bool { facilityFilter != nil || difficultyFilter != nil || heliOnly }

    func clearFilters() {
        facilityFilter = nil
        difficultyFilter = nil
        heliOnly = false
    }

    func loadCompletions() async {
        struct Stats: Decodable {
            struct Grade: Decodable { let scenarioId: String; let passed: Bool; let score: Int }
            let recent: [Grade]?
        }
        guard let stats = try? await NetworkClient.shared.request("/api/user/stats", as: Stats.self),
              let recent = stats.recent else { return }
        var map: [String: CompletionInfo] = [:]
        for g in recent {
            if let existing = map[g.scenarioId], existing.score >= g.score { continue }
            map[g.scenarioId] = CompletionInfo(passed: g.passed, score: g.score)
        }
        completed = map
    }
}

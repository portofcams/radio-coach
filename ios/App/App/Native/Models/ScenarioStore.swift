import Foundation

// Loads the bundled scenario library once at launch. Mirrors the scenarios
// array + getScenario/getScenariosByPhase helpers in src/lib/scenarios.ts.
enum ScenarioStore {
    static let all: [Scenario] = load()

    static func byId(_ id: String) -> Scenario? {
        all.first { $0.id == id }
    }

    static func byPhase(_ phase: Scenario.Phase) -> [Scenario] {
        all.filter { $0.phase == phase }
    }

    /// Deterministic "Call of the Day" — same date-seeded pick as train/page.tsx,
    /// drawn from the free, non-helicopter pool.
    static func callOfTheDay(on date: Date = Date()) -> Scenario? {
        let pool = all.filter { !$0.isPro && !$0.isHelicopter }
        guard !pool.isEmpty else { return nil }
        var formatter = ISO8601DateFormatter()
        formatter.formatOptions = [.withFullDate]
        let day = formatter.string(from: date)
        var h: UInt32 = 0
        for scalar in day.unicodeScalars { h = h &* 31 &+ scalar.value }
        return pool[Int(h % UInt32(pool.count))]
    }

    private static func load() -> [Scenario] {
        guard let url = Bundle.main.url(forResource: "scenarios", withExtension: "json"),
              let data = try? Data(contentsOf: url) else {
            assertionFailure("scenarios.json missing from app bundle")
            return []
        }
        do {
            return try JSONDecoder().decode([Scenario].self, from: data)
        } catch {
            assertionFailure("scenarios.json decode failed: \(error)")
            return []
        }
    }
}

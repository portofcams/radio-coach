import Foundation

// Response models for the Profile stats endpoints. NetworkClient decodes with
// .convertFromSnakeCase, so snake_case JSON keys map to these camelCase names.
// Several DB-derived numeric fields come back as STRINGS ("5") — decoded as
// String here and exposed as Int via computed props.

struct UserStats: Decodable {
    let total: Int
    let passed: Int
    let passRate: Int
    let avgScore: Int
    let byPhase: [PhaseStat]
    let topMistakes: [Mistake]
    let recent: [RecentGrade]

    struct PhaseStat: Decodable, Identifiable {
        let phase: String
        let total: String
        let passed: String
        let avgScore: String
        var id: String { phase }
        var totalN: Int { Int(total) ?? 0 }
        var passedN: Int { Int(passed) ?? 0 }
        var passPct: Int { totalN > 0 ? Int((Double(passedN) / Double(totalN) * 100).rounded()) : 0 }
        var label: String { Scenario.Phase(rawValue: phase)?.label ?? phase.capitalized }
    }

    struct Mistake: Decodable, Identifiable {
        let elem: String
        let cnt: String
        var id: String { elem }
        var count: Int { Int(cnt) ?? 0 }
    }

    struct RecentGrade: Decodable, Identifiable {
        let scenarioId: String
        let score: Int
        let passed: Bool
        let hintUsed: Bool
        let createdAt: String
        var id: String { scenarioId + createdAt }
        var title: String { ScenarioStore.byId(scenarioId)?.title ?? scenarioId.replacingOccurrences(of: "-", with: " ").capitalized }
    }
}

struct Readiness: Decodable {
    let score: Int
    let level: String       // "not-ready" | "almost" | "ready"
    let label: String
    let factors: Factors

    struct Factors: Decodable {
        let recentAccuracy: Int
        let passRate: Int
        let coverage: Int
    }
}

struct WeakSpotsResponse: Decodable {
    let weakspots: [WeakSpot]
}

struct WeakSpot: Decodable, Identifiable {
    let key: String
    let label: String
    let tip: String
    let opportunities: Int
    let misses: Int
    let rate: Double        // 0.0–1.0
    let drill: [String]
    var id: String { key }
    var ratePct: Int { Int((rate * 100).rounded()) }
}

// Retroactively-reconstructed weekly readiness points (GET /api/user/readiness/history).
// Not stored -- rc_grades is INSERT-only, so any past instant's readiness is
// exactly reconstructable from immutable history.
struct ReadinessHistoryResponse: Decodable {
    let weeks: [ReadinessHistoryPoint]
}

struct ReadinessHistoryPoint: Decodable, Identifiable {
    let weekEnd: String   // "yyyy-MM-dd"
    let score: Int
    let level: String
    let cumulativeAttempts: Int
    let weekAttempts: Int
    var id: String { weekEnd }

    private static let fmt: DateFormatter = {
        let f = DateFormatter()
        f.dateFormat = "yyyy-MM-dd"
        f.timeZone = TimeZone(identifier: "UTC") // server emits a plain calendar date, not a zoned instant
        return f
    }()
    var date: Date { Self.fmt.date(from: weekEnd) ?? Date() }
}

// Airport lookup preview for the home-field setter (GET /api/airports?ident=).
struct AirportLookup: Decodable {
    let field: Field?
    struct Field: Decodable {
        let icao: String
        let name: String
        let city: String
        let region: String
        let towered: Bool
        let runways: [String]
    }
}

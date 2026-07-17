import Foundation

// Loads the Profile progress data (readiness, stats, weak spots) in parallel.
@Observable
@MainActor
final class ProfileStatsViewModel {
    var readiness: Readiness?
    var stats: UserStats?
    var weakspots: [WeakSpot] = []
    var history: [ReadinessHistoryPoint] = []
    var loaded = false

    private let client = NetworkClient.shared

    func load() async {
        async let r: Readiness? = try? client.request("/api/user/readiness", as: Readiness.self)
        async let s: UserStats? = try? client.request("/api/user/stats", as: UserStats.self)
        async let w: WeakSpotsResponse? = try? client.request("/api/user/weakspots", as: WeakSpotsResponse.self)
        async let h: ReadinessHistoryResponse? = try? client.request("/api/user/readiness/history", as: ReadinessHistoryResponse.self)
        readiness = await r
        stats = await s
        weakspots = (await w)?.weakspots ?? []
        history = (await h)?.weeks ?? []
        loaded = true
    }

    var hasAnyData: Bool {
        (stats?.total ?? 0) > 0 || readiness != nil || !weakspots.isEmpty
    }
}

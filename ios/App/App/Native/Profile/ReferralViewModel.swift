import Foundation

@Observable
@MainActor
final class ReferralViewModel {
    var stats: ReferralStats?
    var loaded = false
    var errorMessage: String?

    private let client = NetworkClient.shared

    func load() async {
        do {
            stats = try await client.request("/api/referral", as: ReferralStats.self)
        } catch {
            errorMessage = error.localizedDescription
        }
        loaded = true
    }
}

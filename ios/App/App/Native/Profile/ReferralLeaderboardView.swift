import SwiftUI

// Native port of /leaderboard?scope=referrals (#94) -- scoped to just the
// referral leaderboard, not the full multi-tab leaderboard system (all-time/
// week/streak/towered/school), which is a separate, larger port not asked
// for here.
struct ReferralLeaderboardView: View {
    @State private var rows: [ReferralLeaderboardRow] = []
    @State private var loaded = false

    var body: some View {
        List {
            if !loaded {
                ProgressView()
            } else if rows.isEmpty {
                Text("No converted referrals yet.").foregroundStyle(.secondary)
            } else {
                ForEach(rows) { r in
                    HStack {
                        Text("#\(r.rank)").font(.caption).monospaced().foregroundStyle(.secondary)
                            .frame(width: 32, alignment: .leading)
                        Text(r.callsign)
                            .fontWeight(r.you ? .semibold : .regular)
                        if r.you { Text("(you)").font(.caption).foregroundStyle(.blue) }
                        Spacer()
                        VStack(alignment: .trailing, spacing: 1) {
                            Text("\(r.passes)").fontWeight(.semibold)
                            Text("converted").font(.caption2).foregroundStyle(.secondary)
                        }
                        if let referred = r.referred {
                            VStack(alignment: .trailing, spacing: 1) {
                                Text("\(referred)").foregroundStyle(.secondary)
                                Text("referred").font(.caption2).foregroundStyle(.secondary)
                            }
                            .frame(width: 60)
                        }
                    }
                    .listRowBackground(r.you ? Color.accentColor.opacity(0.08) : nil)
                }
            }
        }
        .navigationTitle("Referral Leaderboard")
        .navigationBarTitleDisplayMode(.inline)
        .task {
            guard !loaded else { return }
            if let resp = try? await NetworkClient.shared.request(
                "/api/leaderboard?scope=referrals", as: ReferralLeaderboardResponse.self
            ) {
                rows = resp.rows
            }
            loaded = true
        }
    }
}

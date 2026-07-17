import SwiftUI

// Native port of src/app/challenge/page.tsx — the deterministic daily scenario.
// Same seed as the web (days since 2026-01-01 UTC, mod library size) so every
// pilot gets the same call each day.
struct ChallengeView: View {
    private var daily: Scenario? {
        let epoch = Date(timeIntervalSince1970: 1_767_225_600) // 2026-01-01 00:00 UTC
        let days = Int(Date().timeIntervalSince(epoch) / 86_400)
        let all = ScenarioStore.all
        guard !all.isEmpty, days >= 0 else { return all.first }
        return all[days % all.count]
    }

    private var todayLabel: String {
        var cal = Calendar(identifier: .gregorian)
        cal.timeZone = TimeZone(identifier: "Pacific/Honolulu") ?? .current
        let f = DateFormatter()
        f.timeZone = cal.timeZone
        f.dateFormat = "EEEE, MMMM d, yyyy"
        return f.string(from: Date())
    }

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 20) {
                Text(todayLabel).font(.subheadline).foregroundStyle(.secondary)

                if let s = daily {
                    VStack(alignment: .leading, spacing: 12) {
                        HStack(spacing: 8) {
                            Text(DifficultyMeta.from(s.difficulty).label)
                                .font(.caption).fontWeight(.bold)
                            Text(s.airport).font(.caption).monospaced().foregroundStyle(.blue)
                            Text(s.phase.rawValue).font(.caption).foregroundStyle(.secondary)
                        }
                        Text(s.title).font(.title2).fontWeight(.semibold)
                        Text(s.setup).font(.subheadline).foregroundStyle(.secondary)
                    }
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .padding()
                    .background(Color(.secondarySystemBackground), in: RoundedRectangle(cornerRadius: 12))

                    NavigationLink(value: Route.scenario(s.id)) {
                        Text("Start today's challenge →").frame(maxWidth: .infinity)
                    }
                    .buttonStyle(.borderedProminent)
                    .controlSize(.large)
                }
            }
            .padding(20)
        }
        .navigationTitle("Daily Challenge")
        .navigationBarTitleDisplayMode(.inline)
    }
}

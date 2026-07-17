import SwiftUI
import Charts

// The progress/stats block on the Profile screen — native port of the readiness
// card, stats overview, by-phase, top mistakes, weak spots, and recent history
// from src/app/profile/page.tsx. Data from /api/user/readiness, /stats, /weakspots.
struct ProfileStatsView: View {
    @State private var model = ProfileStatsViewModel()
    @ScaledMetric(relativeTo: .largeTitle) private var readinessFontSize: CGFloat = 40

    var body: some View {
        Group {
            if !model.loaded {
                // A concrete, always-present view so .task reliably fires (an
                // all-conditional Group can render nothing and never load).
                Section { HStack { Spacer(); ProgressView(); Spacer() } }
            }

            if let r = model.readiness {
                Section("Radio readiness") { readinessCard(r) }
            }

            if let s = model.stats, s.total > 0 {
                Section {
                    HStack {
                        stat("\(s.total)", "scenarios")
                        Divider()
                        stat("\(s.passRate)%", "pass rate")
                        Divider()
                        stat("\(s.avgScore)", "avg score")
                    }
                    .frame(maxWidth: .infinity)
                }

                if !s.byPhase.isEmpty {
                    Section("By phase") {
                        ForEach(s.byPhase) { p in phaseRow(p) }
                    }
                }

                if !s.topMistakes.isEmpty {
                    Section("Your most-missed elements") {
                        ForEach(s.topMistakes) { m in
                            HStack {
                                Text(m.elem)
                                Spacer()
                                Text("×\(m.count)").foregroundStyle(.secondary).monospaced()
                            }
                        }
                    }
                }
            }

            if !model.weakspots.isEmpty {
                Section {
                    ForEach(model.weakspots) { w in weakSpotRow(w) }
                } header: {
                    Text("Your weak spots")
                } footer: {
                    Text("Ranked from your graded scenarios.")
                }
            }

            if let s = model.stats, !s.recent.isEmpty {
                Section("Recent history") {
                    ForEach(s.recent.prefix(10)) { g in recentRow(g) }
                }
            }

            if model.loaded && !model.hasAnyData {
                Section {
                    Text("Fly a few scenarios and your readiness, stats, and weak spots will show up here.")
                        .font(.subheadline).foregroundStyle(.secondary)
                }
            }
        }
        .task { await model.load() }
    }

    private func readinessCard(_ r: Readiness) -> some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack(alignment: .firstTextBaseline) {
                Text("\(r.score)").font(.system(size: readinessFontSize, weight: .bold))
                Text("/ 100").font(.subheadline).foregroundStyle(.secondary)
                Spacer()
                Text(r.label)
                    .font(.subheadline).fontWeight(.semibold)
                    .foregroundStyle(levelColor(r.level))
            }
            .accessibilityElement(children: .ignore)
            .accessibilityLabel("Readiness \(r.score) out of 100, \(r.label)")
            factorBar("Recent accuracy", r.factors.recentAccuracy)
            factorBar("Pass rate", r.factors.passRate)
            factorBar("Library coverage", r.factors.coverage)
            if model.history.count >= 2 {
                Chart(model.history) { p in
                    LineMark(x: .value("Week", p.date), y: .value("Score", p.score))
                    PointMark(x: .value("Week", p.date), y: .value("Score", p.score))
                }
                .foregroundStyle(levelColor(r.level))
                .chartYScale(domain: 0...100)
                .chartXAxis(.hidden)
                .frame(height: 70)
                .padding(.top, 4)
            } else if model.history.count == 1 {
                Text("Train a few more weeks to see your trend.").font(.caption).foregroundStyle(.secondary)
            }
        }
        .padding(.vertical, 4)
    }

    private func factorBar(_ label: String, _ pct: Int) -> some View {
        VStack(alignment: .leading, spacing: 3) {
            HStack {
                Text(label).font(.caption).foregroundStyle(.secondary)
                Spacer()
                Text("\(pct)%").font(.caption).monospaced().foregroundStyle(.secondary)
            }
            ProgressView(value: Double(pct), total: 100).tint(Color.accentColor)
        }
    }

    private func phaseRow(_ p: UserStats.PhaseStat) -> some View {
        VStack(alignment: .leading, spacing: 4) {
            HStack {
                Text(p.label).font(.subheadline)
                Spacer()
                Text("\(p.passPct)% · \(p.totalN) done").font(.caption).foregroundStyle(.secondary)
            }
            ProgressView(value: Double(p.passPct), total: 100)
                .tint(p.passPct >= 70 ? .green : p.passPct >= 40 ? .orange : .red)
        }
    }

    private func weakSpotRow(_ w: WeakSpot) -> some View {
        VStack(alignment: .leading, spacing: 6) {
            HStack {
                Text(w.label).font(.subheadline).fontWeight(.medium)
                Spacer()
                Text("\(w.ratePct)% missed").font(.caption).foregroundStyle(.red)
            }
            Text(w.tip).font(.caption).foregroundStyle(.secondary)
            if let first = w.drill.first {
                NavigationLink(value: Route.scenario(first)) {
                    Text("Drill this →").font(.caption).fontWeight(.medium)
                }
            }
        }
        .padding(.vertical, 2)
    }

    private func recentRow(_ g: UserStats.RecentGrade) -> some View {
        HStack {
            Text(g.title).lineLimit(1)
            if g.hintUsed {
                Text("hint").font(.caption2).padding(.horizontal, 5).padding(.vertical, 1)
                    .background(Color(.tertiarySystemFill), in: Capsule()).foregroundStyle(.secondary)
            }
            Spacer()
            Text("\(g.score)").monospaced()
                .foregroundStyle(g.passed ? .green : .red)
        }
        .font(.subheadline)
    }

    private func stat(_ value: String, _ label: String) -> some View {
        VStack(spacing: 2) {
            Text(value).font(.title3).fontWeight(.semibold)
            Text(label).font(.caption2).foregroundStyle(.secondary)
        }
        .frame(maxWidth: .infinity)
    }

    private func levelColor(_ level: String) -> Color {
        switch level { case "ready": return .green; case "almost": return .orange; default: return .secondary }
    }
}

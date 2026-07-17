import SwiftUI

// Native port of src/app/refer/page.tsx (#94) -- was web-only, native users
// never saw the CFI ambassador program or their referral stats. Only ever
// reached from ProfileView's signed-in section, so (unlike the web page)
// there's no logged-out/anon branch to handle here.
struct ReferralView: View {
    @State private var model = ReferralViewModel()
    @State private var copied = false

    var body: some View {
        List {
            if let stats = model.stats {
                Section {
                    Text(stats.isCfi ? "CFI Ambassador" : "Give a month, get a month")
                        .font(.title2).fontWeight(.semibold)
                    Text(stats.isCfi
                         ? "Share your link with students. Anyone who signs up gets a free month of Pro. When they upgrade to a paid plan, you get \(stats.cfiMonths) free months of CFI Pro — 3x the standard referral, since your referrals are recurring students, not one-off signups."
                         : "Share your link. Anyone who signs up gets a free month of Pro. When they upgrade to a paid plan, you get a free month too.")
                        .font(.subheadline).foregroundStyle(.secondary)
                }

                Section("Your referral link") {
                    Text(stats.link)
                        .font(.system(.footnote, design: .monospaced))
                        .foregroundStyle(.secondary)
                        .lineLimit(2)
                    HStack {
                        Button(copied ? "Copied" : "Copy") {
                            UIPasteboard.general.string = stats.link
                            copied = true
                            Task { try? await Task.sleep(for: .seconds(1.5)); copied = false }
                        }
                        Spacer()
                        if let url = URL(string: stats.link) {
                            ShareLink(item: url) { Label("Share", systemImage: "square.and.arrow.up") }
                        }
                    }
                }

                Section {
                    HStack {
                        statTile(value: "\(stats.referred)", label: "signed up")
                        statTile(value: "\(stats.converted)", label: "upgraded", tint: .green)
                        statTile(value: "\(stats.monthsLeft)", label: "comp days left", tint: .blue)
                    }
                    .listRowInsets(EdgeInsets())
                    .padding()
                } footer: {
                    Text("Comp time stacks on top of any paid plan and is applied automatically — no codes to enter.")
                }

                Section {
                    NavigationLink(value: Route.referralLeaderboard) {
                        Text("See the referral leaderboard")
                    }
                }
            } else if let error = model.errorMessage {
                Section {
                    Text(error).foregroundStyle(.red)
                }
            } else {
                Section {
                    ProgressView()
                }
            }
        }
        .navigationTitle("Refer & Earn")
        .navigationBarTitleDisplayMode(.inline)
        .task { if model.stats == nil { await model.load() } }
    }

    private func statTile(value: String, label: String, tint: Color = .primary) -> some View {
        VStack(spacing: 4) {
            Text(value).font(.title2).fontWeight(.bold).foregroundStyle(tint)
            Text(label).font(.caption2).foregroundStyle(.secondary)
        }
        .frame(maxWidth: .infinity)
    }
}

import SwiftUI

// Native port of src/app/train/page.tsx — the post-login home. Filter chips
// scroll horizontally instead of wrapping/overflowing (the exact layout bug
// that plagued the WebView build on a narrow viewport).
struct TrainHubView: View {
    @State private var model = TrainViewModel()
    @Environment(AuthManager.self) private var auth

    @State private var path: [Route] = []

    var body: some View {
        NavigationStack(path: $path) {
            ScrollView {
                VStack(alignment: .leading, spacing: 20) {
                    quickLinks
                    filters
                    if let cotd = model.callOfTheDay, !model.hasActiveFilter {
                        callOfTheDayCard(cotd)
                    }
                    scenarioSections
                }
                .padding(.horizontal, 20)
                .padding(.vertical, 12)
            }
            .navigationTitle("Training")
            .navigationBarTitleDisplayMode(.large)
            .toolbar {
                ToolbarItem(placement: .topBarTrailing) {
                    NavigationLink(value: Route.profile) { Image(systemName: "person.circle") }
                        .accessibilityLabel("Profile")
                }
            }
            .navigationDestination(for: Route.self) { route in
                switch route {
                case .profile: ProfileView()
                case .scenario(let id): ScenarioDetailView(scenarioId: id)
                case .practice: PracticeView()
                case .listen: ListenView()
                case .oral: OralView()
                case .challenge: ChallengeView()
                case .referral: ReferralView()
                case .referralLeaderboard: ReferralLeaderboardView()
                case .flashcards(let handoff): FlashcardsView(handoff: handoff)
                case .comingSoon(let name): ComingSoonView(title: name)
                }
            }
        }
        // #98 Watch->iPhone handoff: a drill started on the Watch arrives
        // here as an NSUserActivity: navigate straight to the matching card
        // instead of dropping the user on the training hub with no context.
        .onContinueUserActivity("com.binnacleai.radiocoach.drill") { activity in
            guard
                let info = activity.userInfo,
                let kindRaw = info["drillType"] as? String,
                let kind = DrillKind(rawValue: kindRaw),
                let prompt = info["prompt"] as? String
            else { return }
            path = [.flashcards(DrillHandoff(kind: kind, prompt: prompt))]
        }
        .task {
            #if DEBUG
            // Verification hook: deep-link straight to a screen for screenshots.
            if let id = ProcessInfo.processInfo.environment["RC_DEBUG_SCENARIO"], !id.isEmpty {
                path = [.scenario(id)]
            }
            switch ProcessInfo.processInfo.environment["RC_DEBUG_ROUTE"] {
            case "listen": path = [.listen]
            case "oral": path = [.oral]
            case "practice": path = [.practice]
            case "challenge": path = [.challenge]
            case "profile": path = [.profile]
            default: break
            }
            #endif
            await model.loadCompletions()
        }
    }

    // Practice / Listen / Oral / … — horizontal scroll, no overflow clipping.
    private var quickLinks: some View {
        ScrollView(.horizontal, showsIndicators: false) {
            HStack(spacing: 8) {
                NavigationLink(value: Route.challenge) { chipLabel("Challenge") }
                ForEach(QuickLink.allCases, id: \.self) { link in
                    NavigationLink(value: link.route) { chipLabel(link.label) }
                }
            }
        }
    }

    private func chipLabel(_ text: String) -> some View {
        Text(text)
            .font(.subheadline).fontWeight(.medium)
            .foregroundStyle(.primary)
            .padding(.horizontal, 12).padding(.vertical, 6)
            .background(Color(.secondarySystemBackground), in: Capsule())
    }

    private var filters: some View {
        VStack(alignment: .leading, spacing: 8) {
            ScrollView(.horizontal, showsIndicators: false) {
                HStack(spacing: 6) {
                    chip("All", selected: !model.hasActiveFilter) { model.clearFilters() }
                    ForEach(Scenario.Facility.allCases, id: \.self) { f in
                        chip(f.rawValue, selected: model.facilityFilter == f) {
                            model.facilityFilter = model.facilityFilter == f ? nil : f
                            model.heliOnly = false
                        }
                    }
                    chip("HELI", selected: model.heliOnly) {
                        model.heliOnly.toggle(); model.facilityFilter = nil
                    }
                }
            }
            ScrollView(.horizontal, showsIndicators: false) {
                HStack(spacing: 6) {
                    chip("All levels", selected: model.difficultyFilter == nil) { model.difficultyFilter = nil }
                    ForEach(1...3, id: \.self) { d in
                        chip(DifficultyMeta.from(d).label, selected: model.difficultyFilter == d) {
                            model.difficultyFilter = model.difficultyFilter == d ? nil : d
                        }
                    }
                }
            }
        }
    }

    private func chip(_ text: String, selected: Bool, action: @escaping () -> Void) -> some View {
        Button(action: action) {
            Text(text)
                .font(.caption).fontWeight(selected ? .bold : .regular)
                .foregroundStyle(selected ? Color.white : Color.secondary)
                .padding(.horizontal, 10).padding(.vertical, 5)
                .background(selected ? Color.accentColor : Color(.secondarySystemBackground),
                            in: RoundedRectangle(cornerRadius: 8))
        }
        .buttonStyle(.plain)
    }

    private func callOfTheDayCard(_ s: Scenario) -> some View {
        NavigationLink(value: Route.scenario(s.id)) {
            HStack {
                VStack(alignment: .leading, spacing: 2) {
                    Text("CALL OF THE DAY")
                        .font(.caption2).fontWeight(.bold).tracking(1.5)
                        .foregroundStyle(.orange)
                    Text(s.title).font(.body).fontWeight(.medium).foregroundStyle(.primary)
                }
                Spacer()
                if let c = model.completed[s.id] {
                    Text("\(c.score)").font(.subheadline).foregroundStyle(.orange)
                } else {
                    Text("Fly it →").font(.subheadline).foregroundStyle(.orange)
                }
            }
            .padding()
            .background(Color.orange.opacity(0.1), in: RoundedRectangle(cornerRadius: 12))
            .overlay(RoundedRectangle(cornerRadius: 12).strokeBorder(Color.orange.opacity(0.35)))
        }
        .buttonStyle(.plain)
    }

    private var scenarioSections: some View {
        ForEach(model.byPhase, id: \.phase) { group in
            VStack(alignment: .leading, spacing: 8) {
                Text(group.phase.label.uppercased())
                    .font(.caption).fontWeight(.semibold).tracking(1)
                    .foregroundStyle(.secondary)
                ForEach(group.scenarios) { s in
                    NavigationLink(value: Route.scenario(s.id)) { scenarioRow(s) }
                        .buttonStyle(.plain)
                }
            }
        }
    }

    private func scenarioRow(_ s: Scenario) -> some View {
        HStack {
            VStack(alignment: .leading, spacing: 4) {
                Text(s.title).font(.body).fontWeight(.medium).foregroundStyle(.primary)
                HStack(spacing: 6) {
                    if let f = s.facility {
                        Text(f.rawValue).font(.caption2).fontWeight(.bold)
                            .foregroundStyle(.secondary)
                    }
                    if let freq = s.frequency {
                        Text(freq).font(.caption2).monospaced().foregroundStyle(.secondary)
                    }
                    if s.isPro {
                        Text("PRO").font(.caption2).fontWeight(.bold)
                            .padding(.horizontal, 4).padding(.vertical, 1)
                            .background(Color.accentColor, in: RoundedRectangle(cornerRadius: 3))
                            .foregroundStyle(.white)
                    }
                }
            }
            Spacer()
            if let c = model.completed[s.id] {
                Text("\(c.score)")
                    .font(.caption).monospaced()
                    .foregroundStyle(c.passed ? .green : .red)
            }
        }
        .padding()
        .background(Color(.secondarySystemBackground), in: RoundedRectangle(cornerRadius: 12))
    }
}

enum Route: Hashable {
    case profile
    case scenario(String)
    case practice, listen, oral, challenge
    case referral, referralLeaderboard
    case flashcards(DrillHandoff?)
    case comingSoon(String)
}

enum QuickLink: String, CaseIterable {
    case practice, listen, oral, community, leaderboard, guides, glossary, tools, learn
    var label: String { rawValue.capitalized }

    // Practice/Listen/Oral are native (Phase 1). The rest are Phase 2 or
    // web-only content — routed to a placeholder for now.
    var route: Route {
        switch self {
        case .practice: return .practice
        case .listen: return .listen
        case .oral: return .oral
        default: return .comingSoon(label)
        }
    }
}

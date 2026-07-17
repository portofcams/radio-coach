import SwiftUI

// Native port of src/app/practice/page.tsx — the practice launcher. Smart
// practice pulls an adaptively-chosen scenario from /api/adaptive/next; Endless
// random picks any bundled scenario. (Live duel + weak-spot bootcamp are Phase 2.)
struct PracticeView: View {
    @State private var picking = false
    @State private var target: ScenarioTarget?
    @State private var errorMessage: String?

    private struct AdaptiveResponse: Decodable { let scenarioId: String; let reason: String }

    var body: some View {
        ScrollView {
            VStack(spacing: 14) {
                card(
                    title: "Smart practice",
                    subtitle: "An adaptive pick tuned to your recent scores.",
                    systemImage: "brain.head.profile",
                    loading: picking
                ) { Task { await startSmart() } }

                card(
                    title: "Endless random",
                    subtitle: "A surprise call from anywhere in the library.",
                    systemImage: "shuffle"
                ) {
                    if let s = ScenarioStore.all.randomElement() { target = ScenarioTarget(id: s.id) }
                }

                NavigationLink(value: Route.flashcards(nil)) {
                    HStack(spacing: 14) {
                        Image(systemName: "rectangle.on.rectangle").font(.title2).foregroundStyle(Color.accentColor).frame(width: 32).accessibilityHidden(true)
                        VStack(alignment: .leading, spacing: 2) {
                            Text("Flashcards").font(.body).fontWeight(.medium).foregroundStyle(.primary)
                            Text("Phonetic, number, and callsign drills — also on your Watch.").font(.caption).foregroundStyle(.secondary).multilineTextAlignment(.leading)
                        }
                        Spacer()
                        Image(systemName: "chevron.right").foregroundStyle(.tertiary).accessibilityHidden(true)
                    }
                    .padding()
                    .background(Color(.secondarySystemBackground), in: RoundedRectangle(cornerRadius: 12))
                }
                .buttonStyle(.plain)

                if let error = errorMessage {
                    Text(error).font(.subheadline).foregroundStyle(.red)
                }
            }
            .padding(20)
        }
        .navigationTitle("Practice")
        .navigationBarTitleDisplayMode(.inline)
        .navigationDestination(item: $target) { ScenarioDetailView(scenarioId: $0.id) }
    }

    private func startSmart() async {
        errorMessage = nil
        picking = true
        defer { picking = false }
        do {
            let res = try await NetworkClient.shared.request("/api/adaptive/next", as: AdaptiveResponse.self)
            target = ScenarioTarget(id: res.scenarioId)
        } catch {
            errorMessage = "Couldn't pick a scenario — try again."
        }
    }

    private func card(
        title: String, subtitle: String, systemImage: String,
        loading: Bool = false, action: @escaping () -> Void
    ) -> some View {
        Button(action: action) {
            HStack(spacing: 14) {
                Image(systemName: systemImage).font(.title2).foregroundStyle(Color.accentColor).frame(width: 32).accessibilityHidden(true)
                VStack(alignment: .leading, spacing: 2) {
                    Text(title).font(.body).fontWeight(.medium).foregroundStyle(.primary)
                    Text(subtitle).font(.caption).foregroundStyle(.secondary).multilineTextAlignment(.leading)
                }
                Spacer()
                if loading { ProgressView() } else { Image(systemName: "chevron.right").foregroundStyle(.tertiary).accessibilityHidden(true) }
            }
            .padding()
            .background(Color(.secondarySystemBackground), in: RoundedRectangle(cornerRadius: 12))
        }
        .buttonStyle(.plain)
        .disabled(loading)
    }
}

// Distinct from Route so the programmatic push here doesn't collide with the
// Train hub's Route-typed navigationDestination.
struct ScenarioTarget: Identifiable, Hashable {
    let id: String
}

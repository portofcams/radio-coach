import SwiftUI

// Placeholder for Phase-2 / web-only sections (Community, Leaderboard, Guides,
// Glossary, Tools, Learn) so the nav is honest about what's native yet.
struct ComingSoonView: View {
    let title: String

    var body: some View {
        ContentUnavailableView {
            Label(title, systemImage: "hourglass")
        } description: {
            Text("Coming to the app soon. For now, this lives on the Clearspar website.")
        }
        .navigationTitle(title)
        .navigationBarTitleDisplayMode(.inline)
    }
}

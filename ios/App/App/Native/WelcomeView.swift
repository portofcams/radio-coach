import SwiftUI

// First screen for a not-signed-in user — mirrors the web landing's value prop
// and its "try free, no account" promise. "Start training" enters as a guest
// (the training loop works anonymously, capped per-device); "Sign in" is
// optional and only needed to save progress across devices.
struct WelcomeView: View {
    @Environment(AuthManager.self) private var auth
    @State private var showLogin = false

    var body: some View {
        VStack(spacing: 0) {
            Spacer()

            VStack(spacing: 12) {
                Text("CLEARSPAR")
                    .font(.caption).fontWeight(.semibold).tracking(3).foregroundStyle(.secondary)
                Text("Your radio calls,\ngraded like a CFI.")
                    .font(.largeTitle).fontWeight(.bold)
                    .multilineTextAlignment(.center)
                Text("ATC gives the transmission. You read it back. Every element graded against FAA standards — missed hold shorts, wrong squawk, non-standard phrases.")
                    .font(.subheadline).foregroundStyle(.secondary)
                    .multilineTextAlignment(.center)
                    .padding(.horizontal, 8)
            }

            Spacer()

            VStack(spacing: 12) {
                Button {
                    auth.isGuest = true
                } label: {
                    Text("Start training →").frame(maxWidth: .infinity)
                }
                .buttonStyle(.borderedProminent)
                .controlSize(.large)

                Button {
                    showLogin = true
                } label: {
                    Text("Sign in").frame(maxWidth: .infinity)
                }
                .buttonStyle(.bordered)
                .controlSize(.large)

                Text("No account needed to try · works offline")
                    .font(.caption).foregroundStyle(.secondary)
            }
        }
        .padding(.horizontal, 28)
        .padding(.bottom, 24)
        .sheet(isPresented: $showLogin) {
            NavigationStack {
                LoginView()
                    .toolbar {
                        ToolbarItem(placement: .topBarTrailing) {
                            Button("Close") { showLogin = false }
                        }
                    }
            }
        }
    }
}

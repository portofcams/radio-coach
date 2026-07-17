import SwiftUI

// Native port of the account-management parts of src/app/profile/page.tsx.
// The Danger Zone (account deletion) is required by App Store guideline
// 5.1.1(v); it calls the same DELETE /api/account the web app uses.
struct ProfileView: View {
    @Environment(AuthManager.self) private var auth
    @State private var confirmingDelete = false
    @State private var isDeleting = false
    @State private var errorMessage: String?
    @State private var showPaywall = false
    @State private var showLogin = false
    @State private var radioMode = RadioPlayer.savedMode
    @State private var dyslexiaSpacing = AccessibilitySettings.dyslexiaFriendlySpacing

    var body: some View {
        List {
            if auth.isSignedIn {
                signedInSections
            } else {
                guestSection
            }

            ReminderSettingsView()

            Section {
                Picker("Radio sound", selection: $radioMode) {
                    ForEach(RadioMode.allCases) { Text($0.label).tag($0) }
                }
                .onChange(of: radioMode) { _, m in RadioPlayer.savedMode = m }
            } header: {
                Text("Settings")
            } footer: {
                Text("How ATC transmissions sound. “Radio” squeezes the voice into the comm band with static and squelch, like a real panel radio; “Busy freq” piles on more noise.")
            }

            Section {
                Toggle("Wider letter & line spacing", isOn: $dyslexiaSpacing)
                    .onChange(of: dyslexiaSpacing) { _, v in AccessibilitySettings.dyslexiaFriendlySpacing = v }
            } footer: {
                Text("Adds extra spacing to your readback transcript and grading results, which some readers with dyslexia find easier to track. This app doesn't bundle a dedicated dyslexia-friendly font — this uses the system font with more room around each letter and line.")
            }

            if let errorMessage {
                Section {
                    Text(errorMessage).foregroundStyle(.red)
                }
            }
        }
        .navigationTitle("Profile")
        .navigationBarTitleDisplayMode(.inline)
        .sheet(isPresented: $showPaywall) {
            NavigationStack { PaywallView() }
        }
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

    // Guest: no account to manage — offer to sign in / create one.
    @ViewBuilder private var guestSection: some View {
        Section {
            Button("Sign in or create an account") { showLogin = true }
        } header: {
            Text("Guest")
        } footer: {
            Text("You're training as a guest. Create a free account to save your scores and streak across devices, and to go Pro.")
        }

        Section("Plans") {
            PlanCard(plan: .free, isCurrent: true)
            // A guest signs in before subscribing (a sub binds to an account).
            PlanCard(plan: .soloPilot, isCurrent: false, action: { showLogin = true })
        }

        Section {
            Button("Exit guest mode") { auth.isGuest = false }
        }
    }

    @ViewBuilder private var signedInSections: some View {
        Section("Account") {
            LabeledContent("Email", value: auth.currentUser?.email ?? "—")
            if let cs = auth.currentUser?.callsign, !cs.isEmpty {
                LabeledContent("Callsign", value: cs)
            }
        }

        ProfileStatsView()

        HomeFieldView()

        Section {
            NavigationLink(value: Route.referral) {
                Text("Refer & Earn")
            }
        }

        Section("Plans") {
            PlanCard(plan: .free, isCurrent: !auth.isPro)
            PlanCard(plan: .soloPilot, isCurrent: auth.isPro,
                     action: auth.isPro ? nil : { showPaywall = true })
            if auth.isPro {
                Text("Manage or cancel in Settings → Apple Account → Subscriptions.")
                    .font(.caption).foregroundStyle(.secondary)
            }
        }

        Section {
            Button("Log out", role: .destructive) { auth.logout() }
        }

        Section {
            if confirmingDelete {
                Button(role: .destructive) {
                    deleteAccount()
                } label: {
                    if isDeleting {
                        ProgressView()
                    } else {
                        Text("Confirm — permanently delete my account")
                    }
                }
                .disabled(isDeleting)
                Button("Cancel") { confirmingDelete = false }
            } else {
                Button("Delete account", role: .destructive) { confirmingDelete = true }
            }
        } header: {
            Text("Danger zone")
        } footer: {
            Text("Permanently deletes your account, grades, logbook, and any CFI/school links. This cannot be undone.")
        }
    }

    private func deleteAccount() {
        errorMessage = nil
        isDeleting = true
        Task {
            defer { isDeleting = false }
            do {
                try await auth.deleteAccount()
                // On success, AuthManager clears currentUser → RootView swaps to LoginView.
            } catch {
                errorMessage = error.localizedDescription
                confirmingDelete = false
            }
        }
    }
}

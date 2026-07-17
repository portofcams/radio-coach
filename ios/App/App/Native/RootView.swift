import SwiftUI

struct RootView: View {
    @State private var auth = AuthManager.shared
    @State private var didRestore = false
    #if DEBUG
    @State private var showDebugPaywall = false
    #endif

    var body: some View {
        Group {
            if !didRestore {
                ProgressView()
            } else if auth.currentUser != nil || auth.isGuest {
                TrainHubView()
                    #if DEBUG
                    .sheet(isPresented: $showDebugPaywall) { NavigationStack { PaywallView() } }
                    #endif
            } else {
                WelcomeView()
            }
        }
        .environment(auth)
        .task {
            #if DEBUG
            // Verification hook: `SIMCTL_CHILD_RC_DEBUG_TOKEN=… simctl launch`
            // seeds a real session so the signed-in UI can be screenshotted
            // without driving the login form. Never compiled into Release.
            if let token = ProcessInfo.processInfo.environment["RC_DEBUG_TOKEN"], !token.isEmpty {
                NSLog("RC_DEBUG: seeding token len=\(token.count)")
                KeychainHelper.save(token)
            } else {
                NSLog("RC_DEBUG: no RC_DEBUG_TOKEN in env")
            }
            if ProcessInfo.processInfo.environment["RC_DEBUG_PAYWALL"] == "1" {
                showDebugPaywall = true
            }
            #endif
            await auth.restoreSession()
            didRestore = true
        }
    }
}

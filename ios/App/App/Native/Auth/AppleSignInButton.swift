import SwiftUI
import AuthenticationServices

// The system "Sign in with Apple" button. On success it extracts Apple's
// identityToken (a signed JWT) and, on the very first authorization, the email,
// and hands them to AuthManager — which verifies server-side at /api/auth/apple
// and stores our own JWT. Requires the com.apple.developer.applesignin
// entitlement (in App.entitlements) + the capability on the App ID.
struct AppleSignInButton: View {
    @Environment(AuthManager.self) private var auth
    var onError: (String) -> Void = { _ in }

    var body: some View {
        SignInWithAppleButton(.signIn) { request in
            request.requestedScopes = [.email, .fullName]
        } onCompletion: { result in
            switch result {
            case .success(let authResults):
                guard
                    let cred = authResults.credential as? ASAuthorizationAppleIDCredential,
                    let tokenData = cred.identityToken,
                    let token = String(data: tokenData, encoding: .utf8)
                else {
                    onError("Apple didn’t return a usable credential. Try again.")
                    return
                }
                // The one-time authorizationCode lets the server fetch a refresh
                // token it can revoke on account deletion (App Store 5.1.1(v)).
                let authCode = cred.authorizationCode.flatMap { String(data: $0, encoding: .utf8) }
                Task {
                    do { try await auth.signInWithApple(identityToken: token, authorizationCode: authCode, email: cred.email) }
                    catch { onError(error.localizedDescription) }
                }
            case .failure(let error):
                // A user cancel isn't worth surfacing as an error.
                if (error as? ASAuthorizationError)?.code == .canceled { return }
                onError(error.localizedDescription)
            }
        }
        .signInWithAppleButtonStyle(.black)
        .frame(height: 50)
    }
}

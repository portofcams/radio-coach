import Foundation

private struct LoginRequest: Encodable { let email: String; let password: String }
private struct SignupRequest: Encodable { let email: String; let password: String }

@Observable
final class AuthManager {
    static let shared = AuthManager()

    var currentUser: User?
    var entitlement: Entitlement?
    var isLoading = false
    /// True when the user chose "Start training" without an account. Lets the
    /// training loop run for anonymous users (the API grades them, capped
    /// per-device) — mirrors the web app's "Continue without account".
    var isGuest = false

    var isPro: Bool { entitlement?.pro ?? false }
    var isSignedIn: Bool { currentUser != nil }

    private let client = NetworkClient.shared

    private init() {}

    /// Call once at app launch — restores the session from a Keychain token, if any.
    func restoreSession() async {
        guard KeychainHelper.load() != nil else { return }
        isLoading = true
        defer { isLoading = false }
        if let me = try? await client.request("/api/auth/me", as: MeResponse.self) {
            currentUser = me.user
            entitlement = me.entitlement
        }
    }

    /// Re-fetch entitlement after a purchase/restore so the UI reflects Pro immediately.
    func refreshEntitlement() async {
        if let me = try? await client.request("/api/auth/me", as: MeResponse.self) {
            entitlement = me.entitlement
        }
    }

    func signup(email: String, password: String) async throws {
        let res: AuthResponse = try await client.request(
            "/api/auth/signup", method: "POST", body: SignupRequest(email: email, password: password)
        )
        KeychainHelper.save(res.token)
        currentUser = res.user
        isGuest = false
        await refreshEntitlement()
    }

    func login(email: String, password: String) async throws {
        let res: AuthResponse = try await client.request(
            "/api/auth/login", method: "POST", body: LoginRequest(email: email, password: password)
        )
        KeychainHelper.save(res.token)
        currentUser = res.user
        isGuest = false
        await refreshEntitlement()
    }

    /// Sign in with Apple. `identityToken` is Apple's signed JWT; `authorizationCode`
    /// is a one-time code the server exchanges for a refresh token (so it can revoke
    /// it on account deletion, App Store 5.1.1(v)); `email` is only present on the
    /// user's first authorization. The server (/api/auth/apple) verifies the token
    /// against Apple's keys and find-or-creates the account.
    func signInWithApple(identityToken: String, authorizationCode: String? = nil, email: String?) async throws {
        var json = ["identityToken": identityToken]
        if let authorizationCode, !authorizationCode.isEmpty { json["authorizationCode"] = authorizationCode }
        if let email, !email.isEmpty { json["email"] = email }
        let res: AuthResponse = try await client.postJSON("/api/auth/apple", json)
        KeychainHelper.save(res.token)
        currentUser = res.user
        isGuest = false
        await refreshEntitlement()
    }

    /// JWTs here are stateless (no server-side revocation) — logout just drops the
    /// local token and returns to the welcome screen (not guest mode).
    func logout() {
        KeychainHelper.clear()
        currentUser = nil
        entitlement = nil
        isGuest = false
    }

    /// Matches Danger Zone in the web app's src/app/profile/page.tsx — same endpoint,
    /// cancels any active subscription server-side before deleting the row.
    func deleteAccount() async throws {
        struct Empty: Decodable {}
        _ = try await client.request("/api/account", method: "DELETE", as: Empty.self)
        logout()
    }
}

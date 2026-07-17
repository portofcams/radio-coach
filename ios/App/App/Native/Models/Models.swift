import Foundation

// Matches the `user` object returned by /api/auth/login, /api/auth/signup,
// and /api/auth/me (src/app/api/auth/*/route.ts). Extend per-screen as
// native views need more fields — avoid modeling response shape we don't use yet.
struct User: Codable, Identifiable {
    let id: Int
    let email: String
    let callsign: String?
}

struct AuthResponse: Codable {
    let user: User
    let token: String
}

// /api/auth/me returns { user, entitlement }. entitlement.pro gates the
// advanced scenario library + hides the paywall.
struct Entitlement: Codable {
    let pro: Bool
    let plan: String?
    let status: String?
    let periodEnd: String?
}

struct MeResponse: Codable {
    let user: User?
    let entitlement: Entitlement?
}

import Foundation

// GET /api/referral -- src/app/api/referral/route.ts. Both referred/converted
// come back as genuine JSON numbers (the route casts ::int / reads pg's own
// ::int-cast COUNT results directly, no parseInt needed server-side), so
// plain Int decoding is correct here -- unlike UserStats.swift's PhaseStat,
// which decodes raw uncast Postgres COUNT strings.
struct ReferralStats: Decodable {
    let code: String
    let referred: Int
    let converted: Int
    let compProUntil: String?
    let link: String
    let isCfi: Bool
    let cfiCompDays: Int

    var cfiMonths: Int { Int((Double(cfiCompDays) / 30).rounded()) }

    var monthsLeft: Int {
        guard let compProUntil, let date = Self.isoFmt.date(from: compProUntil) else { return 0 }
        return max(0, Int((date.timeIntervalSinceNow / 86_400).rounded(.up)))
    }

    private static let isoFmt: ISO8601DateFormatter = {
        let f = ISO8601DateFormatter()
        f.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
        return f
    }()
}

// GET /api/leaderboard?scope=referrals -- src/app/api/leaderboard/route.ts.
// That route's own shape() helper already normalizes every numeric field
// with parseInt() before responding, so (unlike the raw-SQL UserStats
// fields) these decode straight to Int.
struct ReferralLeaderboardResponse: Decodable {
    let scope: String
    let rows: [ReferralLeaderboardRow]
    let you: ReferralLeaderboardRow?
}

struct ReferralLeaderboardRow: Decodable, Identifiable {
    let rank: Int
    let callsign: String
    let passes: Int      // converted referrals, for scope=referrals
    let referred: Int?   // total signups referred
    let you: Bool
    var id: Int { rank }
}

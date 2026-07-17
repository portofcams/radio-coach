import Foundation

// Matches GradeResult in src/lib/types.ts (returned by POST /api/grade).
struct GradeResult: Codable {
    let score: Int
    let passFail: PassFail
    let elements: Elements
    let phraseologyIssues: [String]
    let correctReadback: String
    let feedback: String
    let cfiTip: String
    let deliveryNotes: DeliveryNotes?

    enum PassFail: String, Codable { case pass = "PASS", partial = "PARTIAL", fail = "FAIL" }

    struct Elements: Codable {
        let required: [String]
        let hit: [String]
        let missed: [String]
    }

    // Only ever set by the AI grader (GRADER_MODE=ai) -- nil under the $0 rule
    // grader, which is every environment today. Not rendered in this pass;
    // matches phraseologyIssues, which iOS also decodes but doesn't show yet.
    struct DeliveryNotes: Codable {
        let fillerCount: Int
        let fillerWords: [String]
        let hesitationNote: String?
    }
}

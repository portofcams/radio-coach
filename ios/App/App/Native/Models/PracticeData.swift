import Foundation

// Mirrors LISTEN_CALLS in src/lib/listening.ts (listening.json).
struct ListenCall: Codable, Identifiable, Hashable {
    let id: String
    let text: String
    let context: String
}

// Mirrors ORAL_QUESTIONS in src/lib/oral.ts (oral.json).
struct OralQuestion: Codable, Identifiable, Hashable {
    let id: String
    let area: String
    let question: String
    let answer: String
    let keyPoints: [String]
}

enum PracticeData {
    static let listenCalls: [ListenCall] = load("listening")
    static let oralQuestions: [OralQuestion] = load("oral")

    private static func load<T: Decodable>(_ name: String) -> [T] {
        guard let url = Bundle.main.url(forResource: name, withExtension: "json"),
              let data = try? Data(contentsOf: url),
              let decoded = try? JSONDecoder().decode([T].self, from: data) else {
            assertionFailure("\(name).json missing or malformed")
            return []
        }
        return decoded
    }

    // Word-accuracy score for the listening drill — ports scoreListening() in
    // src/lib/listening.ts (multiset overlap of normalized words).
    static func scoreListening(said: String, target: String) -> (pct: Int, targetWords: Int, matched: Int) {
        func normalize(_ s: String) -> [String] {
            s.lowercased()
                .map { $0.isLetter || $0.isNumber || $0 == " " ? $0 : " " }
                .reduce(into: "") { $0.append($1) }
                .split(separator: " ").map(String.init)
        }
        let t = normalize(target)
        var pool = normalize(said)
        var matched = 0
        for w in t {
            if let i = pool.firstIndex(of: w) { matched += 1; pool.remove(at: i) }
        }
        let pct = t.isEmpty ? 0 : Int((100.0 * Double(matched) / Double(t.count)).rounded())
        return (pct, t.count, matched)
    }
}

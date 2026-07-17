import Foundation

// Self-contained drill data + logic. No network — works on the wrist offline.

enum Phonetics {
    static let alphabet: [Character: String] = [
        "A": "Alpha", "B": "Bravo", "C": "Charlie", "D": "Delta", "E": "Echo",
        "F": "Foxtrot", "G": "Golf", "H": "Hotel", "I": "India", "J": "Juliett",
        "K": "Kilo", "L": "Lima", "M": "Mike", "N": "November", "O": "Oscar",
        "P": "Papa", "Q": "Quebec", "R": "Romeo", "S": "Sierra", "T": "Tango",
        "U": "Uniform", "V": "Victor", "W": "Whiskey", "X": "X-ray", "Y": "Yankee", "Z": "Zulu",
    ]
    static let digits: [Character: String] = [
        "0": "Zero", "1": "One", "2": "Two", "3": "Tree", "4": "Four",
        "5": "Fife", "6": "Six", "7": "Seven", "8": "Eight", "9": "Niner",
    ]

    /// Spell a callsign / mixed string the way ATC says it.
    static func say(_ s: String) -> String {
        s.uppercased().compactMap { ch -> String? in
            if let a = alphabet[ch] { return a }
            if let d = digits[ch] { return d }
            if ch == "." { return "point" }
            if ch == " " { return nil }
            return String(ch)
        }.joined(separator: " ")
    }

    static func randomCallsign() -> String {
        let letters = Array("ABCDEFGHJKLMNPRSTUVWXYZ")
        var s = "N\(Int.random(in: 1...9))\(Int.random(in: 0...9))"
        s.append(letters.randomElement()!)
        s.append(letters.randomElement()!)
        return s
    }
}

struct NumberItem: Identifiable {
    let id = UUID()
    let display: String
    let spoken: String
}

enum Numbers {
    // Frequencies, altitudes, squawks, headings — with the standard spoken form.
    static let items: [NumberItem] = [
        .init(display: "118.5", spoken: "one one eight point fife"),
        .init(display: "121.9", spoken: "one two one point niner"),
        .init(display: "126.75", spoken: "one two six point seven fife"),
        .init(display: "4,500", spoken: "four thousand fife hundred"),
        .init(display: "10,000", spoken: "one zero thousand"),
        .init(display: "3,000", spoken: "tree thousand"),
        .init(display: "Squawk 0234", spoken: "squawk zero two tree four"),
        .init(display: "Squawk 7700", spoken: "squawk seven seven zero zero"),
        .init(display: "Heading 180", spoken: "heading one eight zero"),
        .init(display: "Heading 050", spoken: "heading zero fife zero"),
        .init(display: "Runway 16L", spoken: "runway one six left"),
        .init(display: "Runway 27", spoken: "runway two seven"),
    ]
    static func random() -> NumberItem { items.randomElement()! }
}

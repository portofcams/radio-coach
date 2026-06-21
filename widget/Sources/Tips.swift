import Foundation

// Self-contained widget content — no network, no App Group. A daily phonetic
// letter or radio tip, rotated by date/hour.
struct Tip {
    let title: String
    let body: String
}

enum Tips {
    static let all: [Tip] = [
        Tip(title: "A — Alpha", body: "Phonetic alphabet"),
        Tip(title: "B — Bravo", body: "Phonetic alphabet"),
        Tip(title: "C — Charlie", body: "Phonetic alphabet"),
        Tip(title: "D — Delta", body: "Phonetic alphabet"),
        Tip(title: "E — Echo", body: "Phonetic alphabet"),
        Tip(title: "F — Foxtrot", body: "Phonetic alphabet"),
        Tip(title: "G — Golf", body: "Phonetic alphabet"),
        Tip(title: "H — Hotel", body: "Phonetic alphabet"),
        Tip(title: "I — India", body: "Phonetic alphabet"),
        Tip(title: "J — Juliett", body: "Phonetic alphabet"),
        Tip(title: "K — Kilo", body: "Phonetic alphabet"),
        Tip(title: "L — Lima", body: "Phonetic alphabet"),
        Tip(title: "M — Mike", body: "Phonetic alphabet"),
        Tip(title: "N — November", body: "Phonetic alphabet"),
        Tip(title: "O — Oscar", body: "Phonetic alphabet"),
        Tip(title: "P — Papa", body: "Phonetic alphabet"),
        Tip(title: "Q — Quebec", body: "Phonetic alphabet"),
        Tip(title: "R — Romeo", body: "Phonetic alphabet"),
        Tip(title: "S — Sierra", body: "Phonetic alphabet"),
        Tip(title: "T — Tango", body: "Phonetic alphabet"),
        Tip(title: "U — Uniform", body: "Phonetic alphabet"),
        Tip(title: "V — Victor", body: "Phonetic alphabet"),
        Tip(title: "W — Whiskey", body: "Phonetic alphabet"),
        Tip(title: "X — X-ray", body: "Phonetic alphabet"),
        Tip(title: "Y — Yankee", body: "Phonetic alphabet"),
        Tip(title: "Z — Zulu", body: "Phonetic alphabet"),
        Tip(title: "Niner, fife, tree", body: "Say 9, 5, 3 the ICAO way"),
        Tip(title: "Read back hold-shorts", body: "Verbatim — with the runway"),
        Tip(title: "Wilco = will comply", body: "More than \u{201C}roger\u{201D}"),
        Tip(title: "Roger = received", body: "Not a substitute for a readback"),
        Tip(title: "Squawk VFR = 1200", body: "7600 lost comms, 7700 emergency"),
        Tip(title: "Who, who, where, what", body: "The initial call-up formula"),
    ]

    static func forDate(_ d: Date) -> Tip {
        let cal = Calendar.current
        let idx = cal.component(.hour, from: d) + cal.component(.day, from: d)
        return all[idx % all.count]
    }
}

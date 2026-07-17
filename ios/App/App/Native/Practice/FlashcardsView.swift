import SwiftUI

// #98 -- iPhone-side port of WilcoWatch/Drills.swift + DrillViews.swift, so a
// drill started on the Watch has somewhere to continue via Handoff. This is a
// deliberate DUPLICATION of the small Phonetics/Numbers logic (~60 lines) into
// the iOS target rather than sharing one file across both targets: this
// project's own Watch-embed history (scripts/embed-watch-app.rb's header
// comment) documents a real bug from hand-wiring Xcode target membership --
// duplicating a tiny, stable enum is the safer choice here than editing
// project.pbxproj's Compile Sources build phase by hand.

enum DrillKind: String, CaseIterable, Identifiable, Hashable {
    case phonetic, numbers, callsign
    var id: String { rawValue }
    var label: String {
        switch self {
        case .phonetic: return "Phonetic"
        case .numbers: return "Numbers"
        case .callsign: return "Callsign"
        }
    }
}

private enum Phonetics {
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

private struct NumberItem { let display: String; let spoken: String }
private enum Numbers {
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
    static func matching(display: String) -> NumberItem? { items.first { $0.display == display } }
}

/// #98 Handoff payload -- what a Watch drill screen publishes via
/// `.userActivity`, and what this screen resolves back into a specific card.
/// Hashable (not just Equatable) so it can ride along as a Route associated
/// value in TrainHubView's NavigationStack path.
struct DrillHandoff: Hashable {
    let kind: DrillKind
    let prompt: String
}

struct FlashcardsView: View {
    /// Set when arriving via Watch Handoff -- lands on this exact kind+item
    /// instead of a random one. `nil` for the normal in-app entry point.
    var handoff: DrillHandoff?

    @State private var kind: DrillKind
    @State private var prompt: String
    @State private var answer: String
    @State private var revealed = false

    init(handoff: DrillHandoff? = nil) {
        self.handoff = handoff
        let k = handoff?.kind ?? .phonetic
        _kind = State(initialValue: k)
        let (p, a) = Self.item(for: k, prompt: handoff?.prompt)
        _prompt = State(initialValue: p)
        _answer = State(initialValue: a)
    }

    var body: some View {
        VStack(spacing: 16) {
            Picker("Drill", selection: $kind) {
                ForEach(DrillKind.allCases) { Text($0.label).tag($0) }
            }
            .pickerStyle(.segmented)
            .onChange(of: kind) { _, new in next(for: new) }

            Spacer(minLength: 8)
            VStack(spacing: 14) {
                Text(prompt)
                    .font(.system(size: 44, weight: .bold, design: .monospaced))
                    .minimumScaleFactor(0.5)
                    .lineLimit(2)
                if revealed {
                    Text(answer).font(.title3).foregroundStyle(.cyan).multilineTextAlignment(.center)
                } else {
                    Text("Tap to reveal").font(.subheadline).foregroundStyle(.secondary)
                }
            }
            .frame(maxWidth: .infinity)
            .padding(24)
            .background(Color(.secondarySystemBackground), in: RoundedRectangle(cornerRadius: 16))
            .contentShape(Rectangle())
            .onTapGesture { if !revealed { revealed = true } }
            .accessibilityElement(children: .ignore)
            .accessibilityLabel(revealed ? "\(prompt). Spoken form: \(answer)" : "\(prompt). Double tap to reveal.")

            Spacer(minLength: 8)
            Button(revealed ? "Next" : "Reveal") {
                if revealed { next(for: kind) } else { revealed = true }
            }
            .buttonStyle(.borderedProminent)
            .controlSize(.large)
            .tint(.cyan)
        }
        .padding(20)
        .navigationTitle("Flashcards")
        .navigationBarTitleDisplayMode(.inline)
        // Continuity in the OTHER direction too: this screen also publishes
        // its own current card, so "Continue on iPhone/Watch" works both ways
        // as long as both targets declare the same NSUserActivityTypes entry.
        .userActivity("com.binnacleai.radiocoach.drill") { activity in
            activity.title = "Continue this drill"
            activity.userInfo = ["drillType": kind.rawValue, "prompt": prompt]
            activity.isEligibleForHandoff = true
        }
    }

    private func next(for k: DrillKind) {
        let (p, a) = Self.item(for: k, prompt: nil)
        prompt = p; answer = a; revealed = false
    }

    private static func item(for kind: DrillKind, prompt requestedPrompt: String?) -> (String, String) {
        switch kind {
        case .phonetic:
            let pool = Array("ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789")
            let ch: Character = requestedPrompt?.first ?? pool.randomElement()!
            return (String(ch), Phonetics.alphabet[ch] ?? Phonetics.digits[ch] ?? String(ch))
        case .numbers:
            let item = requestedPrompt.flatMap(Numbers.matching(display:)) ?? Numbers.random()
            return (item.display, item.spoken)
        case .callsign:
            let cs = requestedPrompt ?? Phonetics.randomCallsign()
            return (cs, Phonetics.say(cs))
        }
    }
}

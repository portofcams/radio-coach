import WidgetKit
import SwiftUI

// A watch-face complication: a daily phonetic letter / radio tip. Self-contained
// (no network, no account) — taps open the Wilco watch app. Supports the
// accessory families (circular, rectangular, inline, corner).

struct CTip {
    let letter: String
    let word: String
    var title: String { "\(letter) — \(word)" }
    var short: String { "\(letter) \(word)" }
}

enum CTips {
    static let all: [CTip] = [
        CTip(letter: "A", word: "Alpha"), CTip(letter: "B", word: "Bravo"), CTip(letter: "C", word: "Charlie"),
        CTip(letter: "D", word: "Delta"), CTip(letter: "E", word: "Echo"), CTip(letter: "F", word: "Foxtrot"),
        CTip(letter: "G", word: "Golf"), CTip(letter: "H", word: "Hotel"), CTip(letter: "I", word: "India"),
        CTip(letter: "J", word: "Juliett"), CTip(letter: "K", word: "Kilo"), CTip(letter: "L", word: "Lima"),
        CTip(letter: "M", word: "Mike"), CTip(letter: "N", word: "November"), CTip(letter: "O", word: "Oscar"),
        CTip(letter: "P", word: "Papa"), CTip(letter: "Q", word: "Quebec"), CTip(letter: "R", word: "Romeo"),
        CTip(letter: "S", word: "Sierra"), CTip(letter: "T", word: "Tango"), CTip(letter: "U", word: "Uniform"),
        CTip(letter: "V", word: "Victor"), CTip(letter: "W", word: "Whiskey"), CTip(letter: "X", word: "X-ray"),
        CTip(letter: "Y", word: "Yankee"), CTip(letter: "Z", word: "Zulu"),
    ]
    static func forDate(_ d: Date) -> CTip {
        let cal = Calendar.current
        return all[(cal.component(.hour, from: d) + cal.component(.day, from: d)) % all.count]
    }
}

struct CEntry: TimelineEntry { let date: Date; let tip: CTip }

struct CProvider: TimelineProvider {
    func placeholder(in context: Context) -> CEntry { CEntry(date: Date(), tip: CTips.all[3]) }
    func getSnapshot(in context: Context, completion: @escaping (CEntry) -> Void) { completion(CEntry(date: Date(), tip: CTips.forDate(Date()))) }
    func getTimeline(in context: Context, completion: @escaping (Timeline<CEntry>) -> Void) {
        let cal = Calendar.current, now = Date()
        let entries = (0..<8).map { i -> CEntry in let d = cal.date(byAdding: .hour, value: i, to: now) ?? now; return CEntry(date: d, tip: CTips.forDate(d)) }
        completion(Timeline(entries: entries, policy: .atEnd))
    }
}

struct CView: View {
    @Environment(\.widgetFamily) var family
    var entry: CEntry
    var body: some View {
        switch family {
        case .accessoryInline:
            Text("Wilco: \(entry.tip.short)")
        case .accessoryCircular:
            VStack(spacing: 0) {
                Text(entry.tip.letter).font(.system(size: 20, weight: .bold, design: .rounded))
                Text(entry.tip.word).font(.system(size: 9)).minimumScaleFactor(0.5).lineLimit(1)
            }
        case .accessoryRectangular:
            VStack(alignment: .leading, spacing: 2) {
                Text("WILCO").font(.system(size: 9, weight: .bold, design: .monospaced)).foregroundStyle(.secondary)
                Text(entry.tip.title).font(.headline)
                Text("Tap to practice").font(.system(size: 10)).foregroundStyle(.secondary)
            }
        default:
            Text(entry.tip.letter).font(.system(size: 18, weight: .bold))
        }
    }
}

struct WilcoComplication: Widget {
    let kind = "WilcoComplication"
    var body: some WidgetConfiguration {
        StaticConfiguration(kind: kind, provider: CProvider()) { entry in
            if #available(watchOS 10.0, *) {
                CView(entry: entry).containerBackground(.clear, for: .widget)
            } else {
                CView(entry: entry)
            }
        }
        .configurationDisplayName("Wilco")
        .description("A daily phonetic letter on your watch face.")
        .supportedFamilies([.accessoryCircular, .accessoryRectangular, .accessoryInline, .accessoryCorner])
    }
}

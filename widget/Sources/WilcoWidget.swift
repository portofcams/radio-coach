import WidgetKit
import SwiftUI

struct WilcoEntry: TimelineEntry {
    let date: Date
    let tip: Tip
}

struct WilcoProvider: TimelineProvider {
    func placeholder(in context: Context) -> WilcoEntry { WilcoEntry(date: Date(), tip: Tips.all[3]) }

    func getSnapshot(in context: Context, completion: @escaping (WilcoEntry) -> Void) {
        completion(WilcoEntry(date: Date(), tip: Tips.forDate(Date())))
    }

    func getTimeline(in context: Context, completion: @escaping (Timeline<WilcoEntry>) -> Void) {
        let cal = Calendar.current
        let now = Date()
        let entries = (0..<12).map { i -> WilcoEntry in
            let d = cal.date(byAdding: .hour, value: i, to: now) ?? now
            return WilcoEntry(date: d, tip: Tips.forDate(d))
        }
        completion(Timeline(entries: entries, policy: .atEnd))
    }
}

struct WilcoWidgetEntryView: View {
    var entry: WilcoEntry
    var body: some View {
        VStack(alignment: .leading, spacing: 4) {
            Text("WILCO")
                .font(.system(size: 10, weight: .bold, design: .monospaced))
                .foregroundStyle(.secondary)
            Spacer(minLength: 2)
            Text(entry.tip.title)
                .font(.system(size: 20, weight: .bold, design: .rounded))
                .minimumScaleFactor(0.6)
                .lineLimit(2)
            Text(entry.tip.body)
                .font(.caption)
                .foregroundStyle(.secondary)
                .lineLimit(2)
            Spacer(minLength: 2)
            Text("Tap to practice \u{2192}")
                .font(.system(size: 11, weight: .medium))
                .foregroundStyle(.tint)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .widgetURL(URL(string: "https://wilco.binnacleai.com/practice"))
    }
}

struct WilcoWidget: Widget {
    let kind = "WilcoWidget"
    var body: some WidgetConfiguration {
        StaticConfiguration(kind: kind, provider: WilcoProvider()) { entry in
            if #available(iOS 17.0, *) {
                WilcoWidgetEntryView(entry: entry)
                    .containerBackground(.fill.tertiary, for: .widget)
            } else {
                WilcoWidgetEntryView(entry: entry)
                    .padding()
            }
        }
        .configurationDisplayName("Wilco")
        .description("A daily phonetic letter + radio tip. Tap to practice.")
        .supportedFamilies([.systemSmall, .systemMedium])
    }
}

import ActivityKit
import WidgetKit
import SwiftUI

// #97 -- Lock Screen banner + Dynamic Island for the current scenario phase.
// Started/updated/ended from ScenarioViewModel.setPhase() in the app target;
// this file only renders whatever ContentState it's handed.
struct ScenarioLiveActivity: Widget {
    var body: some WidgetConfiguration {
        ActivityConfiguration(for: ScenarioActivityAttributes.self) { context in
            HStack(alignment: .center) {
                Image(systemName: "antenna.radiowaves.left.and.right")
                    .foregroundStyle(.cyan)
                VStack(alignment: .leading, spacing: 2) {
                    Text(context.attributes.scenarioTitle)
                        .font(.caption).fontWeight(.semibold)
                        .lineLimit(1)
                        .foregroundStyle(.secondary)
                    Text(context.state.phaseLabel)
                        .font(.subheadline).fontWeight(.medium)
                }
                Spacer()
            }
            .padding()
            .activityBackgroundTint(Color.black.opacity(0.65))
            .activitySystemActionForegroundColor(Color.white)
        } dynamicIsland: { context in
            DynamicIsland {
                DynamicIslandExpandedRegion(.leading) {
                    Image(systemName: "antenna.radiowaves.left.and.right").foregroundStyle(.cyan)
                }
                DynamicIslandExpandedRegion(.trailing) {
                    Text(context.state.phaseLabel).font(.caption).fontWeight(.semibold)
                }
                DynamicIslandExpandedRegion(.bottom) {
                    Text(context.attributes.scenarioTitle).font(.caption).lineLimit(1).foregroundStyle(.secondary)
                }
            } compactLeading: {
                Image(systemName: "antenna.radiowaves.left.and.right").foregroundStyle(.cyan)
            } compactTrailing: {
                Text(compactLabel(context.state.phaseLabel))
                    .font(.caption2).fontWeight(.semibold)
            } minimal: {
                Image(systemName: "antenna.radiowaves.left.and.right").foregroundStyle(.cyan)
            }
        }
    }

    // The Dynamic Island's compact trailing slot is only a few characters
    // wide -- collapse the full phase sentence to something that still fits.
    private func compactLabel(_ phaseLabel: String) -> String {
        switch phaseLabel {
        case "Recording your readback": return "REC"
        case "Transcribing": return "STT"
        case "Grading": return "..."
        case "Done": return "✓"
        default: return "ATC"
        }
    }
}

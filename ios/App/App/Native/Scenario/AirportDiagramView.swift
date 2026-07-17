import SwiftUI

// Native port of the real-chart branch of src/components/AirportDiagram.tsx:
// the bundled FAA airport-diagram image with a cyan ownship marker overlaid at
// the aircraft's position (% of image) and heading.
struct AirportDiagramView: View {
    let diagram: Scenario.Diagram

    private static let cyan = Color(red: 0.13, green: 0.83, blue: 0.93) // #22d3ee

    var body: some View {
        if let name = diagram.chartImageName, let ui = loadChart(name) {
            VStack(spacing: 0) {
                HStack {
                    Text("FAA AIRPORT DIAGRAM · \(diagram.airport)")
                        .font(.system(size: 10, design: .monospaced)).tracking(1.5)
                        .foregroundStyle(.secondary)
                    Spacer()
                    Text("NOT FOR NAVIGATION")
                        .font(.system(size: 10, design: .monospaced))
                        .foregroundStyle(.tertiary)
                }
                .padding(.horizontal, 12).padding(.vertical, 8)

                Image(uiImage: ui)
                    .resizable()
                    .aspectRatio(ui.size.width / ui.size.height, contentMode: .fit)
                    .overlay(alignment: .topLeading) { ownshipOverlay }
                    .background(.white)
            }
            .background(Color(.secondarySystemBackground))
            .clipShape(RoundedRectangle(cornerRadius: 12))
            .overlay(RoundedRectangle(cornerRadius: 12).strokeBorder(Color(.separator)))
            // The scenario's setup/ATC-call text (read elsewhere on this same
            // screen) already narrates this same taxi route in words -- this
            // diagram is a supplementary visual aid, not the only source of
            // the information. Grouped into one brief, non-redundant
            // announcement instead of VoiceOver reading each tiny overlay
            // label (10pt diagram annotations, "NOT FOR NAVIGATION", etc.)
            // as separate, confusing fragments.
            .accessibilityElement(children: .ignore)
            .accessibilityLabel("Airport diagram for \(diagram.airport), illustrating the route described above")
        }
    }

    @ViewBuilder private var ownshipOverlay: some View {
        if let a = diagram.aircraft {
            GeometryReader { geo in
                Ownship(heading: a.heading)
                    .position(x: geo.size.width * a.x / 100, y: geo.size.height * a.y / 100)
            }
        }
    }

    private func loadChart(_ name: String) -> UIImage? {
        if let path = Bundle.main.path(forResource: name, ofType: "png"),
           let img = UIImage(contentsOfFile: path) {
            return img
        }
        return UIImage(named: name)
    }
}

// Top-down aircraft marker that points up at heading 0, with a soft pulse ring.
private struct Ownship: View {
    let heading: Double
    @State private var pulse = false
    private static let cyan = Color(red: 0.13, green: 0.83, blue: 0.93)

    var body: some View {
        ZStack {
            Circle()
                .fill(Self.cyan.opacity(0.25))
                .frame(width: 26, height: 26)
                .scaleEffect(pulse ? 1.8 : 0.6)
                .opacity(pulse ? 0 : 0.9)
                .animation(.easeOut(duration: 1.8).repeatForever(autoreverses: false), value: pulse)
            Image(systemName: "location.north.fill")
                .font(.system(size: 16))
                .foregroundStyle(Self.cyan)
                .shadow(color: Self.cyan.opacity(0.9), radius: 3)
                .rotationEffect(.degrees(heading))
        }
        .onAppear { pulse = true }
    }
}

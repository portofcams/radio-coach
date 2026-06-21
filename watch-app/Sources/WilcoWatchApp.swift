import SwiftUI

@main
struct WilcoWatchApp: App {
    var body: some Scene {
        WindowGroup {
            ContentView()
        }
    }
}

struct ContentView: View {
    var body: some View {
        NavigationStack {
            List {
                NavigationLink("Phonetic flash") { PhoneticDrillView() }
                NavigationLink("Number readback") { NumbersDrillView() }
                NavigationLink("Callsign spell") { CallsignDrillView() }
            }
            .navigationTitle("Wilco")
        }
    }
}

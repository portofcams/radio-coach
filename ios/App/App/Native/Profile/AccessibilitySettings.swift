import SwiftUI

// #99 -- persisted accessibility preference, same UserDefaults idiom as
// RadioPlayer's savedMode. NOT a bundled custom font: no dyslexia-oriented
// font ships in this app (nothing was vendored, and fetching/bundling a
// third-party font file plus wiring Info.plist's UIAppFonts is a real,
// separate undertaking with its own licensing check -- out of scope here).
// This applies the actual evidence-backed technique available without a
// custom font: increased letter- and line-spacing, which measurably reduces
// crowding for many dyslexic readers on the existing system font.
enum AccessibilitySettings {
    private static let key = "rc_dyslexia_spacing"

    static var dyslexiaFriendlySpacing: Bool {
        get { UserDefaults.standard.bool(forKey: key) }
        set { UserDefaults.standard.set(newValue, forKey: key) }
    }

    static let extraTracking: Double = 0.6
    static let extraLineSpacing: Double = 4
}

private struct DyslexiaFriendlyReadout: ViewModifier {
    func body(content: Content) -> some View {
        if AccessibilitySettings.dyslexiaFriendlySpacing {
            content.tracking(AccessibilitySettings.extraTracking).lineSpacing(AccessibilitySettings.extraLineSpacing)
        } else {
            content
        }
    }
}

extension View {
    /// Applied to the readback transcript + grading result text (#99) --
    /// wider letter/line spacing when the reader has turned on Learner-
    /// readability mode in Settings. A no-op otherwise.
    func dyslexiaFriendlyReadout() -> some View {
        modifier(DyslexiaFriendlyReadout())
    }
}

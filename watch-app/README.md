# Wilco — Apple Watch micro-drills (watchOS app)

Complete SwiftUI source for a wrist app: quick **phonetic / numbers / callsign**
flashcard drills, fully offline (no network, no Capacitor). The Swift is done;
what's left is a one-time **Xcode GUI step** to add the watchOS target and drop
these files in — that can't be scripted reliably (and `ios/` is gitignored, so
the target wouldn't be durable in git anyway, which is why the source lives here).

## Files (`watch-app/Sources/`)
- `WilcoWatchApp.swift` — `@main` app + `ContentView` (the drill menu)
- `Drills.swift` — phonetic/number data + spelling logic (niner/fife/tree)
- `DrillViews.swift` — the three flashcard drill screens

## One-time setup (Xcode, ~15 min)
1. Open `ios/App/App.xcworkspace` in Xcode.
2. **File → New → Target… → watchOS → App** (SwiftUI, no complications needed).
   - Product name: `WilcoWatch`
   - Bundle id: `com.binnacleai.radiocoach.watchkitapp` (must be the iOS id + `.watchkitapp`)
   - "Embed in companion app": **App**
3. Delete the auto-generated `ContentView.swift` / `…App.swift` in the new target,
   then **add the three files** from `watch-app/Sources/` to the watch target
   (drag in; check the WilcoWatch target membership).
4. Signing: select the watch target → Signing & Capabilities → Team `CCSWC89S2V`,
   Automatically manage signing (it'll create the watch provisioning profile).
5. Set the watch target's deployment target to watchOS 10.0+ (SwiftUI `NavigationStack`).
6. Build to a paired Watch simulator to smoke-test the three drills.

## Shipping
The watch app embeds in the iOS app — archive the **App** scheme as usual
(the verified recipe in `ai-atc-radio-coach-plan.md`: Node22 PATH + UTF-8 +
`AuthKey_SVA3JDJ975.p8`), and the watch build rides along to TestFlight.
Bump `CURRENT_PROJECT_VERSION` (currently 6) for both targets.

## Notes
- Pure SwiftUI + WatchKit haptic (`.click`); no third-party deps.
- ⚠️ Not build-verified here (no watchOS toolchain in the build env) — compile in
  Xcode and fix any minor API drift before archiving.
- Re-running `npx cap add ios` (full regen) would drop the target; `npx cap sync`
  (copy + plugin/pod update) does **not** — but keep this source as the backup.

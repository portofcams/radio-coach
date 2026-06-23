# Clearspar — Apple Watch complication (watchOS WidgetKit)

A watch-face complication showing a **daily phonetic letter** (A — Alpha…),
self-contained (no network, no account). Supports the accessory families
(circular, rectangular, inline, corner). Tapping opens the Clearspar watch app.

## Files
- `Sources/` (committed) — `WilcoComplication.swift` (tips + provider + family-aware
  view + widget) and `WilcoComplicationBundle.swift` (`@main`).
- `ios-template/` — `Info.plist` (NSExtension = widgetkit-extension) + a minimal
  `Assets.xcassets`.
- `../scripts/add-watch-complication.rb` — adds the `WilcoComplication` watchOS
  extension and embeds it in the **WilcoWatch app** (PlugIns).

## Wiring it up
Requires the watch target first. Run from repo root:
```sh
gem install xcodeproj          # once
npx cap sync ios
ruby scripts/add-watch-target.rb
ruby scripts/add-watch-complication.rb
```
Verify it compiles:
```sh
xcodebuild -project ios/App/App.xcodeproj -target WilcoComplication \
  -sdk watchsimulator -configuration Debug CODE_SIGNING_ALLOWED=NO build
# ** BUILD SUCCEEDED **  (verified 2026-06-21, Xcode 26.5 / watchOS 26.5 SDK)
```

## Notes
- Bundle id `com.binnacleai.radiocoach.watchkitapp.complication` (sub-bundle of the
  watch app). Signing is automatic with team `CCSWC89S2V`.
- This version shows a phonetic-of-the-day — **no account data**. A streak/readiness
  complication would need the watch app to sync from the account (future work:
  WatchConnectivity or a small authenticated fetch).
- Embeds in the watch app, which embeds in the iOS app — archiving the App scheme
  ships all three to TestFlight.

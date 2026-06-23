# Clearspar — Siri App Shortcut

`Sources/ClearsparShortcuts.swift` (committed) defines an App Intent + AppShortcutsProvider
so users can say **"Hey Siri, practice radio with Clearspar"** (also "start a drill in
Clearspar" / "quiz me on phonetics with Clearspar") to open the app. App Shortcuts are
zero-config on iOS 16+ — no Info.plist or registration needed.

## Wiring it up
`ios/` is gitignored, so re-run the script after a fresh `npx cap add ios`:
```sh
ruby scripts/add-siri-intent.rb     # copies the Swift into ios/App/App + adds it to the App target
```
Verify the Swift compiles (no full build / pods needed):
```sh
xcrun -sdk iphonesimulator swiftc -typecheck -target arm64-apple-ios16.0-simulator siri/Sources/ClearsparShortcuts.swift
# (clean exit = OK; verified 2026-06-20, iOS 26.5 SDK)
```

## Notes
- The intent sets `openAppWhenRun = true` and opens Clearspar to its home. Deep-linking
  to `/practice` would need the web app to handle a launch URL (Associated Domains
  or a custom scheme) — a future enhancement.
- The phrases appear in the Shortcuts app and Siri automatically once the build with
  this file ships to TestFlight / the App Store.

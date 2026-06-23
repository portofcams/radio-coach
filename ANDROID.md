# Clearspar Radio Trainer — Android (Capacitor)

Clearspar Radio Trainer's iOS app is a Capacitor shell that loads the live site
(`https://wilco.binnacleai.com`, see `capacitor.config.ts`). Android works the
same way — the web app already runs in any browser, so the Android wrapper is
thin. `@capacitor/android` is installed; the `android/` project is gitignored and
generated on demand, so this is a one-time scaffold + build (needs Android Studio,
which isn't on the iOS dev Mac).

## One-time scaffold
```sh
npx cap add android      # generates android/ from the installed @capacitor/android
npx cap sync android     # copy web assets + plugin configs
```
`capacitor.config.ts` already sets `appId: com.binnacleai.radiocoach`, `appName: Clearspar Radio Trainer`,
and `server.url`, so the wrapper points at production with no extra config.

## Build / run (Android Studio + SDK required)
```sh
npx cap open android     # opens the project in Android Studio
```
- Set up signing (Build → Generate Signed Bundle / APK) with a new upload keystore.
- Min SDK 23+ is fine (Capacitor 8 default).
- Run on an emulator/device to smoke-test, then build a signed **AAB** for Play.

## Push (optional, later)
Android push uses **FCM**, not APNs: add `google-services.json` to `android/app`,
add the Firebase Gradle plugin, and `@capacitor/push-notifications` (already
installed) will deliver the FCM token to `/api/push/register` with
`platform: 'android'`. The server `rc_push_tokens` table already stores both
platforms; the sender in `src/lib/apns.ts` is iOS-only — an FCM sender would be a
sibling module.

## Play Store
- Create the app in the Play Console, com.binnacleai.radiocoach.
- Privacy policy URL, data-safety form, screenshots (the web UI), AAB upload.
- Internal testing track first, then production.

## Notes
- Because the wrapper loads the live URL, **web deploys ship to Android instantly**
  — you only rebuild the AAB for native shell changes (plugins, icons, version).
- Bump `versionCode`/`versionName` in `android/app/build.gradle` per release.

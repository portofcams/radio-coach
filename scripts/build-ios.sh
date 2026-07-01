#!/bin/bash
set -e

# Builds the locally bundled static export used by the iOS app (fixes App
# Store guideline 4.2 — no more loading the live website in a remote webview;
# see capacitor.config.ts). The website itself keeps deploying via deploy.sh
# (output: 'standalone', SSR, unaffected by this script).
#
# directory/ and top-pilots/ read the DB directly at request time (SEO-only
# pages, never linked to from in-app navigation — see profile/school pages,
# which now link to them as absolute https://clearsparradio.binnacleai.com/...
# URLs instead) and can't be statically exported, so they're excluded from
# the app build only.
#
# api/ is excluded entirely — the native app never calls its own bundled API
# routes (there's no server behind a static export to run them). Every
# fetch('/api/...') call gets redirected to the real API host at runtime by
# src/lib/native-fetch.ts instead.
#
# s/ is the public score-card share landing (reads searchParams server-side
# to build personalized OG image previews for social links) — never linked
# to from in-app navigation, only shared externally; resolves fine on the
# live website for whoever opens the link.

cd "$(dirname "$0")/.."

EXCLUDE_DIRS=(src/app/directory src/app/top-pilots src/app/api src/app/s)
STASH=".ios-build-excluded"

rm -rf "$STASH"
mkdir -p "$STASH"
echo "Excluding DB-backed pages and API routes from the app bundle..."
for d in "${EXCLUDE_DIRS[@]}"; do
  if [ -e "$d" ]; then
    mkdir -p "$STASH/$(dirname "$d")"
    mv "$d" "$STASH/$d"
  fi
done

restore() {
  echo "Restoring excluded pages..."
  for d in "${EXCLUDE_DIRS[@]}"; do
    if [ -e "$STASH/$d" ]; then
      mkdir -p "$(dirname "$d")"
      mv "$STASH/$d" "$d"
    fi
  done
  rm -rf "$STASH"
}
trap restore EXIT

echo "Building static export (BUILD_TARGET=ios)..."
rm -rf out .next
BUILD_TARGET=ios npm run build

restore
trap - EXIT

echo "Syncing Capacitor (copies out/ into ios/App)..."
npx cap sync ios

echo "Done — open ios/App/App.xcworkspace and archive as usual."

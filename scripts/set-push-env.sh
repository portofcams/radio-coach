#!/bin/sh
# Capacitor regenerates ios/ on `cap sync`. If App.entitlements ever resets,
# re-run this from the repo root to restore the production APNs entitlement
# (TestFlight/App Store builds use the production APNs gateway, which the
# server's apns.ts targets by default).
set -e
ENT="ios/App/App/App.entitlements"
/usr/libexec/PlistBuddy -c "Set :aps-environment production" "$ENT" 2>/dev/null \
  || /usr/libexec/PlistBuddy -c "Add :aps-environment string production" "$ENT"
echo "aps-environment = production in $ENT"

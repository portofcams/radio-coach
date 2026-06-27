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

# Declare encryption-exempt (standard HTTPS only) so TestFlight builds skip the
# "Missing Compliance" gate that blocks distribution to testers.
INFO="ios/App/App/Info.plist"
/usr/libexec/PlistBuddy -c "Set :ITSAppUsesNonExemptEncryption NO" "$INFO" 2>/dev/null \
  || /usr/libexec/PlistBuddy -c "Add :ITSAppUsesNonExemptEncryption bool NO" "$INFO"
echo "ITSAppUsesNonExemptEncryption = NO in $INFO"

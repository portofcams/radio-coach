import type { CapacitorConfig } from '@capacitor/cli'

// webDir points at the static export scripts/build-ios.sh produces (`out/`),
// bundled into the app — NOT a remote server.url. Loading a live website in a
// webview is what triggered the App Store 4.2 (minimum functionality)
// rejection; the app now ships its own local UI and talks to the API host
// only for data (see src/lib/native-fetch.ts).
const config: CapacitorConfig = {
  appId: 'com.binnacleai.radiocoach',
  appName: 'Clearspar Radio Trainer',
  webDir: 'out',
  ios: {
    contentInset: 'automatic',
  },
}

export default config

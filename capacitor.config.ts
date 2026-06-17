import type { CapacitorConfig } from '@capacitor/cli'

// In dev: Capacitor points to your local Next.js server.
// For TestFlight/App Store builds: remove the server block and set
// server.url to 'https://radiocoach.binnacleai.com'
const config: CapacitorConfig = {
  appId: 'com.binnacleai.radiocoach',
  appName: 'Radio Coach',
  webDir: 'public',
  server: {
    url: 'http://localhost:3001',
    cleartext: true,
  },
  ios: {
    contentInset: 'automatic',
  },
}

export default config

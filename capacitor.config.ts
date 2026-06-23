import type { CapacitorConfig } from '@capacitor/cli'

const config: CapacitorConfig = {
  appId: 'com.binnacleai.radiocoach',
  appName: 'Clearspar Radio Trainer',
  webDir: 'public',
  server: {
    url: 'https://wilco.binnacleai.com',
  },
  ios: {
    contentInset: 'automatic',
  },
}

export default config

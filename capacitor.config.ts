import type { CapacitorConfig } from '@capacitor/cli'

const config: CapacitorConfig = {
  appId: 'com.binnacleai.radiocoach',
  appName: 'Radio Coach',
  webDir: 'public',
  server: {
    url: 'https://radiocoach.binnacleai.com',
  },
  ios: {
    contentInset: 'automatic',
  },
}

export default config

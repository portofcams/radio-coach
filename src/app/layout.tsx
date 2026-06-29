import type { Metadata } from 'next'
import './globals.css'
import NativeInit from '@/components/NativeInit'
import InstallPrompt from '@/components/InstallPrompt'
import ThemeToggle from '@/components/ThemeToggle'
import SiteFooter from '@/components/SiteFooter'
import Analytics from '@/components/Analytics'

// Set the theme class before paint (no flash of the wrong theme).
const THEME_SCRIPT = `(function(){try{var t=localStorage.getItem('wilco_theme');if(t==='dark'||(!t&&matchMedia('(prefers-color-scheme:dark)').matches))document.documentElement.classList.add('dark')}catch(e){}})()`

export const metadata: Metadata = {
  title: 'Clearspar Radio Trainer — ATC Radio Training',
  description:
    'Clearspar Radio Trainer — learn aviation radio comms like a game. Free Ground School drills plus live, graded ATC readbacks. No mic, works offline.',
  metadataBase: new URL('https://clearsparradio.binnacleai.com'),
  openGraph: {
    title: 'Clearspar Radio Trainer — your radio calls, graded like a CFI',
    description: 'Free ATC readback training. AI grades every element against the FAA AIM. No mic, works offline.',
    url: 'https://clearsparradio.binnacleai.com',
    siteName: 'Clearspar Radio Trainer',
    images: [{ url: '/api/og', width: 1200, height: 630 }],
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Clearspar Radio Trainer — graded like a CFI',
    description: 'Free ATC readback training. AI grades every element. No mic, works offline.',
    images: ['/api/og'],
  },
  manifest: '/manifest.webmanifest',
  icons: {
    icon: '/icon-192.png',
    apple: '/apple-icon.png',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />
      </head>
      <body className="antialiased">
        <NativeInit />
        <Analytics />
        {children}
        <SiteFooter />
        <InstallPrompt />
        <ThemeToggle />
      </body>
    </html>
  )
}

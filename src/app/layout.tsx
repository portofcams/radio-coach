import type { Metadata } from 'next'
import './globals.css'
import NativeInit from '@/components/NativeInit'
import InstallPrompt from '@/components/InstallPrompt'

export const metadata: Metadata = {
  title: 'Wilco — Clearspar Radio Training',
  description:
    'Wilco by Clearspar — learn aviation radio comms like a game. Free Ground School drills plus live, graded ATC readbacks. No mic, works offline.',
  manifest: '/manifest.webmanifest',
  icons: {
    icon: '/icon-192.png',
    apple: '/apple-icon.png',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-white text-gray-900 antialiased">
        <NativeInit />
        {children}
        <InstallPrompt />
      </body>
    </html>
  )
}

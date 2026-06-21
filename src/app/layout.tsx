import type { Metadata } from 'next'
import './globals.css'
import NativeInit from '@/components/NativeInit'

export const metadata: Metadata = {
  title: 'Wilco — Clearspar Radio Training',
  description:
    'Wilco by Clearspar — learn aviation radio comms like a game. Free Ground School drills plus live, graded ATC readbacks. No mic, works offline.',
  manifest: '/manifest.webmanifest',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-white text-gray-900 antialiased">
        <NativeInit />
        {children}
      </body>
    </html>
  )
}

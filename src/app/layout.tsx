import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Wilco — Clearspar Radio Training',
  description:
    'Wilco by Clearspar — learn aviation radio comms like a game. Free Ground School drills plus live, graded ATC readbacks. No mic, works offline.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-white text-gray-900 antialiased">{children}</body>
    </html>
  )
}

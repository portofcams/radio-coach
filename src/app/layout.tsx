import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Radio Coach — ATC readback trainer',
  description:
    'Built by a student pilot who kept screwing up radio calls. Practice ATC readbacks until they\'re second nature.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-white text-gray-900 antialiased">{children}</body>
    </html>
  )
}

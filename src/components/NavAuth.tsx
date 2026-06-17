'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

export default function NavAuth() {
  const [user, setUser] = useState<{ email: string } | null | undefined>(undefined)

  useEffect(() => {
    fetch('/api/auth/me')
      .then((r) => r.json())
      .then((d) => setUser(d.user ?? null))
      .catch(() => setUser(null))
  }, [])

  if (user === undefined) return null // loading — render nothing to avoid flash

  if (user) {
    return (
      <div className="flex items-center gap-3">
        <Link href="/profile" className="text-sm text-gray-600 hover:text-gray-900 font-medium">
          Profile
        </Link>
        <Link href="/train" className="bg-gray-900 text-white text-sm px-4 py-2 rounded-lg font-medium hover:bg-gray-800 transition-colors">
          Start training →
        </Link>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-3">
      <Link href="/login" className="text-sm text-gray-600 hover:text-gray-900 font-medium">
        Sign in
      </Link>
      <Link href="/train" className="bg-gray-900 text-white text-sm px-4 py-2 rounded-lg font-medium hover:bg-gray-800 transition-colors">
        Start training →
      </Link>
    </div>
  )
}

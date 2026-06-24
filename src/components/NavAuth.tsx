'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

export default function NavAuth({ dark = false }: { dark?: boolean }) {
  const [user, setUser] = useState<{ email: string } | null | undefined>(undefined)

  useEffect(() => {
    fetch('/api/auth/me')
      .then((r) => r.json())
      .then((d) => setUser(d.user ?? null))
      .catch(() => setUser(null))
  }, [])

  if (user === undefined) return null // loading — render nothing to avoid flash

  const linkCls = dark
    ? 'text-sm text-gray-300 hover:text-white font-medium'
    : 'text-sm text-gray-600 hover:text-gray-900 font-medium'
  const btnCls = dark
    ? 'bg-white text-gray-900 text-sm px-4 py-2 rounded-lg font-medium hover:bg-gray-100 transition-colors'
    : 'bg-gray-900 text-white text-sm px-4 py-2 rounded-lg font-medium hover:bg-gray-800 transition-colors'

  if (user) {
    return (
      <div className="flex items-center gap-3">
        <Link href="/profile" className={linkCls}>
          Profile
        </Link>
        <Link href="/train" className={btnCls}>
          Start training →
        </Link>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-3">
      <Link href="/login" className={linkCls}>
        Sign in
      </Link>
      <Link href="/train" className={btnCls}>
        Start training →
      </Link>
    </div>
  )
}

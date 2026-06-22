'use client'

import { useEffect, useState } from 'react'

export default function ThemeToggle() {
  const [dark, setDark] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => { setMounted(true); setDark(document.documentElement.classList.contains('dark')) }, [])

  function toggle() {
    const next = !dark
    setDark(next)
    document.documentElement.classList.toggle('dark', next)
    try { localStorage.setItem('wilco_theme', next ? 'dark' : 'light') } catch { /* ignore */ }
  }

  if (!mounted) return null
  return (
    <button
      onClick={toggle}
      aria-label="Toggle dark mode"
      className="fixed bottom-4 right-4 z-40 w-9 h-9 rounded-full border border-gray-300 bg-white text-gray-700 shadow-sm hover:border-gray-500 flex items-center justify-center text-sm"
    >
      {dark ? 'Lt' : 'Dk'}
    </button>
  )
}

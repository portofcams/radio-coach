'use client'

import { useEffect, useState } from 'react'

type BIPEvent = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: string }> }

/** "Add to Home Screen" nudge — appears only where the browser fires
 * beforeinstallprompt (Android/desktop Chrome). Dismissible, remembered. */
export default function InstallPrompt() {
  const [evt, setEvt] = useState<BIPEvent | null>(null)

  useEffect(() => {
    try { if (localStorage.getItem('wilco_install_dismissed')) return } catch { /* */ }
    const handler = (e: Event) => { e.preventDefault(); setEvt(e as BIPEvent) }
    window.addEventListener('beforeinstallprompt', handler)
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  if (!evt) return null
  const dismiss = () => { setEvt(null); try { localStorage.setItem('wilco_install_dismissed', '1') } catch { /* */ } }

  return (
    <div className="fixed bottom-4 inset-x-4 z-50 mx-auto max-w-sm bg-[#0b0f14] text-white rounded-xl shadow-lg p-3 flex items-center gap-3">
      <div className="flex-1 text-sm">Add Wilco to your home screen for one-tap radio practice.</div>
      <button
        onClick={async () => { try { await evt.prompt(); await evt.userChoice } catch { /* */ } finally { dismiss() } }}
        className="shrink-0 text-sm bg-white text-gray-900 rounded-lg px-3 py-1.5 font-medium hover:bg-gray-100"
      >Install</button>
      <button onClick={dismiss} aria-label="Dismiss" className="shrink-0 text-gray-400 hover:text-white text-lg leading-none">✕</button>
    </div>
  )
}

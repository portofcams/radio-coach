'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface Cur { passengerDay: { count: number; required: number }; passengerNight: { count: number; required: number }; flightReviewDate: string | null; medicalExpiry: string | null }

function addMonths(iso: string, m: number): Date { const d = new Date(iso + 'T00:00:00'); d.setMonth(d.getMonth() + m); return d }
function daysUntil(d: Date): number { return Math.ceil((d.getTime() - Date.now()) / 86_400_000) }

function StatusCard({ title, ok, detail, warn }: { title: string; ok: boolean; detail: string; warn?: boolean }) {
  const cls = ok ? (warn ? 'border-amber-300 bg-amber-50' : 'border-green-300 bg-green-50') : 'border-red-300 bg-red-50'
  const tcls = ok ? (warn ? 'text-amber-700' : 'text-green-700') : 'text-red-700'
  return (
    <div className={`border rounded-xl p-4 ${cls}`}>
      <div className="text-sm font-semibold text-gray-900">{title}</div>
      <div className={`text-sm font-medium ${tcls}`}>{ok ? (warn ? 'Expiring soon' : 'Current') : 'Not current'}</div>
      <div className="text-xs text-gray-500 mt-1">{detail}</div>
    </div>
  )
}

export default function CurrencyPage() {
  const router = useRouter()
  const [cur, setCur] = useState<Cur | null>(null)
  const [state, setState] = useState<'loading' | 'ok' | 'anon'>('loading')
  const [fr, setFr] = useState('')
  const [med, setMed] = useState('')
  const [saved, setSaved] = useState(false)

  async function load() {
    const r = await fetch('/api/currency')
    if (r.status === 401) { setState('anon'); return }
    const d: Cur = await r.json()
    setCur(d); setFr(d.flightReviewDate ?? ''); setMed(d.medicalExpiry ?? ''); setState('ok')
  }
  useEffect(() => { load() }, [])

  async function save() {
    await fetch('/api/currency', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ flightReviewDate: fr || null, medicalExpiry: med || null }) })
    setSaved(true); setTimeout(() => setSaved(false), 1500); load()
  }

  if (state === 'loading') return <div className="max-w-md mx-auto px-6 py-16 text-gray-400">Loading…</div>
  if (state === 'anon') return (
    <main className="max-w-md mx-auto px-6 py-16 text-center">
      <h1 className="text-xl font-semibold mb-2">Currency</h1>
      <p className="text-gray-500 mb-6">Sign in to track passenger currency (from your logbook), flight review, and medical.</p>
      <button onClick={() => router.push('/login')} className="bg-gray-900 text-white rounded-lg px-5 py-3 text-sm font-semibold hover:bg-gray-800">Sign in</button>
    </main>
  )

  const day = cur!.passengerDay, night = cur!.passengerNight
  const frDue = fr ? addMonths(fr, 24) : null
  const frDays = frDue ? daysUntil(frDue) : null
  const medDue = med ? new Date(med + 'T00:00:00') : null
  const medDays = medDue ? daysUntil(medDue) : null
  const inp = 'w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900'

  return (
    <main className="min-h-screen">
      <div className="max-w-lg mx-auto px-6 py-10">
        <Link href="/tools" className="text-gray-400 hover:text-gray-600 text-sm">← tools</Link>
        <h1 className="text-2xl font-semibold mt-3 mb-1">Currency</h1>
        <p className="text-gray-500 mb-6">Passenger currency comes from your <Link href="/logbook" className="text-blue-600 hover:underline">logbook</Link> (last 90 days). Add your flight-review and medical dates below.</p>

        <div className="grid grid-cols-2 gap-3 mb-6">
          <StatusCard title="Passengers (day)" ok={day.count >= day.required} detail={`${day.count}/${day.required} landings in 90 days`} />
          <StatusCard title="Passengers (night)" ok={night.count >= night.required} detail={`${night.count}/${night.required} night landings in 90 days`} />
          <StatusCard title="Flight review" ok={frDays != null && frDays >= 0} warn={frDays != null && frDays >= 0 && frDays < 60} detail={frDue ? `Due ${frDue.toISOString().slice(0, 10)}${frDays != null && frDays >= 0 ? ` (${frDays}d)` : ''}` : 'Enter your last review date'} />
          <StatusCard title="Medical" ok={medDays != null && medDays >= 0} warn={medDays != null && medDays >= 0 && medDays < 60} detail={medDue ? `Expires ${med}${medDays != null && medDays >= 0 ? ` (${medDays}d)` : ''}` : 'Enter your medical expiry'} />
        </div>

        <div className="border border-gray-200 rounded-xl p-5 space-y-3">
          <div className="text-xs font-semibold uppercase tracking-widest text-gray-400">Your dates</div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="text-xs text-gray-500">Last flight review</label><input type="date" className={inp} value={fr} onChange={(e) => setFr(e.target.value)} /></div>
            <div><label className="text-xs text-gray-500">Medical expires</label><input type="date" className={inp} value={med} onChange={(e) => setMed(e.target.value)} /></div>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={save} className="bg-gray-900 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-800">Save dates</button>
            {saved && <span className="text-xs text-green-600">Saved</span>}
          </div>
        </div>
        <p className="text-xs text-gray-400 mt-3">Passenger currency = 3 takeoffs &amp; landings in 90 days (night = to a full stop). Flight review every 24 calendar months. Always confirm against the regs.</p>
      </div>
    </main>
  )
}

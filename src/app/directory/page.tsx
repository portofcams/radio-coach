import type { Metadata } from 'next'
import Link from 'next/link'
import { getPool } from '@/lib/db'
import { listPublicSchools } from '@/lib/directory'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Flight schools & CFIs training with Clearspar · Directory',
  description: 'Find a flight school or instructor using Clearspar to train radio communications. Schools: list yours free and show students you teach to the FAA standard.',
  alternates: { canonical: 'https://wilco.binnacleai.com/directory' },
}

export default async function DirectoryPage() {
  const db = getPool()
  const schools = db ? await listPublicSchools(db) : []
  return (
    <main className="min-h-screen">
      <div className="max-w-2xl mx-auto px-6 py-10">
        <Link href="/" className="text-gray-400 hover:text-gray-600 text-sm">← home</Link>
        <h1 className="text-2xl font-semibold mt-3 mb-1">Flight schools training with Clearspar</h1>
        <p className="text-gray-500 mb-6">Schools and instructors using Clearspar to drill radio communications to the FAA standard.</p>

        {schools.length === 0 ? (
          <div className="border border-dashed border-gray-300 rounded-xl p-6 text-center mb-6">
            <p className="text-gray-600 mb-2">No schools listed yet — be the first.</p>
            <p className="text-sm text-gray-400">If your school uses Clearspar, add a free listing below.</p>
          </div>
        ) : (
          <div className="space-y-2 mb-8">
            {schools.map((s) => (
              <Link key={s.slug} href={`/directory/${s.slug}`} className="block border border-gray-200 rounded-xl px-4 py-3 hover:border-gray-400 transition-colors group">
                <div className="font-medium group-hover:text-gray-900">{s.name}</div>
                <div className="flex items-center gap-2 mt-0.5 text-sm text-gray-500">
                  {(s.city || s.region) && <span>{[s.city, s.region].filter(Boolean).join(', ')}</span>}
                  <span className="font-mono text-[10px] font-bold px-1.5 py-0 rounded bg-gray-900 text-white leading-4 tracking-wide">WILCO</span>
                </div>
              </Link>
            ))}
          </div>
        )}

        <div className="border border-gray-200 rounded-xl p-5 bg-gray-50">
          <div className="font-semibold mb-1">List your school free</div>
          <p className="text-sm text-gray-500 mb-3">On the Flight School plan you can publish a directory listing from your dashboard — show prospective students you train to the standard.</p>
          <Link href="/school" className="inline-block bg-gray-900 text-white rounded-lg px-4 py-2 text-sm font-semibold hover:bg-gray-800">Manage your school →</Link>
        </div>
      </div>
    </main>
  )
}

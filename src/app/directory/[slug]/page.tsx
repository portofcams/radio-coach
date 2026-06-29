import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getPool } from '@/lib/db'
import { getSchoolBySlug } from '@/lib/directory'

export const dynamic = 'force-dynamic'

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const db = getPool()
  const s = db ? await getSchoolBySlug(db, slug) : null
  if (!s) return {}
  const where = [s.city, s.region].filter(Boolean).join(', ')
  return {
    title: `${s.name}${where ? ` — ${where}` : ''} · trains with Clearspar`,
    description: s.blurb ?? `${s.name} uses Clearspar to train pilots on ATC radio communications.`,
    alternates: { canonical: `https://clearsparradio.binnacleai.com/directory/${slug}` },
  }
}

export default async function SchoolProfile({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const db = getPool()
  const s = db ? await getSchoolBySlug(db, slug) : null
  if (!s) notFound()
  const where = [s.city, s.region].filter(Boolean).join(', ')

  return (
    <main className="min-h-screen">
      <div className="max-w-2xl mx-auto px-6 py-10">
        <Link href="/directory" className="text-gray-400 hover:text-gray-600 text-sm">← directory</Link>
        <div className="flex items-center gap-2 mt-3 mb-1">
          <h1 className="text-2xl font-semibold">{s.name}</h1>
          <span className="font-mono text-[10px] font-bold px-1.5 py-0.5 rounded bg-gray-900 text-white tracking-wide">CLEARSPAR</span>
        </div>
        {where && <p className="text-gray-500">{where}</p>}
        {s.blurb && <p className="text-gray-700 mt-4 leading-relaxed">{s.blurb}</p>}
        <div className="mt-5 flex items-center gap-4">
          {s.website && (
            <a href={s.website} target="_blank" rel="nofollow noopener noreferrer" className="text-sm text-blue-600 hover:underline">Visit website →</a>
          )}
        </div>
        <div className="mt-8 border-t border-gray-100 pt-6">
          <p className="text-sm text-gray-500 mb-3">{s.name} trains radio communications with Clearspar — graded ATC scenarios built to the FAA standard.</p>
          <Link href="/train" className="inline-block bg-gray-900 text-white rounded-lg px-4 py-2 text-sm font-semibold hover:bg-gray-800">Try Clearspar free →</Link>
        </div>
      </div>
    </main>
  )
}

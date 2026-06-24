import Link from 'next/link'

export default function SiteFooter() {
  return (
    <footer className="border-t border-gray-100 py-8 mt-12">
      <div className="max-w-5xl mx-auto px-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-gray-400">
        <span className="font-mono font-semibold tracking-widest text-gray-500">
          CLEARSPAR<span className="text-gray-300 font-normal"> · Radio Trainer</span>
        </span>
        <nav className="flex flex-wrap items-center gap-x-4 gap-y-1">
          <Link href="/privacy" className="hover:text-gray-700">Privacy</Link>
          <Link href="/terms" className="hover:text-gray-700">Terms</Link>
          <Link href="/contact" className="hover:text-gray-700">Contact</Link>
          <Link href="/feedback" className="hover:text-gray-700">Feedback</Link>
        </nav>
      </div>
      <div className="max-w-5xl mx-auto px-6 mt-3 text-[11px] text-gray-400">
        Built for student pilots. Graded against FAA AIM Chapter 4. A training aid only — not for navigation or operational use.
      </div>
    </footer>
  )
}

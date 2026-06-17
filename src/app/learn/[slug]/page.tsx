import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getModule, modules } from '@/lib/modules'
import { getScenario } from '@/lib/scenarios'

export function generateStaticParams() {
  return modules.map((m) => ({ slug: m.id }))
}

export default async function ModulePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const mod = getModule(slug)
  if (!mod) notFound()

  const moduleIndex = modules.findIndex((m) => m.id === slug)
  const next = modules[moduleIndex + 1]

  const SECTION_STYLES = {
    rule: {
      border: 'border-gray-200',
      bg: 'bg-white',
      tag: 'RULE',
      tagColor: 'bg-gray-900 text-white',
    },
    example: {
      border: 'border-blue-200',
      bg: 'bg-blue-50',
      tag: 'EXAMPLE',
      tagColor: 'bg-blue-600 text-white',
    },
    mistake: {
      border: 'border-red-200',
      bg: 'bg-red-50',
      tag: 'AVOID',
      tagColor: 'bg-red-600 text-white',
    },
    tip: {
      border: 'border-amber-200',
      bg: 'bg-amber-50',
      tag: 'TIP',
      tagColor: 'bg-amber-500 text-white',
    },
  }

  return (
    <main className="min-h-screen">
      <div className="max-w-2xl mx-auto px-6 py-10">

        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-gray-400 mb-8">
          <Link href="/" className="hover:text-gray-600">Home</Link>
          <span>/</span>
          <Link href="/learn" className="hover:text-gray-600">Learn</Link>
          <span>/</span>
          <span className="text-gray-700">{mod.title}</span>
        </div>

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <span className="font-mono text-sm font-bold tracking-widest text-gray-500 border border-gray-300 rounded-md px-2.5 py-1.5">{mod.icon}</span>
            <div>
              <div className="text-xs text-gray-400 font-mono uppercase tracking-widest">Module {String(moduleIndex + 1).padStart(2, '0')} · {mod.estimatedMinutes} min</div>
              <h1 className="text-2xl font-semibold">{mod.title}</h1>
            </div>
          </div>
          <p className="text-gray-500">{mod.subtitle}</p>
        </div>

        {/* Sections */}
        <div className="space-y-5 mb-10">
          {mod.sections.map((section, i) => {
            const style = SECTION_STYLES[section.type]
            return (
              <div key={i} className={`border rounded-xl p-5 ${style.border} ${style.bg}`}>
                <div className="flex items-start gap-3 mb-3">
                  <span className={`text-xs font-mono font-bold px-2 py-0.5 rounded shrink-0 mt-0.5 ${style.tagColor}`}>
                    {style.tag}
                  </span>
                  {section.heading && (
                    <h3 className="font-semibold text-gray-900 leading-snug">{section.heading}</h3>
                  )}
                </div>

                {/* Body text */}
                {section.body && (
                  <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line pl-10">
                    {section.body}
                  </p>
                )}

                {/* ATC transmission */}
                {section.atc && (
                  <div className="pl-10 mt-3 space-y-2">
                    <div className="bg-gray-950 rounded-lg p-3">
                      <div className="text-green-400 font-mono text-xs uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-green-400 inline-block" />
                        ATC
                      </div>
                      <p className="text-green-300 font-mono text-sm leading-relaxed">&ldquo;{section.atc}&rdquo;</p>
                    </div>
                    {section.correct && (
                      <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                        <div className="text-xs font-mono uppercase tracking-widest text-green-700 mb-1">Correct readback</div>
                        <p className="text-green-900 font-mono text-sm leading-relaxed">&ldquo;{section.correct}&rdquo;</p>
                      </div>
                    )}
                  </div>
                )}

                {/* Wrong examples */}
                {section.wrong && section.wrong.length > 0 && (
                  <ul className="pl-10 mt-2 space-y-2">
                    {section.wrong.map((w, j) => (
                      <li key={j} className="flex items-start gap-2 text-sm text-red-800">
                        <span className="text-red-500 shrink-0 mt-0.5">✗</span>
                        <span>{w}</span>
                      </li>
                    ))}
                  </ul>
                )}

                {/* Penalty note */}
                {section.penalty && (
                  <p className="pl-10 mt-2 text-xs text-gray-500 italic">{section.penalty}</p>
                )}
              </div>
            )
          })}
        </div>

        {/* Practice scenarios */}
        {mod.practiceScenarioIds.length > 0 && (
          <div className="border border-gray-200 rounded-xl p-5 mb-8">
            <div className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-3">
              Practice these scenarios
            </div>
            <div className="space-y-2">
              {mod.practiceScenarioIds.map((id) => {
                const s = getScenario(id)
                if (!s) return null
                const diffColor = s.difficulty === 1 ? 'bg-green-100 text-green-800' : s.difficulty === 2 ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'
                const diffLabel = ['', 'Student', 'Intermediate', 'Advanced'][s.difficulty]
                return (
                  <Link
                    key={id}
                    href={`/train/${id}`}
                    className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-gray-50 group"
                  >
                    <span className="text-sm text-gray-700 group-hover:text-gray-900">{s.title}</span>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-xs font-mono text-blue-600">{s.airport}</span>
                      <span className={`text-xs px-2 py-0.5 rounded font-medium ${diffColor}`}>{diffLabel}</span>
                      <span className="text-gray-400 text-sm">→</span>
                    </div>
                  </Link>
                )
              })}
            </div>
          </div>
        )}

        {/* Navigation */}
        <div className="flex items-center justify-between">
          <Link href="/learn" className="text-sm text-gray-500 hover:text-gray-700">
            ← All modules
          </Link>
          {next && (
            <Link
              href={`/learn/${next.id}`}
              className="flex items-center gap-2 bg-gray-900 text-white text-sm px-4 py-2 rounded-lg hover:bg-gray-800"
            >
              Next: {next.title} →
            </Link>
          )}
        </div>

      </div>
    </main>
  )
}

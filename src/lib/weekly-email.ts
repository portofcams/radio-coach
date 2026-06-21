// Compose a pilot's weekly "radio report" email (subject + HTML + text).
// Pure — takes data, returns strings. No sending here.

export interface WeeklyReportData {
  callsign: string | null
  weekScenarios: number
  weekPassed: number
  readinessScore: number
  readinessLabel: string
  topWeakspot: string | null
  unsubUrl: string
  appUrl: string
}

const ADDRESS = '440 Lewers St, Suite 603, Honolulu HI 96815'

export function composeWeeklyReport(d: WeeklyReportData): { subject: string; html: string; text: string } {
  const who = d.callsign ? d.callsign : 'pilot'
  const subject = d.weekScenarios > 0
    ? `Your radio report: ${d.weekPassed}/${d.weekScenarios} this week · ${d.readinessScore}% ready`
    : `Keep your radio sharp — ${d.readinessScore}% checkride-ready`

  const intro = d.weekScenarios > 0
    ? `You flew <strong>${d.weekScenarios}</strong> Live Comms scenario${d.weekScenarios === 1 ? '' : 's'} this week and passed <strong>${d.weekPassed}</strong>.`
    : `You didn't get on the radio this week — a few minutes keeps the phraseology sharp.`
  const weak = d.topWeakspot
    ? `<p style="margin:0 0 16px;color:#374151">Focus area: <strong>${d.topWeakspot}</strong>. A couple of targeted drills will move the needle.</p>`
    : ''

  const html = `<!doctype html><html><body style="margin:0;background:#f6f7f9;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif">
  <div style="max-width:480px;margin:0 auto;padding:24px">
    <div style="background:#0b0f14;color:#fff;border-radius:12px 12px 0 0;padding:16px 20px;font-weight:600;letter-spacing:.08em">WILCO</div>
    <div style="background:#fff;border:1px solid #e5e7eb;border-top:0;border-radius:0 0 12px 12px;padding:24px 20px">
      <p style="margin:0 0 8px;color:#111827;font-size:16px">Your weekly radio report, ${who}.</p>
      <p style="margin:0 0 16px;color:#374151">${intro}</p>
      <div style="display:inline-block;border:1px solid #e5e7eb;border-radius:10px;padding:12px 18px;margin:0 0 16px">
        <div style="font-size:28px;font-weight:800;color:#0f172a">${d.readinessScore}<span style="font-size:14px;color:#9ca3af">/100</span></div>
        <div style="font-size:12px;color:#6b7280">${d.readinessLabel}</div>
      </div>
      ${weak}
      <a href="${d.appUrl}/train" style="display:inline-block;background:#0f172a;color:#fff;text-decoration:none;border-radius:8px;padding:10px 18px;font-size:14px;font-weight:600">Fly a scenario →</a>
    </div>
    <div style="text-align:center;color:#9ca3af;font-size:11px;padding:16px 8px;line-height:1.6">
      Wilco · Clearspar — aviation radio training<br>${ADDRESS}<br>
      <a href="${d.unsubUrl}" style="color:#9ca3af">Unsubscribe from weekly reports</a>
    </div>
  </div></body></html>`

  const text = [
    `Your weekly radio report, ${who}.`,
    d.weekScenarios > 0 ? `You flew ${d.weekScenarios} scenario(s) this week and passed ${d.weekPassed}.` : `You didn't get on the radio this week — a few minutes keeps it sharp.`,
    `Readiness: ${d.readinessScore}/100 (${d.readinessLabel}).`,
    d.topWeakspot ? `Focus area: ${d.topWeakspot}.` : '',
    `Fly a scenario: ${d.appUrl}/train`,
    '',
    `Wilco · Clearspar — ${ADDRESS}`,
    `Unsubscribe: ${d.unsubUrl}`,
  ].filter(Boolean).join('\n')

  return { subject, html, text }
}

export interface CfiDigestData {
  instructorName: string | null
  total: number
  ready: number
  needsWork: number
  inactive: number
  activeThisWeek: number
  highlights: Array<{ email: string; flag: string; weekCount: number; lastDays: number | null }>
  unsubUrl: string
  appUrl: string
}

const FLAG_LABEL: Record<string, string> = {
  ready: 'Checkride-ready', 'needs-work': 'Needs work', inactive: 'Inactive', active: 'On track',
}

/** A CFI's weekly roster digest — who's ready, who's stuck, who's gone quiet. */
export function composeCfiDigest(d: CfiDigestData): { subject: string; html: string; text: string } {
  const who = d.instructorName ? d.instructorName : 'instructor'
  const subject = `Roster report: ${d.ready} ready · ${d.needsWork} need work · ${d.activeThisWeek}/${d.total} active`

  const lastSeen = (n: number | null) => (n == null ? 'never' : n === 0 ? 'today' : `${n}d ago`)
  const rows = d.highlights.map((s) => {
    const color = s.flag === 'ready' ? '#16a34a' : s.flag === 'needs-work' ? '#dc2626' : '#6b7280'
    return `<tr>
      <td style="padding:6px 8px;color:#111827;font-size:13px">${s.email}</td>
      <td style="padding:6px 8px;font-size:12px;font-weight:600;color:${color}">${FLAG_LABEL[s.flag] ?? s.flag}</td>
      <td style="padding:6px 8px;color:#6b7280;font-size:12px">${s.weekCount} this wk · ${lastSeen(s.lastDays)}</td>
    </tr>`
  }).join('')

  const html = `<!doctype html><html><body style="margin:0;background:#f6f7f9;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif">
  <div style="max-width:520px;margin:0 auto;padding:24px">
    <div style="background:#0b0f14;color:#fff;border-radius:12px 12px 0 0;padding:16px 20px;font-weight:600;letter-spacing:.08em">WILCO · CFI</div>
    <div style="background:#fff;border:1px solid #e5e7eb;border-top:0;border-radius:0 0 12px 12px;padding:24px 20px">
      <p style="margin:0 0 8px;color:#111827;font-size:16px">Your weekly roster report, ${who}.</p>
      <p style="margin:0 0 16px;color:#374151"><strong>${d.activeThisWeek}</strong> of <strong>${d.total}</strong> students flew the radio this week. ${d.ready} checkride-ready, ${d.needsWork} need work, ${d.inactive} inactive.</p>
      ${rows ? `<table style="width:100%;border-collapse:collapse;border:1px solid #e5e7eb;border-radius:8px;margin:0 0 16px">${rows}</table>` : ''}
      <a href="${d.appUrl}/cfi" style="display:inline-block;background:#0f172a;color:#fff;text-decoration:none;border-radius:8px;padding:10px 18px;font-size:14px;font-weight:600">Open your roster →</a>
    </div>
    <div style="text-align:center;color:#9ca3af;font-size:11px;padding:16px 8px;line-height:1.6">
      Wilco · Clearspar — aviation radio training<br>${ADDRESS}<br>
      <a href="${d.unsubUrl}" style="color:#9ca3af">Unsubscribe from weekly reports</a>
    </div>
  </div></body></html>`

  const text = [
    `Your weekly roster report, ${who}.`,
    `${d.activeThisWeek} of ${d.total} students flew this week. ${d.ready} ready, ${d.needsWork} need work, ${d.inactive} inactive.`,
    '',
    ...d.highlights.map((s) => `- ${s.email}: ${FLAG_LABEL[s.flag] ?? s.flag} (${s.weekCount} this wk, ${lastSeen(s.lastDays)})`),
    '',
    `Open your roster: ${d.appUrl}/cfi`,
    `Wilco · Clearspar — ${ADDRESS}`,
    `Unsubscribe: ${d.unsubUrl}`,
  ].join('\n')

  return { subject, html, text }
}

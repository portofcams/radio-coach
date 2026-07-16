import type { Pool } from 'pg'

/** Log a pilot's demand vote for an unlisted airport. Same ON-CONFLICT +
 *  conditional-increment shape as the community-scenario upvote route --
 *  a repeat request from the same pilot never inflates the count. */
export async function requestAirport(
  db: Pool, ident: string, userId: number, note: string | null,
): Promise<{ requestCount: number; alreadyRequested: boolean }> {
  const ins = await db.query(
    `INSERT INTO rc_airport_requests (ident, note) VALUES ($1, $2)
     ON CONFLICT (ident) DO UPDATE SET note = COALESCE(rc_airport_requests.note, EXCLUDED.note), updated_at = now()
     RETURNING id`,
    [ident, note],
  )
  const requestId = ins.rows[0].id as number
  const vote = await db.query(
    'INSERT INTO rc_airport_request_votes (request_id, user_id) VALUES ($1,$2) ON CONFLICT DO NOTHING RETURNING request_id',
    [requestId, userId],
  )
  if (vote.rows[0]) await db.query('UPDATE rc_airport_requests SET request_count = request_count + 1 WHERE id=$1', [requestId])
  const r = await db.query('SELECT request_count FROM rc_airport_requests WHERE id=$1', [requestId])
  return { requestCount: r.rows[0]?.request_count ?? 0, alreadyRequested: !vote.rows[0] }
}

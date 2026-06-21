import type { Pool } from 'pg'

// Public flight-school / CFI directory — schools opt in from /school.
export interface DirSchool {
  name: string
  slug: string
  city: string | null
  region: string | null
  website: string | null
  blurb: string | null
}

export function slugify(s: string): string {
  return s.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '').slice(0, 60)
}

const COLS = 'name, slug, city, region, website, blurb'

export async function listPublicSchools(db: Pool): Promise<DirSchool[]> {
  const r = await db.query(
    `SELECT ${COLS} FROM rc_schools WHERE public_listing = true AND slug IS NOT NULL ORDER BY name`,
  )
  return r.rows
}

export async function getSchoolBySlug(db: Pool, slug: string): Promise<DirSchool | null> {
  const r = await db.query(
    `SELECT ${COLS} FROM rc_schools WHERE slug = $1 AND public_listing = true LIMIT 1`,
    [slug],
  )
  return r.rows[0] ?? null
}

/** Assign a unique slug for a school going public (append owner id on collision). */
export async function ensureSlug(db: Pool, ownerId: number, name: string): Promise<string> {
  const base = slugify(name) || `school-${ownerId}`
  const taken = await db.query('SELECT 1 FROM rc_schools WHERE slug = $1 AND owner_user_id <> $2', [base, ownerId])
  return taken.rows[0] ? `${base}-${ownerId}` : base
}

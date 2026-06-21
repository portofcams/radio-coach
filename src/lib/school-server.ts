// SERVER-ONLY. Flight-school (multi-CFI) helpers.
import type { Pool } from 'pg'
import { getEntitlement } from './entitlement'

/** Only the paying school owner (own sub plan='school') can manage the school. */
export async function isSchoolOwner(userId: number): Promise<boolean> {
  const ent = await getEntitlement(userId)
  return !!ent.pro && ent.plan === 'school'
}

export async function ensureSchool(db: Pool, ownerId: number): Promise<{ id: number; name: string }> {
  await db.query(
    `INSERT INTO rc_schools (owner_user_id, name) VALUES ($1, 'My Flight School')
     ON CONFLICT (owner_user_id) DO NOTHING`,
    [ownerId],
  )
  const r = await db.query('SELECT id, name FROM rc_schools WHERE owner_user_id = $1', [ownerId])
  return r.rows[0]
}

export interface SchoolMember {
  id: number
  status: string
  role: string
  email: string
  joined: boolean
  joinUrl: string | null
  students: number
}

export async function schoolMembers(db: Pool, schoolId: number, origin: string): Promise<SchoolMember[]> {
  const r = await db.query(
    `SELECT m.id, m.status, m.token, m.user_id, m.email, m.role, u.email AS user_email,
            (SELECT COUNT(*) FROM rc_cfi_students s WHERE s.cfi_user_id = m.user_id AND s.status = 'active') AS students
     FROM rc_school_members m LEFT JOIN rc_users u ON u.id = m.user_id
     WHERE m.school_id = $1 ORDER BY m.created_at`,
    [schoolId],
  )
  return r.rows.map((row) => ({
    id: row.id,
    status: row.status,
    role: row.role,
    email: row.user_email || row.email || '—',
    joined: !!row.user_id,
    joinUrl: row.user_id ? null : `${origin}/school/join/${row.token}`,
    students: parseInt(row.students) || 0,
  }))
}

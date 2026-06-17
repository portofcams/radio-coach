import { Pool } from 'pg'

let pool: Pool | null = null

export function getPool(): Pool | null {
  if (!process.env.DATABASE_URL) return null
  if (!pool) {
    pool = new Pool({ connectionString: process.env.DATABASE_URL })
  }
  return pool
}

export async function initDB(): Promise<void> {
  const db = getPool()
  if (!db) return

  await db.query(`
    CREATE TABLE IF NOT EXISTS rc_users (
      id SERIAL PRIMARY KEY,
      email VARCHAR(255) UNIQUE NOT NULL,
      password_hash VARCHAR(255) NOT NULL,
      callsign VARCHAR(20),
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `)

  await db.query(`
    CREATE TABLE IF NOT EXISTS rc_grades (
      id SERIAL PRIMARY KEY,
      user_id INTEGER REFERENCES rc_users(id) ON DELETE CASCADE,
      scenario_id VARCHAR(100) NOT NULL,
      score INTEGER NOT NULL,
      passed BOOLEAN NOT NULL,
      readback TEXT NOT NULL,
      correct_readback TEXT NOT NULL,
      missed_elements JSONB NOT NULL DEFAULT '[]',
      phrase_issues JSONB NOT NULL DEFAULT '[]',
      hint_used BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `)

  await db.query(`
    CREATE INDEX IF NOT EXISTS rc_grades_user_id ON rc_grades(user_id);
    CREATE INDEX IF NOT EXISTS rc_grades_scenario_id ON rc_grades(scenario_id);
  `)
}

// Run init once on first import in server context
if (process.env.DATABASE_URL) {
  initDB().catch(console.error)
}

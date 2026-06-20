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

  // Ground School progress — one row per user (synced from localStorage)
  await db.query(`
    CREATE TABLE IF NOT EXISTS rc_gs_progress (
      user_id INTEGER PRIMARY KEY REFERENCES rc_users(id) ON DELETE CASCADE,
      completed JSONB NOT NULL DEFAULT '[]',
      xp INTEGER NOT NULL DEFAULT 0,
      streak INTEGER NOT NULL DEFAULT 0,
      last_day TEXT,
      updated_at TIMESTAMPTZ DEFAULT NOW()
    )
  `)

  // Subscription / entitlement columns on the user (driven by the Stripe webhook)
  await db.query(`
    ALTER TABLE rc_users
      ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT,
      ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT,
      ADD COLUMN IF NOT EXISTS subscription_status TEXT,
      ADD COLUMN IF NOT EXISTS plan TEXT,
      ADD COLUMN IF NOT EXISTS current_period_end TIMESTAMPTZ
  `)

  // Home-field personalization. home_ident → real FAA field (preferred);
  // home_name/tower/runway → manual lean fallback for unlisted fields.
  await db.query(`
    ALTER TABLE rc_users
      ADD COLUMN IF NOT EXISTS home_name TEXT,
      ADD COLUMN IF NOT EXISTS home_tower TEXT,
      ADD COLUMN IF NOT EXISTS home_runway TEXT,
      ADD COLUMN IF NOT EXISTS home_ident TEXT
  `)

  // Cache of real taxiway geometry per field (fetched once from OpenStreetMap).
  await db.query(`
    CREATE TABLE IF NOT EXISTS rc_field_geo (
      ident TEXT PRIMARY KEY,
      taxiways JSONB NOT NULL DEFAULT '[]',
      fetched_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `)

  // CFI Pro — student roster (a CFI links students who join via an invite token).
  await db.query(`
    CREATE TABLE IF NOT EXISTS rc_cfi_students (
      id SERIAL PRIMARY KEY,
      cfi_user_id INTEGER NOT NULL REFERENCES rc_users(id) ON DELETE CASCADE,
      student_user_id INTEGER REFERENCES rc_users(id) ON DELETE CASCADE,
      student_email TEXT,
      token TEXT UNIQUE NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending',
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `)
  // CFI Pro — assigned scenarios (a radio syllabus).
  await db.query(`
    CREATE TABLE IF NOT EXISTS rc_assignments (
      id SERIAL PRIMARY KEY,
      cfi_user_id INTEGER NOT NULL REFERENCES rc_users(id) ON DELETE CASCADE,
      student_user_id INTEGER NOT NULL REFERENCES rc_users(id) ON DELETE CASCADE,
      scenario_id TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `)
  await db.query(`CREATE INDEX IF NOT EXISTS rc_cfi_students_cfi ON rc_cfi_students(cfi_user_id)`)
  await db.query(`CREATE INDEX IF NOT EXISTS rc_assignments_student ON rc_assignments(student_user_id)`)

  // CFI Pro — instructor comments + endorsements; school co-branding on rc_users.
  await db.query(`
    CREATE TABLE IF NOT EXISTS rc_cfi_comments (
      id SERIAL PRIMARY KEY,
      cfi_user_id INTEGER NOT NULL REFERENCES rc_users(id) ON DELETE CASCADE,
      student_user_id INTEGER NOT NULL REFERENCES rc_users(id) ON DELETE CASCADE,
      body TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `)
  await db.query(`
    CREATE TABLE IF NOT EXISTS rc_endorsements (
      id SERIAL PRIMARY KEY,
      cfi_user_id INTEGER NOT NULL REFERENCES rc_users(id) ON DELETE CASCADE,
      student_user_id INTEGER NOT NULL REFERENCES rc_users(id) ON DELETE CASCADE,
      kind TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `)
  await db.query(`CREATE INDEX IF NOT EXISTS rc_cfi_comments_student ON rc_cfi_comments(student_user_id)`)
  await db.query(`CREATE INDEX IF NOT EXISTS rc_endorsements_student ON rc_endorsements(student_user_id)`)
  // CFI Pro — custom scenarios a CFI authors (assignable to students).
  await db.query(`
    CREATE TABLE IF NOT EXISTS rc_custom_scenarios (
      id SERIAL PRIMARY KEY,
      cfi_user_id INTEGER NOT NULL REFERENCES rc_users(id) ON DELETE CASCADE,
      title TEXT NOT NULL,
      setup TEXT NOT NULL DEFAULT '',
      atc_transmission TEXT NOT NULL,
      required_elements JSONB NOT NULL DEFAULT '[]',
      correct_readback TEXT NOT NULL,
      facility TEXT,
      frequency TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `)
  await db.query(`CREATE INDEX IF NOT EXISTS rc_custom_cfi ON rc_custom_scenarios(cfi_user_id)`)
  await db.query(`
    ALTER TABLE rc_users
      ADD COLUMN IF NOT EXISTS cfi_org_name TEXT,
      ADD COLUMN IF NOT EXISTS cfi_logo_url TEXT,
      ADD COLUMN IF NOT EXISTS referral_code TEXT,
      ADD COLUMN IF NOT EXISTS referred_by INTEGER
  `)
}

// Run init once on first import in server context
if (process.env.DATABASE_URL) {
  initDB().catch(console.error)
}

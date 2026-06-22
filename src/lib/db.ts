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
  await db.query(`ALTER TABLE rc_assignments ADD COLUMN IF NOT EXISTS due_at TIMESTAMPTZ`)

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
  await db.query(`ALTER TABLE rc_cfi_comments ADD COLUMN IF NOT EXISTS scenario_id TEXT`)
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

  // Lightweight client-error capture (server errors go to docker logs).
  await db.query(`
    CREATE TABLE IF NOT EXISTS rc_logs (
      id SERIAL PRIMARY KEY,
      level TEXT NOT NULL DEFAULT 'error',
      message TEXT,
      url TEXT,
      stack TEXT,
      user_agent TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `)
  await db.query(`CREATE INDEX IF NOT EXISTS rc_logs_created ON rc_logs(created_at DESC)`)

  // Flight School tier ($99) — one owner, many instructor-CFIs under one sub.
  await db.query(`
    CREATE TABLE IF NOT EXISTS rc_schools (
      id SERIAL PRIMARY KEY,
      owner_user_id INTEGER NOT NULL UNIQUE REFERENCES rc_users(id) ON DELETE CASCADE,
      name TEXT NOT NULL DEFAULT 'My Flight School',
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `)
  await db.query(`
    CREATE TABLE IF NOT EXISTS rc_school_members (
      id SERIAL PRIMARY KEY,
      school_id INTEGER NOT NULL REFERENCES rc_schools(id) ON DELETE CASCADE,
      user_id INTEGER REFERENCES rc_users(id) ON DELETE CASCADE,
      email TEXT,
      token TEXT UNIQUE NOT NULL,
      role TEXT NOT NULL DEFAULT 'instructor',
      status TEXT NOT NULL DEFAULT 'pending',
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `)
  await db.query(`CREATE INDEX IF NOT EXISTS rc_school_members_user ON rc_school_members(user_id)`)
  await db.query(`
    ALTER TABLE rc_users
      ADD COLUMN IF NOT EXISTS cfi_org_name TEXT,
      ADD COLUMN IF NOT EXISTS cfi_logo_url TEXT,
      ADD COLUMN IF NOT EXISTS referral_code TEXT,
      ADD COLUMN IF NOT EXISTS referred_by INTEGER,
      ADD COLUMN IF NOT EXISTS email_opt_out BOOLEAN NOT NULL DEFAULT false,
      ADD COLUMN IF NOT EXISTS email_unsub_token TEXT,
      ADD COLUMN IF NOT EXISTS last_weekly_email TIMESTAMPTZ,
      ADD COLUMN IF NOT EXISTS comp_pro_until TIMESTAMPTZ,
      ADD COLUMN IF NOT EXISTS referral_rewarded BOOLEAN NOT NULL DEFAULT false
  `)
  // Referral codes must be unique (used to look up the referrer).
  await db.query(`CREATE UNIQUE INDEX IF NOT EXISTS rc_users_referral_code ON rc_users(referral_code) WHERE referral_code IS NOT NULL`)

  // Push notification device tokens (APNs / FCM).
  await db.query(`
    CREATE TABLE IF NOT EXISTS rc_push_tokens (
      id SERIAL PRIMARY KEY,
      user_id INTEGER REFERENCES rc_users(id) ON DELETE CASCADE,
      token TEXT NOT NULL UNIQUE,
      platform TEXT NOT NULL DEFAULT 'ios',
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      last_seen TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `)

  // Custom-scenario optional home airport (METAR/diagram context).
  await db.query(`ALTER TABLE rc_custom_scenarios ADD COLUMN IF NOT EXISTS airport TEXT`)

  // Saved aircraft profiles (spine for weight & balance).
  await db.query(`
    CREATE TABLE IF NOT EXISTS rc_aircraft (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES rc_users(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      tail TEXT, type TEXT,
      empty_weight REAL, empty_arm REAL,
      max_gross REAL, cg_fwd REAL, cg_aft REAL,
      front_arm REAL, rear_arm REAL, fuel_arm REAL, baggage_arm REAL,
      fuel_cap_gal REAL, fuel_lb_per_gal REAL DEFAULT 6,
      max_baggage REAL, max_xwind REAL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `)
  await db.query(`CREATE INDEX IF NOT EXISTS rc_aircraft_user ON rc_aircraft(user_id)`)

  // Logbook.
  await db.query(`
    CREATE TABLE IF NOT EXISTS rc_logbook (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES rc_users(id) ON DELETE CASCADE,
      flight_date DATE NOT NULL,
      aircraft TEXT, dep TEXT, arr TEXT,
      total REAL DEFAULT 0, pic REAL DEFAULT 0, dual REAL DEFAULT 0, night REAL DEFAULT 0,
      day_ldg INTEGER DEFAULT 0, night_ldg INTEGER DEFAULT 0,
      remarks TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `)
  await db.query(`CREATE INDEX IF NOT EXISTS rc_logbook_user ON rc_logbook(user_id, flight_date DESC)`)

  // Pilot currency dates.
  await db.query(`
    ALTER TABLE rc_users
      ADD COLUMN IF NOT EXISTS flight_review_date DATE,
      ADD COLUMN IF NOT EXISTS medical_expiry DATE
  `)

  // Cross-device study-tool state (flashcards SRS, ACS checklist) per user+tool.
  await db.query(`
    CREATE TABLE IF NOT EXISTS rc_study_state (
      user_id INTEGER NOT NULL REFERENCES rc_users(id) ON DELETE CASCADE,
      tool TEXT NOT NULL,
      state JSONB NOT NULL DEFAULT '{}',
      updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      PRIMARY KEY (user_id, tool)
    )
  `)

  // Community scenario library — user-submitted, auto-validated by the rule grader.
  await db.query(`
    CREATE TABLE IF NOT EXISTS rc_community_scenarios (
      id SERIAL PRIMARY KEY,
      author_user_id INTEGER REFERENCES rc_users(id) ON DELETE SET NULL,
      author_name TEXT NOT NULL DEFAULT 'A pilot',
      title TEXT NOT NULL,
      setup TEXT NOT NULL DEFAULT '',
      atc_transmission TEXT NOT NULL,
      required_elements JSONB NOT NULL DEFAULT '[]',
      correct_readback TEXT NOT NULL,
      facility TEXT, frequency TEXT, airport TEXT,
      status TEXT NOT NULL DEFAULT 'pending',
      upvotes INTEGER NOT NULL DEFAULT 0,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `)
  await db.query(`CREATE INDEX IF NOT EXISTS rc_community_status ON rc_community_scenarios(status, upvotes DESC)`)
  await db.query(`
    CREATE TABLE IF NOT EXISTS rc_community_votes (
      scenario_id INTEGER NOT NULL REFERENCES rc_community_scenarios(id) ON DELETE CASCADE,
      user_id INTEGER NOT NULL REFERENCES rc_users(id) ON DELETE CASCADE,
      PRIMARY KEY (scenario_id, user_id)
    )
  `)

  // "7 days to radio confidence" email drip subscribers.
  await db.query(`
    CREATE TABLE IF NOT EXISTS rc_drip_subscribers (
      id SERIAL PRIMARY KEY,
      email TEXT NOT NULL UNIQUE,
      day_sent INTEGER NOT NULL DEFAULT -1,
      unsub_token TEXT NOT NULL,
      opted_out BOOLEAN NOT NULL DEFAULT false,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      last_sent TIMESTAMPTZ
    )
  `)

  // Readback duels — async "beat my score" challenges (shareable link).
  await db.query(`
    CREATE TABLE IF NOT EXISTS rc_duels (
      id SERIAL PRIMARY KEY,
      scenario_id TEXT NOT NULL,
      creator_name TEXT NOT NULL DEFAULT 'A pilot',
      creator_score INTEGER NOT NULL,
      attempts INTEGER NOT NULL DEFAULT 0,
      beaten INTEGER NOT NULL DEFAULT 0,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `)

  // In-app feedback (bugs / ideas / other).
  await db.query(`
    CREATE TABLE IF NOT EXISTS rc_feedback (
      id SERIAL PRIMARY KEY,
      user_id INTEGER REFERENCES rc_users(id) ON DELETE SET NULL,
      email TEXT,
      kind TEXT NOT NULL DEFAULT 'general',
      message TEXT NOT NULL,
      url TEXT,
      user_agent TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `)

  // Public flight-school directory listing fields.
  await db.query(`
    ALTER TABLE rc_schools
      ADD COLUMN IF NOT EXISTS public_listing BOOLEAN NOT NULL DEFAULT false,
      ADD COLUMN IF NOT EXISTS slug TEXT,
      ADD COLUMN IF NOT EXISTS city TEXT,
      ADD COLUMN IF NOT EXISTS region TEXT,
      ADD COLUMN IF NOT EXISTS website TEXT,
      ADD COLUMN IF NOT EXISTS blurb TEXT
  `)
  await db.query(`CREATE UNIQUE INDEX IF NOT EXISTS rc_schools_slug ON rc_schools(slug) WHERE slug IS NOT NULL`)
}

// Run init once on first import in server context
if (process.env.DATABASE_URL) {
  initDB().catch(console.error)
}

import { neon } from '@neondatabase/serverless';

let sql = null;

function getSql() {
  if (!sql) {
    if (!process.env.POSTGRES_URL) throw new Error('POSTGRES_URL not set');
    sql = neon(process.env.POSTGRES_URL, { fullResults: true });
  }
  return sql;
}

export async function initDb() {
  const sql = getSql();
  await sql`
    CREATE TABLE IF NOT EXISTS calendar_connections (
      id TEXT PRIMARY KEY,
      owner_id TEXT NOT NULL UNIQUE,
      nylas_grant_id TEXT NOT NULL,
      google_email TEXT,
      connected_at TIMESTAMPTZ DEFAULT NOW(),
      is_valid BOOLEAN DEFAULT true
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS business_hours (
      id TEXT PRIMARY KEY,
      owner_id TEXT NOT NULL,
      day_of_week INTEGER NOT NULL,
      start_time TEXT NOT NULL,
      end_time TEXT NOT NULL,
      slot_duration_minutes INTEGER DEFAULT 60,
      timezone TEXT DEFAULT 'America/New_York',
      UNIQUE(owner_id, day_of_week)
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS bookings (
      id TEXT PRIMARY KEY,
      owner_id TEXT NOT NULL,
      customer_name TEXT NOT NULL,
      customer_email TEXT NOT NULL,
      start_time TEXT NOT NULL,
      end_time TEXT NOT NULL,
      notes TEXT,
      nylas_event_id TEXT,
      status TEXT DEFAULT 'confirmed',
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `;
}

export { getSql as sql };

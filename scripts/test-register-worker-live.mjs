// ============================================================================
// DoneKaro — Database Test Runner for register_worker Live Staging Suite
// ============================================================================
// Executes scripts/test-register-worker-live.sql inside BEGIN...ROLLBACK.
// Requires a non-production PostgreSQL connection string:
// TEST_DATABASE_URL or STAGING_DATABASE_URL
// ============================================================================

import fs from 'node:fs'
import path from 'node:path'

const dbUrl = process.env.TEST_DATABASE_URL || process.env.STAGING_DATABASE_URL

console.log('================================================================')
console.log('🧪 DoneKaro Live Staging register_worker Test Runner')
console.log('================================================================\n')

if (!dbUrl) {
  console.log('STATUS: [NOT RUN]')
  console.log('Reason: No local or staging database connection string provided.')
  console.log('Safety Guard: Production database is strictly off-limits for test executions.')
  console.log('\nTo execute against a staging or local container:')
  console.log('1. Start a local Supabase instance: `supabase start` or launch a local Postgres container.')
  console.log('2. Provide connection string: `TEST_DATABASE_URL=postgres://postgres:postgres@127.0.0.1:54322/postgres node scripts/test-register-worker-live.mjs`')
  console.log('3. Alternatively, copy scripts/test-register-worker-live.sql into your staging Supabase SQL Editor.')
  console.log('   The script executes entirely inside BEGIN ... ROLLBACK and leaves 0 permanent records.\n')
  process.exit(0)
}

console.log('Targeting test database connection...')
// If someone provides a database URL, execute using pg or psql
try {
  const { execSync } = await import('node:child_process')
  const sqlPath = path.resolve('scripts/test-register-worker-live.sql')
  const output = execSync(`psql "${dbUrl}" -f "${sqlPath}"`, { encoding: 'utf8' })
  console.log(output)
} catch (err) {
  console.error('Test execution failed:', err.message)
  process.exit(1)
}

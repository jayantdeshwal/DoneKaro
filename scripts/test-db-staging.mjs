#!/usr/bin/env node
import process from 'node:process'
import crypto from 'node:crypto'

let Client
try { ({ Client } = await import('pg')) } catch { console.error('Missing dependency: install the pg package before running this staging-only harness.'); process.exit(2) }

const urlText = process.env.STAGING_DATABASE_URL
const forbiddenRef = 'omoqfizkkccaewiodyef'
const stageArg = process.argv.find(value => value.startsWith('--stage='))
const stage = stageArg?.slice('--stage='.length)
const stages = { pre001: 0, post001: 1, post002: 2 }

if (!urlText) { console.error('Refusing to run: STAGING_DATABASE_URL is not set.'); process.exit(2) }
if (!stage || !(stage in stages)) { console.error('Refusing to run: use --stage=pre001, --stage=post001, or --stage=post002.'); process.exit(2) }

// PRIMARY SAFETY GUARD: Target project ref check. Never connect to production.
if (urlText.toLowerCase().includes(forbiddenRef)) {
  console.error(`Refusing to run against forbidden production Supabase ref: ${forbiddenRef}`);
  process.exit(2)
}

let databaseUrl
try { databaseUrl = new URL(urlText) } catch { console.error('Refusing to run: STAGING_DATABASE_URL is not a valid URL.'); process.exit(2) }
if (databaseUrl.port === '6543') { console.error('Refusing to run through the transaction pooler. Use a direct or session-mode STAGING_DATABASE_URL.'); process.exit(2) }

// SECONDARY SAFETY GUARD: Database environment setting check.
// IMPORTANT: The SQL command `ALTER DATABASE postgres SET donekaro.environment = 'staging'`
// MUST be executed ONLY in the dedicated staging database project by the staging DBA.
// NEVER execute this command in production.
const client = new Client({ connectionString: urlText })
const results = []
let superAdminId = null
const id = () => crypto.randomUUID()
const errorShape = error => error ? { code: error.code ?? null, message: error.message ?? String(error) } : null
const textOf = value => value == null ? 'NULL' : String(value)
const sql = (text, params = []) => client.query(text, params)

function fixtureIds() {
  return {
    customer: id(),
    otherCustomer: id(),
    worker: id(),
    admin: id(),
    subAdmin: id(),
    booking: id(),
    session: `donekaro-staging-${id()}`,
  }
}

async function setClaims(uuid, role = 'authenticated', sessionId = null) {
  const claims = { role }
  if (role !== 'anon' && uuid) claims.sub = uuid
  if (sessionId) claims.session_id = sessionId
  await sql('SELECT set_config($1, $2, true)', ['request.jwt.claims', JSON.stringify(claims)])
  await sql(`SET LOCAL ROLE ${role}`)
}

async function createFixtures({ worker = true, booking = false, admin2fa = false, customerWorkerProfile = null } = {}) {
  // 202609110001_initial_schema.sql:73-87 defines bookings and its columns.
  // 202609200031_admin_2fa_sessions.sql:11-19 defines admin_2fa_sessions and
  // CONSTRAINT uq_admin_2fa_session UNIQUE (admin_id, session_id).
  // 202609110001_initial_schema.sql:201-220 defines the auth.users trigger;
  // handle_new_user reads new.id, new.phone, and new.raw_user_meta_data.
  // 202609180026_two_level_admin_lockdown.sql:101-112 defines is_admin() using
  // role IN ('super_admin', 'sub_admin'); the fixture therefore uses sub_admin.
  const f = fixtureIds()
  const users = [
    [f.customer, 'staging-customer'],
    [f.otherCustomer, 'staging-other-customer'],
    [f.admin, 'staging-admin'],
    [f.subAdmin, 'staging-sub-admin'],
  ]
  if (worker) users.push([f.worker, 'staging-worker'])
  for (const [userId, label] of users) {
    await sql(`
      INSERT INTO auth.users (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
      VALUES ($1, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', $2, '', now(), '{"provider":"email","providers":["email"]}'::jsonb, jsonb_build_object('full_name', $2), now(), now())
      ON CONFLICT (id) DO NOTHING`, [userId, `${label}-${userId}@example.invalid`])
  }
  await sql(`
    INSERT INTO public.profiles (id, full_name, phone, role, created_at, updated_at)
    VALUES ($1,'Staging Customer','9999900001','customer',now(),now()),
           ($2,'Staging Other Customer','9999900002','customer',now(),now()),
           ($3,'Staging Admin','9999900003','sub_admin',now(),now()),
           ($4,'Staging Sub Admin','9999900004','sub_admin',now(),now())
    ON CONFLICT (id) DO UPDATE SET full_name=excluded.full_name, phone=excluded.phone, role=excluded.role, updated_at=timezone('utc',now())`,
    [f.customer, f.otherCustomer, f.admin, f.subAdmin]
  )
  if (worker) {
    await sql(`INSERT INTO public.profiles (id,full_name,phone,role,created_at,updated_at) VALUES ($1,'Staging Worker','9999900005','worker',now(),now()) ON CONFLICT (id) DO UPDATE SET role='worker',updated_at=timezone('utc',now())`, [f.worker])
    await sql(`INSERT INTO public.worker_profiles (id,bio,experience_years,approval_status,rejection_reason,is_available,id_proof_url) VALUES ($1,'staging worker',2,'pending',NULL,true,NULL) ON CONFLICT (id) DO NOTHING`, [f.worker])
    await sql(`INSERT INTO public.worker_categories (worker_id,category_id) VALUES ($1,'plumber') ON CONFLICT DO NOTHING`, [f.worker])
  }
  if (customerWorkerProfile) {
    await sql(`UPDATE public.profiles SET role='worker' WHERE id=$1`, [f.customer])
    await sql(`INSERT INTO public.worker_profiles (id,bio,experience_years,approval_status,rejection_reason,is_available,id_proof_url) VALUES ($1,'existing staging worker',2,$2,$3,true,NULL)`, [f.customer, customerWorkerProfile, customerWorkerProfile === 'rejected' ? 'Blurry' : null])
  }
  if (admin2fa) {
    await sql(`INSERT INTO public.admin_2fa_sessions (admin_id,session_id,expires_at) VALUES ($1,$2,now()+interval '30 minutes') ON CONFLICT (admin_id,session_id) DO UPDATE SET expires_at=excluded.expires_at`, [f.admin, f.session])
  }
  if (booking) {
    const area = await sql(`SELECT id FROM public.service_areas WHERE pincode='251001' LIMIT 1`)
    if (!area.rows[0]) throw new Error('Fixture requires service area pincode 251001')
    await sql(`INSERT INTO public.bookings (id,customer_id,worker_id,category_id,service_area_id,status,address,notes) VALUES ($1,$2,$3,'plumber',$4,'completed','Staging address','Staging review fixture')`, [f.booking, f.customer, f.worker, area.rows[0].id])
  }
  return f
}

function stageStatus(result, passStage, informational = false) {
  if (informational || result.status === 'NOT_TESTED' || result.status === 'KNOWN_LIMITATION') return result.status
  if (stage !== 'post002') {
    // In pre001 and post001, mismatches against expected are informational baseline diffs
    if (result.status === 'FAIL') return 'BASELINE_DIFF'
    if (result.status === 'PASS' && stages[stage] < stages[passStage]) return 'BASELINE_DIFF'
    return result.status
  }
  // In post002:
  if (result.status === 'PASS' && stages[stage] < stages[passStage]) return 'UNEXPECTED_PASS'
  if (result.status === 'FAIL' && stages[stage] < stages[passStage]) return 'EXPECTED_BASELINE_FAIL'
  return result.status
}

async function runCase(name, action, options = {}) {
  const result = { name, passStage: options.passStage, outcome: null, code: null, message: null, status: options.notTested ? 'NOT_TESTED' : 'FAIL' }
  if (!options.notTested && !options.passStage) { result.status = 'NOT_TESTED'; result.message = 'NOT TESTED: case has no first passing stage tag.'; results.push(result); return }
  if (options.notTested) { result.message = options.notTested; results.push(result); return }
  try {
    await sql('BEGIN')
    const fixtures = await createFixtures(options.fixtures)
    if (options.claims) await setClaims(options.claims(fixtures), options.role ?? 'authenticated', options.session ? fixtures.session : null)
    let actionError = null
    await sql('SAVEPOINT case_action')
    try {
      const value = await action(fixtures, result)
      result.outcome = value == null ? 'success' : JSON.stringify(value)
      await sql('RELEASE SAVEPOINT case_action')
    } catch (error) {
      actionError = errorShape(error)
      await sql('ROLLBACK TO SAVEPOINT case_action')
      await sql('RELEASE SAVEPOINT case_action')
    }
    if (actionError) {
      result.code = actionError.code
      result.message = actionError.message
      if (!options.expectError) result.status = 'FAIL'
      else if (typeof options.expectError === 'string') result.status = actionError.message === options.expectError ? 'PASS' : 'FAIL'
      else result.status = options.expectError.test(actionError.message) ? 'PASS' : 'FAIL'
    } else {
      result.status = options.expectError ? 'FAIL' : 'PASS'
      if (options.expectError) result.message = `Expected error ${options.expectError}, but action succeeded`
    }
    if (options.assert && result.status === 'PASS') {
      const assertion = await options.assert(fixtures, result)
      if (!assertion.ok) { result.status = 'FAIL'; result.message = assertion.message }
    }
    if (options.verify && result.status === 'PASS') {
      await sql('RESET ROLE')
      const assertion = await options.verify(fixtures, result)
      if (!assertion.ok) { result.status = 'FAIL'; result.message = assertion.message }
    }
    if (options.informational) {
      result.status = 'KNOWN_LIMITATION'
      result.message = result.outcome ?? result.message ?? 'observed'
    }
  } catch (error) {
    const caught = errorShape(error)
    result.code = caught.code
    result.message = caught.message
    result.status = 'FAIL'
  } finally {
    try { await sql('ROLLBACK') } catch {}
    try { await sql('RESET ROLE') } catch {}
  }
  result.status = stageStatus(result, options.passStage, options.informational)
  results.push(result)
}

const authCustomer = f => f.customer
const authWorker = f => f.worker
const authAdmin = f => f.admin

async function verifyUnchanged(result, idValue) {
  const after = (await sql('SELECT role,full_name,phone FROM public.profiles WHERE id=$1', [idValue])).rows[0]
  const before = result.before
  const ok = before?.role === after?.role && before?.full_name === after?.full_name && before?.phone === after?.phone
  return { ok, message: ok ? 'profile row unchanged' : `before=${JSON.stringify(before)} after=${JSON.stringify(after)}` }
}

async function verifyWorkerState(f, expected = {}) {
  const profile = (await sql('SELECT role FROM public.profiles WHERE id=$1', [f.customer])).rows[0]
  const worker = (await sql('SELECT approval_status,id_proof_url,rejection_reason FROM public.worker_profiles WHERE id=$1', [f.customer])).rows[0]
  const categories = (await sql('SELECT count(*)::int AS count FROM public.worker_categories WHERE worker_id=$1', [f.customer])).rows[0]
  const areas = (await sql('SELECT count(*)::int AS count FROM public.worker_service_areas WHERE worker_id=$1', [f.customer])).rows[0]
  const problems = []
  if (expected.role && profile?.role !== expected.role) problems.push(`role=${profile?.role}`)
  if (expected.status && worker?.approval_status !== expected.status) problems.push(`status=${worker?.approval_status}`)
  if (expected.proof !== undefined && worker?.id_proof_url !== expected.proof) problems.push(`id_proof_url=${worker?.id_proof_url}`)
  if (expected.reason !== undefined && worker?.rejection_reason !== expected.reason) problems.push(`rejection_reason=${worker?.rejection_reason}`)
  if (expected.categories !== undefined && categories?.count !== expected.categories) problems.push(`categories=${categories?.count}`)
  if (expected.areas !== undefined && areas?.count !== expected.areas) problems.push(`areas=${areas?.count}`)
  return { ok: problems.length === 0, message: problems.join(', ') || 'state verified' }
}

async function reviewTamperWithSavepoint(f) {
  await sql('SAVEPOINT review_rating_tamper')
  let caught = null
  try { await sql('UPDATE public.worker_profiles SET rating=1 WHERE id=$1', [f.worker]) } catch (error) { caught = errorShape(error) }
  await sql('ROLLBACK TO SAVEPOINT review_rating_tamper')
  await sql('RELEASE SAVEPOINT review_rating_tamper')
  if (!caught) throw new Error('Direct customer rating update unexpectedly succeeded')
  if (!/Direct worker profile updates cannot change rating|permission denied/i.test(caught.message)) throw new Error(caught.message)
}

async function main() {
  await client.connect()
  const identity = await sql('SELECT current_user AS current_user')
  if (identity.rows[0].current_user !== 'postgres') throw new Error(`Refusing to run: connection user must be postgres, got ${identity.rows[0].current_user}`)
  const marker = await sql(`SELECT current_setting('donekaro.environment',true) AS environment`)
  if (marker.rows[0]?.environment !== 'staging') throw new Error(`Refusing to run: donekaro.environment must be staging, got ${marker.rows[0]?.environment ?? 'unset'}`)
  superAdminId = (await sql('SELECT public.get_super_admin_uuid() AS id')).rows[0]?.id ?? null

  // --------------------------------------------------------------------------
  // SECTION 1: REGISTRATION RPC TESTS (001)
  // --------------------------------------------------------------------------
  // 202610140001_repair_worker_registration_rpc.sql:18-143
  await runCase('valid registration with ID proof', f => sql(`SELECT public.register_worker('Ramesh Plumber','9999900001','Bio',6,'plumber',ARRAY['251001'],NULL,$1,ARRAY['plumber'])`, [`${f.customer}/id.pdf`]), { passStage:'post001', claims:authCustomer, verify:f => verifyWorkerState(f,{role:'worker',status:'pending',proof:`${f.customer}/id.pdf`,categories:1,areas:1}) })
  await runCase('valid two services same parent', () => sql(`SELECT public.register_worker('Two Services','9999900001','Bio',6,'plumber',ARRAY['251001','251002'],NULL,NULL,ARRAY['plumber','raj_mistri'])`), { passStage:'post001', claims:authCustomer, verify:f => verifyWorkerState(f,{categories:2,areas:2}) })

  // Rejections with verified line references from 202610140001_repair_worker_registration_rpc.sql
  const rejected = [
    // 202610140001:80 ('Select 1 or 2 services (requested: %)')
    ['three services rejected', `SELECT public.register_worker('Three','9999900001','Bio',2,'plumber',ARRAY['251001'],NULL,NULL,ARRAY['plumber','raj_mistri','electrician'])`, /Select 1 or 2 services|at most 2 services/],
    // 202610140001:94 ('All selected services must belong to the same parent category')
    ['mixed parents rejected', `SELECT public.register_worker('Mixed','9999900001','Bio',2,'plumber',ARRAY['251001'],NULL,NULL,ARRAY['plumber','ac_repair'])`, 'All selected services must belong to the same parent category'],
    // 202610140001:91 ('Cannot select a top-level group as a service')
    ['top-level group rejected', `SELECT public.register_worker('Group','9999900001','Bio',2,'home_repair',ARRAY['251001'],NULL,NULL,ARRAY['home_repair'])`, /Cannot select a top-level/],
    // 202610140001:88 ('One or more selected services are invalid')
    ['unknown service rejected', `SELECT public.register_worker('Unknown','9999900001','Bio',2,'nonexistent_service',ARRAY['251001'],NULL,NULL,ARRAY['nonexistent_service'])`, 'One or more selected services are invalid'],
    // 202610140001:64 ('Experience must be between 0 and 50 years')
    ['negative experience rejected', `SELECT public.register_worker('Experience','9999900001','Bio',-1,'plumber',ARRAY['251001'],NULL,NULL,ARRAY['plumber'])`, 'Experience must be between 0 and 50 years'],
    // 202610140001:64 ('Experience must be between 0 and 50 years')
    ['experience above 50 rejected', `SELECT public.register_worker('Experience','9999900001','Bio',51,'plumber',ARRAY['251001'],NULL,NULL,ARRAY['plumber'])`, 'Experience must be between 0 and 50 years'],
    // 202610140001:61 ('Worker name is required')
    ['empty name rejected', `SELECT public.register_worker('   ','9999900001','Bio',5,'plumber',ARRAY['251001'],NULL,NULL,ARRAY['plumber'])`, 'Worker name is required'],
    // 202610140001:103 ('One or more service areas are invalid')
    ['invalid pincode rejected', `SELECT public.register_worker('Pin','9999900001','Bio',5,'plumber',ARRAY['999999'],NULL,NULL,ARRAY['plumber'])`, 'One or more service areas are invalid'],
  ]
  for (const [name, statement, expected] of rejected) {
    await runCase(name, () => sql(statement), { passStage:'post001', claims:authCustomer, expectError:expected })
  }

  await runCase('duplicate services and areas deduplicate', () => sql(`SELECT public.register_worker('Dedup','9999900001','Bio',4,'plumber',ARRAY['251001','251001'],NULL,NULL,ARRAY['plumber','plumber'])`), { passStage:'post001', claims:authCustomer, verify:f => verifyWorkerState(f,{categories:1,areas:1}) })
  await runCase('registration is idempotent', async () => { await sql(`SELECT public.register_worker('Retry','9999900001','Bio',4,'plumber',ARRAY['251001'],NULL,NULL,ARRAY['plumber'])`); await sql(`SELECT public.register_worker('Retry again','9999900001','Bio',4,'plumber',ARRAY['251001'],NULL,NULL,ARRAY['plumber'])`) }, { passStage:'post001', claims:authCustomer, verify:f => verifyWorkerState(f,{categories:1,areas:1}) })
  // 202610140001:108 ('Invalid ID document path')
  await runCase('foreign document path rejected', () => sql(`SELECT public.register_worker('Spoof','9999900001','Bio',3,'plumber',ARRAY['251001'],NULL,'another-user/id.pdf',ARRAY['plumber'])`), { passStage:'post001', claims:authCustomer, expectError:'Invalid ID document path' })
  // 202610140001:108 ('Invalid ID document path')
  await runCase('document traversal rejected', f => sql(`SELECT public.register_worker('Traversal','9999900001','Bio',3,'plumber',ARRAY['251001'],NULL,$1,ARRAY['plumber'])`, [`${f.customer}/../escaped.pdf`]), { passStage:'post001', claims:authCustomer, expectError:'Invalid ID document path' })
  // 202610140001:72 ('Primary service must be one of the selected services')
  await runCase('primary service mismatch rejected', () => sql(`SELECT public.register_worker('Mismatch','9999900001','Bio',3,'electrician',ARRAY['251001'],NULL,NULL,ARRAY['plumber'])`), { passStage:'post001', claims:authCustomer, expectError:'Primary service must be one of the selected services' })
  await runCase('approved worker remains approved', () => sql(`SELECT public.register_worker('Approved retry','9999900001','Bio',5,'plumber',ARRAY['251001'],NULL,NULL,ARRAY['plumber'])`), { passStage:'post001', fixtures:{customerWorkerProfile:'approved'}, claims:authCustomer, verify:f => verifyWorkerState(f,{status:'approved'}) })
  await runCase('rejected worker returns to pending', f => sql(`SELECT public.register_worker('Rejected retry','9999900001','Bio',5,'plumber',ARRAY['251001'],NULL,$1,ARRAY['plumber'])`, [`${f.customer}/new.pdf`]), { passStage:'post001', fixtures:{customerWorkerProfile:'rejected'}, claims:authCustomer, verify:f => verifyWorkerState(f,{status:'pending',reason:null}) })
  await runCase('pending worker remains pending', () => sql(`SELECT public.register_worker('Pending retry','9999900001','Bio',5,'plumber',ARRAY['251001'],NULL,NULL,ARRAY['plumber'])`), { passStage:'post001', fixtures:{customerWorkerProfile:'pending'}, claims:authCustomer, verify:f => verifyWorkerState(f,{status:'pending'}) })

  // 202610140001:57 ('This account type cannot register as a worker')
  await runCase('sub-admin registration rejected and profile unchanged', async (f,result) => { await sql('RESET ROLE'); result.before=(await sql('SELECT role,full_name,phone FROM public.profiles WHERE id=$1',[f.subAdmin])).rows[0]; await setClaims(f.subAdmin); await sql(`SELECT public.register_worker('Sub Admin','9999900003','Bio',5,'plumber',ARRAY['251001'],NULL,NULL,ARRAY['plumber'])`) }, { passStage:'post001', fixtures:{worker:false}, claims:f=>f.subAdmin, expectError:'This account type cannot register as a worker', verify:(f,result)=>verifyUnchanged(result,f.subAdmin) })
  if (superAdminId) {
    await runCase('real super-admin registration rejected and profile unchanged', async (f,result) => { await sql('RESET ROLE'); result.before=(await sql('SELECT role,full_name,phone FROM public.profiles WHERE id=$1',[superAdminId])).rows[0]; await setClaims(superAdminId); await sql(`SELECT public.register_worker('Super Admin','9999900004','Bio',5,'plumber',ARRAY['251001'],NULL,NULL,ARRAY['plumber'])`) }, { passStage:'post001', fixtures:{worker:false}, claims:()=>superAdminId, expectError:'This account type cannot register as a worker', verify:(f,result)=>verifyUnchanged(result,superAdminId) })
  }
  await runCase('real super-admin missing', async () => {}, { passStage:'post002', notTested:superAdminId ? 'NOT TESTED: the real super admin exists; the harness never deletes or substitutes it.' : 'NOT TESTED: get_super_admin_uuid() returned NULL; no substitute or fixture was created.' })

  // 202609200031_admin_2fa_sessions.sql:648 ('Unauthorized: Role cannot be modified directly.')
  await runCase('direct profile role update blocked', f => sql(`UPDATE public.profiles SET role='worker' WHERE id=$1`,[f.otherCustomer]), { passStage:'pre001', claims:f=>f.otherCustomer, expectError:/Role cannot be modified directly/ })

  // --------------------------------------------------------------------------
  // SECTION 2: CATEGORY INVARIANT CASES (INPUT F dependent)
  // Per requirement 8: If Input F is empty, mark NOT TESTED.
  // --------------------------------------------------------------------------
  await runCase('direct three-category insert blocked', async () => {}, {
    passStage: 'pre001',
    notTested: 'NOT TESTED: Input F (live trigger def of worker_categories invariant) is empty. Per requirement 8, invariant cases run as postgres without claims only when trigger definition is supplied.',
  })
  await runCase('direct mixed-parent category insert blocked', async () => {}, {
    passStage: 'pre001',
    notTested: 'NOT TESTED: Input F (live trigger def of worker_categories invariant) is empty. Per requirement 8, invariant cases run as postgres without claims only when trigger definition is supplied.',
  })

  // --------------------------------------------------------------------------
  // SECTION 3: PERMISSION & OVERLOAD CHECKS (001)
  // --------------------------------------------------------------------------
  await runCase('anon lacks register_worker execute', async () => { await setClaims(null,'anon'); const row=await sql(`SELECT has_function_privilege('anon','public.register_worker(text,text,text,integer,text,text[],text,text,text[])','EXECUTE') AS allowed`); if (row.rows[0].allowed) throw new Error('anon has EXECUTE privilege on register_worker') }, { passStage:'post001', claims:()=>null })
  // 202610140001:49 ('You must be signed in to register as a worker')
  await runCase('anon registration rejected', () => sql(`SELECT public.register_worker('Anon','9999900009','Bio',2,'plumber',ARRAY['251001'],NULL,NULL,ARRAY['plumber'])`), { passStage:'post001', fixtures:{worker:false}, claims:()=>null, role:'anon', expectError:/signed in|permission denied/ })
  await runCase('one register_worker overload exists', async () => { const row=await sql(`SELECT count(*)::int AS count FROM pg_proc WHERE proname='register_worker' AND pronamespace='public'::regnamespace`); if (row.rows[0].count !== 1) throw new Error(`Expected exactly 1 overload, found ${row.rows[0].count}`) }, { passStage:'post001', claims:authCustomer })

  // --------------------------------------------------------------------------
  // SECTION 4: REGRESSION GUARDS (Tagged pre001 or post001)
  // --------------------------------------------------------------------------
  // Baseline allow check: Pending insert (pre001 allowed in baseline; post002 blocks direct inserts)
  await runCase('customer clean pending worker-profile insert allowed', f => sql(`INSERT INTO public.worker_profiles(id,bio,experience_years,approval_status) VALUES ($1,'test',1,'pending')`,[f.customer]), { passStage:'pre001', claims:authCustomer, verify:f=>verifyWorkerState(f,{status:'pending'}) })

  // Baseline allow check: Editable fields update (pre001)
  await runCase('worker editable fields allowed', f => sql(`UPDATE public.worker_profiles SET bio='updated',experience_years=4,is_available=false WHERE id=$1`,[f.worker]), { passStage:'pre001', claims:authWorker })

  // Baseline allow check: Own ID path update (pre001)
  await runCase('own ID path allowed', f => sql(`UPDATE public.worker_profiles SET id_proof_url=$1 WHERE id=$2`,[`${f.worker}/x.pdf`,f.worker]), { passStage:'pre001', claims:authWorker })

  // Baseline allow check: Real customer review updates rating and count (pre001).
  // 202609110012_real_reviews_system.sql:93-152
  await runCase('real customer review updates rating and count', async f => { const before=(await sql('SELECT rating,review_count FROM public.worker_profiles WHERE id=$1',[f.worker])).rows[0]; await sql(`SELECT public.submit_booking_review($1,5,'Staging review')`,[f.booking]); const after=(await sql('SELECT rating,review_count FROM public.worker_profiles WHERE id=$1',[f.worker])).rows[0]; if (Number(after.review_count)!==Number(before.review_count)+1) throw new Error(`review_count did not increment: ${before.review_count} -> ${after.review_count}`); if (after.rating===before.rating) throw new Error('rating did not change'); if (stages[stage] >= stages.post002) await reviewTamperWithSavepoint(f); return {rating:after.rating,review_count:after.review_count} }, { passStage:'pre001', fixtures:{booking:true}, claims:authCustomer, verify:async f => { const row=(await sql('SELECT rating,review_count FROM public.worker_profiles WHERE id=$1',[f.worker])).rows[0]; const ok=Number(row.review_count)===1 && Number(row.rating)===5; return {ok,message:ok?'review rating/count verified':JSON.stringify({row})} } })

  // Baseline allow check: Real admin review_worker approval (pre001)
  // 202609200031_admin_2fa_sessions.sql:187-227
  await runCase('real admin review_worker approval allowed', f => sql(`SELECT public.review_worker($1,'approved',NULL)`,[f.worker]), { passStage:'pre001', fixtures:{admin2fa:true}, claims:authAdmin, session:true, verify:async f => { const row=(await sql('SELECT approval_status FROM public.worker_profiles WHERE id=$1',[f.worker])).rows[0]; return {ok:row?.approval_status==='approved',message:`approval_status=${row?.approval_status}`} } })

  // Registration verification (post001)
  await runCase('register_worker status and cleanup', f => sql(`SELECT public.register_worker('Guard','9999999999','',1,'electrician',ARRAY['251001'],NULL,$1,ARRAY['electrician'])`,[`${f.customer}/id.pdf`]), { passStage:'post001', claims:authCustomer, verify:async f => { const row=(await sql('SELECT approval_status FROM public.worker_profiles WHERE id=$1',[f.customer])).rows[0]; return {ok:row?.approval_status==='pending',message:`approval_status=${row?.approval_status}`} } })

  // --------------------------------------------------------------------------
  // SECTION 5: FRONTEND PAYLOAD REPLAY CASES (pre001)
  // Replaying exact payloads from useWorkerAvailability.ts and useProfileData.ts
  // --------------------------------------------------------------------------
  // Payload 1: useWorkerAvailability.ts:40-48
  // update({ is_available: newStatus, updated_at: new Date().toISOString() }).eq('id', workerId)
  await runCase('frontend replay: useWorkerAvailability (pending worker)', f => sql(`UPDATE public.worker_profiles SET is_available = false, updated_at = timezone('utc', now()) WHERE id = $1`, [f.worker]), { passStage: 'pre001', fixtures: { customerWorkerProfile: 'pending' }, claims: authWorker })
  await runCase('frontend replay: useWorkerAvailability (approved worker)', f => sql(`UPDATE public.worker_profiles SET is_available = false, updated_at = timezone('utc', now()) WHERE id = $1`, [f.customer]), { passStage: 'pre001', fixtures: { customerWorkerProfile: 'approved' }, claims: authCustomer })

  // Payload 2: useProfileData.ts:199-205
  // update({ id_proof_url: filePath, updated_at: new Date().toISOString() }).eq('id', user.id)
  await runCase('frontend replay: useProfileData id_proof_url upload (pending worker)', f => sql(`UPDATE public.worker_profiles SET id_proof_url = $2, updated_at = timezone('utc', now()) WHERE id = $1`, [f.worker, `${f.worker}/id-proof-1728000000.jpg`]), { passStage: 'pre001', fixtures: { customerWorkerProfile: 'pending' }, claims: authWorker })
  await runCase('frontend replay: useProfileData id_proof_url upload (approved worker)', f => sql(`UPDATE public.worker_profiles SET id_proof_url = $2, updated_at = timezone('utc', now()) WHERE id = $1`, [f.customer, `${f.customer}/id-proof-1728000000.jpg`]), { passStage: 'post002', fixtures: { customerWorkerProfile: 'approved' }, claims: authCustomer, expectError: 'Approved workers cannot replace ID documents without re-review' })

  // Payload 3: useProfileData.ts:294-301
  // update({ bio: ..., experience_years: ..., is_available: ..., updated_at: ... }).eq('id', targetUuid)
  await runCase('frontend replay: useProfileData details update (pending worker)', f => sql(`UPDATE public.worker_profiles SET bio = 'Updated staging bio', experience_years = 5, is_available = true, updated_at = timezone('utc', now()) WHERE id = $1`, [f.worker]), { passStage: 'pre001', fixtures: { customerWorkerProfile: 'pending' }, claims: authWorker })
  await runCase('frontend replay: useProfileData details update (approved worker)', f => sql(`UPDATE public.worker_profiles SET bio = 'Updated staging bio', experience_years = 5, is_available = true, updated_at = timezone('utc', now()) WHERE id = $1`, [f.customer]), { passStage: 'pre001', fixtures: { customerWorkerProfile: 'approved' }, claims: authCustomer })

  // --------------------------------------------------------------------------
  // SECTION 6: WORKER PROFILES GUARD PROTECTION TESTS (post002)
  // --------------------------------------------------------------------------
  // Direct post-registration approval modification blocked
  await runCase('direct post-registration approval update blocked', async f => { await sql(`SELECT public.register_worker('Flag','9999900001','Bio',3,'plumber',ARRAY['251001'],NULL,NULL,ARRAY['plumber'])`); await sql(`UPDATE public.worker_profiles SET approval_status='approved' WHERE id=$1`,[f.customer]) }, { passStage:'post002', claims:authCustomer, expectError:/permission denied|Direct worker profile updates cannot change approval_status/ })
  // Direct insert blocked (REVOKE INSERT or trigger)
  await runCase('customer approved worker-profile insert blocked', f => sql(`INSERT INTO public.worker_profiles(id,bio,experience_years,approval_status) VALUES ($1,'test',1,'approved')`,[f.customer]), { passStage:'post002', claims:authCustomer, expectError:/permission denied|Direct worker profile inserts must start with pending approval|use register_worker/ })
  await runCase('customer non-default rating insert blocked', f => sql(`INSERT INTO public.worker_profiles(id,bio,experience_years,approval_status,rating) VALUES ($1,'test',1,'pending',5)`,[f.customer]), { passStage:'post002', claims:authCustomer, expectError:/permission denied|Direct worker profile inserts must use the rating column default|use register_worker/ })

  // Protected updates in 202610140002
  for (const [field,value,regex] of [
    ['approval_status','approved',/permission denied|cannot change approval_status/],
    ['rejection_reason','tamper',/permission denied|cannot change rejection_reason/],
    ['approved_at','now()',/permission denied|cannot change approved_at/],
    ['rating','5',/permission denied|cannot change rating/],
    ['review_count','5',/permission denied|cannot change review_count/],
  ]) {
    await runCase(`worker protected update: ${field}`, f => sql(`UPDATE public.worker_profiles SET ${field}=${value} WHERE id=$1`,[f.worker]), { passStage:'post002', claims:authWorker, expectError:regex })
  }

  // Document checks
  await runCase('foreign ID path blocked', f => sql(`UPDATE public.worker_profiles SET id_proof_url='another-user/x.pdf' WHERE id=$1`,[f.worker]), { passStage:'post002', claims:authWorker, expectError:'Worker ID document path must belong to the authenticated user and cannot contain ..' })
  await runCase('ID path traversal blocked', f => sql(`UPDATE public.worker_profiles SET id_proof_url=$1 WHERE id=$2`,[`${f.worker}/x/../x.pdf`,f.worker]), { passStage:'post002', claims:authWorker, expectError:'Worker ID document path must belong to the authenticated user and cannot contain ..' })
  await runCase('approved worker ID replacement blocked', f => sql(`UPDATE public.worker_profiles SET id_proof_url=$1 WHERE id=$2`,[`${f.customer}/replacement.pdf`,f.customer]), { passStage:'post002', fixtures:{customerWorkerProfile:'approved'}, claims:authCustomer, expectError:'Approved workers cannot replace ID documents without re-review' })

  // Anonymous writes blocked
  await runCase('anonymous worker-profile write blocked', f => sql(`INSERT INTO public.worker_profiles(id,approval_status) VALUES ($1,'pending')`,[id()]), { passStage:'post002', fixtures:{worker:false}, claims:()=>null, role:'anon', expectError:/permission denied|authenticated|target the authenticated user/ })

  // GUC BYPASS NEGATIVE TESTS (Proving that setting custom GUCs cannot bypass the guard)
  await runCase('authenticated customer GUC insert bypass attempt blocked', f => sql(`SELECT set_config('jugnu.worker_profile_write_allowed','true',true); INSERT INTO public.worker_profiles(id,bio,experience_years,approval_status) VALUES ($1,'bypass attempt',1,'approved')`,[f.customer]), { passStage:'post002', claims:authCustomer, expectError:/permission denied|Direct worker profile inserts|target the authenticated user/ })
  await runCase('authenticated customer GUC rating tamper attempt blocked', f => sql(`SELECT set_config('jugnu.worker_rating_update_allowed','true',true); UPDATE public.worker_profiles SET rating = 5 WHERE id = $1`,[f.worker]), { passStage:'post002', claims:authWorker, expectError:/permission denied|cannot change rating/ })

  // --------------------------------------------------------------------------
  // HARNESS RESULTS REPORTING
  // --------------------------------------------------------------------------
  console.log('CASE'.padEnd(65)+'STAGE'.padEnd(12)+'STATUS'.padEnd(25)+'CODE'.padEnd(10)+'MESSAGE')
  console.log('-'.repeat(150))
  for (const result of results) {
    console.log(`${result.name.padEnd(65)}${result.passStage.padEnd(12)}${result.status.padEnd(25)}${textOf(result.code).padEnd(10)}${textOf(result.message ?? result.outcome)}`)
  }
  console.log('-'.repeat(150))
  const counts = status => results.filter(result => result.status === status).length
  console.log(`TOTAL=${results.length} PASS=${counts('PASS')} BASELINE_DIFF=${counts('BASELINE_DIFF')} EXPECTED_BASELINE_FAIL=${counts('EXPECTED_BASELINE_FAIL')} UNEXPECTED_PASS=${counts('UNEXPECTED_PASS')} NOT_TESTED=${counts('NOT_TESTED')} KNOWN_LIMITATION=${counts('KNOWN_LIMITATION')} FAIL=${counts('FAIL')}`)

  process.exitCode = (stage === 'post002' && (counts('FAIL') || counts('UNEXPECTED_PASS'))) ? 1 : 0
}

try { await main() } catch (error) { console.error(errorShape(error)); process.exitCode = 1 } finally { await client.end().catch(() => {}) }

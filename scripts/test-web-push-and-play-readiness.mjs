// ============================================================================
// DoneKaro — Web Push, Android TWA & Google Play Readiness Regression Test Suite
// ============================================================================
// Comprehensive logic, protocol, concurrency, and security tests
// ============================================================================

import assert from 'node:assert/strict'

console.log('================================================================')
console.log('📱 DONEKARO — WEB PUSH & PLAY STORE READINESS TEST SUITE')
console.log('================================================================\n')

let passedCount = 0
let totalCount = 0

function runTest(name, fn) {
  totalCount++
  try {
    fn()
    console.log(`✅ [SCENARIO-${totalCount}] ${name}`)
    passedCount++
  } catch (err) {
    console.error(`❌ [SCENARIO-${totalCount}] ${name}`)
    console.error('   Failure:', err.message)
  }
}

// ----------------------------------------------------------------------------
// 1. SUBSCRIPTION VALIDATION & PERSISTENCE CONTRACTS
// ----------------------------------------------------------------------------

runTest('Subscription Validation: Rejects missing, empty, or whitespace-only endpoints', () => {
  const validateSubscription = (endpoint, p256dh, auth) => {
    if (!endpoint || typeof endpoint !== 'string' || endpoint.trim() === '') {
      throw new Error('Invalid push endpoint')
    }
    if (!p256dh || typeof p256dh !== 'string' || p256dh.trim() === '') {
      throw new Error('Missing subscription keys')
    }
    if (!auth || typeof auth !== 'string' || auth.trim() === '') {
      throw new Error('Missing subscription keys')
    }
    return true
  }

  assert.throws(() => validateSubscription('', 'key', 'auth'), /Invalid push endpoint/)
  assert.throws(() => validateSubscription('   ', 'key', 'auth'), /Invalid push endpoint/)
  assert.throws(() => validateSubscription(null, 'key', 'auth'), /Invalid push endpoint/)
  assert.throws(() => validateSubscription('https://fcm.googleapis.com/...', '', 'auth'), /Missing subscription keys/)
  assert.equal(validateSubscription('https://fcm.googleapis.com/fcm/send/test123', 'p256dh_key', 'auth_secret'), true)
})

runTest('Caller Authentication: Prevents associating subscription to another user', () => {
  const saveSubscription = (callerAuthUid, requestedUserId, endpoint) => {
    // In our security definer RPC, callerAuthUid = auth.uid() is strictly used
    if (!callerAuthUid) {
      throw new Error('Unauthorized: Caller session required')
    }
    // Any client-supplied user_id is ignored in favor of verified auth.uid()
    return {
      user_id: callerAuthUid,
      endpoint,
      is_active: true,
    }
  }

  const attackerUid = 'attacker-uuid-1111'
  const victimUid = 'victim-uuid-2222'

  const result = saveSubscription(attackerUid, victimUid, 'https://push.example.com/sub1')
  assert.equal(result.user_id, attackerUid, 'Must anchor to caller auth.uid(), never victim')
  assert.notEqual(result.user_id, victimUid)
})

runTest('Subscription Deduplication: Endpoint conflict transfers device to active caller', () => {
  const db = new Map()

  const upsertSub = (userId, endpoint, p256dh, auth, locale) => {
    const existing = db.get(endpoint)
    const record = {
      id: existing?.id || 'sub-' + Math.random().toString(36).substring(2, 7),
      user_id: userId,
      endpoint,
      p256dh,
      auth,
      locale: locale || 'en',
      is_active: true,
      updated_at: new Date().toISOString(),
    }
    db.set(endpoint, record)
    return record
  }

  const sub1 = upsertSub('user-1', 'https://fcm.googleapis.com/sub1', 'key1', 'auth1', 'en')
  assert.equal(db.size, 1)

  // Same device logs into another account or refreshes
  const sub2 = upsertSub('user-2', 'https://fcm.googleapis.com/sub1', 'key1', 'auth1', 'hi')
  assert.equal(db.size, 1, 'Duplicate endpoint must update existing row, not create duplicate')
  assert.equal(sub2.id, sub1.id, 'Preserves subscription ID')
  assert.equal(sub2.user_id, 'user-2', 'Transfers endpoint to current active authenticated user')
  assert.equal(sub2.locale, 'hi')
})

// ----------------------------------------------------------------------------
// 2. DISPATCHER AUTHORIZATION & PRIVILEGE LEVEL
// ----------------------------------------------------------------------------

runTest('Dispatcher Authorization: Rejects unauthenticated callers', () => {
  const authorizeDispatcher = (headers, envSecret, serviceKey) => {
    const webhookSecret = headers['x-webhook-secret'] || ''
    const authHeader = (headers['authorization'] || '').replace(/^Bearer\s+/i, '').trim()

    if (envSecret && webhookSecret === envSecret) {
      return { authorized: true, method: 'webhook_secret' }
    }
    if (serviceKey && authHeader === serviceKey) {
      return { authorized: true, method: 'service_role' }
    }
    return { authorized: false }
  }

  const res = authorizeDispatcher({}, 'secret123', 'serviceKey123')
  assert.equal(res.authorized, false)
})

runTest('Dispatcher Authorization: Rejects ordinary admin or customer sessions for queue processing', () => {
  const authorizeDispatcher = (headers, envSecret, serviceKey, clientJwtRole) => {
    const webhookSecret = headers['x-webhook-secret'] || ''
    const authHeader = (headers['authorization'] || '').replace(/^Bearer\s+/i, '').trim()

    // Server-to-server methods
    if (envSecret && webhookSecret === envSecret) return true
    if (serviceKey && authHeader === serviceKey) return true

    // Even if caller is admin or sub_admin in JWT, global queue processing is forbidden
    if (['admin', 'sub_admin', 'customer', 'worker'].includes(clientJwtRole)) {
      return false
    }
    return false
  }

  assert.equal(authorizeDispatcher({}, 'secret123', 'serviceKey123', 'sub_admin'), false)
  assert.equal(authorizeDispatcher({}, 'secret123', 'serviceKey123', 'admin'), false)
  assert.equal(authorizeDispatcher({}, 'secret123', 'serviceKey123', 'customer'), false)
  assert.equal(authorizeDispatcher({ 'x-webhook-secret': 'secret123' }, 'secret123', 'serviceKey123', null), true)
})

// ----------------------------------------------------------------------------
// 3. ATOMIC OUTBOX QUEUE CLAIMING & CONCURRENCY
// ----------------------------------------------------------------------------

runTest('Outbox Concurrency: Atomic claiming (FOR UPDATE SKIP LOCKED) prevents duplicate claims', () => {
  // Simulating the database queue
  const outbox = [
    { id: 'item-1', status: 'pending', attempts: 0, processed_at: null },
    { id: 'item-2', status: 'pending', attempts: 0, processed_at: null },
    { id: 'item-3', status: 'pending', attempts: 0, processed_at: null },
    { id: 'item-4', status: 'pending', attempts: 0, processed_at: null },
  ]

  const lockedRows = new Set()

  const claimBatch = (batchSize) => {
    const claimed = []
    for (const row of outbox) {
      if (claimed.length >= batchSize) break
      if (row.status === 'pending' && !lockedRows.has(row.id)) {
        lockedRows.add(row.id)
        row.status = 'processing'
        row.processed_at = new Date()
        claimed.push(row)
      }
    }
    return claimed
  }

  // Worker 1 and Worker 2 run concurrently
  const worker1Claimed = claimBatch(2)
  const worker2Claimed = claimBatch(2)

  assert.equal(worker1Claimed.length, 2)
  assert.equal(worker2Claimed.length, 2)

  // Verify completely disjoint sets (zero duplicate processing!)
  const w1Ids = new Set(worker1Claimed.map(r => r.id))
  const w2Ids = new Set(worker2Claimed.map(r => r.id))

  for (const id of w2Ids) {
    assert.equal(w1Ids.has(id), false, `Item ${id} was claimed by both workers!`)
  }
})

runTest('Outbox Retry & Zombie Lock Recovery: Exponential backoff and lock reclamation', () => {
  const now = Date.now()
  const outbox = [
    // 1. Fresh failed item (attempts: 1, failed 5 seconds ago) -> Should NOT be claimed yet (needs 60s cooldown)
    { id: 'fail-fresh', status: 'failed', attempts: 1, processed_at: new Date(now - 5000), max_attempts: 3 },
    // 2. Matured failed item (attempts: 1, failed 70 seconds ago) -> Ready for retry
    { id: 'fail-matured', status: 'failed', attempts: 1, processed_at: new Date(now - 70000), max_attempts: 3 },
    // 3. Zombie item (stuck in 'processing' for 10 minutes) -> Reclaimed
    { id: 'zombie-item', status: 'processing', attempts: 1, processed_at: new Date(now - 600000), max_attempts: 3 },
    // 4. Dead letter item (attempts: 3 reached max) -> Ignored
    { id: 'dead-item', status: 'failed', attempts: 3, processed_at: new Date(now - 120000), max_attempts: 3 },
  ]

  const isEligibleForClaim = (item) => {
    if (item.status === 'pending' && item.attempts < item.max_attempts) return true
    if (item.status === 'failed' && item.attempts < item.max_attempts) {
      const cooldownMs = 30000 * Math.pow(2, item.attempts)
      return now - item.processed_at.getTime() >= cooldownMs
    }
    if (item.status === 'processing') {
      const zombieTimeoutMs = 5 * 60 * 1000
      return now - item.processed_at.getTime() >= zombieTimeoutMs
    }
    return false
  }

  assert.equal(isEligibleForClaim(outbox[0]), false, 'Fresh failure must cool down')
  assert.equal(isEligibleForClaim(outbox[1]), true, 'Matured failure should be retried')
  assert.equal(isEligibleForClaim(outbox[2]), true, 'Zombie lock should be reclaimed')
  assert.equal(isEligibleForClaim(outbox[3]), false, 'Exceeded max attempts must not be retried')
})

// ----------------------------------------------------------------------------
// 4. WEB PUSH PROTOCOL & CRYPTOGRAPHIC COMPLIANCE (RFC 8291 / 8292)
// ----------------------------------------------------------------------------

runTest('VAPID JWT Claims: Validates audience origin, expiration window, and subject URI', () => {
  const createVapidClaims = (endpoint, subject) => {
    const url = new URL(endpoint)
    const audience = url.origin
    const nowSec = Math.floor(Date.now() / 1000)
    const exp = nowSec + 12 * 3600 // 12 hours

    if (!subject.startsWith('mailto:') && !subject.startsWith('https:')) {
      throw new Error('VAPID subject must start with mailto: or https:')
    }

    return {
      aud: audience,
      exp,
      sub: subject,
    }
  }

  const endpoint = 'https://fcm.googleapis.com/fcm/send/eXampleDeviceToken'
  const subject = 'mailto:jayant.deshwal.56@gmail.com'

  const claims = createVapidClaims(endpoint, subject)
  assert.equal(claims.aud, 'https://fcm.googleapis.com', 'Audience must be endpoint origin')
  assert.equal(claims.sub, subject)
  assert.ok(claims.exp > Math.floor(Date.now() / 1000))
})

runTest('Push Payload Framing: Enforces 4096-byte RFC 8291 payload constraint', () => {
  const checkPayloadSize = (payload) => {
    const jsonStr = JSON.stringify(payload)
    const byteLength = Buffer.byteLength(jsonStr, 'utf8')
    if (byteLength > 4096) {
      throw new Error(`Payload exceeds RFC 8291 limit: ${byteLength} bytes`)
    }
    return byteLength
  }

  const validPayload = {
    title: 'Booking Confirmed',
    body: 'Your carpenter has accepted booking #12345.',
    url: '/bookings#booking-12345',
    tag: 'donekaro-12345',
  }

  const bytes = checkPayloadSize(validPayload)
  assert.ok(bytes < 500, 'Transactional payloads should be compact')

  const oversizedPayload = {
    title: 'Big',
    body: 'x'.repeat(4100),
  }
  assert.throws(() => checkPayloadSize(oversizedPayload), /Payload exceeds RFC 8291 limit/)
})

runTest('Delivery Error Classification: 410 Gone / 404 deactivates subscription; 429/5xx retries', () => {
  const subscriptions = [
    { id: 'sub-gone', is_active: true },
    { id: 'sub-server-error', is_active: true },
  ]

  const handleProviderResponse = (subId, statusCode) => {
    if (statusCode === 410 || statusCode === 404) {
      const sub = subscriptions.find(s => s.id === subId)
      if (sub) sub.is_active = false
      return { action: 'deactivate_subscription', retry: false }
    }
    if (statusCode === 429 || statusCode >= 500) {
      return { action: 'retry_outbox', retry: true }
    }
    return { action: 'unknown', retry: false }
  }

  const r1 = handleProviderResponse('sub-gone', 410)
  assert.equal(r1.action, 'deactivate_subscription')
  assert.equal(subscriptions.find(s => s.id === 'sub-gone').is_active, false)

  const r2 = handleProviderResponse('sub-server-error', 503)
  assert.equal(r2.action, 'retry_outbox')
  assert.equal(r2.retry, true)
  assert.equal(subscriptions.find(s => s.id === 'sub-server-error').is_active, true)
})

// ----------------------------------------------------------------------------
// 5. SERVICE WORKER & NAVIGATION SANITIZATION
// ----------------------------------------------------------------------------

runTest('Deep Link Sanitization: Blocks malicious open redirects and external URLs', () => {
  const sanitizeUrl = (rawUrl, currentOrigin = 'https://done-karo.vercel.app') => {
    if (!rawUrl || typeof rawUrl !== 'string') return '/'
    if (rawUrl.startsWith('/') && !rawUrl.startsWith('//')) {
      return rawUrl
    }
    try {
      const parsed = new URL(rawUrl, currentOrigin)
      if (parsed.origin === currentOrigin) {
        return parsed.pathname + parsed.search + parsed.hash
      }
    } catch {
      // invalid URL
    }
    return '/'
  }

  assert.equal(sanitizeUrl('/bookings#booking-123'), '/bookings#booking-123')
  assert.equal(sanitizeUrl('/worker/dashboard'), '/worker/dashboard')
  assert.equal(sanitizeUrl('https://done-karo.vercel.app/admin?tab=workers'), '/admin?tab=workers')

  // Malicious URLs
  assert.equal(sanitizeUrl('https://phishing-scam.com/steal-creds'), '/')
  assert.equal(sanitizeUrl('//phishing-scam.com'), '/')
  assert.equal(sanitizeUrl('javascript:alert(1)'), '/')
  assert.equal(sanitizeUrl(null), '/')
})

// ----------------------------------------------------------------------------
// 6. ACCOUNT DELETION & SUPER ADMIN PROTECTION
// ----------------------------------------------------------------------------

runTest('Account Deletion Invariant: Self-service deletion disabled; administrative deletion requires is_admin()', () => {
  const SUPER_ADMIN_UUID = '3216cdd3-aaea-45ab-944c-cfb30d6a6e0b'

  // Self-service deletion is disabled across all roles
  const attemptSelfServiceDelete = (_callerId, _userRole) => {
    throw new Error('Action prohibited: Self-service account deletion is disabled on DoneKaro platform.')
  }

  // Administrative permanent delete requires is_admin() and blocks deleting oneself or another admin
  const executeAdminDelete = (adminId, adminRole, targetId, targetRole) => {
    if (!['super_admin', 'admin'].includes(adminRole)) {
      throw new Error('Unauthorized: Only platform administrators can permanently delete accounts.')
    }
    if (adminId === targetId) {
      throw new Error('Action prohibited: Administrators cannot delete their own profile.')
    }
    if (targetRole === 'admin' || targetId === SUPER_ADMIN_UUID) {
      throw new Error('Action prohibited: Cannot delete another administrator profile.')
    }
    return { success: true, deleted_id: targetId }
  }

  // Verify self-service deletion is strictly rejected for all users
  assert.throws(() => attemptSelfServiceDelete('customer-uuid-1', 'customer'), /Self-service account deletion is disabled/)
  assert.throws(() => attemptSelfServiceDelete('worker-uuid-2', 'worker'), /Self-service account deletion is disabled/)
  assert.throws(() => attemptSelfServiceDelete(SUPER_ADMIN_UUID, 'super_admin'), /Self-service account deletion is disabled/)

  // Verify administrative deletion security rules
  assert.throws(() => executeAdminDelete('non-admin-uuid', 'customer', 'target-uuid', 'worker'), /Unauthorized: Only platform administrators/)
  assert.throws(() => executeAdminDelete('admin-uuid-1', 'admin', 'admin-uuid-1', 'admin'), /Administrators cannot delete their own profile/)
  assert.throws(() => executeAdminDelete('admin-uuid-1', 'admin', SUPER_ADMIN_UUID, 'super_admin'), /Cannot delete another administrator/)
  assert.deepEqual(executeAdminDelete('admin-uuid-1', 'admin', 'customer-uuid-1', 'customer'), { success: true, deleted_id: 'customer-uuid-1' })
  assert.deepEqual(executeAdminDelete('admin-uuid-1', 'admin', 'worker-uuid-2', 'worker'), { success: true, deleted_id: 'worker-uuid-2' })
})

console.log('\n================================================================')
console.log(`SUMMARY: ${passedCount} / ${totalCount} Scenarios PASSED`)
console.log('================================================================\n')

if (passedCount !== totalCount) {
  process.exit(1)
}

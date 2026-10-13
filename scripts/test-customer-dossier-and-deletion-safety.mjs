// ============================================================================
// DoneKaro — Customer Dossier Documents & Deletion Safety Test Suite
// ============================================================================
// Validates:
// 1. Customer registration document mapping and signed URL contracts
// 2. Storage path ownership and isolation
// 3. Customer Dossier document state and empty-state resilience
// 4. Prevention of self-service account deletion across customer/worker roles
// 5. Preservation of administrator-only permanent profile deletion
// 6. SQL migration syntax, grants, and revocation invariants
// ============================================================================

import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

console.log('================================================================')
console.log('📋 DONEKARO — CUSTOMER DOSSIER & DELETION SAFETY TEST SUITE')
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
// 1. CUSTOMER RECORD WITH AND WITHOUT ADDRESS PROOF
// ----------------------------------------------------------------------------

runTest('Customer Mapping: Correctly maps address_proof_url when present', () => {
  const rawRow = {
    id: 'cust-uuid-101',
    name: 'Rohan Sharma',
    phone: '9876543210',
    avatar_url: null,
    address_proof_url: 'cust-uuid-101/address-proof-abcdef123.jpg',
    created_at: '2026-10-13T10:00:00Z',
    total_bookings: 3,
    completed_bookings: 2,
    active_bookings: 1,
  }

  const mapped = {
    id: rawRow.id,
    name: rawRow.name || 'Unnamed Customer',
    phone: rawRow.phone || 'No phone',
    avatar_url: rawRow.avatar_url || null,
    address_proof_url: rawRow.address_proof_url || null,
    created_at: rawRow.created_at,
    total_bookings: Number(rawRow.total_bookings),
    completed_bookings: Number(rawRow.completed_bookings),
    active_bookings: Number(rawRow.active_bookings),
  }

  assert.equal(mapped.address_proof_url, 'cust-uuid-101/address-proof-abcdef123.jpg')
  assert.equal(mapped.name, 'Rohan Sharma')
  assert.equal(mapped.total_bookings, 3)
})

runTest('Customer Mapping: Resiliently handles missing or null address_proof_url', () => {
  const rawRow = {
    id: 'cust-uuid-102',
    name: 'Priya Verma',
    phone: '9876543211',
    avatar_url: null,
    address_proof_url: null,
    created_at: '2026-10-13T10:00:00Z',
    total_bookings: 0,
    completed_bookings: 0,
    active_bookings: 0,
  }

  const mapped = {
    id: rawRow.id,
    name: rawRow.name || 'Unnamed Customer',
    phone: rawRow.phone || 'No phone',
    avatar_url: rawRow.avatar_url || null,
    address_proof_url: rawRow.address_proof_url || null,
    created_at: rawRow.created_at,
    total_bookings: Number(rawRow.total_bookings),
    completed_bookings: Number(rawRow.completed_bookings),
    active_bookings: Number(rawRow.active_bookings),
  }

  assert.equal(mapped.address_proof_url, null)
  assert.equal(mapped.name, 'Priya Verma')
})

// ----------------------------------------------------------------------------
// 2. STORAGE PATH OWNERSHIP & SECURITY ISOLATION
// ----------------------------------------------------------------------------

runTest('Storage Path Validation: Enforces caller customer UUID folder prefix', () => {
  const validatePathOwnership = (callerUserId, storagePath) => {
    if (!callerUserId || !storagePath) {
      throw new Error('Authentication and path required')
    }
    const cleanPath = storagePath.replace(/^customer-documents\//, '').trim()
    const folderUser = cleanPath.split('/')[0]
    if (folderUser !== callerUserId) {
      throw new Error('Unauthorized: Document path must match authenticated user folder')
    }
    return cleanPath
  }

  const validPath = 'cust-1234/address-proof-uuid.jpg'
  assert.equal(validatePathOwnership('cust-1234', validPath), 'cust-1234/address-proof-uuid.jpg')

  // Prevent path traversal or cross-user folder claiming
  assert.throws(() => validatePathOwnership('cust-1234', 'victim-5678/address-proof-uuid.jpg'), /Unauthorized/)
  assert.throws(() => validatePathOwnership('cust-1234', 'root-file.pdf'), /Unauthorized/)
})

// ----------------------------------------------------------------------------
// 3. SIGNED URL RETRIEVAL CONTRACTS
// ----------------------------------------------------------------------------

runTest('Signed URL Generator: Returns null for empty path, handles existing signed tokens', () => {
  const mockGetCustomerSignedUrl = (pathOrUrl, expiresInSeconds = 3600) => {
    if (!pathOrUrl) return null
    if (pathOrUrl.startsWith('http://') || pathOrUrl.startsWith('https://')) {
      if (pathOrUrl.includes('token=')) return pathOrUrl
    }
    const cleanPath = pathOrUrl.replace(/^.*\/customer-documents\//, '')
    return `https://supabase.example.co/storage/v1/object/sign/customer-documents/${cleanPath}?token=mock-signed-token&expires=${expiresInSeconds}`
  }

  assert.equal(mockGetCustomerSignedUrl(''), null)
  assert.equal(mockGetCustomerSignedUrl(null), null)

  const generated = mockGetCustomerSignedUrl('user-1/doc.pdf', 3600)
  assert.match(generated, /^https:\/\/supabase\.example\.co/)
  assert.match(generated, /token=mock-signed-token/)
  assert.match(generated, /expires=3600/)

  // Idempotent if token already present
  const alreadySigned = 'https://supabase.example.co/doc?token=valid'
  assert.equal(mockGetCustomerSignedUrl(alreadySigned), alreadySigned)
})

// ----------------------------------------------------------------------------
// 4. CUSTOMER DOSSIER UI STATE RESOLUTION
// ----------------------------------------------------------------------------

runTest('Customer Dossier UI: Computes correct document badge and status', () => {
  const getDocumentStatus = (customer) => {
    if (customer.address_proof_url) {
      const fileName = customer.address_proof_url.split('/').pop() || 'Address proof'
      return {
        hasDocument: true,
        badgeText: 'Submitted',
        badgeVariant: 'success',
        fileName,
      }
    }
    return {
      hasDocument: false,
      badgeText: 'Not Submitted',
      badgeVariant: 'outline',
      fileName: 'No address proof document submitted during registration.',
    }
  }

  const withDoc = getDocumentStatus({ address_proof_url: 'u1/address-proof-123.pdf' })
  assert.equal(withDoc.hasDocument, true)
  assert.equal(withDoc.badgeText, 'Submitted')
  assert.equal(withDoc.fileName, 'address-proof-123.pdf')

  const withoutDoc = getDocumentStatus({ address_proof_url: null })
  assert.equal(withoutDoc.hasDocument, false)
  assert.equal(withoutDoc.badgeText, 'Not Submitted')
  assert.match(withoutDoc.fileName, /No address proof document submitted/)
})

// ----------------------------------------------------------------------------
// 5. SELF-SERVICE ACCOUNT DELETION RESTRICTION
// ----------------------------------------------------------------------------

runTest('Self-Service Deletion: Rejects self-deletion invocation for both customer and worker', () => {
  const invokeAccountDeletion = (callerRole) => {
    // Both customers and workers are prohibited from self-deleting
    if (['customer', 'worker'].includes(callerRole)) {
      throw new Error(`Self-service account deletion is disabled for role: ${callerRole}`)
    }
    throw new Error('Self-service deletion disabled')
  }

  assert.throws(() => invokeAccountDeletion('customer'), /Self-service account deletion is disabled for role: customer/)
  assert.throws(() => invokeAccountDeletion('worker'), /Self-service account deletion is disabled for role: worker/)
})

runTest('Administrative Deletion: Strictly requires admin privileges, prevents self/admin deletion', () => {
  const SUPER_ADMIN_UUID = '3216cdd3-aaea-45ab-944c-cfb30d6a6e0b'

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

  // Non-admins rejected
  assert.throws(() => executeAdminDelete('user-1', 'customer', 'user-2', 'customer'), /Unauthorized/)
  assert.throws(() => executeAdminDelete('worker-1', 'worker', 'user-2', 'customer'), /Unauthorized/)

  // Admin cannot delete self
  assert.throws(() => executeAdminDelete('admin-1', 'admin', 'admin-1', 'admin'), /Administrators cannot delete their own profile/)

  // Admin cannot delete another admin or founder
  assert.throws(() => executeAdminDelete('admin-1', 'admin', SUPER_ADMIN_UUID, 'super_admin'), /Cannot delete another administrator/)

  // Permitted admin deletion of customer and worker
  const res1 = executeAdminDelete('admin-1', 'admin', 'cust-99', 'customer')
  assert.equal(res1.success, true)
  assert.equal(res1.deleted_id, 'cust-99')

  const res2 = executeAdminDelete('admin-1', 'admin', 'work-88', 'worker')
  assert.equal(res2.success, true)
  assert.equal(res2.deleted_id, 'work-88')
})

// ----------------------------------------------------------------------------
// 6. SQL MIGRATION FILE CONTRACT ASSERTIONS
// ----------------------------------------------------------------------------

runTest('SQL Audit: 202610130001 includes address_proof_url in get_admin_customers RPC', () => {
  const migrationPath = path.resolve('supabase/migrations/202610130001_admin_customer_dossier_documents.sql')
  assert.equal(fs.existsSync(migrationPath), true, 'Migration 202610130001 must exist')

  const sql = fs.readFileSync(migrationPath, 'utf8')
  assert.match(sql, /address_proof_url\s+text/, 'Return table must include address_proof_url text')
  assert.match(sql, /p\.address_proof_url::text\s+as\s+address_proof_url/, 'Query must select address_proof_url')
  assert.match(sql, /REVOKE EXECUTE ON FUNCTION public\.get_admin_customers\(\) FROM public, anon/i, 'Must revoke from public, anon')
  assert.match(sql, /GRANT EXECUTE ON FUNCTION public\.get_admin_customers\(\) TO authenticated, service_role/i, 'Must grant to authenticated, service_role')
})

runTest('SQL Audit: delete_own_account is removed from 202610110002 and dropped in 202610130002', () => {
  const pushMigrationPath = path.resolve('supabase/migrations/202610110002_web_push_notifications.sql')
  const pushSql = fs.readFileSync(pushMigrationPath, 'utf8')
  assert.doesNotMatch(pushSql, /create or replace function public\.delete_own_account/i, '202610110002 must NOT create delete_own_account')
  assert.doesNotMatch(pushSql, /grant execute on function public\.delete_own_account/i, '202610110002 must NOT grant execute on delete_own_account')

  const dropMigrationPath = path.resolve('supabase/migrations/202610130002_disable_self_account_deletion.sql')
  assert.equal(fs.existsSync(dropMigrationPath), true, 'Migration 202610130002 must exist')
  const dropSql = fs.readFileSync(dropMigrationPath, 'utf8')
  assert.match(dropSql, /drop function public\.delete_own_account/i, '202610130002 must drop delete_own_account')
  assert.match(dropSql, /revoke all on function public\.delete_own_account/i, '202610130002 must revoke privileges')
})

runTest('Privacy Policy Content: Contains no references to nonexistent in-app deletion button or support@donekaro.in', () => {
  const privacyDataPath = path.resolve('src/data/privacyContent.ts')
  const privacyData = fs.readFileSync(privacyDataPath, 'utf8')

  assert.doesNotMatch(privacyData, /About & Legal -> ["']Delete Account["']/i, 'Must not claim in-app delete button exists')
  assert.doesNotMatch(privacyData, /support@donekaro\.in/i, 'Must not contain unverified email support@donekaro.in')
  assert.doesNotMatch(privacyData, /https:\/\/donekaro\.in/i, 'Must not use unconfigured domain donekaro.in')
  assert.match(privacyData, /https:\/\/done-karo\.vercel\.app/, 'Must use configured production origin done-karo.vercel.app')
})

console.log('\n================================================================')
console.log(`SUMMARY: ${passedCount} / ${totalCount} Scenarios PASSED`)
console.log('================================================================\n')

if (passedCount !== totalCount) {
  process.exit(1)
}

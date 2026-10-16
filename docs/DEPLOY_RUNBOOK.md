# DoneKaro deployment runbook

This runbook separates read-only inspection, local edits, staging changes, production changes, website deployment, and Android release operations. Production remains blocked until the unresolved Migration 002 trust-boundary issue is redesigned and verified.

## Current release gate

`NOT READY — SECURITY OR CORRECTNESS DEFECTS REMAIN`

Migration 002 currently uses transaction-local custom GUC values as trusted-operation flags. PostgreSQL clients can call `set_config(..., true)` for custom GUCs, so an authenticated customer can set `jugnu.worker_profile_write_allowed = 'true'`. A GUC alone cannot distinguish a trusted `SECURITY DEFINER` function from a client request. Do not deploy Migration 002 until the owner supplies and approves a trusted-writer design.

The rollback for Migration 002 remains TODO until the live `public.recalculate_worker_rating()` definition and permissions are captured.

## Read-only prerequisites

1. Record `git status --short --branch` and preserve unrelated work.
2. Inspect the complete definitions of `register_worker`, `review_worker`, `submit_booking_review`, `update_worker_availability`, `recalculate_worker_rating`, and all `worker_profiles`/`reviews` triggers.
3. Run `scripts/compare_function_defs.sql` separately in the staging and production projects. It is read-only and does not assume an `inserted_at` migration-history column.
4. Capture table columns, defaults, constraints, policies, grants, function owners, security-definer settings, and trigger definitions.
5. Confirm the production project identity independently. Never use `STAGING_DATABASE_URL` for production.

## Local-only verification

These commands do not connect to a database:

```text
node --check scripts/test-db-staging.mjs
npx tsc --noEmit
npm run build
```

Record the exact exit code and raw output. A build failure caused by local process restrictions is not a passing build.

The staging harness is not a local-only test: do not run it unless a disposable staging database, a direct/session-mode connection, and the marker below are available.

## Staging prerequisites

Use a separate Supabase staging project and disposable test identities. The connection must be direct or session-mode, never the transaction pooler. The harness refuses the protected project ref and requires a PostgreSQL connection user of `postgres`.

Set the marker once on the staging database as the staging owner:

```sql
ALTER DATABASE your_staging_database SET donekaro.environment = 'staging';
```

Run the harness with one explicit stage:

```text
STAGING_DATABASE_URL=<staging-direct-or-session-url> node scripts/test-db-staging.mjs --stage=pre001
STAGING_DATABASE_URL=<staging-direct-or-session-url> node scripts/test-db-staging.mjs --stage=post001
STAGING_DATABASE_URL=<staging-direct-or-session-url> node scripts/test-db-staging.mjs --stage=post002
```

Every case is transactional and rolls back. The harness must never be pointed at production. `NOT_TESTED` does not fail the summary; `FAIL` and `UNEXPECTED_PASS` do.

## Migration 001 procedure

Before applying it, verify:

- the intended nine-argument identity exists;
- the obsolete eight-argument identity is present only when its exact removal is intended;
- no worker has more than two categories;
- the category taxonomy has the required parent groups;
- the rollback definition is the exact captured baseline, not an invented reconstruction;
- `authenticated` has execute privilege and `anon` does not.

Apply Migration 001 only in staging first, inside its transaction. Run the post-001 stage and inspect the complete output. Stop if any required case is `FAIL`, `UNEXPECTED_PASS`, or `NOT_TESTED` because of missing required evidence.

## Migration 002 procedure

Do not apply until all of the following are resolved:

- the trusted writer mechanism cannot be set by an authenticated client;
- approved workers cannot replace ID documents without an explicit re-review transition;
- review recalculation can update exactly the intended columns and always clears its authorization state;
- admin approval/rejection is verified against the live function definition and 2FA path;
- the live rating function and permissions are captured for rollback;
- all preconditions for protected, editable, audit, and default columns are confirmed.

After staging application, run `--stage=post002`, inspect all result rows, and retain the raw output with the release evidence. Do not treat a successful static check as proof of live database security.

## Frontend and storage

Deploy the frontend only after staging database compatibility and post-migration checks pass. Verify the frontend RPC parameter names against the nine-argument function. Keep `worker-documents` private, verify owner-scoped upload/read policies, and confirm upload failures cannot produce a false registration success.

Do not delete uploaded files automatically unless ownership and reference state are verified. Use disposable staging accounts for end-to-end dossier checks.

## Digital Asset Links and Android

Verify `public/.well-known/assetlinks.json` is served as JSON with HTTP 200 and is not rewritten to `index.html`. Confirm its package name against the Android application ID. Preserve existing fingerprints unless independently verified.

The Google Play app-signing SHA-256 fingerprint must come from the correct Play Console app-signing section or another authoritative owner-provided source. Do not substitute the upload-key fingerprint and do not invent a fingerprint. No Android release or signing configuration change is authorized in this runbook.

## Stop and rollback conditions

Stop immediately on any failed migration precondition, unexpected pass, missing live definition, privilege mismatch, RLS mismatch, failed required assertion, or uncertainty about production project identity. Use the matching rollback only after confirming its source definition and permissions. Migration 002 rollback is not approved while its TODO remains.

## Owner actions, in order

1. Supply the live definitions and privileges for `recalculate_worker_rating`, `guard_worker_profile_updates`, `review_worker`, and all related triggers.
2. Approve a trusted-writer design that does not rely on client-settable GUCs.
3. Run the read-only evidence script in staging and production separately.
4. Create or identify a disposable staging project and set the staging marker.
5. Run the three harness stages and retain raw output.
6. Apply migrations manually in staging only after all gates pass.
7. Verify the frontend, private document flow, and Digital Asset Links in staging.
8. Obtain a separate production approval after the security blockers are closed.

No production database change, production deployment, real-user data change, or Android release is authorized by this document.

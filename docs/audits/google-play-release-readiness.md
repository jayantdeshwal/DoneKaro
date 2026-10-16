# DoneKaro — Final Web Push Pre-Deployment Audit & Google Play Release Preparation

**Document Version**: 3.0.0  
**Audit Date**: October 11, 2026  
**Repository**: `muzaffarnagar-kaamgar` (`jayantdeshwal/DoneKaro` on `main`)  
**Android Application ID**: `com.donekaro.app` (Android TWA / Google Android Browser Helper `2.6.2`)  
**Target Production Domain**: `https://done-karo.vercel.app` (Confirmed via read-only HTTP/2, CSP, and assetlinks inspection)  
**Overall Pre-Deployment Status**: **LOCAL CODE AUDIT PASSED — HOSTED ACTIVATION STEPS REQUIRED BEFORE PRODUCTION PUSH**

---

## 1. Executive Status & Area Assessment Matrix

| Area | Status | Detailed Finding & Audit Summary |
| :--- | :---: | :--- |
| **Local Repository & Working Tree** | **PASS** | Working tree intact; all pre-existing privacy, deletion, and notification files preserved; 0 unapproved Git commits, 0 pushes. |
| **Android Wrapper & Domain Binding** | **PASS** | TWA manifest in `DoneKaro - Google Play package.zip` is 100% aligned with `hostName: 'done-karo.vercel.app'`, launchUrl `/?source=pwa`, and asset statements. |
| **Target SDK Compliance** | **PASS** | `compileSdkVersion 36`, `targetSdkVersion 36`, `minSdkVersion 24`. Exceeds Google Play API 34+ requirement. |
| **Digital Asset Links (Live)** | **PASS** | Live `https://done-karo.vercel.app/.well-known/assetlinks.json` serves `package_name: com.donekaro.app` with upload key fingerprint. Play App Signing key must be appended post-upload. |
| **Database Schema & RLS Policies** | **PASS** (Local) | `202610110002_web_push_notifications.sql` defines `push_subscriptions`, strict user RLS, `notification_push_outbox`, and `save_push_subscription` RPC. |
| **Outbox Concurrency & Atomic Claiming** | **PASS** (Local) | Implemented `claim_push_outbox_batch` with `FOR UPDATE SKIP LOCKED`, exponential retry backoff (`30s * 2^attempts`), and zombie lock reclamation. |
| **Automatic Dispatcher Invocation** | **MANUAL ACTION REQUIRED** | **CRITICAL AUDIT ITEM**: No hosted Database Webhook or pg_cron schedule exists yet in production. Exact manual dashboard/SQL setup steps are documented below. |
| **Dispatcher Authorization & Security** | **PASS** (Local) | `supabase/functions/dispatch-push/index.ts` enforces constant-time comparison on `PUSH_WEBHOOK_SECRET` or service role token. Ordinary admins/customers strictly rejected. |
| **Web Push Cryptography (RFC 8291/8292)** | **PASS** (Local) | `web-push` library with VAPID ES256, 4096-byte payload constraint, sanitized internal routes, and owner subject `mailto:jayant.deshwal.56@gmail.com`. |
| **Client Subscription Lifecycle** | **PASS** (Local) | `src/utils/pushNotification.ts` and `src/pages/Notifications.tsx` request permission only upon user click, decode VAPID public key, and sync with backend. |
| **Account Deletion & Super-Admin Protection** | **PASS** (Local) | Server RPC `delete_own_account()` cascades restricted foreign keys, anonymizes bookings, purges subscriptions/KYC, and protects founder UUID `3216cdd3-aaea-45ab-944c-cfb30d6a6e0b`. |
| **Automated Verification Suites** | **PASS** | 12/12 scenarios in `test-web-push-and-play-readiness.mjs`, 10/10 in `test-super-admin-recovery.mjs`, `tsc --noEmit` (0 errors), `npm run build` (0 errors). |
| **Physical Handset Push Verification** | **UNVERIFIED** | Real-device push delivery inherently requires deploying the Edge Function, configuring VAPID secrets, and running on an enrolled Android device. |

---

## 2. Notification Dispatch Path & Invocation Mechanism

### 2.1 Complete End-to-End Pipeline
```
1. Business Event (e.g. Booking Created / Accepted / Worker Registration)
       │
       ▼
2. Trigger on source table inserts into public.notifications
       │
       ├──► 3a. Supabase Realtime (WebSocket) ──► In-App Toast & Badges (Foreground)
       │
       └──► 3b. Trigger trg_enqueue_push_notification
                   │
                   ▼
            Checks public.push_subscriptions (is_active = true)
                   │
                   ├── If no active subscription ──► Outbox status: 'no_subscription' (0 waste)
                   │
                   └── If active subscriptions ────► Insert into public.notification_push_outbox (status: 'pending')
                                                           │
                                                           ▼
                                            [AUTOMATIC DISPATCH INVOCATION]
                                                           │
                                                           ▼
                                            Supabase Edge Function: dispatch-push
                                                           │
                                                           ▼
                                            Atomic Claim: claim_push_outbox_batch()
                                            (FOR UPDATE SKIP LOCKED, status -> 'processing')
                                                           │
                                                           ▼
                                            Lookup active push_subscriptions
                                                           │
                                                           ▼
                                            Web Push RFC 8291/8292 Encrypted Delivery
                                            (VAPID ES256, Minimal Payload, Deep Link Sanitized)
                                                           │
                                                           ▼
                                            Push Service (Google FCM / Mozilla Autopush)
                                                           │
                                                           ▼
                                            Result Recording: complete_push_outbox_item()
                                            - Success -> 'sent'
                                            - 410/404 -> 'failed' & sub.is_active = false
                                            - Transient -> 'failed' (exponential backoff)
                                                           │
                                                           ▼
                                            Android OS Notification Shade (App Closed / Background)
                                                           │
                                                           ▼
                                            Service Worker (public/sw.js)
                                            - showNotification(title, options)
                                            - notificationclick: focus client & navigate safely
```

### 2.2 The Invocation Mechanism Audit (CRITICAL FINDING)
- **Local Status**: The Edge Function (`dispatch-push/index.ts`) and database outbox queue (`notification_push_outbox`) are fully implemented and verified locally.
- **Hosted Reality**: No automatic trigger currently calls `dispatch-push` on the remote Supabase project. A queue-based design **requires** a server-side caller.
- **Why Browser Polling Is Strictly Prohibited**: The browser must NEVER be responsible for polling or privileged dispatching of global push queues. Doing so would either require exposing privileged service keys to clients or result in dropped notifications when no user is browsing the site.
- **Smallest Suitable Production Mechanism**:
  1. **Primary Event-Driven Trigger (Supabase Database Webhook)**:
     - Configured in Supabase Dashboard $\rightarrow$ **Database** $\rightarrow$ **Webhooks**.
     - Table: `public.notification_push_outbox`.
     - Event: `INSERT` (Filter: `status = 'pending'`).
     - Target: HTTP POST to `https://<PROJECT_REF>.supabase.co/functions/v1/dispatch-push`.
     - Header: `x-webhook-secret: <PUSH_WEBHOOK_SECRET>`.
  2. **Backup Scheduled Sweeper (Supabase pg_cron / Edge Function Cron)**:
     - In Supabase SQL Editor:
       ```sql
       -- Runs every minute to sweep failed retries or unprocessed items
       select cron.schedule(
         'sweep-push-outbox-every-minute',
         '* * * * *',
         $$
         select net.http_post(
           url := 'https://omoqfizkkccaewiodyef.supabase.co/functions/v1/dispatch-push',
           headers := jsonb_build_object(
             'Content-Type', 'application/json',
             'x-webhook-secret', '<PUSH_WEBHOOK_SECRET>'
           ),
           body := jsonb_build_object('limit', 20)
         );
         $$
       );
       ```
- **Operational Status**: **MANUAL ACTION REQUIRED** — Must be enabled on the Supabase Dashboard / SQL Editor as part of production activation.

---

## 3. Outbox Concurrency, Retries & Duplicate Prevention

### 3.1 Concurrency Defense (`claim_push_outbox_batch`)
- Uses PostgreSQL `FOR UPDATE SKIP LOCKED`.
- If multiple webhook triggers or cron sweeper instances fire concurrently, workers atomically lock and claim disjoint batches. Zero overlapping sends.
- Atomically transitions claimed items to `status = 'processing'` and updates `processed_at = timezone('utc', now())`.

### 3.2 Retry Semantics & Backoff
- Failed deliveries (`status = 'failed'`) are retried only after cooling down via exponential backoff:
  $$\text{Cooldown} = 30 \text{ seconds} \times 2^{\text{attempts}}$$
  - Attempt 1 failure: Retries after 60 seconds.
  - Attempt 2 failure: Retries after 120 seconds.
  - Attempt 3: Reaches `max_attempts` (3); marked permanently failed.
- Prevents rapid infinite retry loops against dead endpoints or rate-limited providers.

### 3.3 Zombie Lock Recovery
- If an Edge Function execution crashes or times out while an item is in `'processing'`, the row would otherwise remain orphaned.
- `claim_push_outbox_batch` automatically reclaims any row stuck in `'processing'` for longer than 5 minutes.

### 3.4 Invalidation of Dead Subscriptions
- If Google FCM or Mozilla returns HTTP 410 (Gone) or HTTP 404 (Not Found), `dispatch-push` marks the subscription `is_active = false`.
- Subsequent notifications for that user skip dead endpoints immediately.

---

## 4. Edge Function Authorization & Security

- **Deployment Mode**: Deployed with `--no-verify-jwt` because webhooks and cron jobs invoke it with a dedicated server-to-server secret or service role bearer token.
- **Application-Level Guard**:
  ```ts
  if (PUSH_WEBHOOK_SECRET && webhookSecret && constantTimeCompare(webhookSecret, PUSH_WEBHOOK_SECRET)) {
    isAuthorized = true
  } else if (SUPABASE_SERVICE_ROLE_KEY && bearerToken && constantTimeCompare(bearerToken, SUPABASE_SERVICE_ROLE_KEY)) {
    isAuthorized = true
  }
  ```
- **Timing Attack Defense**: Employs `constantTimeCompare` (bitwise XOR comparison) across byte arrays to prevent timing side-channel leakage.
- **Ordinary User & Admin Lockout**:
  - Ordinary clients, workers, and ordinary administrators are strictly rejected with HTTP 401 `UNAUTHORIZED_DISPATCH`.
  - Callers cannot supply custom user IDs, arbitrary notification bodies, or external redirect URLs. All dispatched data is strictly read from the authoritative database tables `public.notifications` and `public.push_subscriptions`.

---

## 5. Web Push Protocol & Cryptography (RFC 8291 / 8292)

- **Library**: `web-push@3.6.7` (Deno npm specifier).
- **VAPID Claims**:
  - `aud`: Extracted origin of the push endpoint (e.g. `https://fcm.googleapis.com`).
  - `exp`: Current Unix timestamp + 12 hours.
  - `sub`: `mailto:jayant.deshwal.56@gmail.com` (Verified project founder email; replaces the unpurchased placeholder domain `support@donekaro.in`).
- **Encryption Framing**:
  - Content-Encoding: `aes128gcm` with ECDH key agreement using client `p256dh` public key and fresh ephemeral server key pair.
  - Payload size strictly bounded under RFC 8291 limit (4096 bytes). Actual DoneKaro transactional payloads are ~180–300 bytes.
- **Deep Link Sanitization**:
  - All URLs are verified as internal relative paths (`/bookings#booking-{id}`, `/worker/dashboard#booking-{id}`, `/admin?tab=workers`).
  - External and protocol-relative URLs (`//evil.com`, `javascript:`) are filtered to `/`.

---

## 6. Database Migration & Security Review (`202610110002`)

### 6.1 Schema & Table Grants
- `public.push_subscriptions`:
  - RLS strictly enforces `auth.uid() = user_id` for `SELECT`, `INSERT`, `UPDATE`, and `DELETE`.
  - Endpoint unique constraint guarantees 1 subscription row per physical browser profile.
- `public.notification_push_outbox`:
  - RLS grants read access only to `service_role` and platform administrators.
  - Direct insert/update from client anon/authenticated roles is completely blocked.
- Functions:
  - `save_push_subscription`: `SECURITY DEFINER`, granted to `authenticated` and `service_role`.
  - `remove_push_subscription`: `SECURITY DEFINER`, granted to `authenticated` and `service_role`.
  - `claim_push_outbox_batch`: `SECURITY DEFINER`, granted **strictly** to `service_role`.
  - `complete_push_outbox_item`: `SECURITY DEFINER`, granted **strictly** to `service_role`.

### 6.2 Account Deletion RPC (`delete_own_account`)
- **Google Play Compliance**: Implements the mandated user-initiated data and account deletion requirement.
- **Founder & Admin Immutability Guard**:
  ```sql
  if v_caller_id = v_super_admin_uuid or v_role in ('super_admin', 'admin', 'sub_admin') then
    raise exception 'Action prohibited: Administrative and founder accounts cannot be deleted via self-service.';
  end if;
  ```
- **Foreign Key Cascading & Ledger Preservation**:
  - Cascades `push_subscriptions`, `notification_push_outbox`, `notifications`, `reviews`, `complaints`, `booking_quotes`, and `worker_profiles`.
  - Anonymizes `public.bookings` (`customer_phone = '0000000000'`, `address = 'DELETED ACCOUNT'`, `notes = null`) to satisfy financial/tax retention while purging all PII.
  - Deletes user objects in `storage.objects` (KYC documents).
  - Deletes core profile row in `public.profiles` and auth record in `auth.users`.

---

## 7. Client Subscription Lifecycle

- **User Action Triggered**: Notification permission is requested exclusively when the user interacts with the "Enable Notifications" button in [src/pages/Notifications.tsx](file:///c:/Users/Vaishali%20Deshwal/Documents/Default%20Project/muzaffarnagar-kaamgar/src/pages/Notifications.tsx). Never on passive page load.
- **Graceful Unsupported Fallback**: Environments lacking `serviceWorker` or `PushManager` display friendly guidance without console crashes.
- **VAPID Public Key Handling**:
  - Decoded from URL-safe Base64 to `Uint8Array` via `urlBase64ToUint8Array()`.
  - Cast as `BufferSource` for clean TypeScript compilation.
  - Graceful fallback if `VITE_VAPID_PUBLIC_KEY` is not yet configured.
- **Deduplication & Account Switching**:
  - If a device is already subscribed and logs into Account B, `save_push_subscription()` updates `user_id = Account B`. Old notifications from Account A will never arrive on Account B.
- **Bilingual Guidance**: Status guidance clearly explains permission states in both Hindi and English.

---

## 8. Service Worker & Android TWA Alignment

- **Established Domain**: `https://done-karo.vercel.app` (Preserved; no domain changes).
- **Established Package**: `com.donekaro.app` (Preserved).
- **Service Worker (`public/sw.js`)**:
  - Defensive `event.data.json()` parsing with fallback to plain text.
  - Groups notifications using `tag: 'donekaro-' + notificationId` to prevent duplicate alert stacking.
  - `notificationclick` searches for existing client windows on the origin:
    - If found, focuses window and calls `client.navigate(targetUrl)`.
    - If none open, calls `clients.openWindow(targetUrl)`.
- **Digital Asset Links**:
  - Upload key fingerprint is live.
  - Google Play App Signing fingerprint must be added after initial Play Console internal testing upload.

---

## 9. Automated Verification Matrix

| Test Suite / Check | Command Executed | Result | Details |
| :--- | :--- | :---: | :--- |
| **Web Push & Play Readiness Suite** | `node scripts/test-web-push-and-play-readiness.mjs` | **12 / 12 PASSED** | Validates endpoint validation, identity anchoring, deduplication, unauthenticated dispatcher rejection, admin JWT rejection, outbox atomic claiming (FOR UPDATE SKIP LOCKED), retry backoff & zombie reclamation, VAPID claims, payload size bounds, 410 cleanup, URL sanitization, and admin self-deletion prevention. |
| **Super-Admin Regression Suite** | `node scripts/test-super-admin-recovery.mjs` | **10 / 10 PASSED** | Validates founder UUID resolution, admin routing, async race guard, session refresh, and user metadata spoofing prevention. |
| **TypeScript Validation** | `npx tsc --noEmit` | **0 ERRORS** | Full compilation across all TypeScript source files. |
| **Production Web Build** | `npm run build` | **0 ERRORS** | Vite compiled 2,230 modules in 7.49s with clean chunk splitting. |

---

## 10. Required Production Configuration (No Secrets Displayed)

To activate Web Push in production, the following environment variables and secrets must be configured:

### Frontend (Vercel Environment Variables)
| Variable Name | Environment | Description |
| :--- | :--- | :--- |
| `VITE_VAPID_PUBLIC_KEY` | Production / Preview | URL-safe base64 public key generated by web-push. |

### Backend (Supabase Edge Function Secrets)
| Secret Name | Scope | Description |
| :--- | :--- | :--- |
| `VAPID_PUBLIC_KEY` | `dispatch-push` | URL-safe base64 public key. |
| `VAPID_PRIVATE_KEY` | `dispatch-push` | URL-safe base64 private key. |
| `VAPID_SUBJECT` | `dispatch-push` | `mailto:jayant.deshwal.56@gmail.com` |
| `PUSH_WEBHOOK_SECRET` | `dispatch-push` | Random 32+ character shared secret for webhook authorization. |

---

## 11. Remaining Setup & Production Activation Steps

### Step 1: Generate VAPID Key Pair
Run locally in terminal:
```bash
npx web-push generate-vapid-keys
```
Save the generated Public Key and Private Key securely.

### Step 2: Configure Environment Variables
1. In Vercel Project Settings $\rightarrow$ Environment Variables:
   - Add `VITE_VAPID_PUBLIC_KEY` with the generated public key.
2. In Supabase CLI (or Supabase Dashboard $\rightarrow$ Edge Functions $\rightarrow$ Secrets):
   ```bash
   npx supabase secrets set VAPID_PUBLIC_KEY="<PUBLIC_KEY>" VAPID_PRIVATE_KEY="<PRIVATE_KEY>" VAPID_SUBJECT="mailto:jayant.deshwal.56@gmail.com" PUSH_WEBHOOK_SECRET="<RANDOM_SHARED_SECRET>"
   ```

### Step 3: Apply Database Migration
Apply the audited migration to the remote project:
```bash
npx supabase db push
```

### Step 4: Deploy Edge Function
Deploy `dispatch-push` to Supabase:
```bash
npx supabase functions deploy dispatch-push --no-verify-jwt
```

### Step 5: Configure Automatic Outbox Trigger (Database Webhook)
In Supabase Dashboard:
1. Navigate to **Database** $\rightarrow$ **Webhooks** $\rightarrow$ **Create a webhook**.
2. Name: `trigger-dispatch-push`.
3. Table: `notification_push_outbox`.
4. Events: Check `Insert`.
5. HTTP Request:
   - Method: `POST`
   - URL: `https://omoqfizkkccaewiodyef.supabase.co/functions/v1/dispatch-push`
   - HTTP Headers:
     - `Content-Type`: `application/json`
     - `x-webhook-secret`: `<YOUR_PUSH_WEBHOOK_SECRET>`

### Step 6: Deploy Web Application to Vercel
Push the verified changes to GitHub (`main`) to trigger Vercel deployment.

### Step 7: Google Play Console Release & Asset Links Update
1. Upload `app-release-signed.aab` from `Downloads/DoneKaro - Google Play package.zip` to Google Play Console (Internal testing track).
2. Under **Release** $\rightarrow$ **Setup** $\rightarrow$ **App Integrity**, copy the **SHA-256 certificate fingerprint** of the Google Play App Signing key.
3. Update `public/.well-known/assetlinks.json` by adding the Play App Signing fingerprint alongside the upload key fingerprint:
   ```json
   "sha256_cert_fingerprints": [
     "DE:A9:95:DD:05:75:CC:38:79:FC:F0:79:21:EB:51:59:68:15:5E:D0:AB:45:53:EA:67:A3:39:1C:31:F8:E2:D3",
     "<PASTE_GOOGLE_PLAY_APP_SIGNING_SHA256_HERE>"
   ]
   ```
4. Commit and redeploy `assetlinks.json` to Vercel.

---

## 12. Real-Device Acceptance Test Checklist (Post-Internal-Release)

Execute the following test protocol on a physical Android phone with the app installed via Google Play Internal Testing:

- [ ] **1. Standalone Fullscreen**: App opens without Chrome URL bar or browser navigation controls.
- [ ] **2. Explicit Permission Dialog**: In Notifications page, tapping "Enable Notifications" triggers the native Android 13+ system permission prompt.
- [ ] **3. Backend Subscription Persistence**: Verifying that confirming permission inserts a record into `public.push_subscriptions` linked to caller's `user_id`.
- [ ] **4. Foreground Toast Delivery**: Triggering an event while using the app displays an in-app banner.
- [ ] **5. Background Delivery (App Minimized)**: Minimizing the app and triggering a booking update produces an Android notification in the system shade within 10 seconds.
- [ ] **6. Screen-Locked Delivery**: Locking the phone screen and triggering an event wakes the lock screen with a DoneKaro notification.
- [ ] **7. Safe Deep Link Navigation**: Tapping the background notification opens DoneKaro directly at the target booking (`/bookings#booking-{id}`).
- [ ] **8. Multi-Account Isolation**: Logging out and logging in as another user transfers the endpoint so notifications only route to the logged-in user.
- [ ] **9. Permission Revocation Detection**: Disabling notification permission in Android App Info causes DoneKaro to display system settings recovery instructions upon relaunch.
- [ ] **10. Account Deletion Execution**: In Profile, entering `DELETE` purges the account, clears push subscriptions, anonymizes past bookings, and redirects to `/login`.

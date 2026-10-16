// Supabase Edge Function: dispatch-push
// Dispatches Web Push notifications using VAPID and RFC 8291/8292 Web Push protocol
// Uses atomic queue claiming (FOR UPDATE SKIP LOCKED) and strict server-to-server authorization

declare const Deno: {
  env: {
    get(key: string): string | undefined
  }
}

// @ts-ignore - Deno imports resolved at runtime by Supabase Edge Functions
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
// @ts-ignore
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.7'
// @ts-ignore
import webpush from 'npm:web-push@3.6.7'
import { getCorsHeaders, handleCors } from '../_shared/cors.ts'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || ''
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
const VAPID_PUBLIC_KEY = Deno.env.get('VAPID_PUBLIC_KEY') || ''
const VAPID_PRIVATE_KEY = Deno.env.get('VAPID_PRIVATE_KEY') || ''
// VAPID subject: RFC 8292 requires mailto: or https: contact identity
const VAPID_SUBJECT = Deno.env.get('VAPID_SUBJECT') || 'mailto:jayant.deshwal.56@gmail.com'
const PUSH_WEBHOOK_SECRET = Deno.env.get('PUSH_WEBHOOK_SECRET') || ''

// Initialize VAPID details if keys are present
if (VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY) {
  try {
    webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY)
  } catch (err) {
    console.warn('VAPID initialization error:', err)
  }
}

/**
 * Constant-time string comparison to prevent timing attacks on shared secrets.
 */
function constantTimeCompare(a: string, b: string): boolean {
  if (typeof a !== 'string' || typeof b !== 'string' || a.length === 0 || b.length === 0) {
    return false
  }
  const enc = new TextEncoder()
  const aBuf = enc.encode(a)
  const bBuf = enc.encode(b)
  if (aBuf.byteLength !== bBuf.byteLength) {
    return false
  }
  let mismatch = 0
  for (let i = 0; i < aBuf.byteLength; i++) {
    mismatch |= aBuf[i] ^ bBuf[i]
  }
  return mismatch === 0
}

/**
 * Resolves safe internal route path based on notification type and booking ID.
 * Strictly prevents open-redirect vulnerabilities.
 */
function resolveSafeDestinationUrl(notificationType: string, bookingId?: string | null): string {
  if (bookingId && typeof bookingId === 'string') {
    const cleanId = encodeURIComponent(bookingId)
    if (notificationType === 'booking_created') {
      return `/worker/dashboard#booking-${cleanId}`
    }
    return `/bookings#booking-${cleanId}`
  }

  if (notificationType && notificationType.includes('quote')) {
    return '/bookings#quote-requests'
  }

  if (notificationType === 'worker_registration_submitted') {
    return '/admin?tab=workers'
  }

  if (notificationType === 'profile_approved' || notificationType === 'profile_rejected') {
    return '/worker/dashboard'
  }

  return '/notifications'
}

serve(async (req: Request) => {
  const additionalAllowedHeaders = ['x-webhook-secret']
  const corsResponse = handleCors(req, additionalAllowedHeaders)
  if (corsResponse) return corsResponse
  const corsHeaders = getCorsHeaders(req, additionalAllowedHeaders)

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method Not Allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  try {
    // 1. Strict Server-to-Server Authorization Check
    const authHeader = req.headers.get('Authorization') || ''
    const webhookSecret = req.headers.get('x-webhook-secret') || ''
    const bearerToken = authHeader.replace(/^Bearer\s+/i, '').trim()

    let isAuthorized = false

    // Method A: Dedicated Webhook Secret (Database Webhook / Event Trigger)
    if (PUSH_WEBHOOK_SECRET && webhookSecret && constantTimeCompare(webhookSecret, PUSH_WEBHOOK_SECRET)) {
      isAuthorized = true
    }
    // Method B: Supabase Service Role Key (Cron / Server Background Task)
    else if (
      SUPABASE_SERVICE_ROLE_KEY &&
      bearerToken &&
      constantTimeCompare(bearerToken, SUPABASE_SERVICE_ROLE_KEY)
    ) {
      isAuthorized = true
    }

    // STRICT DEFENSE: Reject all unauthenticated callers, client JWTs, ordinary admins, and customers.
    // Global push queue dispatching is an automated, privileged server-to-server task.
    if (!isAuthorized) {
      return new Response(
        JSON.stringify({
          error: 'Unauthorized: Privileged server-to-server credentials required.',
          code: 'UNAUTHORIZED_DISPATCH',
        }),
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    // 2. Verify VAPID Key Availability
    if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) {
      return new Response(
        JSON.stringify({
          error: 'VAPID keys not configured on Edge Function environment',
          code: 'VAPID_UNCONFIGURED',
        }),
        {
          status: 503,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    const serviceClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
    const body = await req.json().catch(() => ({}))
    const limit = Math.min(Math.max(Number(body.limit) || 20, 1), 50)

    // 3. Atomic Outbox Queue Claiming via FOR UPDATE SKIP LOCKED RPC
    const { data: claimedItems, error: claimErr } = await serviceClient.rpc(
      'claim_push_outbox_batch',
      { p_batch_size: limit }
    )

    if (claimErr) {
      console.error('Failed to claim outbox batch:', claimErr.message)
      return new Response(JSON.stringify({ error: 'Outbox claim failure' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    if (!claimedItems || claimedItems.length === 0) {
      return new Response(
        JSON.stringify({ message: 'No pending push notifications to dispatch', count: 0 }),
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    const dispatchResults: Array<{
      outbox_id: string
      notification_id: string
      status: string
      delivered: number
      failed: number
    }> = []

    // 4. Process Each Claimed Item
    for (const item of claimedItems) {
      // Lookup active subscriptions for recipient
      const { data: subscriptions, error: subsErr } = await serviceClient
        .from('push_subscriptions')
        .select('id, endpoint, p256dh, auth, locale')
        .eq('user_id', item.user_id)
        .eq('is_active', true)

      if (subsErr || !subscriptions || subscriptions.length === 0) {
        // No active devices registered for this user
        await serviceClient.rpc('complete_push_outbox_item', {
          p_outbox_id: item.outbox_id,
          p_status: 'no_subscription',
        })
        dispatchResults.push({
          outbox_id: item.outbox_id,
          notification_id: item.notification_id,
          status: 'no_subscription',
          delivered: 0,
          failed: 0,
        })
        continue
      }

      const safeUrl = resolveSafeDestinationUrl(item.notification_type, item.booking_id)

      let deliveredCount = 0
      let failedCount = 0
      let lastErrorMessage = ''

      // Dispatch to each registered device
      for (const sub of subscriptions) {
        const pushPayload = JSON.stringify({
          title: item.title || 'DoneKaro',
          body: item.body || 'New update available!',
          url: safeUrl,
          tag: `donekaro-${item.notification_id}`,
          notificationId: item.notification_id,
        })

        const pushSubscription = {
          endpoint: sub.endpoint,
          keys: {
            p256dh: sub.p256dh,
            auth: sub.auth,
          },
        }

        try {
          await webpush.sendNotification(pushSubscription, pushPayload, {
            TTL: 86400,
            urgency: 'high',
          })
          deliveredCount++

          // Update subscription last used timestamp
          await serviceClient
            .from('push_subscriptions')
            .update({ last_used_at: new Date().toISOString() })
            .eq('id', sub.id)
        } catch (err: any) {
          failedCount++
          lastErrorMessage = err?.statusCode ? `HTTP ${err.statusCode}` : err?.message || 'Delivery error'

          // Invalidate expired/unregistered subscriptions (HTTP 410 Gone or 404 Not Found)
          if (err?.statusCode === 410 || err?.statusCode === 404) {
            await serviceClient
              .from('push_subscriptions')
              .update({ is_active: false })
              .eq('id', sub.id)
          }
        }
      }

      // Record atomic outbox completion
      const finalStatus = deliveredCount > 0 ? 'sent' : failedCount > 0 ? 'failed' : 'no_subscription'
      await serviceClient.rpc('complete_push_outbox_item', {
        p_outbox_id: item.outbox_id,
        p_status: finalStatus,
        p_last_error: finalStatus === 'failed' ? lastErrorMessage : null,
      })

      dispatchResults.push({
        outbox_id: item.outbox_id,
        notification_id: item.notification_id,
        status: finalStatus,
        delivered: deliveredCount,
        failed: failedCount,
      })
    }

    return new Response(JSON.stringify({ success: true, count: dispatchResults.length, results: dispatchResults }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (err: any) {
    console.error('Fatal push dispatch failure:', err?.message || 'Unknown error')
    return new Response(JSON.stringify({ error: 'Internal dispatch error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})

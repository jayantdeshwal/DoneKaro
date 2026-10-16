// Supabase Edge Function: chat-ai
// Secure server-side Groq inference proxy with Supabase JWT authentication
// Enforces 4-tier truth boundary, role-based persona access, and server-side secret protection

// Ambient Deno type declaration for IDE compatibility
declare const Deno: {
  env: {
    get(key: string): string | undefined
  }
}

// @ts-ignore - Deno remote URL imports are resolved at runtime by Supabase Edge Functions
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
// @ts-ignore
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.7'
import { getCorsHeaders, handleCors } from '../_shared/cors.ts'

// Sanitize raw secret by trimming whitespace and stripping surrounding shell quotes if present
const rawKey = Deno.env.get('GROQ_API_KEY') || ''
const GROQ_API_KEY = rawKey.replace(/^["']|["']$/g, '').trim()
const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions'
const PRIMARY_GROQ_MODEL = 'openai/gpt-oss-20b'
const FALLBACK_GROQ_MODEL = 'openai/gpt-oss-120b'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || ''
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY') || ''
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''

const ALLOWED_PERSONAS = ['customer_booking', 'worker_sarathi'] as const
type AssistantPersona = typeof ALLOWED_PERSONAS[number]

const BASE_GROUNDING_INSTRUCTION = `You are the official AI Support assistant for DoneKaro, the hyper-local home services platform operating in Muzaffarnagar, Uttar Pradesh (PIN codes 251001 and 251002).

STRICT TRUTH BOUNDARY (MANDATORY):
1. TIER 1 - AUTHORITATIVE APPLICATION DATA:
   - When an 'AUTHORITATIVE APPLICATION DATA' block is present in the prompt, treat it as verified ground truth directly from the database under the caller's authorized session.
   - Use the exact amounts, status, and receipt numbers from this block.
   - If no live data block is present, explicitly guide the user to check their 'My Bookings' or 'Worker Dashboard' tab.
   - NEVER fabricate booking IDs, quote amounts, worker names, arrival times, or payment receipts.
2. TIER 2 - VERIFIED DONEKARO RULES:
   - DoneKaro is a quote-first marketplace: providers submit quotes, customer reviews and accepts.
   - Additional work on-site requires a change request in the app with customer approval before payment.
   - Payments are made directly in Cash to the artisan upon work completion and verification.
3. TIER 3 - GENERAL GUIDANCE:
   - Provide safe, practical home troubleshooting and communication guidance.
4. TIER 4 - UNKNOWN / UNAVAILABLE:
   - Live worker location or transit ETA is UNAVAILABLE (DoneKaro does NOT track artisan real-time GPS locations).
   - If information is not in the live data block, explicitly state it. NEVER guess or promise.

NO-HALLUCINATION ENFORCEMENT:
- NEVER promise arrival times (e.g. NEVER say "worker arriving in 15 minutes" or "10 seconds"). Advise the customer to contact the assigned artisan using the Call Artisan or WhatsApp button on their active booking card in My Bookings.
- NEVER state that a payment is completed or a receipt generated if payment status is unpaid or pending.
- NEVER state that a complaint, ticket, or refund has been filed or resolved. AI Support is read-only.
- NEVER state that you have cancelled a booking.
- NEVER invent phone numbers. DoneKaro platform support phone calls are disabled; support is managed in-app. Users may contact their assigned artisan directly via the Call Artisan option on their booking card.`

const SYSTEM_PROMPTS: Record<AssistantPersona, string> = {
  customer_booking: `${BASE_GROUNDING_INSTRUCTION}

MODE: BOOKING HELP (बुकिंग सहायता)
Your mission:
1. Help citizens of Muzaffarnagar diagnose household issues (electricity, plumbing, AC repair, cleaning, salon, carpentry, painting).
2. Recommend the exact trade service needed and explain how to submit a request.
3. Explain the quote marketplace: artisans submit quotes, customer reviews and chooses, up to 2 providers compete in active slot.
4. Transparent pricing: DoneKaro does not set fixed prices; artisans provide quotes based on the work required.
5. Answer politely and concisely, first in English and then in Hindi.`,

  worker_sarathi: `${BASE_GROUNDING_INSTRUCTION}

MODE: WORK ADVICE (काम व सेवा सलाह)
Your mission:
1. Support local artisans with practical business, quoting, and customer service advice.
2. QUOTING: Advise workers to quote accurately, promptly, and transparently based on diagnostics and labor.
3. EXTRA CHARGES: Remind workers to discuss extra work with customers and submit a change request in the app for approval before doing extra work.
4. COMPLETION: Jobs must be marked complete only after the customer verifies the repair. 100% of customer payment is paid directly in Cash.
5. TEMPLATES: Provide polite Hindi WhatsApp message templates when requested.
6. Speak with respect and encouragement in warm, clear language.`,
}

interface ChatHistoryItem {
  sender: 'user' | 'assistant'
  textEn?: string
  textHi?: string
}

interface RequestBody {
  query: string
  persona: AssistantPersona
  conversationHistory?: ChatHistoryItem[]
  bookingHintId?: string
}

interface EdgeLiveContextResult {
  promptText: string
  hasPrimaryBooking: boolean
  isPaid: boolean
  finalPayableAmount: number | null
  paymentStatus: string | null
}

function classifyQueryIntent(queryText?: string): string {
  if (!queryText) return 'general'
  const q = queryText.toLowerCase()
  if (q.includes('receipt') || q.includes('bill') || q.includes('invoice') || q.includes('रसीद') || q.includes('बिल')) {
    return 'receipt'
  }
  if (
    q.includes('complaint') ||
    q.includes('complain') ||
    q.includes('issue') ||
    q.includes('problem') ||
    q.includes('dispute') ||
    q.includes('overcharge') ||
    q.includes('bad') ||
    q.includes('ticket') ||
    q.includes('escalat') ||
    q.includes('शिकायत') ||
    q.includes('समस्या') ||
    q.includes('विवाद') ||
    q.includes('खराब')
  ) {
    return 'complaint'
  }
  if (q.includes('pay') || q.includes('charge') || q.includes('price') || q.includes('money') || q.includes('cost') || q.includes('extra') || q.includes('quote') || q.includes('पैसे') || q.includes('चार्ज') || q.includes('भुगतान') || q.includes('रेट') || q.includes('कोट')) {
    return 'payment'
  }
  if (q.includes('where') || q.includes('late') || q.includes('delay') || q.includes('arrive') || q.includes('reach') || q.includes('location') || q.includes('कहाँ') || q.includes('देरी') || q.includes('लेट') || q.includes('आगमन') || q.includes('आएगा')) {
    return 'worker_arrival'
  }
  if (q.includes('cancel') || q.includes('रद्द')) {
    return 'cancellation'
  }
  if (q.includes('history') || q.includes('past') || q.includes('last') || q.includes('previous') || q.includes('review') || q.includes('रेटिंग') || q.includes('पिछला') || q.includes('समीक्षा')) {
    return 'review_history'
  }
  if (q.includes('status') || q.includes('active') || q.includes('track') || q.includes('booking') || q.includes('स्थिति') || q.includes('बुकिंग')) {
    return 'status'
  }
  return 'general'
}

async function fetchEdgeLiveContext(
  supabase: any,
  callerId: string,
  callerRole: string,
  bookingHintId?: string,
  queryText?: string
): Promise<EdgeLiveContextResult> {
  const isWorker = callerRole === 'worker'
  const queryIntent = classifyQueryIntent(queryText)
  let primaryBooking: any = null
  let recentPastBooking: any = null
  let activeBookings: any[] = []
  let resolutionReason: 'hint_match' | 'single_active' | 'multiple_active' | 'post_service_history' | 'no_relevant_booking' = 'no_relevant_booking'

  try {
    // 1. If booking hint is provided, try authorized lookup under caller's RLS
    if (bookingHintId && typeof bookingHintId === 'string' && bookingHintId.trim().length > 10) {
      let hintQuery = supabase
        .from('bookings')
        .select('id, category_id, status, scheduled_at, notes, customer_id, worker_id, created_at')
        .eq('id', bookingHintId.trim())

      if (isWorker) {
        hintQuery = hintQuery.eq('worker_id', callerId)
      } else {
        hintQuery = hintQuery.eq('customer_id', callerId)
      }

      const { data: hintRes } = await hintQuery.maybeSingle()
      if (hintRes) {
        primaryBooking = hintRes
        resolutionReason = 'hint_match'
      }
    }

    // 2. Query active bookings
    const activeStatuses = isWorker
      ? ['accepted', 'in_progress', 'payment_pending']
      : ['pending', 'accepted', 'in_progress', 'payment_pending']

    let activeQuery = supabase
      .from('bookings')
      .select('id, category_id, status, scheduled_at, notes, customer_id, worker_id, created_at')
      .in('status', activeStatuses)
      .order('created_at', { ascending: false })
      .limit(5)

    if (isWorker) {
      activeQuery = activeQuery.eq('worker_id', callerId)
    } else {
      activeQuery = activeQuery.eq('customer_id', callerId)
    }

    const { data: activeList } = await activeQuery
    activeBookings = activeList || []

    if (!primaryBooking) {
      if (activeBookings.length === 1) {
        primaryBooking = activeBookings[0]
        resolutionReason = 'single_active'
      } else if (activeBookings.length > 1) {
        // Check if user specifically mentioned one category
        const qLower = (queryText || '').toLowerCase()
        const matchingActive = activeBookings.filter(b => {
          const catId = (b.category_id || '').toLowerCase()
          return qLower.includes(catId) || qLower.includes(catId.replace(/_/g, ' '))
        })

        if (matchingActive.length === 1) {
          primaryBooking = matchingActive[0]
          resolutionReason = 'single_active'
        } else {
          // Multiple active bookings: ambiguity. Do not arbitrarily choose one.
          primaryBooking = null
          resolutionReason = 'multiple_active'
        }
      } else {
        // 0 active bookings. Query most recent past booking.
        let recentQuery = supabase
          .from('bookings')
          .select('id, category_id, status, scheduled_at, notes, customer_id, worker_id, created_at')
          .order('created_at', { ascending: false })
          .limit(1)

        if (isWorker) {
          recentQuery = recentQuery.eq('worker_id', callerId)
        } else {
          recentQuery = recentQuery.eq('customer_id', callerId)
        }

        const { data: recentList } = await recentQuery
        if (recentList && recentList.length > 0) {
          recentPastBooking = recentList[0]

          // Strictly conditional: only promote to primary if query is explicitly post-service
          const isPostServiceQuery =
            queryIntent === 'receipt' ||
            queryIntent === 'review_history' ||
            queryIntent === 'complaint' ||
            (queryIntent === 'payment' && (
              (queryText || '').toLowerCase().includes('last') ||
              (queryText || '').toLowerCase().includes('previous') ||
              (queryText || '').toLowerCase().includes('paid') ||
              (queryText || '').toLowerCase().includes('पिछला') ||
              (queryText || '').toLowerCase().includes('रसीद')
            ))

          if (isPostServiceQuery) {
            primaryBooking = recentPastBooking
            resolutionReason = 'post_service_history'
          } else {
            primaryBooking = null
            resolutionReason = 'no_relevant_booking'
          }
        } else {
          primaryBooking = null
          resolutionReason = 'no_relevant_booking'
        }
      }
    }

    const lines: string[] = ['### AUTHORITATIVE APPLICATION DATA (TIER 1 - GROUND TRUTH):']
    lines.push(`Caller Role: ${callerRole.toUpperCase()}`)
    lines.push(`Context Mode: ${resolutionReason.toUpperCase()}`)

    let isPaid = false
    let finalPayableAmount: number | null = null
    let paymentStatus: string | null = null

    if (primaryBooking) {
      const bId = primaryBooking.id
      const [payRes, crRes, counterpartyRes, compRes] = await Promise.all([
        supabase.rpc('get_booking_payment_summary', { target_booking_id: bId }),
        supabase.from('booking_change_requests').select('id, amount, status, reason').eq('booking_id', bId),
        isWorker
          ? supabase.from('profiles').select('full_name').eq('id', primaryBooking.customer_id).maybeSingle()
          : supabase.from('approved_worker_directory').select('name').eq('id', primaryBooking.worker_id).maybeSingle(),
        supabase.from('complaints').select('id, status, created_at, reason').eq('booking_id', bId).eq('opened_by', callerId).order('created_at', { ascending: false }).limit(1).maybeSingle(),
      ])

      const payData = (payRes.data && payRes.data.length > 0) ? payRes.data[0] : null
      const changeRequests = (crRes.data || []) as any[]
      const pendingCRs = changeRequests.filter((cr: any) => cr.status === 'pending')
      const pendingCount = pendingCRs.length
      const pendingAmount = pendingCRs.reduce((sum: number, cr: any) => sum + (Number(cr.amount) || 0), 0)

      let counterpartyName = isWorker
        ? (counterpartyRes.data?.full_name ? String(counterpartyRes.data.full_name).split(' ')[0] + ' (Customer)' : 'Customer')
        : (counterpartyRes.data?.name || 'Assigned Artisan')

      paymentStatus = payData?.payment_status || 'unpaid'
      isPaid = paymentStatus === 'paid'
      finalPayableAmount = payData ? Number(payData.final_payable_amount) : null

      const tradeName = String(primaryBooking.category_id || 'Home Service').replace(/_/g, ' ')

      lines.push(`[Active Booking ID]: ${bId}`)
      lines.push(`[Service]: ${tradeName}`)
      lines.push(`[Booking Status]: ${primaryBooking.status}`)
      lines.push(`[Scheduled Appointment Slot]: ${primaryBooking.scheduled_at || 'Flexible'} *(Scheduled slot only; NOT a live transit ETA)*`)
      lines.push(`[${isWorker ? 'Customer' : 'Assigned Artisan'}]: ${counterpartyName}`)

      if (payData?.initial_quote_amount !== undefined && payData.initial_quote_amount !== null) {
        lines.push(`[Initial Quote Amount]: ₹${Number(payData.initial_quote_amount).toFixed(2)}`)
      }
      if (payData?.approved_additional_amount && Number(payData.approved_additional_amount) > 0) {
        lines.push(`[Approved Additional Charges]: ₹${Number(payData.approved_additional_amount).toFixed(2)}`)
      }
      if (pendingCount > 0) {
        lines.push(`[Pending Change Requests]: ${pendingCount} request(s) totaling ₹${pendingAmount.toFixed(2)} (Awaiting Customer Approval in App)`)
      }
      if (finalPayableAmount !== null) {
        lines.push(`[Final Payable Amount]: ₹${finalPayableAmount.toFixed(2)}`)
      }
      lines.push(`[Payment Status]: ${paymentStatus.toUpperCase()}`)
      lines.push(`[Payment Method]: ${payData?.payment_method || 'Cash'}`)
      if (payData?.receipt_number) {
        lines.push(`[Receipt Number]: ${payData.receipt_number}`)
      } else {
        lines.push(`[Receipt Number]: NONE (Receipt will generate after cash payment is confirmed upon completion)`)
      }

      if (compRes?.data) {
        lines.push(`[Authoritative Support Complaint]: Reference #CMP-${compRes.data.id.slice(0, 8).toUpperCase()} | Status: ${String(compRes.data.status).toUpperCase()} | Reason: "${compRes.data.reason}"`)
        lines.push(`INSTRUCTION: Inform the user that an official support request is already on record with status ${String(compRes.data.status).toUpperCase()}. Complaints are reviewed by the administration team and are NOT automatically escalated. AI Support cannot modify complaints. Recommend viewing Support History.`)
      } else {
        lines.push(`[Support Complaint Status]: No complaint currently filed on this booking by caller.`)
        lines.push(`INSTRUCTION: If user asks to file a complaint or report an issue with this booking, empathize, explain that AI cannot directly file complaints, and advise them to use the confirmation flow (action: CREATE_SUPPORT_REQUEST). Do NOT claim you have filed, created, or escalated a complaint.`)
      }
    } else if (resolutionReason === 'multiple_active') {
      lines.push(`[Ambiguity Notice]: User has ${activeBookings.length} active bookings:`)
      activeBookings.forEach((ab, idx) => {
        lines.push(`  ${idx + 1}. ID: ${ab.id.slice(0, 8)}... | ${ab.category_id} | Status: ${ab.status}`)
      })
      lines.push(`INSTRUCTION: DO NOT guess which booking the user is asking about. List the active services and politely ask the user to clarify which service they are asking about.`)
    } else {
      lines.push('[Booking Context]: No active booking found.')
      lines.push('INSTRUCTION: If user asks about active booking status or arrival, state clearly that they have no active booking and guide them to Browse Categories.')
      if (recentPastBooking) {
        lines.push(`[Most Recent Past Service Reference]: ${recentPastBooking.category_id} (${recentPastBooking.status}) - Only refer to this if user explicitly asks about their previous completed service.`)
      }
    }

    // Telemetry and contact boundaries
    lines.push(`[Worker Live Location]: UNAVAILABLE (DoneKaro does NOT track real-time artisan GPS locations. Never state or promise arrival ETAs).`)
    lines.push(`[Contact Boundary]: Users can contact their assigned worker directly using the in-app Call Artisan or WhatsApp button on the booking card. DoneKaro platform support phone calls are not supported; all support is managed in-app.`)

    if (isWorker) {
      const { count } = await supabase
        .from('bookings')
        .select('id', { count: 'exact', head: true })
        .eq('worker_id', callerId)
        .eq('status', 'completed')
      lines.push(`[Worker Lifetime Completed Jobs]: ${count ?? 0}`)
    }

    return {
      promptText: lines.join('\n'),
      hasPrimaryBooking: Boolean(primaryBooking),
      isPaid,
      finalPayableAmount,
      paymentStatus,
    }
  } catch (err) {
    console.warn('[chat-ai] Error retrieving edge live context:', err)
    return {
      promptText: 'AUTHORITATIVE APPLICATION DATA: None available.',
      hasPrimaryBooking: false,
      isPaid: false,
      finalPayableAmount: null,
      paymentStatus: null,
    }
  }
}

serve(async (req: Request) => {
  const corsResponse = handleCors(req)
  if (corsResponse) return corsResponse
  const corsHeaders = getCorsHeaders(req)

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method Not Allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  try {
    // 1. Verify caller authentication via Supabase JWT
    const authHeader = req.headers.get('Authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({
          error: 'Unauthorized: Missing or invalid Authorization header',
          fallback_required: true,
        }),
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    const token = authHeader.replace('Bearer ', '').trim()
    if (!token) {
      return new Response(
        JSON.stringify({
          error: 'Unauthorized: Empty bearer token',
          fallback_required: true,
        }),
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    const authSupabase = createClient(
      SUPABASE_URL,
      SUPABASE_ANON_KEY || SUPABASE_SERVICE_ROLE_KEY,
      {
        global: { headers: { Authorization: `Bearer ${token}` } },
      }
    )

    const { data: userData, error: userError } = await authSupabase.auth.getUser(token)
    if (userError || !userData?.user) {
      return new Response(
        JSON.stringify({
          error: 'Unauthorized: Invalid or expired caller session',
          fallback_required: true,
        }),
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    const callerId = userData.user.id

    // Fetch caller role to enforce persona access boundary
    const { data: profile } = await authSupabase
      .from('profiles')
      .select('role')
      .eq('id', callerId)
      .maybeSingle()

    const callerRole = profile?.role || 'customer'

    // Server-side enforcement: Admin accounts have NO AI access
    if (callerRole === 'admin') {
      return new Response(
        JSON.stringify({
          error: 'Forbidden: Admin accounts do not have AI Assistant access',
          fallback_required: false,
        }),
        {
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    // 2. Read and enforce maximum payload size (32KB)
    const rawBody = await req.text()
    if (rawBody.length > 32768) {
      return new Response(JSON.stringify({ error: 'Payload size exceeds limit' }), {
        status: 413,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    let parsed: Partial<RequestBody>
    try {
      parsed = JSON.parse(rawBody)
    } catch {
      return new Response(JSON.stringify({ error: 'Invalid JSON payload' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const { query, persona, conversationHistory, bookingHintId } = parsed

    // Validate query
    if (typeof query !== 'string' || !query.trim()) {
      return new Response(JSON.stringify({ error: 'Query is required and must be a non-empty string' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    if (query.trim().length > 1000) {
      return new Response(JSON.stringify({ error: 'Query exceeds maximum allowed length of 1000 characters' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Validate persona
    if (!persona || !ALLOWED_PERSONAS.includes(persona as AssistantPersona)) {
      return new Response(
        JSON.stringify({
          error: `Invalid persona. Must be one of: ${ALLOWED_PERSONAS.join(', ')}`,
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    // Enforce role-aware mode access:
    // Worker accounts must use worker_sarathi.
    // Customer accounts must use customer_booking.
    if (callerRole === 'worker' && persona !== 'worker_sarathi') {
      return new Response(
        JSON.stringify({
          error: 'Forbidden: Worker accounts must use the Work Advice persona',
          fallback_required: false,
        }),
        {
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    if (callerRole === 'customer' && persona !== 'customer_booking') {
      return new Response(
        JSON.stringify({
          error: 'Forbidden: Customer accounts must use the Booking Help persona',
          fallback_required: false,
        }),
        {
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    // Validate conversation history if provided
    const safeHistory: Array<{ role: 'user' | 'assistant'; content: string }> = []
    if (Array.isArray(conversationHistory)) {
      // Limit to last 6 messages
      const recent = conversationHistory.slice(-6)
      for (const msg of recent) {
        if (msg && typeof msg === 'object') {
          const role = msg.sender === 'user' ? 'user' : 'assistant'
          const content = String(msg.textEn || msg.textHi || '').trim().slice(0, 1000)
          if (content) {
            safeHistory.push({ role, content })
          }
        }
      }
    }

    // Check server GROQ_API_KEY
    if (!GROQ_API_KEY) {
      return new Response(
        JSON.stringify({
          error: 'AI service unconfigured: GROQ_API_KEY not set in Edge Function secrets',
          fallback_required: true,
        }),
        {
          status: 503,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    // Fetch authorized live context directly using authSupabase (enforcing caller RLS)
    const liveContext = await fetchEdgeLiveContext(authSupabase, callerId, callerRole, bookingHintId, query)

    // Prepare Groq chat completions messages with injected live context
    const systemPromptContent = `${SYSTEM_PROMPTS[persona as AssistantPersona]}\n\n${liveContext.promptText}`
    const messagesPayload = [
      { role: 'system', content: systemPromptContent },
      ...safeHistory,
      { role: 'user', content: query.trim() },
    ]

    let selectedModel = PRIMARY_GROQ_MODEL

    async function executeGroqCompletion(model: string) {
      return await fetch(GROQ_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${GROQ_API_KEY}`,
        },
        body: JSON.stringify({
          model,
          messages: messagesPayload,
          temperature: 0.5,
          max_tokens: 500,
        }),
      })
    }

    let groqRes = await executeGroqCompletion(selectedModel)

    // If Groq returns a model-unavailable/deprecated/not-found error, perform ONE fallback attempt using FALLBACK_GROQ_MODEL
    if (!groqRes.ok && (groqRes.status === 404 || groqRes.status === 400)) {
      let isModelUnavailableError = false
      let checkReason = `HTTP ${groqRes.status}`
      try {
        const errJson = await groqRes.clone().json()
        const errMsg = String(errJson?.error?.message || errJson?.error?.code || '').toLowerCase()
        if (
          groqRes.status === 404 ||
          errMsg.includes('model') ||
          errMsg.includes('decommissioned') ||
          errMsg.includes('deprecated') ||
          errMsg.includes('not found') ||
          errMsg.includes('does not exist')
        ) {
          isModelUnavailableError = true
        }
        checkReason = errMsg.replace(/gsk_[a-zA-Z0-9_-]+/g, '[REDACTED]').slice(0, 150)
      } catch {
        if (groqRes.status === 404) isModelUnavailableError = true
      }

      if (isModelUnavailableError && selectedModel !== FALLBACK_GROQ_MODEL) {
        console.warn(`[chat-ai] Primary model ${selectedModel} unavailable (${checkReason}), attempting single fallback to ${FALLBACK_GROQ_MODEL}`)
        selectedModel = FALLBACK_GROQ_MODEL
        groqRes = await executeGroqCompletion(selectedModel)
      }
    }

    if (!groqRes.ok) {
      let upstreamReason = `HTTP ${groqRes.status}`
      try {
        const errJson = await groqRes.json()
        upstreamReason = `[model: ${selectedModel}] ` + String(errJson?.error?.message || errJson?.error?.code || upstreamReason)
          .replace(/gsk_[a-zA-Z0-9_-]+/g, '[REDACTED]')
          .slice(0, 150)
      } catch {
        // preserve status code
      }
      console.warn(`[chat-ai] Upstream Groq error: HTTP ${groqRes.status} - ${upstreamReason}`)
      return new Response(
        JSON.stringify({
          error: 'AI upstream provider error',
          upstream_status: groqRes.status,
          upstream_reason: upstreamReason,
          fallback_required: true,
        }),
        {
          status: 502,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    const groqData = await groqRes.json()
    const rawContent = groqData.choices?.[0]?.message?.content || ''

    if (!rawContent) {
      return new Response(
        JSON.stringify({
          error: 'Empty response from AI model',
          fallback_required: true,
        }),
        {
          status: 502,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    // Post-process rawContent for absolute no-hallucination compliance
    let finalContent = rawContent

    // 1. Actively replace live arrival time / transit ETA / arrival guarantee claims
    const arrivalTimeRegex = /\b(?:(?:will\s+arrive|arriving|reach|is)\s+(?:in\s+)?\d+\s*(?:mins?|minutes?|seconds?|hours?)(?:\s+away)?|within\s+\d+\s*(?:mins?|minutes?)|guaranteed\s+arrival|fastest\s+arrival|20-minute\s+arrival|30-minute\s+arrival|same-day\s+arrival\s+promise)\b/gi
    if (arrivalTimeRegex.test(finalContent)) {
      finalContent = finalContent.replace(
        arrivalTimeRegex,
        '[Live transit ETA is unavailable. DoneKaro does not track real-time artisan GPS locations. Scheduled time represents the agreed appointment slot only, not a live transit ETA. To check arrival or communicate, please contact your assigned artisan directly using the Call Artisan or WhatsApp button on your active booking card in My Bookings. (Note: DoneKaro platform support phone calls are not supported; support is managed in-app.)]'
      )
    }

    // 2. Actively replace payment completed claims if status is unpaid or pending
    const claimsPaidRegex = /\b(?:(?:your\s+)?payment\s+(?:has\s+been\s+completed|is\s+completed|is\s+received|has\s+been\s+received)|(?:your\s+)?receipt\s+is\s+generated|(?:you\s+have\s+)?already\s+paid)\b/gi
    if (liveContext.hasPrimaryBooking && !liveContext.isPaid && claimsPaidRegex.test(finalContent)) {
      const amountStr = liveContext.finalPayableAmount !== null
        ? `₹${liveContext.finalPayableAmount.toFixed(2)}`
        : 'the agreed amount'
      const statusStr = (liveContext.paymentStatus || 'unpaid').toUpperCase()
      finalContent = finalContent.replace(
        claimsPaidRegex,
        `[According to system records, your payment of ${amountStr} is currently ${statusStr}. Official receipts are generated only after cash payment is confirmed upon service completion]`
      )
    }

    // 3. Actively replace ticket / complaint filed or escalated claims (AI support is read-only)
    const claimsComplaintFiledRegex = /\b(?:I\s+have\s+(?:filed|registered|created|logged|escalated)\s+(?:your\s+)?(?:complaint|ticket|issue)|(?:your\s+)?(?:complaint|ticket)\s+has\s+been\s+(?:created|registered|escalated)|(?:our\s+support\s+team\s+will\s+contact\s+you\s+within\s+\d+\s*(?:mins?|minutes?|hours?)))\b/gi
    if (claimsComplaintFiledRegex.test(finalContent)) {
      finalContent = finalContent.replace(
        claimsComplaintFiledRegex,
        '[AI Support is read-only and cannot file or escalate tickets or complaints. Please review and submit your support request through the confirmation form]'
      )
    }

    // 4. Actively replace refund processed claims
    const claimsRefundRegex = /\b(?:I\s+have\s+processed\s+(?:your\s+)?refund|(?:your\s+)?refund\s+has\s+been\s+(?:processed|initiated|issued))\b/gi
    if (claimsRefundRegex.test(finalContent)) {
      finalContent = finalContent.replace(
        claimsRefundRegex,
        '[AI Support cannot process refunds. Cash payments are made directly to the artisan upon service verification]'
      )
    }

    // 5. Actively replace booking cancelled claims
    const claimsCancelledRegex = /\b(?:I\s+have\s+cancelled\s+your\s+booking|(?:your\s+)?booking\s+has\s+been\s+cancelled)\b/gi
    if (claimsCancelledRegex.test(finalContent)) {
      finalContent = finalContent.replace(
        claimsCancelledRegex,
        '[AI Support cannot cancel bookings. You can manage or cancel your booking directly from your active booking card in My Bookings]'
      )
    }

    // 6. Actively replace support phone call claims
    const supportPhoneRegex = /\b(?:call\s+(?:our\s+)?support\s+at\s+[\+\d\s\-]+|support\s+(?:helpline|number|phone)\s*(?:is|:)?\s*[\+\d\s\-]+)\b/gi
    if (supportPhoneRegex.test(finalContent)) {
      finalContent = finalContent.replace(
        supportPhoneRegex,
        '[DoneKaro platform support phone calls are not supported; customer support is managed directly inside the app]'
      )
    }

    return new Response(
      JSON.stringify({
        success: true,
        content: finalContent,
        sourceType: liveContext.hasPrimaryBooking ? 'application_data' : 'jugnu_rule',
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      },
    )
  } catch (err) {
    // Never expose stack trace or internal error messages to client
    return new Response(
      JSON.stringify({
        error: 'An internal server error occurred while processing AI query',
        fallback_required: true,
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      },
    )
  }
})

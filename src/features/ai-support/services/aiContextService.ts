/**
 * AI Context Service
 * Retrieves authenticated, authorized live context for AI support.
 * Strictly adheres to caller identity, RLS permissions, and privacy boundaries:
 * - Verifies booking ownership under RLS before returning context.
 * - Categorizes query intent with lightweight deterministic classification.
 * - Handles ambiguity: never guesses when multiple active bookings exist.
 * - Explicitly restricts "most recent booking" fallback to post-service queries only (receipts/history).
 * - Distinguishes scheduled appointment slots from live transit ETAs.
 * - Clarifies contacting assigned workers in-app vs Jugnu support (no support phone).
 */

import { getSupabaseClient } from '@/lib/supabase'
import { getCategoryById, getCategoryName, getServiceById } from '@kaamgar/shared'
import {
  AIBookingContextSummary,
  AIActiveBookingItem,
  AILiveContext,
  AIQueryIntent,
  AIContextResolutionReason,
} from '../types'

export function classifyQueryIntent(queryText?: string): AIQueryIntent {
  if (!queryText) return 'general'
  const q = queryText.toLowerCase()

  if (q.includes('receipt') || q.includes('bill') || q.includes('invoice') || q.includes('रसीद') || q.includes('बिल')) {
    return 'receipt'
  }
  if (
    q.includes('complain') ||
    q.includes('complaint') ||
    q.includes('issue') ||
    q.includes('problem') ||
    q.includes('dispute') ||
    q.includes('overcharge') ||
    q.includes('unauthorized') ||
    q.includes('bad service') ||
    q.includes('शिकायत') ||
    q.includes('समस्या') ||
    q.includes('विवाद')
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

function formatMaskedName(fullName?: string | null): string {
  if (!fullName) return 'Verified User'
  const parts = fullName.trim().split(/\s+/)
  if (parts.length === 1) return parts[0]
  return `${parts[0]} ${parts[parts.length - 1][0].toUpperCase()}.`
}

function resolveTradeLabel(categoryId?: string | null): string {
  if (!categoryId) return 'Home Service'
  const service = getServiceById(categoryId)
  if (service) return getCategoryName(service, 'en')
  const cat = getCategoryById(categoryId)
  if (cat) return getCategoryName(cat, 'en')
  return categoryId.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
}

async function buildBookingSummary(
  supabase: any,
  bookingRow: any,
  isWorker: boolean,
  userId: string
): Promise<AIBookingContextSummary> {
  const bookingId = bookingRow.id

  const [paymentRes, changeReqRes, counterpartyRes, complaintRes]: [any, any, any, any] = await Promise.all([
    (supabase.rpc as any)('get_booking_payment_summary', { target_booking_id: bookingId }),
    (supabase.from('booking_change_requests') as any)
      .select('id, amount, status, reason')
      .eq('booking_id', bookingId),
    isWorker
      ? (supabase.from('profiles') as any).select('full_name').eq('id', bookingRow.customer_id).maybeSingle()
      : (supabase.from('approved_worker_directory') as any).select('name').eq('id', bookingRow.worker_id).maybeSingle(),
    (supabase.from('complaints') as any)
      .select('id, status, reason, created_at')
      .eq('booking_id', bookingId)
      .eq('opened_by', userId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle(),
  ])

  const payData = (paymentRes?.data && paymentRes.data.length > 0) ? paymentRes.data[0] : null
  const changeRequests = (changeReqRes?.data ?? []) as Array<{ id: string; amount: number; status: string; reason?: string }>

  const pendingCRs = changeRequests.filter(cr => cr.status === 'pending')
  const pendingCount = pendingCRs.length
  const pendingAmount = pendingCRs.reduce((sum, cr) => sum + (Number(cr.amount) || 0), 0)

  let counterpartyName = 'Assigned Partner'
  if (isWorker) {
    counterpartyName = formatMaskedName(counterpartyRes?.data?.full_name)
  } else {
    counterpartyName = counterpartyRes?.data?.name || 'Verified Artisan'
  }

  const paymentStatus = payData?.payment_status || 'unpaid'
  const isPaid = paymentStatus === 'paid'

  const activeComplaint = complaintRes?.data ? {
    id: complaintRes.data.id,
    status: complaintRes.data.status,
    createdAt: complaintRes.data.created_at,
    reason: complaintRes.data.reason,
  } : null

  return {
    id: bookingId,
    categoryId: bookingRow.category_id,
    categoryName: resolveTradeLabel(bookingRow.category_id),
    status: bookingRow.status,
    scheduledAt: bookingRow.scheduled_at,
    counterpartyName,
    notes: bookingRow.notes,
    initialQuoteAmount: payData ? Number(payData.initial_quote_amount) : null,
    approvedAdditionalAmount: payData ? Number(payData.approved_additional_amount) : 0,
    pendingAdditionalCount: pendingCount,
    pendingAdditionalAmount: pendingAmount,
    finalPayableAmount: payData ? Number(payData.final_payable_amount) : null,
    paymentStatus,
    paymentMethod: payData?.payment_method || 'Cash',
    receiptNumber: payData?.receipt_number || null,
    receiptPaidAt: payData?.receipt_paid_at || null,
    isPaid,
    hasPendingChangeRequests: pendingCount > 0,
    activeComplaint,
  }
}

export async function fetchAuthorizedLiveContext(
  bookingHintId?: string,
  queryText?: string
): Promise<AILiveContext | null> {
  const supabase = getSupabaseClient()
  const queryIntent = classifyQueryIntent(queryText)

  const { data: sessionData } = await supabase.auth.getSession()
  const user = sessionData?.session?.user
  if (!user) return null

  // 1. Fetch caller profile role
  const { data: profile } = await (supabase.from('profiles') as any)
    .select('role')
    .eq('id', user.id)
    .maybeSingle()

  const callerRole = ((profile as any)?.role as 'customer' | 'worker' | 'admin') || 'customer'
  const isWorker = callerRole === 'worker'

  let primarySummary: AIBookingContextSummary | null = null
  let recentPastSummary: AIBookingContextSummary | null = null
  let resolutionReason: AIContextResolutionReason = 'no_relevant_booking'

  // 2. Explicit booking hint provided
  if (bookingHintId && typeof bookingHintId === 'string' && bookingHintId.trim().length > 10) {
    let query = supabase
      .from('bookings')
      .select('id, category_id, status, scheduled_at, notes, customer_id, worker_id, created_at')
      .eq('id', bookingHintId.trim())

    if (isWorker) {
      query = query.eq('worker_id', user.id)
    } else {
      query = query.eq('customer_id', user.id)
    }

    const { data: hintBooking } = await query.maybeSingle()
    if (hintBooking) {
      primarySummary = await buildBookingSummary(supabase, hintBooking, isWorker, user.id)
      resolutionReason = 'hint_match'
    }
  }

  // 3. Query caller's active bookings (pending, accepted, in_progress, payment_pending)
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
    activeQuery = activeQuery.eq('worker_id', user.id)
  } else {
    activeQuery = activeQuery.eq('customer_id', user.id)
  }

  const { data: activeList } = await activeQuery
  const activeBookingRows: any[] = activeList ?? []

  const activeBookings: AIActiveBookingItem[] = activeBookingRows.map(b => ({
    id: b.id,
    categoryId: b.category_id,
    categoryName: resolveTradeLabel(b.category_id),
    status: b.status,
    scheduledAt: b.scheduled_at,
  }))

  // 4. If no explicit hint was matched, evaluate active bookings vs query
  if (!primarySummary) {
    if (activeBookingRows.length === 1) {
      // Exactly ONE active booking exists -> unambiguous active context
      primarySummary = await buildBookingSummary(supabase, activeBookingRows[0], isWorker, user.id)
      resolutionReason = 'single_active'
    } else if (activeBookingRows.length > 1) {
      // Check if user specifically mentioned one category among the active ones
      const qLower = (queryText || '').toLowerCase()
      const matchingActive = activeBookingRows.filter(b => {
        const catName = resolveTradeLabel(b.category_id).toLowerCase()
        const catId = (b.category_id || '').toLowerCase()
        return qLower.includes(catName) || qLower.includes(catId)
      })

      if (matchingActive.length === 1) {
        primarySummary = await buildBookingSummary(supabase, matchingActive[0], isWorker, user.id)
        resolutionReason = 'single_active'
      } else {
        // Ambiguous: multiple active bookings. DO NOT arbitrarily choose one.
        primarySummary = null
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
        recentQuery = recentQuery.eq('worker_id', user.id)
      } else {
        recentQuery = recentQuery.eq('customer_id', user.id)
      }

      const { data: recentList } = await recentQuery
      if (recentList && recentList.length > 0) {
        recentPastSummary = await buildBookingSummary(supabase, recentList[0], isWorker, user.id)

        // Only promote most-recent booking to primary if the question is explicitly a post-service question
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
          primarySummary = recentPastSummary
          resolutionReason = 'post_service_history'
        } else {
          primarySummary = null
          resolutionReason = 'no_relevant_booking'
        }
      } else {
        primarySummary = null
        resolutionReason = 'no_relevant_booking'
      }
    }
  }

  // 5. Worker completed jobs count if applicable
  let workerCompletedJobsCount: number | undefined
  if (isWorker) {
    const { count } = await (supabase.from('bookings') as any)
      .select('id', { count: 'exact', head: true })
      .eq('worker_id', user.id)
      .eq('status', 'completed')
    workerCompletedJobsCount = count ?? 0
  }

  // 6. Caller open complaints count
  let userActiveComplaintsCount: number | undefined
  const { count: openCompCount } = await (supabase.from('complaints') as any)
    .select('id', { count: 'exact', head: true })
    .eq('opened_by', user.id)
    .in('status', ['open', 'investigating'])
  userActiveComplaintsCount = openCompCount ?? 0

  return {
    callerId: user.id,
    callerRole,
    primaryBooking: primarySummary,
    recentPastBooking: recentPastSummary,
    activeBookings,
    hasMultipleActiveBookings: activeBookings.length > 1,
    resolutionReason,
    queryIntent,
    workerCompletedJobsCount,
    userActiveComplaintsCount,
    liveLocationAvailable: false,
    resolvedAt: new Date().toISOString(),
  }
}

/**
 * Formats authoritative live context into a structured string block for prompt injection.
 */
export function formatLiveContextForPrompt(ctx: AILiveContext | null): string {
  if (!ctx) {
    return '### AUTHORITATIVE APPLICATION DATA: None available (User is unauthenticated).'
  }

  const lines: string[] = ['### AUTHORITATIVE APPLICATION DATA (TIER 1 - GROUND TRUTH):']
  lines.push(`Caller Role: ${ctx.callerRole.toUpperCase()}`)
  lines.push(`Context Mode: ${ctx.resolutionReason.toUpperCase()}`)

  if (ctx.primaryBooking) {
    const pb = ctx.primaryBooking
    lines.push(`[Active Booking ID]: ${pb.id}`)
    lines.push(`[Service]: ${pb.categoryName}`)
    lines.push(`[Booking Status]: ${pb.status}`)
    lines.push(`[Scheduled Appointment Slot]: ${pb.scheduledAt ? new Date(pb.scheduledAt).toLocaleString('en-IN') : 'Flexible'} *(Scheduled slot only; NOT a live transit ETA)*`)
    lines.push(`[${ctx.callerRole === 'worker' ? 'Customer' : 'Assigned Artisan'}]: ${pb.counterpartyName}`)

    if (pb.initialQuoteAmount !== null) {
      lines.push(`[Initial Quote Amount]: ₹${pb.initialQuoteAmount.toFixed(2)}`)
    }
    if (pb.approvedAdditionalAmount !== null && pb.approvedAdditionalAmount > 0) {
      lines.push(`[Approved Additional Charges]: ₹${pb.approvedAdditionalAmount.toFixed(2)}`)
    }
    if (pb.pendingAdditionalCount > 0) {
      lines.push(`[Pending Change Requests]: ${pb.pendingAdditionalCount} request(s) totaling ₹${pb.pendingAdditionalAmount.toFixed(2)} (Awaiting Customer Approval in App)`)
    }
    if (pb.finalPayableAmount !== null) {
      lines.push(`[Final Payable Amount]: ₹${pb.finalPayableAmount.toFixed(2)}`)
    }
    lines.push(`[Payment Status]: ${pb.paymentStatus?.toUpperCase() || 'UNPAID'}`)
    lines.push(`[Payment Method]: ${pb.paymentMethod || 'Cash'}`)
    if (pb.receiptNumber) {
      lines.push(`[Receipt Number]: ${pb.receiptNumber} (Generated at ${pb.receiptPaidAt || 'Completion'})`)
    } else {
      lines.push(`[Receipt Number]: NONE (Receipt will generate after cash payment is confirmed upon completion)`)
    }

    if (pb.activeComplaint) {
      lines.push(`[Active Support Complaint on File]: Reference: #CMP-${pb.activeComplaint.id.slice(0, 8).toUpperCase()} | Status: ${pb.activeComplaint.status.toUpperCase()} | Filed At: ${pb.activeComplaint.createdAt}`)
    } else {
      lines.push(`[Active Support Complaint on File]: None`)
    }
  } else if (ctx.resolutionReason === 'multiple_active') {
    lines.push(`[Ambiguity Notice]: User has ${ctx.activeBookings.length} active bookings:`)
    ctx.activeBookings.forEach((ab, idx) => {
      lines.push(`  ${idx + 1}. ${ab.categoryName} (ID: ${ab.id.slice(0, 8)}..., Status: ${ab.status})`)
    })
    lines.push(`INSTRUCTION: DO NOT guess which booking the user is asking about. List the active services and politely ask the user to clarify.`)
  } else {
    lines.push('[Booking Context]: No active booking found.')
    lines.push('INSTRUCTION: If the user asks about an active artisan or booking status, state clearly that they have no active booking and guide them to Browse Categories.')
    if (ctx.recentPastBooking) {
      lines.push(`[Most Recent Past Service Reference]: ${ctx.recentPastBooking.categoryName} (${ctx.recentPastBooking.status}) - Only refer to this if user explicitly asks about their previous completed service.`)
    }
  }

  if (ctx.userActiveComplaintsCount !== undefined) {
    lines.push(`[Caller Active Open Complaints Total]: ${ctx.userActiveComplaintsCount}`)
  }

  // Telemetry and contact boundaries
  lines.push(`[Worker Live Location]: UNAVAILABLE (Jugnu does NOT track real-time artisan GPS locations. Never state or promise arrival ETAs).`)
  lines.push(`[Contact Boundary]: Users can contact their assigned worker directly using the in-app Contact Artisan button on the booking card. Jugnu platform support phone calls are not supported; all support is managed in-app.`)
  lines.push(`[Support Request Boundary]: AI Support is read-only and CANNOT automatically insert complaints. When a user requests to file a complaint, recommend the 'CREATE_SUPPORT_REQUEST' action so the user can review and confirm.`)

  if (ctx.workerCompletedJobsCount !== undefined) {
    lines.push(`[Worker Lifetime Completed Jobs]: ${ctx.workerCompletedJobsCount}`)
  }

  return lines.join('\n')
}

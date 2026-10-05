/**
 * AI Grounding Service
 * Enforces Tier 1 ground-truth validation, anti-hallucination post-checks,
 * and converts allowlisted action codes into safe internal routes.
 */

import { AILiveContext, AllowedActionCode, ChatAction } from '../types'

/**
 * Maps allowlisted action codes to safe internal routes and labels.
 */
export function buildGroundedAction(
  code: AllowedActionCode,
  categoryHint?: string
): ChatAction | null {
  switch (code) {
    case 'VIEW_BOOKING':
    case 'OPEN_BOOKINGS':
      return {
        id: 'act_go_bookings_' + Date.now(),
        labelEn: 'View My Bookings',
        labelHi: 'मेरी बुकिंग्स देखें',
        type: 'navigate',
        payload: '/bookings',
        icon: 'Calendar',
      }

    case 'VIEW_PAYMENT':
      return {
        id: 'act_view_payment_' + Date.now(),
        labelEn: 'Check Payment Details',
        labelHi: 'भुगतान विवरण देखें',
        type: 'navigate',
        payload: '/bookings',
        icon: 'Calendar',
      }

    case 'VIEW_RECEIPT':
      return {
        id: 'act_view_receipt_' + Date.now(),
        labelEn: 'View Receipt',
        labelHi: 'रसीद देखें',
        type: 'navigate',
        payload: '/bookings',
        icon: 'Calendar',
      }

    case 'OPEN_WORKER_DASHBOARD':
      return {
        id: 'act_worker_dash_' + Date.now(),
        labelEn: 'Open Worker Dashboard',
        labelHi: 'कारीगर डैशबोर्ड खोलें',
        type: 'navigate',
        payload: '/worker/dashboard',
        icon: 'Briefcase',
      }

    case 'OPEN_SEARCH':
      return {
        id: 'act_open_search_' + Date.now(),
        labelEn: categoryHint ? `Find ${categoryHint}` : 'Search Services',
        labelHi: categoryHint ? `${categoryHint} खोजें` : 'सेवा खोजें',
        type: 'navigate',
        payload: categoryHint ? `/search?category=${encodeURIComponent(categoryHint)}` : '/search',
        icon: 'Search',
      }

    case 'OPEN_CATEGORIES':
      return {
        id: 'act_categories_' + Date.now(),
        labelEn: 'Browse Categories',
        labelHi: 'श्रेणियाँ देखें',
        type: 'navigate',
        payload: '/categories',
        icon: 'Search',
      }

    case 'CREATE_SUPPORT_REQUEST':
      return {
        id: 'act_support_req_' + Date.now(),
        labelEn: 'File Support Request',
        labelHi: 'सहायता अनुरोध दर्ज करें',
        type: 'create_support_request',
        payload: categoryHint || '',
        icon: 'AlertCircle',
      }

    case 'VIEW_SUPPORT_HISTORY':
      return {
        id: 'act_support_hist_' + Date.now(),
        labelEn: 'View Support History',
        labelHi: 'शिकायत इतिहास देखें',
        type: 'create_support_request',
        payload: 'history',
        icon: 'FileText',
      }

    default:
      return null
  }
}

/**
 * Validates and sanitizes AI generated text against live application truth.
 * Actively neutralizes prohibited hallucinations so they are not presented as authoritative facts:
 * 1. Promising arrival times / ETAs / speed guarantees.
 * 2. Claiming payment is confirmed/received when live payment is unpaid or pending.
 * 3. Claiming to have filed tickets, complaints, or processed refunds.
 * 4. Claiming to have cancelled bookings.
 * 5. Claiming escalation without authoritative backing.
 * 6. Reintroducing direct DoneKaro support phone calls.
 */
export function sanitizeAndGroundAiResponse(
  rawText: string,
  liveContext: AILiveContext | null
): { text: string; corrected: boolean } {
  let text = rawText
  let corrected = false

  // 1. Actively replace live arrival time / transit ETA / arrival guarantee claims
  const arrivalTimeRegex = /\b(?:(?:will\s+arrive|arriving|reach|is)\s+(?:in\s+)?\d+\s*(?:mins?|minutes?|seconds?|hours?)(?:\s+away)?|within\s+\d+\s*(?:mins?|minutes?)|guaranteed\s+arrival|fastest\s+arrival|20-minute\s+arrival|30-minute\s+arrival|same-day\s+arrival\s+promise)\b/gi
  if (arrivalTimeRegex.test(text)) {
    text = text.replace(
      arrivalTimeRegex,
      '[Live transit ETA is unavailable. DoneKaro does not track real-time artisan GPS locations. Scheduled time represents the agreed appointment slot only, not a live transit ETA. To check arrival or communicate, please contact your assigned artisan directly using the Call Artisan or WhatsApp button on your active booking card in My Bookings. (Note: DoneKaro platform support phone calls are not supported; support is managed in-app.)]'
    )
    corrected = true
  }

  // 2. Actively replace payment completed claims if status is unpaid or pending
  const claimsPaidRegex = /\b(?:(?:your\s+)?payment\s+(?:has\s+been\s+completed|is\s+completed|is\s+received|has\s+been\s+received)|(?:your\s+)?receipt\s+is\s+generated|(?:you\s+have\s+)?already\s+paid)\b/gi
  if (liveContext?.primaryBooking && !liveContext.primaryBooking.isPaid && claimsPaidRegex.test(text)) {
    const amountStr = liveContext.primaryBooking.finalPayableAmount !== null
      ? `₹${liveContext.primaryBooking.finalPayableAmount.toFixed(2)}`
      : 'the agreed amount'
    const statusStr = (liveContext.primaryBooking.paymentStatus || 'unpaid').toUpperCase()
    text = text.replace(
      claimsPaidRegex,
      `[According to system records, your payment of ${amountStr} is currently ${statusStr}. Official receipts are generated only after cash payment is confirmed upon service completion]`
    )
    corrected = true
  }

  // 3. Actively replace ticket / complaint filed or escalated claims (AI support is read-only)
  const claimsComplaintFiledRegex = /\b(?:I\s+have\s+(?:filed|registered|created|logged|escalated)\s+(?:your\s+)?(?:complaint|ticket|issue)|(?:your\s+)?(?:complaint|ticket)\s+has\s+been\s+(?:created|registered|escalated)|(?:our\s+support\s+team\s+will\s+contact\s+you\s+within\s+\d+\s*(?:mins?|minutes?|hours?)))\b/gi
  if (claimsComplaintFiledRegex.test(text)) {
    text = text.replace(
      claimsComplaintFiledRegex,
      '[AI Support is read-only and cannot file or escalate tickets or complaints. Please review and submit your support request through the confirmation form]'
    )
    corrected = true
  }

  // 4. Actively replace refund processed claims
  const claimsRefundRegex = /\b(?:I\s+have\s+processed\s+(?:your\s+)?refund|(?:your\s+)?refund\s+has\s+been\s+(?:processed|initiated|issued))\b/gi
  if (claimsRefundRegex.test(text)) {
    text = text.replace(
      claimsRefundRegex,
      '[AI Support cannot process refunds. Cash payments are made directly to the artisan upon service verification]'
    )
    corrected = true
  }

  // 5. Actively replace booking cancelled claims if booking is not actually cancelled
  const claimsCancelledRegex = /\b(?:I\s+have\s+cancelled\s+your\s+booking|(?:your\s+)?booking\s+has\s+been\s+cancelled)\b/gi
  if (claimsCancelledRegex.test(text)) {
    if (!liveContext?.primaryBooking || liveContext.primaryBooking.status !== 'cancelled') {
      text = text.replace(
        claimsCancelledRegex,
        '[AI Support cannot cancel bookings. You can manage or cancel your booking directly from your active booking card in My Bookings]'
      )
      corrected = true
    }
  }

  // 6. Actively replace any reintroduction of support phone calling
  const supportPhoneRegex = /\b(?:call\s+(?:our\s+)?support\s+at\s+[\+\d\s\-]+|support\s+(?:helpline|number|phone)\s*(?:is|:)?\s*[\+\d\s\-]+)\b/gi
  if (supportPhoneRegex.test(text)) {
    text = text.replace(
      supportPhoneRegex,
      '[DoneKaro platform support phone calls are not supported; customer support is managed directly inside the app]'
    )
    corrected = true
  }

  return { text, corrected }
}


/**
 * AI Support Core Types & Contracts
 * Phase 10A: Standardized Personas, Truth Tiers & Response Contracts
 */

export const ALLOWED_PERSONAS = [
  'customer_booking',
  'customer_care',
  'worker_sarathi',
] as const

export type AssistantPersona = typeof ALLOWED_PERSONAS[number]

/**
 * 4-Tier Truth Classification Boundary:
 * - application_data: Authoritative data from database (bookings, receipts, quotes)
 * - jugnu_rule: Verified product business rules (marketplace flow, approval rules)
 * - general_guidance: Practical maintenance/communication tips
 * - unknown: Data unavailable to the assistant; must explicitly admit lack of access
 */
export type AISourceType =
  | 'application_data'
  | 'jugnu_rule'
  | 'general_guidance'
  | 'unknown'

export type AIActionType =
  | 'navigate'
  | 'external_link'
  | 'copy_text'
  | 'quick_reply'
  | 'create_support_request'
  | 'none'

export interface ChatAction {
  id: string
  labelEn: string
  labelHi: string
  type: AIActionType
  payload: string
  icon?: string
}

export interface ChatMessage {
  id: string
  sender: 'user' | 'assistant'
  persona: AssistantPersona
  timestamp: Date
  textEn: string
  textHi?: string
  actions?: ChatAction[]
  sourceType?: AISourceType
}

export interface SuggestionChip {
  id: string
  labelEn: string
  labelHi: string
  query: string
  icon?: string
}

export interface AssistantConfig {
  id: AssistantPersona
  nameEn: string
  nameHi: string
  roleTitleEn: string
  roleTitleHi: string
  badgeEn: string
  badgeHi: string
  avatar: string
  greetingEn: string
  greetingHi: string
  chips: SuggestionChip[]
}

export type AllowedActionCode =
  | 'VIEW_BOOKING'
  | 'VIEW_PAYMENT'
  | 'VIEW_RECEIPT'
  | 'OPEN_BOOKINGS'
  | 'OPEN_WORKER_DASHBOARD'
  | 'OPEN_SEARCH'
  | 'OPEN_CATEGORIES'
  | 'CREATE_SUPPORT_REQUEST'
  | 'VIEW_SUPPORT_HISTORY'

export interface AIBookingContextSummary {
  id: string
  categoryId: string
  categoryName: string
  status: string
  scheduledAt: string | null
  counterpartyName: string
  notes?: string | null
  initialQuoteAmount: number | null
  approvedAdditionalAmount: number | null
  pendingAdditionalCount: number
  pendingAdditionalAmount: number
  finalPayableAmount: number | null
  paymentStatus: string | null
  paymentMethod: string | null
  receiptNumber: string | null
  receiptPaidAt: string | null
  isPaid: boolean
  hasPendingChangeRequests: boolean
  activeComplaint?: {
    id: string
    status: string
    createdAt: string
    reason: string
  } | null
}

export interface AIActiveBookingItem {
  id: string
  categoryId: string
  categoryName: string
  status: string
  scheduledAt: string | null
}

export type AIQueryIntent =
  | 'receipt'
  | 'payment'
  | 'status'
  | 'worker_arrival'
  | 'cancellation'
  | 'review_history'
  | 'complaint'
  | 'general'

export type AIContextResolutionReason =
  | 'hint_match'
  | 'single_active'
  | 'multiple_active'
  | 'post_service_history'
  | 'no_relevant_booking'

export interface AILiveContext {
  callerId: string
  callerRole: 'customer' | 'worker' | 'admin'
  primaryBooking: AIBookingContextSummary | null
  recentPastBooking: AIBookingContextSummary | null
  activeBookings: AIActiveBookingItem[]
  hasMultipleActiveBookings: boolean
  resolutionReason: AIContextResolutionReason
  queryIntent: AIQueryIntent
  workerCompletedJobsCount?: number
  userActiveComplaintsCount?: number
  liveLocationAvailable: false
  resolvedAt: string
}

export interface AIResponsePayload {
  success: boolean
  content: string
  sourceType?: AISourceType
  error?: string
  fallback_required?: boolean
}

export interface GenerateResponseParams {
  query: string
  persona: AssistantPersona
  conversationHistory?: ChatMessage[]
  bookingHintId?: string
  liveContext?: AILiveContext | null
}

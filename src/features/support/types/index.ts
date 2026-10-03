/**
 * Support Feature Types
 * Strictly reflects the PostgreSQL public.complaints schema and complaint_status enum.
 */

export type ComplaintStatus = 'open' | 'investigating' | 'resolved' | 'dismissed'

export type SupportTab = 'complaint' | 'suggestion' | 'history'

export interface ComplaintItem {
  id: string
  booking_id: string
  opened_by: string
  against_user: string
  status: ComplaintStatus
  reason: string
  resolution_note: string | null
  created_at: string
  resolved_at: string | null
  booking?: {
    category_id: string
    status: string
    scheduled_at: string | null
  }
  counterparty_name?: string
}

export interface CreateComplaintParams {
  bookingId: string
  reason: string
}

export type ComplaintErrorCode =
  | 'UNAUTHENTICATED'
  | 'VALIDATION_FAILED'
  | 'BOOKING_NOT_FOUND'
  | 'UNASSIGNED_WORKER'
  | 'ACTIVE_COMPLAINT_EXISTS'
  | 'DATABASE_ERROR'

export interface CreateComplaintResult {
  success: boolean
  complaint?: ComplaintItem
  error?: string
  errorCode?: ComplaintErrorCode
}

export interface EligibleSupportBooking {
  bookingId: string
  categoryId: string
  categoryName: string
  bookingStatus: string
  scheduledAt: string | null
  counterpartyName: string
  counterpartyId: string | null
  createdAt: string
}

export interface OpenSupportOptions {
  bookingId?: string | null
  defaultTab?: SupportTab
  initialReason?: string
}

export interface SuggestionSubmission {
  category: 'app_experience' | 'new_feature' | 'service_coverage' | 'other'
  message: string
}

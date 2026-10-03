/**
 * Admin Support Management Types
 * Strictly reflects authoritative database entities for public.complaints and public.suggestions
 * with admin-isolated participant profiles and booking metadata.
 */

import { ComplaintStatus, SuggestionStatus, SuggestionCategory } from '@/features/support/types'

export type { ComplaintStatus, SuggestionStatus, SuggestionCategory }

export interface AdminUserProfile {
  id: string
  full_name: string | null
  phone: string | null
  role: string | null
}

export interface AdminBookingSummary {
  id: string
  category_id: string
  status: string
  scheduled_at: string | null
  created_at: string
}

export interface AdminComplaint {
  id: string
  booking_id: string
  opened_by: string
  against_user: string
  status: ComplaintStatus
  reason: string
  resolution_note: string | null
  created_at: string
  resolved_at: string | null
  opened_by_user?: AdminUserProfile
  against_user_profile?: AdminUserProfile
  booking?: AdminBookingSummary
}

export interface AdminSuggestion {
  id: string
  submitted_by: string
  category: SuggestionCategory
  message: string
  status: SuggestionStatus
  resolution_note: string | null
  created_at: string
  updated_at: string
  resolved_at: string | null
  submitter?: AdminUserProfile
}

export type AdminSupportTab = 'complaints' | 'suggestions'
export type AdminComplaintFilter = 'all' | 'open' | 'investigating' | 'resolved' | 'dismissed'
export type AdminSuggestionFilter = 'all' | 'open' | 'in_review' | 'resolved' | 'dismissed'

export interface UpdateComplaintParams {
  id: string
  status: ComplaintStatus
  resolutionNote?: string
}

export interface UpdateSuggestionParams {
  id: string
  status: SuggestionStatus
  resolutionNote?: string
}

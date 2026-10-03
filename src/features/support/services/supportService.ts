/**
 * Support Service
 * Authoritative client operations for public.complaints.
 * Strictly enforces server-derived identity (auth.uid()), caller RLS,
 * input validation, and duplicate submission prevention.
 */

import { getSupabaseClient } from '@/lib/supabase'
import { getCategoryById, getCategoryName, getServiceById } from '@kaamgar/shared'
import {
  ComplaintItem,
  CreateComplaintParams,
  CreateComplaintResult,
  EligibleSupportBooking,
  SuggestionItem,
  SuggestionSubmission,
  CreateSuggestionResult,
} from '../types'

function resolveTradeLabel(categoryId?: string | null): string {
  if (!categoryId) return 'Home Service'
  const service = getServiceById(categoryId)
  if (service) return getCategoryName(service, 'en')
  const cat = getCategoryById(categoryId)
  if (cat) return getCategoryName(cat, 'en')
  return categoryId.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
}

export interface SupportBookingContext {
  bookingId: string
  categoryId: string
  categoryName: string
  bookingStatus: string
  scheduledAt: string | null
  counterpartyName: string
  counterpartyId: string | null
}

/**
 * Loads authoritative booking details to populate the Support Request Confirmation modal.
 */
export async function fetchBookingDetailsForSupport(
  bookingId: string
): Promise<SupportBookingContext | null> {
  if (!bookingId || bookingId.length < 10) return null
  const supabase = getSupabaseClient()

  const { data: sessionData } = await supabase.auth.getSession()
  const user = sessionData?.session?.user
  if (!user) return null

  const { data: booking, error: bError } = await (supabase.from('bookings') as any)
    .select('id, category_id, status, scheduled_at, customer_id, worker_id')
    .eq('id', bookingId)
    .maybeSingle()

  if (bError || !booking) return null

  const isCustomer = booking.customer_id === user.id
  const isWorker = booking.worker_id === user.id
  if (!isCustomer && !isWorker) return null

  const counterpartyId = isCustomer ? booking.worker_id : booking.customer_id

  let counterpartyName = isCustomer ? 'Assigned Artisan' : 'Customer'
  if (counterpartyId) {
    if (isCustomer) {
      const { data: workerDir } = await (supabase.from('approved_worker_directory') as any)
        .select('name')
        .eq('id', counterpartyId)
        .maybeSingle()
      if (workerDir?.name) {
        counterpartyName = workerDir.name
      }
    } else {
      const { data: custProf } = await (supabase.from('profiles') as any)
        .select('full_name')
        .eq('id', counterpartyId)
        .maybeSingle()
      if (custProf?.full_name) {
        const parts = String(custProf.full_name).trim().split(/\s+/)
        counterpartyName = parts.length === 1 ? parts[0] : `${parts[0]} ${parts[parts.length - 1][0].toUpperCase()}.`
      }
    }
  }

  return {
    bookingId: booking.id,
    categoryId: booking.category_id,
    categoryName: resolveTradeLabel(booking.category_id),
    bookingStatus: booking.status,
    scheduledAt: booking.scheduled_at,
    counterpartyName,
    counterpartyId,
  }
}

/**
 * Explicitly creates a complaint record in public.complaints.
 * Validates caller identity, booking ownership, and prevents duplicate active complaints.
 */
export async function submitSupportComplaint(
  params: CreateComplaintParams
): Promise<CreateComplaintResult> {
  const supabase = getSupabaseClient()

  // 1. Verify caller session
  const { data: sessionData } = await supabase.auth.getSession()
  const user = sessionData?.session?.user
  if (!user) {
    return {
      success: false,
      error: 'You must be signed in to submit a support request.',
      errorCode: 'UNAUTHENTICATED',
    }
  }

  // 2. Validate input fields
  const trimmedReason = (params.reason || '').trim()
  if (!params.bookingId || params.bookingId.length < 10) {
    return {
      success: false,
      error: 'A valid booking reference is required.',
      errorCode: 'VALIDATION_FAILED',
    }
  }

  if (trimmedReason.length < 10) {
    return {
      success: false,
      error: 'Please describe the issue in at least 10 characters.',
      errorCode: 'VALIDATION_FAILED',
    }
  }

  if (trimmedReason.length > 1000) {
    return {
      success: false,
      error: 'Complaint description exceeds the maximum length of 1000 characters.',
      errorCode: 'VALIDATION_FAILED',
    }
  }

  // 3. Verify booking ownership under caller's RLS
  const { data: booking, error: bError } = await (supabase.from('bookings') as any)
    .select('id, customer_id, worker_id, status')
    .eq('id', params.bookingId)
    .maybeSingle()

  if (bError || !booking) {
    return {
      success: false,
      error: 'Booking could not be verified under your account.',
      errorCode: 'BOOKING_NOT_FOUND',
    }
  }

  const isCustomer = booking.customer_id === user.id
  const isWorker = booking.worker_id === user.id
  if (!isCustomer && !isWorker) {
    return {
      success: false,
      error: 'You are not an authorized participant in this booking.',
      errorCode: 'BOOKING_NOT_FOUND',
    }
  }

  const againstUserId = isCustomer ? booking.worker_id : booking.customer_id
  if (!againstUserId) {
    return {
      success: false,
      error: 'A support request can only be submitted once an artisan has been assigned to the booking.',
      errorCode: 'UNASSIGNED_WORKER',
    }
  }

  // 4. Duplicate prevention: check for existing active complaint (status: 'open' or 'investigating')
  const { data: existingActive, error: checkError } = await (supabase.from('complaints') as any)
    .select('id, booking_id, opened_by, against_user, status, reason, resolution_note, created_at, resolved_at')
    .eq('booking_id', params.bookingId)
    .eq('opened_by', user.id)
    .in('status', ['open', 'investigating'])
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (!checkError && existingActive) {
    return {
      success: false,
      error: `An active support request (#CMP-${existingActive.id.slice(0, 8).toUpperCase()}) already exists for this booking. Our team is reviewing it.`,
      errorCode: 'ACTIVE_COMPLAINT_EXISTS',
      complaint: existingActive,
    }
  }

  // 5. Authoritative insert into public.complaints
  const { data: inserted, error: insertError } = await (supabase.from('complaints') as any)
    .insert({
      booking_id: params.bookingId,
      opened_by: user.id,
      against_user: againstUserId,
      reason: trimmedReason,
      status: 'open',
    })
    .select('id, booking_id, opened_by, against_user, status, reason, resolution_note, created_at, resolved_at')
    .single()

  if (insertError || !inserted) {
    console.warn('[SupportService] Error inserting complaint:', insertError?.message)
    return {
      success: false,
      error: 'Unable to submit your support request at this moment. Please try again.',
      errorCode: 'DATABASE_ERROR',
    }
  }

  return {
    success: true,
    complaint: inserted as ComplaintItem,
  }
}

/**
 * Fetches complaints opened by the caller under RLS isolation.
 */
export async function fetchUserComplaints(): Promise<ComplaintItem[]> {
  const supabase = getSupabaseClient()

  const { data: sessionData } = await supabase.auth.getSession()
  const user = sessionData?.session?.user
  if (!user) return []

  const { data, error } = await (supabase.from('complaints') as any)
    .select(`
      id,
      booking_id,
      opened_by,
      against_user,
      status,
      reason,
      resolution_note,
      created_at,
      resolved_at,
      bookings (
        id,
        category_id,
        status,
        scheduled_at
      )
    `)
    .eq('opened_by', user.id)
    .order('created_at', { ascending: false })

  if (error || !data) {
    console.warn('[SupportService] Error fetching complaints:', error?.message)
    return []
  }

  return data.map((item: any) => ({
    id: item.id,
    booking_id: item.booking_id,
    opened_by: item.opened_by,
    against_user: item.against_user,
    status: item.status,
    reason: item.reason,
    resolution_note: item.resolution_note,
    created_at: item.created_at,
    resolved_at: item.resolved_at,
    booking: item.bookings ? {
      category_id: item.bookings.category_id,
      status: item.bookings.status,
      scheduled_at: item.bookings.scheduled_at,
    } : undefined,
  }))
}

/**
 * Fetches recent bookings for the caller (as customer or worker)
 * that have an assigned counterparty, making them eligible for support/complaints.
 */
export async function fetchEligibleBookingsForSupport(): Promise<EligibleSupportBooking[]> {
  const supabase = getSupabaseClient()

  const { data: sessionData } = await supabase.auth.getSession()
  const user = sessionData?.session?.user
  if (!user) return []

  const { data, error } = await (supabase.from('bookings') as any)
    .select('id, category_id, status, scheduled_at, customer_id, worker_id, created_at')
    .or(`customer_id.eq.${user.id},worker_id.eq.${user.id}`)
    .order('created_at', { ascending: false })
    .limit(20)

  if (error || !data) {
    console.warn('[SupportService] Error fetching eligible bookings:', error?.message)
    return []
  }

  // Filter bookings that have a counterparty
  const eligible = data.filter((b: any) => {
    const isCustomer = b.customer_id === user.id
    const counterpartyId = isCustomer ? b.worker_id : b.customer_id
    return Boolean(counterpartyId)
  })

  // Collect counterparty names
  const workerIds = eligible
    .filter((b: any) => b.customer_id === user.id && b.worker_id)
    .map((b: any) => b.worker_id as string)

  const customerIds = eligible
    .filter((b: any) => b.worker_id === user.id && b.customer_id)
    .map((b: any) => b.customer_id as string)

  const workerNameMap: Record<string, string> = {}
  const customerNameMap: Record<string, string> = {}

  if (workerIds.length > 0) {
    const { data: workers } = await (supabase.from('approved_worker_directory') as any)
      .select('id, name')
      .in('id', Array.from(new Set(workerIds)))
    if (workers) {
      workers.forEach((w: any) => {
        if (w.name) workerNameMap[w.id] = w.name
      })
    }
  }

  if (customerIds.length > 0) {
    const { data: customers } = await (supabase.from('profiles') as any)
      .select('id, full_name')
      .in('id', Array.from(new Set(customerIds)))
    if (customers) {
      customers.forEach((c: any) => {
        if (c.full_name) {
          const parts = String(c.full_name).trim().split(/\s+/)
          customerNameMap[c.id] = parts.length === 1 ? parts[0] : `${parts[0]} ${parts[parts.length - 1][0].toUpperCase()}.`
        }
      })
    }
  }

  return eligible.map((b: any) => {
    const isCustomer = b.customer_id === user.id
    const counterpartyId = isCustomer ? b.worker_id : b.customer_id
    let counterpartyName = isCustomer ? 'Assigned Artisan' : 'Customer'

    if (counterpartyId) {
      if (isCustomer && workerNameMap[counterpartyId]) {
        counterpartyName = workerNameMap[counterpartyId]
      } else if (!isCustomer && customerNameMap[counterpartyId]) {
        counterpartyName = customerNameMap[counterpartyId]
      }
    }

    return {
      bookingId: b.id,
      categoryId: b.category_id,
      categoryName: resolveTradeLabel(b.category_id),
      bookingStatus: b.status,
      scheduledAt: b.scheduled_at,
      counterpartyName,
      counterpartyId,
      createdAt: b.created_at,
    }
  })
}

/**
 * Submits a user suggestion to public.suggestions.
 * Strictly verifies caller session and enforces input validation under RLS.
 */
export async function submitSupportSuggestion(
  submission: SuggestionSubmission
): Promise<CreateSuggestionResult> {
  const supabase = getSupabaseClient()

  // 1. Verify caller session
  const { data: sessionData } = await supabase.auth.getSession()
  const user = sessionData?.session?.user
  if (!user) {
    return {
      success: false,
      error: 'You must be signed in to submit platform feedback.',
    }
  }

  // 2. Validate input fields
  const trimmedMessage = (submission.message || '').trim()
  if (trimmedMessage.length < 10) {
    return {
      success: false,
      error: 'Please describe your suggestion in at least 10 characters.',
    }
  }

  if (trimmedMessage.length > 2000) {
    return {
      success: false,
      error: 'Suggestion description exceeds the maximum length of 2000 characters.',
    }
  }

  const validCategories = ['app_experience', 'new_feature', 'service_coverage', 'other']
  if (!validCategories.includes(submission.category)) {
    return {
      success: false,
      error: 'Please select a valid suggestion category.',
    }
  }

  // 3. Authoritative insert into public.suggestions
  const { data: inserted, error: insertError } = await (supabase.from('suggestions') as any)
    .insert({
      submitted_by: user.id,
      category: submission.category,
      message: trimmedMessage,
      status: 'open',
    })
    .select('id, submitted_by, category, message, status, resolution_note, created_at, updated_at, resolved_at')
    .single()

  if (insertError || !inserted) {
    console.warn('[SupportService] Error inserting suggestion:', insertError?.message)
    return {
      success: false,
      error: 'Unable to submit your suggestion at this moment. Please try again.',
    }
  }

  return {
    success: true,
    suggestion: inserted as SuggestionItem,
  }
}

/**
 * Fetches suggestions submitted by the caller under RLS isolation.
 */
export async function fetchUserSuggestions(): Promise<SuggestionItem[]> {
  const supabase = getSupabaseClient()

  const { data: sessionData } = await supabase.auth.getSession()
  const user = sessionData?.session?.user
  if (!user) return []

  const { data, error } = await (supabase.from('suggestions') as any)
    .select('id, submitted_by, category, message, status, resolution_note, created_at, updated_at, resolved_at')
    .eq('submitted_by', user.id)
    .order('created_at', { ascending: false })

  if (error || !data) {
    console.warn('[SupportService] Error fetching user suggestions:', error?.message)
    return []
  }

  return data as SuggestionItem[]
}

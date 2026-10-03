/**
 * Admin Support Service
 * Authoritative admin operations for public.complaints and public.suggestions.
 * Relies strictly on Supabase client RLS with public.is_admin() server authorization.
 * No service-role bypass; no mutations to payments, quotes, or bookings.
 */

import { getSupabaseClient } from '@/lib/supabase'
import {
  AdminComplaint,
  AdminSuggestion,
  AdminComplaintFilter,
  AdminSuggestionFilter,
  AdminUserProfile,
  UpdateComplaintParams,
  UpdateSuggestionParams,
} from '../types'

/**
 * Helper to fetch profiles for an array of user IDs under admin RLS.
 */
async function fetchProfilesMap(userIds: string[]): Promise<Map<string, AdminUserProfile>> {
  const profileMap = new Map<string, AdminUserProfile>()
  const uniqueIds = Array.from(new Set(userIds.filter(Boolean)))
  if (uniqueIds.length === 0) return profileMap

  const supabase = getSupabaseClient()
  const { data, error } = await (supabase.from('profiles') as any)
    .select('id, full_name, phone, role')
    .in('id', uniqueIds)

  if (error) {
    console.warn('[AdminSupportService] Error fetching user profiles:', error.message)
    return profileMap
  }

  if (data) {
    for (const p of data) {
      profileMap.set(p.id, {
        id: p.id,
        full_name: p.full_name || null,
        phone: p.phone || null,
        role: p.role || null,
      })
    }
  }

  return profileMap
}

/**
 * Fetches all complaints for platform administration, optionally filtered by status.
 */
export async function fetchAdminComplaints(
  statusFilter?: AdminComplaintFilter
): Promise<AdminComplaint[]> {
  const supabase = getSupabaseClient()

  let query = (supabase.from('complaints') as any)
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
        scheduled_at,
        created_at
      )
    `)
    .order('created_at', { ascending: false })

  if (statusFilter && statusFilter !== 'all') {
    query = query.eq('status', statusFilter)
  }

  const { data, error } = await query

  if (error || !data) {
    console.warn('[AdminSupportService] Error fetching complaints:', error?.message)
    return []
  }

  // Gather user IDs to hydrate caller & counterparty profiles
  const userIds: string[] = []
  for (const item of data) {
    if (item.opened_by) userIds.push(item.opened_by)
    if (item.against_user) userIds.push(item.against_user)
  }

  const profiles = await fetchProfilesMap(userIds)

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
    opened_by_user: profiles.get(item.opened_by),
    against_user_profile: profiles.get(item.against_user),
    booking: item.bookings
      ? {
          id: item.bookings.id,
          category_id: item.bookings.category_id,
          status: item.bookings.status,
          scheduled_at: item.bookings.scheduled_at,
          created_at: item.bookings.created_at,
        }
      : undefined,
  }))
}

/**
 * Fetches single complaint details for admin investigation.
 */
export async function fetchAdminComplaintDetails(id: string): Promise<AdminComplaint | null> {
  const supabase = getSupabaseClient()

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
        scheduled_at,
        created_at
      )
    `)
    .eq('id', id)
    .maybeSingle()

  if (error || !data) {
    console.warn('[AdminSupportService] Error fetching complaint details:', error?.message)
    return null
  }

  const profiles = await fetchProfilesMap([data.opened_by, data.against_user])

  return {
    id: data.id,
    booking_id: data.booking_id,
    opened_by: data.opened_by,
    against_user: data.against_user,
    status: data.status,
    reason: data.reason,
    resolution_note: data.resolution_note,
    created_at: data.created_at,
    resolved_at: data.resolved_at,
    opened_by_user: profiles.get(data.opened_by),
    against_user_profile: profiles.get(data.against_user),
    booking: data.bookings
      ? {
          id: data.bookings.id,
          category_id: data.bookings.category_id,
          status: data.bookings.status,
          scheduled_at: data.bookings.scheduled_at,
          created_at: data.bookings.created_at,
        }
      : undefined,
  }
}

/**
 * Updates status and resolution notes of a complaint.
 * Authorized under public.is_admin() RLS policy.
 */
export async function updateComplaintStatus(
  params: UpdateComplaintParams
): Promise<{ success: boolean; error?: string }> {
  const supabase = getSupabaseClient()

  const updates: Record<string, any> = {
    status: params.status,
    resolution_note: params.resolutionNote ? params.resolutionNote.trim() : null,
  }

  if (params.status === 'resolved' || params.status === 'dismissed') {
    updates.resolved_at = new Date().toISOString()
  } else {
    updates.resolved_at = null
  }

  const { error } = await (supabase.from('complaints') as any)
    .update(updates)
    .eq('id', params.id)

  if (error) {
    console.warn('[AdminSupportService] Error updating complaint:', error.message)
    return { success: false, error: error.message }
  }

  return { success: true }
}

/**
 * Fetches all platform suggestions, optionally filtered by status.
 */
export async function fetchAdminSuggestions(
  statusFilter?: AdminSuggestionFilter
): Promise<AdminSuggestion[]> {
  const supabase = getSupabaseClient()

  let query = (supabase.from('suggestions') as any)
    .select('id, submitted_by, category, message, status, resolution_note, created_at, updated_at, resolved_at')
    .order('created_at', { ascending: false })

  if (statusFilter && statusFilter !== 'all') {
    query = query.eq('status', statusFilter)
  }

  const { data, error } = await query

  if (error || !data) {
    console.warn('[AdminSupportService] Error fetching suggestions:', error?.message)
    return []
  }

  const submitterIds = data.map((s: any) => s.submitted_by).filter(Boolean)
  const profiles = await fetchProfilesMap(submitterIds)

  return data.map((item: any) => ({
    id: item.id,
    submitted_by: item.submitted_by,
    category: item.category,
    message: item.message,
    status: item.status,
    resolution_note: item.resolution_note,
    created_at: item.created_at,
    updated_at: item.updated_at,
    resolved_at: item.resolved_at,
    submitter: profiles.get(item.submitted_by),
  }))
}

/**
 * Fetches single suggestion details for admin review.
 */
export async function fetchAdminSuggestionDetails(id: string): Promise<AdminSuggestion | null> {
  const supabase = getSupabaseClient()

  const { data, error } = await (supabase.from('suggestions') as any)
    .select('id, submitted_by, category, message, status, resolution_note, created_at, updated_at, resolved_at')
    .eq('id', id)
    .maybeSingle()

  if (error || !data) {
    console.warn('[AdminSupportService] Error fetching suggestion details:', error?.message)
    return null
  }

  const profiles = await fetchProfilesMap([data.submitted_by])

  return {
    id: data.id,
    submitted_by: data.submitted_by,
    category: data.category,
    message: data.message,
    status: data.status,
    resolution_note: data.resolution_note,
    created_at: data.created_at,
    updated_at: data.updated_at,
    resolved_at: data.resolved_at,
    submitter: profiles.get(data.submitted_by),
  }
}

/**
 * Updates status and admin resolution note of a suggestion.
 * Authorized under public.is_admin() RLS policy.
 */
export async function updateSuggestionStatus(
  params: UpdateSuggestionParams
): Promise<{ success: boolean; error?: string }> {
  const supabase = getSupabaseClient()

  const updates: Record<string, any> = {
    status: params.status,
    resolution_note: params.resolutionNote ? params.resolutionNote.trim() : null,
    updated_at: new Date().toISOString(),
  }

  if (params.status === 'resolved' || params.status === 'dismissed') {
    updates.resolved_at = new Date().toISOString()
  } else {
    updates.resolved_at = null
  }

  const { error } = await (supabase.from('suggestions') as any)
    .update(updates)
    .eq('id', params.id)

  if (error) {
    console.warn('[AdminSupportService] Error updating suggestion:', error.message)
    return { success: false, error: error.message }
  }

  return { success: true }
}

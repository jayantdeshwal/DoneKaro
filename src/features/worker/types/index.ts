import type { JobId } from '@kaamgar/shared'
import type { BookingChangeRequest, BookingPaymentSummary } from '@/services/changeRequests'
import type { ReviewItem } from '@/services/reviews'

export interface WorkerProfileRow {
  bio: string
  experience_years: number
  approval_status: 'pending' | 'approved' | 'rejected'
  is_available: boolean
  rejection_reason: string | null
  rating?: number
  review_count?: number
  service_areas: string[]
}

export interface WorkerBookingRow {
  id: JobId
  category_id: string
  status: 'pending' | 'accepted' | 'rejected' | 'in_progress' | 'payment_pending' | 'completed' | 'cancelled' | 'disputed'
  scheduled_at: string
  address: string
  notes: string | null
  created_at: string
  customer_id: string
  customer?: {
    name: string
    phone?: string | null
    avatar?: string | null
  }
  changeRequests?: BookingChangeRequest[]
  paymentSummary?: BookingPaymentSummary
  review?: ReviewItem
}

export type TabFilter = 'all' | 'pending' | 'active' | 'completed'

export interface ContactModalData {
  isOpen: boolean
  name: string
  phone?: string | null
  avatar?: string | null
  roleLabel: string
  whatsappMessage?: string
  bookingContext?: {
    category?: string
    scheduledAt?: string
    address?: string
  }
}

export type RegistrationStepKey = 'personal' | 'work' | 'documents'

export interface RegistrationStep {
  key: RegistrationStepKey
  title: string
  desc: string
}

export interface RegistrationFormData {
  name: string
  phone: string
  email: string
  category: string
  experience: string
  bio: string
  areas: string[]
  idProof: File | null | undefined
  avatar: File | null | undefined
}

export interface RegistrationErrors {
  name?: string
  phone?: string
  category?: string
  experience?: string
  areas?: string
  idProof?: string
  avatar?: string
  terms?: string
  form?: string
}

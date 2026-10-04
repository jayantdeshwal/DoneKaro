import type { JobId } from '@kaamgar/shared'
import type { BookingChangeRequest, BookingPaymentSummary } from '@/services/changeRequests'

export interface CustomerBookingReview {
  id: string
  rating: number
  comment: string
  created_at: string
}

export type BookingStatus =
  | 'pending'
  | 'accepted'
  | 'in_progress'
  | 'completed'
  | 'payment_pending'
  | 'rejected'
  | 'cancelled'
  | 'disputed'

export interface BookingRow {
  id: JobId
  worker_id: string
  category_id: string
  status: BookingStatus
  scheduled_at: string
  address: string
  notes: string | null
  worker?: {
    name: string
    avatar: string | null
    phone?: string | null
  }
  hasReview?: boolean
  review?: CustomerBookingReview
  changeRequests?: BookingChangeRequest[]
  paymentSummary?: BookingPaymentSummary
}

export interface WorkerDirectoryRow {
  id: string
  name: string
  avatar: string | null
  phone?: string | null
  rating?: number
  reviews?: number
  experience?: number
}

export type BookingTab = 'all' | 'upcoming' | 'past'

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

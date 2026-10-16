import { JobId } from '@kaamgar/shared'
import type {
  AdminWorkerRow,
  AdminCustomerRow,
  AdminNotificationItem,
  AdminTeamMember,
} from '@/services/admin'

export type {
  AdminWorkerRow,
  AdminCustomerRow,
  AdminNotificationItem,
  AdminTeamMember,
}

export type BookingStatus =
  | 'pending'
  | 'accepted'
  | 'rejected'
  | 'in_progress'
  | 'payment_pending'
  | 'completed'
  | 'cancelled'
  | 'disputed'

export interface AdminBooking {
  id: JobId
  customer_id: string
  worker_id: string
  category_id: string
  status: BookingStatus
  scheduled_at: string | null
  created_at: string
  payment_amount: number | null
  payment_currency: string | null
  payment_status: 'unpaid' | 'pending' | 'paid' | 'failed' | 'cancelled' | null
  payment_method: string | null
  paid_at: string | null
  receipt_number: string | null
  payment_details_unavailable: boolean
  receipt_details_unavailable: boolean
  profile_details_unavailable: boolean
  customerName: string
  workerName: string
}

export interface AdminStats {
  workers: number | null
  customers: number | null
  bookings: number | null
  pendingApprovals: number | null
  bookingStatusCounts: Record<BookingStatus, number | null>
}

export type AdminTabType =
  | 'dashboard'
  | 'overview'
  | 'workers'
  | 'customers'
  | 'bookings'
  | 'notifications'
  | 'admins'
  | 'management'

export interface ReviewWorkerRpc {
  rpc: (
    functionName: 'review_worker',
    params: { target_worker_id: string; decision: 'approved' | 'rejected'; decision_reason: string | null },
  ) => Promise<{ error: { message: string } | null }>
}

export interface ProfileToDelete {
  id: string
  name: string
  phone: string
  role: 'worker' | 'customer'
  statsHint?: string
}

export interface BookingTrendDay {
  dateStr: string
  label: string
  count: number
}

export interface BookingTrendsData {
  days: BookingTrendDay[]
  maxCount: number
  totalCount: number
  isSimulated: boolean
}

export interface CategoryDistributionItem {
  category: string
  count: number
  color: string
  pct: number
}

export interface LocalityDistributionItem {
  locality: string
  count: number
  percentage: number
}

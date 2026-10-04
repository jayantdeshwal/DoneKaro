import { BookingStatus } from '../types'

export const BOOKING_STATUS_OPTIONS: Array<{ key: BookingStatus; labelKey: string; fallback: string }> = [
  { key: 'pending', labelKey: 'admin.bookingStatus.pending', fallback: 'Pending' },
  { key: 'accepted', labelKey: 'admin.bookingStatus.accepted', fallback: 'Accepted' },
  { key: 'rejected', labelKey: 'admin.bookingStatus.rejected', fallback: 'Rejected' },
  { key: 'in_progress', labelKey: 'admin.bookingStatus.inProgress', fallback: 'In Progress' },
  { key: 'payment_pending', labelKey: 'admin.bookingStatus.paymentPending', fallback: 'Payment Pending' },
  { key: 'completed', labelKey: 'admin.bookingStatus.completed', fallback: 'Completed' },
  { key: 'cancelled', labelKey: 'admin.bookingStatus.cancelled', fallback: 'Cancelled' },
  { key: 'disputed', labelKey: 'admin.bookingStatus.disputed', fallback: 'Disputed' },
]

export function bookingStatusVariant(status: BookingStatus): 'success' | 'warning' | 'info' | 'danger' {
  if (status === 'completed') return 'success'
  if (status === 'pending' || status === 'payment_pending') return 'warning'
  if (status === 'accepted' || status === 'in_progress') return 'info'
  return 'danger'
}

export function displayMetric(value: number | null): string | number {
  return value == null ? '—' : value
}

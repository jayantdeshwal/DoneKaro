import { useTranslation } from 'react-i18next'
import { Card, Badge, Button } from '@kaamgar/ui'
import { Calendar, RefreshCw, Search, X, Eye } from 'lucide-react'
import { formatJobReference } from '@kaamgar/shared'
import type { AdminBooking, AdminStats, BookingStatus } from '../../types'
import { BOOKING_STATUS_OPTIONS, bookingStatusVariant } from '../../constants'

interface AdminBookingsTabProps {
  bookings: AdminBooking[]
  filteredBookings: AdminBooking[]
  isLoadingBookings: boolean
  bookingStatusFilter: 'all' | BookingStatus
  setBookingStatusFilter: (status: 'all' | BookingStatus) => void
  bookingSearch: string
  setBookingSearch: (val: string) => void
  stats: AdminStats | null
  loadBookings: () => Promise<void>
  setSelectedJobId: (id: string | null) => void
}

export function AdminBookingsTab({
  bookings,
  filteredBookings,
  isLoadingBookings,
  bookingStatusFilter,
  setBookingStatusFilter,
  bookingSearch,
  setBookingSearch,
  stats,
  loadBookings,
  setSelectedJobId,
}: AdminBookingsTabProps) {
  const { t } = useTranslation()

  return (
    <div className="space-y-4">
      {/* Dedicated Mobile Bookings Header */}
      <div className="md:hidden p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200/90 dark:border-zinc-800 shadow-sm flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-blue-500/15 border border-blue-500/30 flex items-center justify-center text-blue-500">
              <Calendar className="w-4 h-4" />
            </div>
            <h2 className="text-base font-black text-slate-900 dark:text-white">
              {t('admin.allBookings', 'All Bookings')}
            </h2>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-blue-500 text-white">
              {bookings.length} Total
            </span>
          </div>
          <p className="text-[11px] text-slate-500 dark:text-zinc-400 mt-1">
            Live booking dispatches and service orders in Muzaffarnagar
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={loadBookings}
          disabled={isLoadingBookings}
          className="p-2 rounded-xl border border-slate-200 dark:border-zinc-700"
        >
          <RefreshCw className={`w-4 h-4 ${isLoadingBookings ? 'animate-spin text-amber-500' : ''}`} />
        </Button>
      </div>

      <Card className="p-0 overflow-hidden bg-white dark:bg-zinc-900 border border-slate-200/90 dark:border-zinc-800 rounded-2xl shadow-sm">
        {/* Controls Bar */}
        <div className="p-4 border-b border-slate-200/90 dark:border-zinc-800 flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-slate-50/80 dark:bg-zinc-850/60">
          {/* Status Filter Pills */}
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-xs font-semibold text-slate-500 dark:text-zinc-400 uppercase mr-1">Status:</span>
            {([{ key: 'all', labelKey: '', fallback: 'All' }, ...BOOKING_STATUS_OPTIONS] as const).map(st => {
              const isSelected = bookingStatusFilter === st.key
              const count =
                st.key === 'all'
                  ? stats?.bookings
                  : stats?.bookingStatusCounts[st.key]

              return (
                <button
                  key={st.key}
                  onClick={() => setBookingStatusFilter(st.key)}
                  className={`px-3 py-1 text-xs font-medium rounded-full transition-colors flex items-center gap-1.5 ${
                    isSelected
                      ? 'bg-amber-500 text-slate-950 font-bold shadow-sm'
                      : 'bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-100'
                  }`}
                >
                  <span>{st.labelKey ? t(st.labelKey, st.fallback) : st.fallback}</span>
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                      isSelected
                        ? 'bg-slate-950/20 text-slate-950 font-bold'
                        : 'bg-slate-200 dark:bg-zinc-700 text-slate-500 dark:text-zinc-400'
                    }`}
                  >
                    {count == null ? '—' : count}
                  </span>
                </button>
              )
            })}
          </div>

          {/* Search Bar */}
          <div className="relative min-w-[280px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-zinc-500" />
            <input
              type="text"
              placeholder="Search by customer, worker, or service..."
              value={bookingSearch}
              onChange={e => setBookingSearch(e.target.value)}
              className="w-full bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-slate-900 dark:text-white rounded-xl pl-9 pr-8 py-2 text-xs placeholder:text-slate-400 dark:placeholder:text-zinc-500 focus:outline-none focus:border-amber-500 transition-colors"
            />
            {bookingSearch && (
              <button
                onClick={() => setBookingSearch('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 dark:text-zinc-500 dark:hover:text-zinc-200 text-xs p-1"
                title="Clear search"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Bookings Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-100/90 dark:bg-zinc-800/90 border-b border-slate-200/90 dark:border-zinc-800">
              <tr>
                <th className="px-6 py-3.5 text-left text-xs font-semibold text-slate-600 dark:text-zinc-400 uppercase tracking-wider">
                  Booking ID
                </th>
                <th className="px-6 py-3.5 text-left text-xs font-semibold text-slate-600 dark:text-zinc-400 uppercase tracking-wider">
                  Customer
                </th>
                <th className="px-6 py-3.5 text-left text-xs font-semibold text-slate-600 dark:text-zinc-400 uppercase tracking-wider">
                  Assigned Worker
                </th>
                <th className="px-6 py-3.5 text-left text-xs font-semibold text-slate-600 dark:text-zinc-400 uppercase tracking-wider">
                  Service
                </th>
                <th className="px-6 py-3.5 text-left text-xs font-semibold text-slate-600 dark:text-zinc-400 uppercase tracking-wider">
                  Scheduled
                </th>
                <th className="px-6 py-3.5 text-left text-xs font-semibold text-slate-600 dark:text-zinc-400 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3.5 text-right text-xs font-semibold text-slate-600 dark:text-zinc-400 uppercase tracking-wider">
                  {t('admin.jobDetails.viewJob', 'Job')}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-semantic-border-light">
              {isLoadingBookings ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-semantic-text-secondary">
                    <RefreshCw className="w-5 h-5 mx-auto animate-spin text-brand-400 mb-2" />
                    Loading bookings directory...
                  </td>
                </tr>
              ) : filteredBookings.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-semantic-text-secondary">
                    No bookings found matching your filters.
                  </td>
                </tr>
              ) : (
                filteredBookings.map(booking => (
                  <tr key={booking.id} className="hover:bg-surface-200/40 transition-colors">
                    <td className="px-6 py-4 font-mono text-xs text-brand-400 font-bold">
                      {formatJobReference(booking.id)}
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-semantic-text-primary">
                      {booking.customerName}
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-semantic-text-primary">
                      {booking.workerName}
                    </td>
                    <td className="px-6 py-4 text-sm text-semantic-text-primary capitalize">
                      {booking.category_id}
                    </td>
                    <td className="px-6 py-4 text-sm text-semantic-text-secondary">
                      {booking.scheduled_at
                        ? new Date(booking.scheduled_at).toLocaleString('en-IN', {
                            dateStyle: 'medium',
                            timeStyle: 'short',
                          })
                        : 'Immediate Dispatch'}
                    </td>
                    <td className="px-6 py-4">
                      <Badge
                        variant={bookingStatusVariant(booking.status)}
                        className="capitalize"
                      >
                        {t(
                          BOOKING_STATUS_OPTIONS.find(status => status.key === booking.status)?.labelKey ?? '',
                          BOOKING_STATUS_OPTIONS.find(status => status.key === booking.status)?.fallback ?? booking.status,
                        )}
                      </Badge>
                      {booking.payment_details_unavailable ? (
                        <p className="mt-1 text-xs font-semibold text-amber-600 dark:text-amber-300">Payment details unavailable</p>
                      ) : booking.payment_status ? (
                        <p className="mt-1 text-xs font-semibold text-semantic-text-secondary">
                          {booking.payment_currency ?? 'INR'} {booking.payment_amount?.toFixed(2)} · {t(`bookings.paymentStatuses.${booking.payment_status}`, booking.payment_status)}
                          {booking.payment_method ? ` · ${booking.payment_method === 'cash' ? t('bookings.paymentMethodCash', 'Cash') : 'Historical payment'}` : ''}
                          {booking.paid_at ? ` · ${new Date(booking.paid_at).toLocaleString('en-IN')}` : ''}
                          {booking.receipt_number ? ` · ${t('bookings.receiptNumber', 'Receipt')}: ${booking.receipt_number}` : ''}
                          {booking.receipt_details_unavailable ? ' · Receipt details unavailable' : ''}
                        </p>
                      ) : booking.receipt_details_unavailable ? (
                        <p className="mt-1 text-xs font-semibold text-amber-600 dark:text-amber-300">Receipt details unavailable</p>
                      ) : null}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedJobId(booking.id)}
                        title={t('admin.jobDetails.viewJob', 'View Job')}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}

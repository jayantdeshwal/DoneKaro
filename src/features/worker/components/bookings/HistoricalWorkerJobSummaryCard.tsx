import React from 'react'
import { useTranslation } from 'react-i18next'
import {
  Calendar,
  CheckCircle2,
  ChevronRight,
  Clock,
  User,
  XCircle,
  AlertCircle,
  FileText,
  Sparkles,
  ShieldAlert,
} from 'lucide-react'
import {
  CATEGORIES,
  formatJobReference,
  getCategoryById,
  getCategoryName,
  getServiceById,
} from '@kaamgar/shared'
import { Badge } from '@/ui'
import type { SupportTab } from '@/features/support'
import type { WorkerBookingRow } from '../../types'

export interface HistoricalWorkerJobSummaryCardProps {
  booking: WorkerBookingRow
  isRepeatCustomer?: boolean
  onViewDetails: (booking: WorkerBookingRow) => void
  onViewReceipt?: (booking: WorkerBookingRow) => void
  onViewReviews?: (booking: WorkerBookingRow) => void
  onOpenSupport?: (options: { bookingId?: string; defaultTab?: SupportTab }) => void
}

function getComplaintStatusMeta(status: string, isHindi: boolean) {
  switch (status) {
    case 'open':
      return {
        label: isHindi ? 'शिकायत: खुली है' : 'Open',
        cls: 'bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/30 hover:bg-amber-500/20',
      }
    case 'investigating':
      return {
        label: isHindi ? 'जाँच जारी' : 'Under Review',
        cls: 'bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-500/30 hover:bg-blue-500/20',
      }
    case 'resolved':
      return {
        label: isHindi ? 'समाधान पूर्ण' : 'Resolved',
        cls: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/30 hover:bg-emerald-500/20',
      }
    case 'dismissed':
    default:
      return {
        label: isHindi ? 'खारिज' : 'Dismissed',
        cls: 'bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-300 border-slate-200 dark:border-zinc-700 hover:bg-slate-200/70 dark:hover:bg-zinc-700',
      }
  }
}

export const HistoricalWorkerJobSummaryCard: React.FC<HistoricalWorkerJobSummaryCardProps> = ({
  booking,
  isRepeatCustomer = false,
  onViewDetails,
  onViewReceipt,
  onViewReviews,
  onOpenSupport,
}) => {
  const { t, i18n } = useTranslation()
  const isHindi = i18n.language === 'hi'
  const lang = isHindi ? 'hi' : 'en'

  if (!booking || !booking.id) {
    return (
      <div className="p-4 rounded-xl bg-surface-100 border border-semantic-border-light shadow-sm text-center py-6 text-sm text-semantic-text-secondary">
        {t('workerDashboard.jobUnavailable', 'This job is no longer available')}
      </div>
    )
  }

  const serviceObj = getServiceById(booking.category_id)
  const catObj = getCategoryById(booking.category_id) || CATEGORIES.find(c => c.id === booking.category_id)
  const serviceName = serviceObj
    ? getCategoryName(serviceObj, lang)
    : catObj
    ? getCategoryName(catObj, lang)
    : booking.category_id

  const jobReference = formatJobReference(booking.id)

  const scheduledDate = booking.scheduled_at ? new Date(booking.scheduled_at) : null
  const isValidDate = scheduledDate && !isNaN(scheduledDate.getTime())
  const formattedDate = isValidDate
    ? scheduledDate.toLocaleDateString(isHindi ? 'hi-IN' : 'en-IN', {
        weekday: 'short',
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      })
    : t('common.dateUnavailable', 'Date not available')

  const summary = booking.paymentSummary
  const finalAmount = summary?.final_payable_amount ?? summary?.initial_quote_amount ?? null
  const isPaid = summary?.payment_status === 'paid'

  const isCompleted = booking.status === 'completed'
  const isCancelled = booking.status === 'cancelled'
  const isRejected = booking.status === 'rejected'

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      onViewDetails(booking)
    }
  }

  const statusLabel = isCompleted
    ? isHindi
      ? 'पूरा हुआ'
      : 'Completed'
    : isCancelled
    ? t('bookings.status.cancelled', 'Cancelled')
    : isRejected
    ? t('bookings.status.rejected', 'Rejected')
    : booking.status

  const complaintMeta = booking.userComplaint
    ? getComplaintStatusMeta(booking.userComplaint.status, isHindi)
    : null

  return (
    <div
      id={`booking-${booking.id}`}
      role="button"
      tabIndex={0}
      onClick={() => onViewDetails(booking)}
      onKeyDown={handleKeyDown}
      aria-label={t('bookings.viewDetailsFor', {
        job: jobReference,
        defaultValue: `View details for ${jobReference}`,
      })}
      className="p-3.5 sm:p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200/90 dark:border-zinc-800 hover:border-amber-500/50 dark:hover:border-amber-500/40 hover:bg-slate-50/80 dark:hover:bg-zinc-850/80 transition-all duration-150 cursor-pointer shadow-xs group"
    >
      {/* Top Row (Identical 2-column summary layout) */}
      <div className="flex items-center justify-between gap-3 sm:gap-4">
        {/* Left Group: Status Icon + Service Name + Date · Customer Name */}
        <div className="flex items-center gap-3 sm:gap-3.5 min-w-0 flex-1">
          <div
            className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center shrink-0 shadow-xs ${
              isCompleted
                ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                : isCancelled
                ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/20'
                : isRejected
                ? 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/20'
                : 'bg-slate-100 dark:bg-zinc-800 text-slate-500 border border-slate-200 dark:border-zinc-700'
            }`}
          >
            {isCompleted ? (
              <CheckCircle2 className="w-5 h-5" />
            ) : isCancelled ? (
              <XCircle className="w-5 h-5" />
            ) : isRejected ? (
              <AlertCircle className="w-5 h-5" />
            ) : (
              <Clock className="w-5 h-5" />
            )}
          </div>

          <div className="min-w-0 flex-1">
            <div className="mb-0.5 min-w-0">
              <h3 className="font-bold text-sm sm:text-base text-slate-900 dark:text-white truncate group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
                {serviceName}
              </h3>
            </div>

            <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-zinc-400 flex-wrap">
              <span className="inline-flex items-center gap-1 shrink-0">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                <span>{formattedDate}</span>
              </span>
              <span className="text-slate-300 dark:text-zinc-700">·</span>
              <span className="inline-flex items-center gap-1 truncate max-w-[140px] sm:max-w-[200px]">
                <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span className="truncate">
                  {booking.customer?.name || t('bookings.customer', 'Customer')}
                </span>
              </span>
              {isRepeatCustomer && (
                <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-400 text-[9px] font-bold border border-amber-500/20 shrink-0">
                  <Sparkles className="w-2.5 h-2.5" />
                  <span>{t('workerDashboard.repeatCustomer', 'Repeat')}</span>
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Right Group: Amount, Status Badge, Receipt Button & Chevron */}
        <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
          <div className="flex flex-col items-end gap-1">
            {finalAmount !== null && finalAmount > 0 && (
              <span className="text-xs sm:text-sm font-extrabold text-slate-900 dark:text-white">
                ₹{Math.round(finalAmount)}
              </span>
            )}

            <Badge
              variant={
                isCompleted ? 'success' : isCancelled ? 'default' : isRejected ? 'danger' : 'outline'
              }
              size="sm"
              className="text-[10px] font-bold tracking-tight"
            >
              {statusLabel}
            </Badge>
          </div>

          {isCompleted && isPaid && onViewReceipt && (
            <button
              type="button"
              onClick={e => {
                e.stopPropagation()
                onViewReceipt(booking)
              }}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 dark:text-amber-300 text-xs font-bold border border-amber-500/30 transition-colors cursor-pointer"
              title={t('bookings.viewReceipt', 'View Receipt')}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>{isHindi ? 'रसीद' : 'Receipt'}</span>
            </button>
          )}

          <div
            className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-zinc-800 text-slate-500 dark:text-zinc-400 group-hover:bg-amber-500 group-hover:text-slate-950 flex items-center justify-center transition-all duration-150 shrink-0 shadow-2xs"
            title={t('bookings.viewDetailsFor', {
              job: jobReference,
              defaultValue: `View details for ${jobReference}`,
            })}
          >
            <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
          </div>
        </div>
      </div>

      {/* Bottom Action Strip (50/50 split below subtle divider for completed jobs) */}
      {isCompleted && (
        <div className="grid grid-cols-2 gap-2 pt-3 mt-3 border-t border-slate-100 dark:border-zinc-800/80">
          {/* Left Slot: Rating / Review */}
          <div className="min-w-0">
            {booking.review ? (
              <button
                type="button"
                onClick={e => {
                  e.stopPropagation()
                  if (onViewReviews) {
                    onViewReviews(booking)
                  } else {
                    onViewDetails(booking)
                  }
                }}
                className="w-full min-h-[38px] px-2.5 py-1.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/25 text-emerald-700 dark:text-emerald-300 text-xs font-semibold flex items-center justify-center gap-1 transition-colors cursor-pointer"
              >
                <span className="text-amber-500">★</span>
                <span className="truncate">
                  {booking.review.rating.toFixed(1)} {isHindi ? 'रिव्यू मिला' : 'Rated'}
                </span>
              </button>
            ) : (
              <div className="w-full min-h-[38px] px-2.5 py-1.5 rounded-xl border border-slate-200/70 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-800/30 text-slate-500 dark:text-zinc-400 text-xs font-medium flex items-center justify-center">
                <span className="truncate">{isHindi ? 'रिव्यू पेंडिंग' : 'Awaiting Review'}</span>
              </div>
            )}
          </div>

          {/* Right Slot: Complaint */}
          <div className="min-w-0">
            {booking.userComplaint && complaintMeta ? (
              <button
                type="button"
                onClick={e => {
                  e.stopPropagation()
                  onOpenSupport?.({ bookingId: booking.id, defaultTab: 'history' })
                }}
                className={`w-full min-h-[38px] px-2.5 py-1.5 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${complaintMeta.cls}`}
              >
                <ShieldAlert className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">{complaintMeta.label}</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={e => {
                  e.stopPropagation()
                  onOpenSupport?.({ bookingId: booking.id, defaultTab: 'complaint' })
                }}
                className="w-full min-h-[38px] px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-zinc-700/80 bg-slate-50/70 dark:bg-zinc-800/50 hover:bg-rose-50 dark:hover:bg-rose-950/30 hover:border-rose-300 dark:hover:border-rose-800 text-slate-600 dark:text-zinc-300 hover:text-rose-600 dark:hover:text-rose-400 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <ShieldAlert className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">{isHindi ? 'शिकायत' : 'Report Issue'}</span>
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

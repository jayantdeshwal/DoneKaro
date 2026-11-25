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
  Star,
  ShieldAlert,
} from 'lucide-react'
import { Badge } from '@kaamgar/ui'
import { formatJobReference } from '@kaamgar/shared'
import type { SupportTab } from '@/features/support'
import type { BookingRow } from '../types'
import { statusConfig } from '../constants/statusConfig'
import { formatBookingDate, resolveServiceAndCategory } from '../utils/bookingFormat'

interface HistoricalBookingSummaryCardProps {
  booking: BookingRow
  onOpenDetails: (booking: BookingRow) => void
  onOpenReceipt?: (booking: BookingRow) => void
  onOpenReviewModal?: (booking: BookingRow) => void
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

export function HistoricalBookingSummaryCard({
  booking,
  onOpenDetails,
  onOpenReceipt,
  onOpenReviewModal,
  onOpenSupport,
}: HistoricalBookingSummaryCardProps) {
  const { t, i18n } = useTranslation()
  const isHindi = i18n.language === 'hi'
  const { serviceName, categoryName } = resolveServiceAndCategory(booking.category_id, i18n.language)
  const jobReference = formatJobReference(booking.id)
  const currentStatusConfig = statusConfig[booking.status] ?? statusConfig.completed

  const formattedDate = formatBookingDate(booking.scheduled_at, i18n.language)

  const summary = booking.paymentSummary
  const finalAmount = summary?.final_payable_amount ?? summary?.initial_quote_amount ?? null
  const isPaid = summary?.payment_status === 'paid'

  const isCompleted = booking.status === 'completed'
  const isCancelled = booking.status === 'cancelled'
  const isRejected = booking.status === 'rejected'

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      onOpenDetails(booking)
    }
  }

  const complaintMeta = booking.userComplaint
    ? getComplaintStatusMeta(booking.userComplaint.status, isHindi)
    : null

  return (
    <div
      id={`booking-${booking.id}`}
      role="button"
      tabIndex={0}
      onClick={() => onOpenDetails(booking)}
      onKeyDown={handleKeyDown}
      aria-label={t('bookings.viewDetailsFor', {
        job: jobReference,
        defaultValue: `View details for ${jobReference}`,
      })}
      className="p-3.5 sm:p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200/90 dark:border-zinc-800 hover:border-amber-500/50 dark:hover:border-amber-500/40 hover:bg-slate-50/80 dark:hover:bg-zinc-850/80 transition-all duration-150 cursor-pointer shadow-xs group"
    >
      {/* Top Row (Identical 2-column summary layout) */}
      <div className="flex items-center justify-between gap-3 sm:gap-4">
        {/* Left Group: Status Icon + Service Name + Date · Partner Name */}
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
                  {booking.worker?.name || categoryName || t('bookings.artisan', 'Artisan')}
                </span>
              </span>
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
              {isCompleted
                ? isHindi
                  ? 'पूरा हुआ'
                  : 'Completed'
                : t(`booking.status.${booking.status}`, currentStatusConfig.label)}
            </Badge>
          </div>

          {isCompleted && isPaid && onOpenReceipt && (
            <button
              type="button"
              onClick={e => {
                e.stopPropagation()
                onOpenReceipt(booking)
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
            {!booking.hasReview ? (
              <button
                type="button"
                onClick={e => {
                  e.stopPropagation()
                  onOpenReviewModal?.(booking)
                }}
                className="w-full min-h-[38px] px-2.5 py-1.5 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/40 text-amber-700 dark:text-amber-300 text-xs font-bold flex items-center justify-center gap-1.5 transition-all active:scale-95 cursor-pointer"
              >
                <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500 animate-bounce" />
                <span className="truncate">{isHindi ? 'रेटिंग दें' : 'Rate Worker'}</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={e => {
                  e.stopPropagation()
                  onOpenDetails(booking)
                }}
                className="w-full min-h-[38px] px-2.5 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/25 text-emerald-700 dark:text-emerald-300 text-xs font-semibold flex items-center justify-center gap-1 cursor-pointer"
              >
                <span className="text-amber-500">★</span>
                <span className="truncate">
                  {booking.review
                    ? `${booking.review.rating.toFixed(1)} ${isHindi ? 'रेटेड' : 'Rated'}`
                    : isHindi
                    ? 'रेटेड'
                    : 'Rated'}
                </span>
              </button>
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

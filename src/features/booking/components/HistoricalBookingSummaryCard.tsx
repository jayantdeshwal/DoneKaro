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
} from 'lucide-react'
import { Badge } from '@kaamgar/ui'
import { formatJobReference } from '@kaamgar/shared'
import type { BookingRow } from '../types'
import { statusConfig } from '../constants/statusConfig'
import { formatBookingDate, formatBookingTime, resolveServiceAndCategory } from '../utils/bookingFormat'

interface HistoricalBookingSummaryCardProps {
  booking: BookingRow
  onOpenDetails: (booking: BookingRow) => void
  onOpenReceipt?: (booking: BookingRow) => void
}

export function HistoricalBookingSummaryCard({
  booking,
  onOpenDetails,
  onOpenReceipt,
}: HistoricalBookingSummaryCardProps) {
  const { t, i18n } = useTranslation()
  const { serviceName, categoryName } = resolveServiceAndCategory(booking.category_id, i18n.language)
  const jobReference = formatJobReference(booking.id)
  const currentStatusConfig = statusConfig[booking.status] ?? statusConfig.completed

  const formattedDate = formatBookingDate(booking.scheduled_at, i18n.language)
  const formattedTime = formatBookingTime(booking.scheduled_at, i18n.language)

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

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onOpenDetails(booking)}
      onKeyDown={handleKeyDown}
      aria-label={t('bookings.viewDetailsFor', {
        job: jobReference,
        defaultValue: `View details for ${jobReference}`,
      })}
      className="p-3.5 sm:p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200/90 dark:border-zinc-800 hover:border-amber-500/50 dark:hover:border-amber-500/40 hover:bg-slate-50/80 dark:hover:bg-zinc-850/80 transition-all duration-150 cursor-pointer shadow-xs group flex items-center justify-between gap-3 sm:gap-4"
    >
      {/* Left Group: Icon + Summary Information */}
      <div className="flex items-center gap-3 sm:gap-3.5 min-w-0 flex-1">
        {/* Status Cue Icon */}
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

        {/* Content Details */}
        <div className="min-w-0 flex-1">
          {/* Top Line: Service Name + Job ID Badge */}
          <div className="flex items-center gap-2 flex-wrap mb-0.5">
            <h3 className="font-bold text-sm sm:text-base text-slate-900 dark:text-white truncate group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
              {serviceName}
            </h3>
            <span className="font-mono text-[10px] sm:text-[11px] font-bold text-slate-500 dark:text-zinc-400 px-1.5 py-0.5 rounded-md bg-slate-100 dark:bg-zinc-800 border border-slate-200/80 dark:border-zinc-700 shrink-0">
              {jobReference}
            </span>
          </div>

          {/* Subtitle / Meta Line: Date/Time & Worker Name */}
          <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-zinc-400 flex-wrap">
            <span className="inline-flex items-center gap-1 shrink-0">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              <span>{formattedDate}</span>
            </span>
            <span className="text-slate-300 dark:text-zinc-700">•</span>
            {booking.worker?.name ? (
              <span className="inline-flex items-center gap-1 truncate max-w-[140px] sm:max-w-[200px]">
                <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span className="truncate">{booking.worker.name}</span>
              </span>
            ) : (
              <span className="truncate">{categoryName}</span>
            )}
          </div>
        </div>
      </div>

      {/* Right Group: Price, Status Badge & Chevron Affordance */}
      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
        <div className="flex flex-col items-end gap-1">
          {/* Price amount if present */}
          {finalAmount !== null && finalAmount > 0 && (
            <span className="text-xs sm:text-sm font-extrabold text-slate-900 dark:text-white">
              ₹{finalAmount}
            </span>
          )}

          {/* Status Badge */}
          <Badge
            variant={
              isCompleted ? 'success' : isCancelled ? 'default' : isRejected ? 'danger' : 'outline'
            }
            size="sm"
            className="text-[10px] font-bold tracking-tight"
          >
            {t(`booking.status.${booking.status}`, currentStatusConfig.label)}
          </Badge>
        </div>

        {/* Receipt Quick Action Button if Completed & Paid */}
        {isCompleted && isPaid && onOpenReceipt && (
          <button
            type="button"
            onClick={e => {
              e.stopPropagation()
              onOpenReceipt(booking)
            }}
            className="hidden md:flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 dark:text-amber-300 text-xs font-bold border border-amber-500/30 transition-colors cursor-pointer"
            title={t('bookings.viewReceipt', 'View Receipt')}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>{t('bookings.receiptNumber', 'Receipt')}</span>
          </button>
        )}

        {/* Prominent Chevron Affordance Button */}
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
  )
}

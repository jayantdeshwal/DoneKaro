import { useTranslation } from 'react-i18next'
import {
  Calendar,
  CheckCircle2,
  Clock,
  FileText,
  MapPin,
  MessageSquare,
  Phone,
  RefreshCw,
  Star,
  UserCheck,
} from 'lucide-react'
import { Avatar, Button, Modal } from '@kaamgar/ui'
import { formatJobReference } from '@kaamgar/shared'
import type { BookingRow } from '../../types'
import { formatBookingDate, formatBookingTime, resolveServiceAndCategory } from '../../utils/bookingFormat'

interface CompletedJobDetailsModalProps {
  booking: BookingRow | null
  onClose: () => void
  onOpenContact: (booking: BookingRow) => void
  onOpenReceipt: (booking: BookingRow) => void
  onRateWorker: (booking: BookingRow) => void
  onBookAgain: (booking: BookingRow) => void
}

export function CompletedJobDetailsModal({
  booking,
  onClose,
  onOpenContact,
  onOpenReceipt,
  onRateWorker,
  onBookAgain,
}: CompletedJobDetailsModalProps) {
  const { t, i18n } = useTranslation()

  if (!booking) return null

  const { serviceName, categoryName } = resolveServiceAndCategory(booking.category_id, i18n.language)
  const summary = booking.paymentSummary
  const jobReference = formatJobReference(booking.id)
  const quoteAmount = summary?.initial_quote_amount ?? 0
  const additionalAmount = summary?.approved_additional_amount ?? 0
  const finalAmount = summary?.final_payable_amount ?? (quoteAmount + additionalAmount)
  const paidDate = summary?.receipt_paid_at || summary?.paid_at
    ? new Date(summary.receipt_paid_at || summary.paid_at || '').toLocaleString(
        i18n.language === 'hi' ? 'hi-IN' : 'en-IN',
        {
          dateStyle: 'medium',
          timeStyle: 'short',
        }
      )
    : formatBookingDate(booking.scheduled_at, i18n.language)
  const review = booking.review

  return (
    <Modal
      isOpen={Boolean(booking)}
      onClose={onClose}
      title={t('bookings.completedJobDetails', 'Completed Service Details')}
      size="md"
    >
      <div className="space-y-4 text-xs">
        {/* Job Identity & Status */}
        <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-zinc-800/60 border border-slate-200 dark:border-zinc-700/60">
          <div>
            <span className="text-[11px] text-slate-500 dark:text-zinc-400 block">{t('bookings.jobId', 'Job ID')}</span>
            <span className="font-mono font-bold text-sm text-slate-900 dark:text-white">{jobReference}</span>
            <p className="text-[11px] text-slate-600 dark:text-zinc-400 mt-0.5">
              {serviceName} {categoryName && `• ${categoryName}`}
            </p>
          </div>
          <div className="text-right">
            <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
              <CheckCircle2 className="w-3.5 h-3.5" />
              {t('booking.status.completed', 'Completed')}
            </span>
          </div>
        </div>

        {/* Worker Information & Recognition Badge */}
        <div className="p-3.5 rounded-xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800">
          <span className="text-[11px] font-semibold text-slate-500 dark:text-zinc-400 block mb-2">{t('bookings.worker', 'Artisan')}</span>
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <Avatar
                name={booking.worker?.name || t('bookings.artisan', 'Artisan')}
                size="md"
                src={booking.worker?.avatar || undefined}
              />
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-sm text-slate-900 dark:text-white">
                    {booking.worker?.name || t('bookings.artisan', 'Artisan')}
                  </span>
                  <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/25">
                    <UserCheck className="w-3 h-3 text-amber-600 dark:text-amber-400" />
                    {t('bookings.previouslyHired', 'Previously Hired')}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-zinc-400 mt-0.5">
                  {t('bookings.verifiedArtisan', 'Verified Jugnu Artisan')}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onOpenContact(booking)}
                className="text-xs p-1.5 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/10 cursor-pointer"
                title={t('bookings.callWorker', 'Call')}
              >
                <Phone className="w-3.5 h-3.5" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onOpenContact(booking)}
                className="text-xs p-1.5 text-amber-600 dark:text-amber-400 border-amber-500/30 hover:bg-amber-500/10 cursor-pointer"
                title={t('bookings.chatWorker', 'WhatsApp')}
              >
                <MessageSquare className="w-3.5 h-3.5" />
              </Button>
            </div>
          </div>
        </div>

        {/* Service Schedule & Location */}
        <div className="p-3.5 rounded-xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 space-y-2">
          <span className="text-[11px] font-semibold text-slate-500 dark:text-zinc-400 block">{t('bookings.serviceLocation', 'Schedule & Location')}</span>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="flex items-center gap-2">
              <Calendar className="w-3.5 h-3.5 text-amber-500 shrink-0" />
              <span>{formatBookingDate(booking.scheduled_at, i18n.language)}</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-3.5 h-3.5 text-amber-500 shrink-0" />
              <span>{formatBookingTime(booking.scheduled_at, i18n.language)}</span>
            </div>
          </div>
          <div className="flex items-start gap-2 pt-1">
            <MapPin className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
            <span className="text-slate-700 dark:text-zinc-300 font-medium">{booking.address}</span>
          </div>
          {booking.notes && (
            <div className="flex items-start gap-2 pt-1 border-t border-slate-100 dark:border-zinc-800 text-[11px] text-slate-600 dark:text-zinc-400">
              <FileText className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold text-slate-700 dark:text-zinc-300">{t('bookings.serviceNotes', 'Customer Request Notes')}: </span>
                {booking.notes}
              </div>
            </div>
          )}
        </div>

        {/* Authoritative Financial Breakdown */}
        <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-zinc-800/50 border border-slate-200 dark:border-zinc-700/60 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-700 dark:text-zinc-300 flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
              {t('bookings.paymentSummary', 'Payment Summary')}
            </span>
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-500/10 px-2 py-0.5 rounded-md">
              {t('bookings.paymentMethodCash', 'Cash')}
            </span>
          </div>

          <div className="space-y-1.5 pt-1 text-slate-600 dark:text-zinc-400">
            <div className="flex justify-between">
              <span>{t('bookings.initialQuote', 'Initial Worker Quote')}</span>
              <span>₹{quoteAmount.toFixed(2)}</span>
            </div>
            {additionalAmount > 0 && (
              <div className="flex justify-between">
                <span>{t('bookings.approvedAdditionalCharges', 'Approved Additional Charges')}</span>
                <span>+₹{additionalAmount.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between items-center pt-1.5 border-t border-slate-200 dark:border-zinc-700 font-bold">
              <span className="text-slate-900 dark:text-white text-xs">{t('bookings.totalPaid', 'Final Total Paid')}</span>
              <span className="text-emerald-600 dark:text-emerald-400 text-sm">₹{finalAmount.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-[11px] text-slate-500 dark:text-zinc-400 pt-0.5">
              <span>{t('bookings.paidAt', 'Paid at')}</span>
              <span>{paidDate}</span>
            </div>
          </div>

          {summary?.receipt_number && (
            <div className="pt-2 border-t border-slate-200 dark:border-zinc-700 flex justify-end">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onOpenReceipt(booking)}
                className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/10 flex items-center gap-1.5 cursor-pointer"
              >
                <FileText className="w-3.5 h-3.5" />
                {t('bookings.viewReceipt', 'View Receipt')} ({summary.receipt_number})
              </Button>
            </div>
          )}
        </div>

        {/* Review History / Rating */}
        <div className="p-3.5 rounded-xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800">
          <span className="text-[11px] font-semibold text-slate-500 dark:text-zinc-400 block mb-1.5">
            {t('bookings.yourReview', 'Your Rating & Feedback')}
          </span>
          {booking.hasReview && review ? (
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <div className="flex items-center text-amber-500">
                  {Array.from({ length: 5 }).map((_, idx) => (
                    <Star
                      key={idx}
                      className={`w-3.5 h-3.5 ${idx < review.rating ? 'fill-amber-400 text-amber-400' : 'text-slate-300 dark:text-zinc-700'}`}
                    />
                  ))}
                </div>
                <span className="font-bold text-xs text-slate-900 dark:text-white">{review.rating} / 5</span>
                {review.created_at && (
                  <span className="text-[11px] text-slate-400 dark:text-zinc-500">
                    • {new Date(review.created_at).toLocaleDateString(i18n.language === 'hi' ? 'hi-IN' : 'en-IN')}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-700 dark:text-zinc-300 mt-1 italic">
                "{review.comment || t('bookings.noComment', 'Rated without comment')}"
              </p>
            </div>
          ) : (
            <div className="flex items-center justify-between gap-2">
              <p className="text-[11px] text-slate-500 dark:text-zinc-400">
                {t('bookings.notReviewedYet', 'Not reviewed yet')}
              </p>
              <Button
                variant="primary"
                size="sm"
                onClick={() => onRateWorker(booking)}
                className="text-xs font-bold flex items-center gap-1 bg-amber-500 hover:bg-amber-400 text-slate-950 cursor-pointer"
              >
                <Star className="w-3.5 h-3.5" />
                {t('bookings.rateWorker', 'Rate Artisan')}
              </Button>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2.5 pt-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onClose}
            className="flex-1 text-xs"
          >
            {t('common.close', 'Close')}
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={() => onBookAgain(booking)}
            className="flex-1 text-xs font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            {t('bookings.bookAgain', 'Book Again')}
          </Button>
        </div>
      </div>
    </Modal>
  )
}

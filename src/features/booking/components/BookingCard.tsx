import { useTranslation } from 'react-i18next'
import {
  Banknote,
  Calendar,
  CheckCircle2,
  Clock,
  FileText,
  Info,
  MapPin,
  MessageSquare,
  Phone,
  RefreshCw,
  Shield,
  ShieldAlert,
  Star,
  User,
  XCircle,
} from 'lucide-react'
import { Avatar, Badge, Button } from '@kaamgar/ui'
import { formatJobReference } from '@kaamgar/shared'
import type { BookingRow } from '../types'
import { statusConfig } from '../constants/statusConfig'
import { formatBookingDate, formatBookingTime, resolveServiceAndCategory } from '../utils/bookingFormat'
import type { BookingChangeRequest } from '@/services/changeRequests'
import type { SupportTab } from '@/features/support'

interface BookingCardProps {
  booking: BookingRow
  isPast: boolean
  decidingRequestId: string | null
  changeRequestError: string
  paymentError: string
  paymentActionBookingId: string
  onChangeRequestDecision: (request: BookingChangeRequest, decision: 'approved' | 'rejected') => Promise<void>
  onOpenPaymentModal: (booking: BookingRow) => void
  onOpenReceiptModal: (booking: BookingRow) => void
  onOpenDetailsModal: (booking: BookingRow) => void
  onOpenBookAgainModal: (booking: BookingRow) => void
  onOpenCancelModal: (booking: BookingRow) => void
  onOpenContactModal: (booking: BookingRow) => void
  onOpenReviewModal: (booking: BookingRow) => void
  onOpenSupport: (params: { bookingId?: string; defaultTab?: SupportTab }) => void
}

export function BookingCard({
  booking,
  isPast,
  decidingRequestId,
  changeRequestError,
  paymentError,
  paymentActionBookingId,
  onChangeRequestDecision,
  onOpenPaymentModal,
  onOpenReceiptModal,
  onOpenDetailsModal,
  onOpenBookAgainModal,
  onOpenCancelModal,
  onOpenContactModal,
  onOpenReviewModal,
  onOpenSupport,
}: BookingCardProps) {
  const { t, i18n } = useTranslation()

  const config = statusConfig[booking.status] || statusConfig.pending
  const Icon = config.icon
  const { serviceName, categoryName } = resolveServiceAndCategory(booking.category_id, i18n.language)
  const canCancel = booking.status === 'pending' || booking.status === 'accepted'
  const jobReference = formatJobReference(booking.id)

  return (
    <div
      id={`booking-${booking.id}`}
      className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 shadow-sm transition-all hover:shadow-md"
    >
      {/* Header: Service Name & Status Badge */}
      <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
        <div>
          <h3 className="font-bold text-base sm:text-lg text-slate-900 dark:text-white">
            {serviceName}
          </h3>
          {categoryName && (
            <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
              {categoryName}
            </p>
          )}
          {booking.status === 'pending' && (
            <p className="mt-1 text-xs text-amber-600 dark:text-amber-400">
              {t('bookings.pendingMsg', 'Waiting for worker to confirm...')}
            </p>
          )}
          {booking.status === 'accepted' && (
            <p className="mt-1 text-xs text-blue-600 dark:text-blue-400">
              {t('bookings.acceptedMsg', 'Worker has confirmed your booking.')}
            </p>
          )}
          {booking.status === 'in_progress' && (
            <p className="mt-1 text-xs text-indigo-600 dark:text-indigo-400">
              {t('bookings.inProgressMsg', 'Worker is currently working on this service.')}
            </p>
          )}
          {booking.status === 'completed' && (
            <p className="mt-1 text-xs text-emerald-600 dark:text-emerald-400">
              {t('bookings.completedMsg', 'Service has been marked as completed.')}
            </p>
          )}
          {booking.status === 'payment_pending' && (
            <p className="mt-1 text-xs text-amber-700 dark:text-amber-300">
              {t('bookings.paymentPendingMsg', 'Service is finished. Payment is pending.')}
            </p>
          )}
          {booking.status === 'cancelled' && (
            <p className="mt-1 text-xs text-slate-500 dark:text-zinc-400">
              {t('bookings.cancelledMsg', 'This booking has been cancelled.')}
            </p>
          )}
          {booking.status === 'rejected' && (
            <p className="mt-1 text-xs text-rose-600 dark:text-rose-400">
              {t('bookings.rejectedMsg', 'Artisan was unable to accept this booking.')}
            </p>
          )}
          {booking.status === 'disputed' && (
            <p className="mt-1 text-xs text-amber-600 dark:text-amber-400">
              {t('bookings.disputedMsg', 'This booking is currently disputed.')}
            </p>
          )}
        </div>

        <div className="flex flex-col items-end gap-1">
          <span
            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${config.badgeClass}`}
          >
            <Icon className={`w-3.5 h-3.5 ${booking.status === 'pending' ? 'animate-spin' : ''}`} />
            <span>
              {t(`booking.status.${booking.status}`, config.label)}
            </span>
          </span>
          <span className="text-[11px] font-mono text-slate-400 dark:text-zinc-500">
            Job {jobReference}
          </span>
        </div>
      </div>

      {/* Booking Details Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2 border-t border-slate-100 dark:border-zinc-800/80 text-xs">
        <div className="flex items-center gap-2 text-slate-600 dark:text-zinc-400">
          <Calendar className="w-3.5 h-3.5 text-amber-500 shrink-0" />
          <span>
            {formatBookingDate(booking.scheduled_at, i18n.language)} at{' '}
            {formatBookingTime(booking.scheduled_at, i18n.language)}
          </span>
        </div>

        <div className="flex items-center gap-2 text-slate-600 dark:text-zinc-400">
          <MapPin className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
          <span className="truncate">{booking.address}</span>
        </div>

        <div className="flex items-center gap-2 text-slate-600 dark:text-zinc-400 sm:col-span-2">
          {booking.worker ? (
            <div className="flex items-center gap-2">
              <Avatar
                name={booking.worker.name || t('bookings.artisan', 'Artisan')}
                size="sm"
                src={booking.worker.avatar || undefined}
              />
              <span className="font-semibold text-slate-800 dark:text-zinc-200">
                {booking.worker.name || t('bookings.artisan', 'Artisan')}
              </span>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <User className="w-3.5 h-3.5 text-slate-400" />
              <span className="text-slate-500 dark:text-zinc-400">{t('bookings.artisan', 'Artisan')}</span>
            </div>
          )}
        </div>

        {booking.notes && (
          <div className="flex items-start gap-2 text-slate-600 dark:text-zinc-400 sm:col-span-2 pt-1 border-t border-slate-50 dark:border-zinc-800/40">
            <FileText className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
            <p className="text-xs text-slate-600 dark:text-zinc-400 break-words line-clamp-2">
              {booking.notes}
            </p>
          </div>
        )}
      </div>

      {/* Change Requests Section */}
      {booking.changeRequests?.map(request => (
        <div key={request.id} className="mt-4 rounded-xl border border-amber-500/25 bg-amber-500/5 p-3.5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm font-bold text-slate-900 dark:text-white">
              {t('bookings.additionalChargeRequested', 'Additional charge requested')}
            </p>
            <Badge variant={request.status === 'pending' ? 'warning' : request.status === 'approved' ? 'success' : 'default'}>
              {request.status === 'pending'
                ? t('bookings.pendingApproval', 'Pending approval')
                : request.status === 'approved'
                ? t('bookings.approved', 'Approved')
                : t('bookings.rejected', 'Rejected')}
            </Badge>
          </div>
          <p className="mt-2 text-xs text-slate-600 dark:text-zinc-400">
            {t('bookings.jobPrefix', 'Job')} {jobReference} • {new Date(request.created_at).toLocaleString(i18n.language === 'hi' ? 'hi-IN' : 'en-IN')}
          </p>
          <p className="mt-2 text-sm text-slate-700 dark:text-zinc-300">
            {t('bookings.reasonLabel', 'Reason')}: {request.reason}
          </p>
          <p className="mt-1 text-sm font-bold text-slate-900 dark:text-white">
            {t('bookings.additionalAmountLabel', 'Additional amount')}: ₹{request.amount.toFixed(2)}
          </p>
          {request.status === 'pending' && (
            <div className="mt-3 flex flex-wrap gap-2">
              <Button
                variant="primary"
                size="sm"
                loading={decidingRequestId === request.id}
                onClick={() => void onChangeRequestDecision(request, 'approved')}
              >
                {t('common.approve', 'Approve')}
              </Button>
              <Button
                variant="secondary"
                size="sm"
                disabled={Boolean(decidingRequestId)}
                onClick={() => void onChangeRequestDecision(request, 'rejected')}
              >
                {t('common.reject', 'Reject')}
              </Button>
            </div>
          )}
        </div>
      ))}
      {changeRequestError && (
        <p className="mt-2 text-xs font-semibold text-rose-600 dark:text-rose-400">{changeRequestError}</p>
      )}

      {/* Payment Summary Section */}
      {booking.paymentSummary?.has_initial_quote && (
        <div className="mt-4 rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-3.5">
          <p className="text-sm font-bold text-slate-900 dark:text-white">{t('bookings.paymentSummary', 'Payment Summary')}</p>
          <div className="mt-2 space-y-1 text-sm text-slate-600 dark:text-zinc-400">
            <div className="flex items-center justify-between gap-3">
              <span>{t('bookings.initialServiceCharge', 'Initial service charge')}</span>
              <span className="font-semibold text-slate-900 dark:text-zinc-200">
                ₹{booking.paymentSummary.initial_quote_amount.toFixed(2)}
              </span>
            </div>
            <div className="flex items-center justify-between gap-3">
              <span>{t('bookings.approvedAdditionalCharges', 'Approved additional charges')}</span>
              <span className="font-semibold text-slate-900 dark:text-zinc-200">
                ₹{booking.paymentSummary.approved_additional_amount.toFixed(2)}
              </span>
            </div>
            <div className="flex items-center justify-between gap-3 border-t border-emerald-500/20 pt-2 font-bold text-slate-900 dark:text-white">
              <span>
                {booking.paymentSummary.is_final || booking.paymentSummary.is_frozen
                  ? t('bookings.finalPayableAmount', 'Final payable amount')
                  : t('bookings.currentPayableAmount', 'Current payable amount')}
              </span>
              <span>₹{booking.paymentSummary.final_payable_amount.toFixed(2)}</span>
            </div>
          </div>
          {booking.paymentSummary.pending_additional_count > 0 && (
            <p className="mt-2 text-xs text-amber-700 dark:text-amber-300">
              {t('bookings.pendingAdditionalCharges', 'Additional charges are awaiting approval.')}
            </p>
          )}
          {booking.status === 'payment_pending' && booking.paymentSummary.pending_additional_count === 0 && (
            <p className="mt-2 text-xs text-amber-700 dark:text-amber-300">
              {t('bookings.paymentPendingMsg', 'Service is finished. Payment is pending.')}
            </p>
          )}
          {booking.paymentSummary.is_frozen && (
            <p className="mt-1 text-xs font-semibold text-slate-600 dark:text-zinc-300">
              {t('bookings.paymentStatus', 'Payment status')}:{' '}
              {t(`bookings.paymentStatuses.${booking.paymentSummary.payment_status ?? 'unpaid'}`, 'Unpaid')}
            </p>
          )}
          {!booking.paymentSummary.is_final &&
            booking.paymentSummary.pending_additional_count === 0 &&
            booking.status !== 'completed' &&
            booking.status !== 'payment_pending' && (
              <p className="mt-2 text-xs text-slate-500 dark:text-zinc-400">
                {t('bookings.finalAmountAfterCompletion', 'The final amount will be shown after the service is completed.')}
              </p>
            )}

          {/* State A: Service Finished, Payment Required */}
          {booking.status === 'payment_pending' &&
            booking.paymentSummary.is_frozen &&
            booking.paymentSummary.payment_status !== 'paid' &&
            booking.paymentSummary.payment_status !== 'pending' && (
              <div className="mt-4 rounded-xl border border-amber-500/30 bg-amber-500/10 p-3.5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                    <p className="text-sm font-bold text-slate-900 dark:text-white">
                      {t('bookings.serviceCompleted', 'Service Completed')}
                    </p>
                  </div>
                  <Badge variant="warning" size="sm">
                    {t('bookings.paymentRequired', 'Payment Required')}
                  </Badge>
                </div>
                <div className="mt-2 flex items-baseline justify-between">
                  <span className="text-xs text-slate-600 dark:text-zinc-400">
                    {t('bookings.amountToPay', 'Amount to Pay')}:
                  </span>
                  <span className="text-base font-bold text-slate-900 dark:text-white">
                    ₹{booking.paymentSummary.final_payable_amount.toFixed(2)}
                  </span>
                </div>
                <p className="mt-1 text-xs text-slate-600 dark:text-zinc-400">
                  {t('bookings.payWorkerInCash', 'Pay the worker the amount shown above in cash.')}
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Button
                    variant="primary"
                    size="sm"
                    className="font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 flex items-center justify-center gap-1.5 cursor-pointer"
                    onClick={() => onOpenPaymentModal(booking)}
                  >
                    <Banknote className="w-4 h-4" />
                    {t('bookings.payWithCash', 'Pay with Cash')}
                  </Button>
                </div>
              </div>
            )}

          {/* State B: Cash Confirmation Submitted, Waiting for Worker */}
          {booking.status === 'payment_pending' && booking.paymentSummary.payment_status === 'pending' && (
            <div className="mt-4 rounded-xl border border-amber-500/30 bg-amber-500/10 p-3.5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-amber-500 animate-spin" />
                  <p className="text-sm font-bold text-amber-800 dark:text-amber-300">
                    {t('bookings.cashPaymentSubmitted', 'Cash Payment Submitted')}
                  </p>
                </div>
                <Badge variant="warning" size="sm">
                  {t('bookings.waitingForWorkerConfirmation', 'Waiting for worker confirmation')}
                </Badge>
              </div>
              <p className="mt-2 text-xs text-slate-700 dark:text-zinc-300">
                {t(
                  'bookings.waitingForWorkerConfirmationDesc',
                  'Waiting for worker confirmation. Your receipt will appear once the payment is confirmed.'
                )}
              </p>
              <div className="mt-2 text-xs font-semibold text-slate-600 dark:text-zinc-400 flex items-center justify-between pt-2 border-t border-amber-500/20">
                <span>{t('bookings.amountToPay', 'Amount to Pay')}</span>
                <span className="text-slate-900 dark:text-white font-bold">
                  ₹{booking.paymentSummary.final_payable_amount.toFixed(2)} · {t('bookings.paymentMethodCash', 'Cash')}
                </span>
              </div>
            </div>
          )}

          {/* State C: Paid & Authoritative Receipt Exists */}
          {booking.status === 'completed' &&
            booking.paymentSummary.payment_status === 'paid' &&
            booking.paymentSummary.receipt_number && (
              <div className="mt-4 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3.5 text-sm">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                    <span className="font-bold text-emerald-800 dark:text-emerald-300">
                      {t('bookings.paymentSuccessful', 'Payment Successful')}
                    </span>
                  </div>
                  <span className="font-mono text-xs font-bold px-2 py-0.5 rounded-lg bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30">
                    {booking.paymentSummary.receipt_number}
                  </span>
                </div>
                <div className="mt-2 flex items-baseline justify-between">
                  <span className="text-xs text-slate-600 dark:text-zinc-400">
                    {t('bookings.totalPaid', 'Total Paid')}:
                  </span>
                  <span className="text-base font-bold text-emerald-700 dark:text-emerald-300">
                    ₹{booking.paymentSummary.final_payable_amount.toFixed(2)} · {t('bookings.paymentMethodCash', 'Cash')}
                  </span>
                </div>
                <p className="mt-1 text-xs text-slate-500 dark:text-zinc-400">
                  {t('bookings.paidAt', 'Paid at')}:{' '}
                  {booking.paymentSummary.receipt_paid_at || booking.paymentSummary.paid_at
                    ? new Date(
                        booking.paymentSummary.receipt_paid_at || booking.paymentSummary.paid_at || ''
                      ).toLocaleString(i18n.language === 'hi' ? 'hi-IN' : 'en-IN', {
                        dateStyle: 'medium',
                        timeStyle: 'short',
                      })
                    : '—'}
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-3 text-xs font-bold flex items-center gap-1.5 text-emerald-700 dark:text-emerald-300 border-emerald-500/40 hover:bg-emerald-500/20 cursor-pointer"
                  onClick={() => onOpenReceiptModal(booking)}
                >
                  <FileText className="w-3.5 h-3.5" />
                  {t('bookings.viewReceipt', 'View Receipt')}
                </Button>
              </div>
            )}
          {paymentError && paymentActionBookingId === '' && booking.status === 'payment_pending' && (
            <p className="mt-2 text-xs font-semibold text-rose-600 dark:text-rose-400">{paymentError}</p>
          )}
        </div>
      )}

      {/* Actions Row */}
      <div className="mt-4 pt-3 border-t border-slate-100 dark:border-zinc-800/80 flex flex-wrap items-center justify-between gap-2.5">
        <div className="flex flex-wrap items-center gap-2">
          {(booking.status === 'accepted' || booking.status === 'in_progress' || booking.status === 'completed') && (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onOpenContactModal(booking)}
                className="text-xs font-semibold flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/10 cursor-pointer"
              >
                <Phone className="w-3.5 h-3.5" />
                {t('bookings.callWorker', 'Call Artisan')}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onOpenContactModal(booking)}
                className="text-xs font-semibold flex items-center gap-1.5 text-amber-600 dark:text-amber-400 border-amber-500/30 hover:bg-amber-500/10 cursor-pointer"
              >
                <MessageSquare className="w-3.5 h-3.5" />
                {t('bookings.chatWorker', 'WhatsApp')}
              </Button>
            </>
          )}

          {booking.status === 'completed' && !booking.hasReview && (
            <Button
              variant="primary"
              size="sm"
              onClick={() => onOpenReviewModal(booking)}
              className="text-xs font-bold flex items-center gap-1 bg-amber-500 hover:bg-amber-400 text-slate-950 cursor-pointer"
            >
              <Star className="w-3.5 h-3.5" />
              {t('bookings.rateWorker', 'Rate Artisan')}
            </Button>
          )}

          {booking.status === 'payment_pending' &&
            booking.paymentSummary?.payment_status !== 'pending' &&
            booking.paymentSummary?.payment_status !== 'paid' && (
              <Button
                variant="primary"
                size="sm"
                onClick={() => onOpenPaymentModal(booking)}
                className="text-xs font-bold flex items-center gap-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 cursor-pointer"
              >
                <Banknote className="w-3.5 h-3.5" />
                {t('bookings.payWithCash', 'Pay with Cash')}
              </Button>
            )}

          {booking.status === 'completed' && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onOpenDetailsModal(booking)}
              className="text-xs font-semibold flex items-center gap-1.5 text-slate-700 dark:text-zinc-300 border-slate-200 dark:border-zinc-700 hover:bg-slate-100 dark:hover:bg-zinc-800 cursor-pointer"
            >
              <Info className="w-3.5 h-3.5 text-amber-500" />
              {t('bookings.viewDetails', 'View Details')}
            </Button>
          )}

          {booking.status === 'completed' && booking.paymentSummary?.receipt_number && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onOpenReceiptModal(booking)}
              className="text-xs font-semibold flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/10 cursor-pointer"
            >
              <FileText className="w-3.5 h-3.5" />
              {t('bookings.viewReceipt', 'View Receipt')}
            </Button>
          )}

          {booking.status === 'completed' && booking.hasReview && (
            <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400 px-2 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
              <CheckCircle2 className="w-3.5 h-3.5" />
              {booking.review
                ? `★ ${booking.review.rating}/5 ${t('bookings.reviewed', 'Reviewed')}`
                : t('bookings.reviewSubmitted', 'Review Submitted')}
            </span>
          )}

          {isPast && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onOpenBookAgainModal(booking)}
              className="text-xs font-medium flex items-center gap-1 text-slate-700 dark:text-zinc-300 border-slate-200 dark:border-zinc-700 hover:bg-slate-100 dark:hover:bg-zinc-800 cursor-pointer"
            >
              <RefreshCw className="w-3 h-3 text-amber-500" />
              {t('bookings.bookAgain', 'Book Again')}
            </Button>
          )}

          {!isPast && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onOpenSupport({ bookingId: booking.id })}
              className="text-xs font-semibold flex items-center gap-1.5 text-amber-600 dark:text-amber-400 border-amber-500/30 hover:bg-amber-500/10 cursor-pointer"
            >
              <Shield className="w-3.5 h-3.5" />
              <span>{i18n.language === 'hi' ? 'सहायता' : 'Need Help?'}</span>
            </Button>
          )}

          <Button
            variant="outline"
            size="sm"
            onClick={() => onOpenSupport({ bookingId: booking.id, defaultTab: 'complaint' })}
            className="text-xs font-semibold flex items-center gap-1.5 text-rose-600 dark:text-rose-400 border-rose-500/30 hover:bg-rose-500/10 cursor-pointer"
          >
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>{i18n.language === 'hi' ? 'केयर / शिकायत' : 'Care & Support'}</span>
          </Button>
        </div>

        {canCancel && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => onOpenCancelModal(booking)}
            className="text-xs font-medium text-rose-600 dark:text-rose-400 border-rose-500/30 hover:bg-rose-500/10 cursor-pointer"
          >
            <XCircle className="w-3.5 h-3.5 mr-1" />
            {t('bookings.cancelBooking', 'Cancel Booking')}
          </Button>
        )}
      </div>
    </div>
  )
}

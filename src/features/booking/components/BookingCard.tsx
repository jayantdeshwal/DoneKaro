import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { AnimatePresence, motion } from 'framer-motion'
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
import { BookingLifecycleStepper } from './BookingLifecycleStepper'

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
  const [isExpanded, setIsExpanded] = useState(false)
  const pendingChangeRequest = booking.changeRequests?.find(request => request.status === 'pending')
  const paymentSummary = booking.paymentSummary
  const needsPayment =
    booking.status === 'payment_pending' &&
    paymentSummary?.payment_status !== 'pending' &&
    paymentSummary?.payment_status !== 'paid'

  return (
    <div
      id={`booking-${booking.id}`}
      className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 shadow-sm transition-all hover:shadow-md"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <h3 className="truncate font-bold text-base text-slate-900 dark:text-white sm:text-lg">
            {serviceName}
          </h3>
          <div className="mt-2 flex min-w-0 items-center gap-2">
            <Avatar
              name={booking.worker?.name || t('bookings.artisan', 'Artisan')}
              size="sm"
              src={booking.worker?.avatar || undefined}
            />
            <span className="truncate text-sm font-semibold text-slate-700 dark:text-zinc-200">
              {booking.worker?.name || t('bookings.artisan', 'Artisan')}
            </span>
          </div>
          <div className="mt-2 flex items-center gap-2 text-xs text-slate-600 dark:text-zinc-400">
            <Calendar className="h-3.5 w-3.5 shrink-0 text-amber-500" />
            <span>
              {formatBookingDate(booking.scheduled_at, i18n.language)} ·{' '}
              {formatBookingTime(booking.scheduled_at, i18n.language)}
            </span>
          </div>
        </div>
        <span className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold ${config.badgeClass}`}>
          <Icon className={`h-3.5 w-3.5 ${booking.status === 'pending' ? 'animate-spin' : ''}`} />
          {t(`booking.status.${booking.status}`, config.label)}
        </span>
      </div>

      <div className="mt-4">
        {pendingChangeRequest ? (
          <Button
            variant="primary"
            className="w-full"
            aria-expanded={isExpanded}
            onClick={() => setIsExpanded(true)}
          >
            {t('bookings.reviewExtraCharge', 'Review Extra Charge')}
          </Button>
        ) : needsPayment ? (
          <Button
            variant="primary"
            className="w-full"
            onClick={() => onOpenPaymentModal(booking)}
          >
            {t('bookings.payAmount', `Pay ₹${paymentSummary?.final_payable_amount.toFixed(2)}`)}
          </Button>
        ) : (
          <Button
            variant="primary"
            className="w-full"
            aria-expanded={isExpanded}
            onClick={() => setIsExpanded(expanded => !expanded)}
          >
            {t('bookings.viewDetails', 'View Details')}
          </Button>
        )}
      </div>

      <AnimatePresence initial={false}>
        {isExpanded && (
          <motion.div
            key="booking-details"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <div className="mt-4 border-t border-slate-100 pt-4 dark:border-zinc-800/80">
              {booking.status !== 'cancelled' && booking.status !== 'rejected' && (
                <BookingLifecycleStepper currentStep={booking.status === 'pending' ? 1 : 3} />
              )}

              <div className="mb-3 flex items-start justify-between gap-3">
                <div className="min-w-0">
                  {categoryName && (
                    <p className="text-xs text-slate-500 dark:text-zinc-400">{categoryName}</p>
                  )}
                  {booking.status === 'pending' && <p className="mt-1 text-xs text-amber-600 dark:text-amber-400">{t('bookings.pendingMsg', 'Waiting for worker to confirm...')}</p>}
                  {booking.status === 'accepted' && <p className="mt-1 text-xs text-blue-600 dark:text-blue-400">{t('bookings.acceptedMsg', 'Worker has confirmed your booking.')}</p>}
                  {booking.status === 'in_progress' && <p className="mt-1 text-xs text-indigo-600 dark:text-indigo-400">{t('bookings.inProgressMsg', 'Worker is currently working on this service.')}</p>}
                  {booking.status === 'completed' && <p className="mt-1 text-xs text-emerald-600 dark:text-emerald-400">{t('bookings.completedMsg', 'Service has been marked as completed.')}</p>}
                  {booking.status === 'payment_pending' && <p className="mt-1 text-xs text-amber-700 dark:text-amber-300">{t('bookings.paymentPendingMsg', 'Service is finished. Payment is pending.')}</p>}
                  {booking.status === 'cancelled' && <p className="mt-1 text-xs text-slate-500 dark:text-zinc-400">{t('bookings.cancelledMsg', 'This booking has been cancelled.')}</p>}
                  {booking.status === 'rejected' && <p className="mt-1 text-xs text-rose-600 dark:text-rose-400">{t('bookings.rejectedMsg', 'Artisan was unable to accept this booking.')}</p>}
                  {booking.status === 'disputed' && <p className="mt-1 text-xs text-amber-600 dark:text-amber-400">{t('bookings.disputedMsg', 'This booking is currently disputed.')}</p>}
                </div>
                <span className="shrink-0 text-[11px] font-mono text-slate-400 dark:text-zinc-500">
                  {t('bookings.jobPrefix', 'Job')} {jobReference}
                </span>
              </div>

              <div className="grid grid-cols-1 gap-2.5 text-xs sm:grid-cols-2">
                <div className="flex items-center gap-2 text-slate-600 dark:text-zinc-400">
                  <Clock className="h-3.5 w-3.5 shrink-0 text-amber-500" />
                  <span>{formatBookingDate(booking.scheduled_at, i18n.language)} at {formatBookingTime(booking.scheduled_at, i18n.language)}</span>
                </div>
                <div className="flex items-start gap-2 text-slate-600 dark:text-zinc-400 sm:col-span-2">
                  <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-500" />
                  <span className="break-words">{booking.address}</span>
                </div>
                {booking.notes && (
                  <div className="flex items-start gap-2 border-t border-slate-100 pt-2 text-slate-600 dark:border-zinc-800/40 dark:text-zinc-400 sm:col-span-2">
                    <FileText className="mt-0.5 h-3.5 w-3.5 shrink-0 text-slate-400" />
                    <p className="break-words">{booking.notes}</p>
                  </div>
                )}
              </div>

              {booking.changeRequests?.map(request => (
                <div key={request.id} className="mt-4 rounded-xl border border-amber-500/25 bg-amber-500/5 p-3.5">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-sm font-bold text-slate-900 dark:text-white">{t('bookings.additionalChargeRequested', 'Additional charge requested')}</p>
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
                  <p className="mt-2 text-sm text-slate-700 dark:text-zinc-300">{t('bookings.reasonLabel', 'Reason')}: {request.reason}</p>
                  <p className="mt-1 text-sm font-bold text-slate-900 dark:text-white">{t('bookings.additionalAmountLabel', 'Additional amount')}: ₹{request.amount.toFixed(2)}</p>
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
                <p className="mt-2 rounded-lg border border-red-800 bg-gray-900 px-2.5 py-1.5 text-xs font-semibold text-red-300 shadow-md">{changeRequestError}</p>
              )}

              {paymentSummary?.has_initial_quote && (
                <div className="mt-4 rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-3.5">
                  <p className="text-sm font-bold text-slate-900 dark:text-white">{t('bookings.paymentSummary', 'Payment Summary')}</p>
                  <div className="mt-2 space-y-1 text-sm text-slate-600 dark:text-zinc-400">
                    <div className="flex items-center justify-between gap-3">
                      <span>{t('bookings.initialServiceCharge', 'Initial service charge')}</span>
                      <span className="font-semibold text-slate-900 dark:text-zinc-200">₹{paymentSummary.initial_quote_amount.toFixed(2)}</span>
                    </div>
                    <div className="flex items-center justify-between gap-3">
                      <span>{t('bookings.approvedAdditionalCharges', 'Approved additional charges')}</span>
                      <span className="font-semibold text-slate-900 dark:text-zinc-200">₹{paymentSummary.approved_additional_amount.toFixed(2)}</span>
                    </div>
                    <div className="flex items-center justify-between gap-3 border-t border-emerald-500/20 pt-2 font-bold text-slate-900 dark:text-white">
                      <span>{paymentSummary.is_final || paymentSummary.is_frozen ? t('bookings.finalPayableAmount', 'Final payable amount') : t('bookings.currentPayableAmount', 'Current payable amount')}</span>
                      <span>₹{paymentSummary.final_payable_amount.toFixed(2)}</span>
                    </div>
                  </div>
                  {paymentSummary.pending_additional_count > 0 && <p className="mt-2 text-xs text-amber-700 dark:text-amber-300">{t('bookings.pendingAdditionalCharges', 'Additional charges are awaiting approval.')}</p>}
                  {paymentSummary.is_frozen && (
                    <p className="mt-1 text-xs font-semibold text-slate-600 dark:text-zinc-300">
                      {t('bookings.paymentStatus', 'Payment status')}: {t(`bookings.paymentStatuses.${paymentSummary.payment_status ?? 'unpaid'}`, 'Unpaid')}
                    </p>
                  )}
                  {!paymentSummary.is_final && paymentSummary.pending_additional_count === 0 && booking.status !== 'completed' && booking.status !== 'payment_pending' && (
                    <p className="mt-2 text-xs text-slate-500 dark:text-zinc-400">{t('bookings.finalAmountAfterCompletion', 'The final amount will be shown after the service is completed.')}</p>
                  )}
                  {booking.status === 'payment_pending' && paymentSummary.payment_status === 'pending' && (
                    <div className="mt-4 rounded-xl border border-amber-300 bg-amber-100 p-3.5">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5">
                          <Clock className="h-4 w-4 animate-spin text-amber-700" />
                          <p className="text-sm font-bold text-amber-900">{t('bookings.cashPaymentSubmitted', 'Cash Payment Submitted')}</p>
                        </div>
                        <Badge variant="warning" size="sm">{t('bookings.waitingForWorkerConfirmation', 'Waiting for worker confirmation')}</Badge>
                      </div>
                      <p className="mt-2 text-xs text-amber-900">{t('bookings.waitingForWorkerConfirmationDesc', 'Waiting for worker confirmation. Your receipt will appear once the payment is confirmed.')}</p>
                    </div>
                  )}
                  {booking.status === 'completed' && paymentSummary.payment_status === 'paid' && paymentSummary.receipt_number && (
                    <div className="mt-4 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3.5 text-sm">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5">
                          <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
                          <span className="font-bold text-emerald-800 dark:text-emerald-300">{t('bookings.paymentSuccessful', 'Payment Successful')}</span>
                        </div>
                        <span className="rounded-lg border border-emerald-500/30 bg-emerald-500/20 px-2 py-0.5 font-mono text-xs font-bold text-emerald-700 dark:text-emerald-300">{paymentSummary.receipt_number}</span>
                      </div>
                      <div className="mt-2 flex items-baseline justify-between">
                        <span className="text-xs text-slate-600 dark:text-zinc-400">{t('bookings.totalPaid', 'Total Paid')}:</span>
                        <span className="font-bold text-emerald-700 dark:text-emerald-300">₹{paymentSummary.final_payable_amount.toFixed(2)} · {t('bookings.paymentMethodCash', 'Cash')}</span>
                      </div>
                      <p className="mt-1 text-xs text-slate-500 dark:text-zinc-400">
                        {t('bookings.paidAt', 'Paid at')}: {paymentSummary.receipt_paid_at || paymentSummary.paid_at
                          ? new Date(paymentSummary.receipt_paid_at || paymentSummary.paid_at || '').toLocaleString(i18n.language === 'hi' ? 'hi-IN' : 'en-IN', { dateStyle: 'medium', timeStyle: 'short' })
                          : '—'}
                      </p>
                      <Button
                        variant="outline"
                        size="sm"
                        className="mt-3 text-xs font-bold"
                        onClick={() => onOpenReceiptModal(booking)}
                      >
                        <FileText className="mr-1.5 h-3.5 w-3.5" />
                        {t('bookings.viewReceipt', 'View Receipt')}
                      </Button>
                    </div>
                  )}
                  {paymentError && paymentActionBookingId === '' && booking.status === 'payment_pending' && (
                    <p className="mt-2 text-xs font-semibold text-rose-600 dark:text-rose-400">{paymentError}</p>
                  )}
                </div>
              )}

              <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-slate-100 pt-3 dark:border-zinc-800/80">
                {(booking.status === 'accepted' || booking.status === 'in_progress' || booking.status === 'completed') && (
                  <>
                    <Button variant="outline" size="sm" onClick={() => onOpenContactModal(booking)} className="text-xs font-semibold">
                      <Phone className="mr-1.5 h-3.5 w-3.5" />{t('bookings.callWorker', 'Call Artisan')}
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => onOpenContactModal(booking)} className="text-xs font-semibold">
                      <MessageSquare className="mr-1.5 h-3.5 w-3.5" />{t('bookings.chatWorker', 'WhatsApp')}
                    </Button>
                  </>
                )}
                {booking.status === 'completed' && !booking.hasReview && (
                  <Button variant="outline" size="sm" onClick={() => onOpenReviewModal(booking)} className="text-xs font-bold">
                    <Star className="mr-1.5 h-3.5 w-3.5" />{t('bookings.rateWorker', 'Rate Artisan')}
                  </Button>
                )}
                {booking.status === 'completed' && (
                  <Button variant="outline" size="sm" onClick={() => onOpenDetailsModal(booking)} className="text-xs font-semibold">
                    <Info className="mr-1.5 h-3.5 w-3.5 text-amber-500" />{t('bookings.viewDetails', 'View Details')}
                  </Button>
                )}
                {booking.status === 'completed' && booking.hasReview && (
                  <span className="inline-flex items-center gap-1 rounded-lg border border-emerald-500/20 bg-emerald-500/10 px-2 py-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    {booking.review ? `★ ${booking.review.rating}/5 ${t('bookings.reviewed', 'Reviewed')}` : t('bookings.reviewSubmitted', 'Review Submitted')}
                  </span>
                )}
                {isPast && (
                  <Button variant="outline" size="sm" onClick={() => onOpenBookAgainModal(booking)} className="text-xs font-medium">
                    <RefreshCw className="mr-1 h-3 w-3 text-amber-500" />{t('bookings.bookAgain', 'Book Again')}
                  </Button>
                )}
                {!isPast && (
                  <Button variant="outline" size="sm" onClick={() => onOpenSupport({ bookingId: booking.id })} className="text-xs font-semibold">
                    <Shield className="mr-1.5 h-3.5 w-3.5" />{i18n.language === 'hi' ? 'सहायता' : 'Need Help?'}
                  </Button>
                )}
                <Button variant="danger-outline" size="sm" onClick={() => onOpenSupport({ bookingId: booking.id, defaultTab: 'complaint' })} className="text-xs font-semibold">
                  <ShieldAlert className="mr-1.5 h-3.5 w-3.5" />{i18n.language === 'hi' ? 'केयर / शिकायत' : 'Care & Support'}
                </Button>
                {canCancel && (
                  <Button variant="danger-outline" size="sm" onClick={() => onOpenCancelModal(booking)} className="text-xs font-medium">
                    <XCircle className="mr-1 h-3.5 w-3.5" />{t('bookings.cancelBooking', 'Cancel Booking')}
                  </Button>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

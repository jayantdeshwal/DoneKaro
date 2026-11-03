import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { AnimatePresence, motion } from 'framer-motion'
import {
  Calendar,
  ExternalLink,
  MapPin,
  MessageCircle,
  Phone,
  Sparkles,
} from 'lucide-react'
import { CATEGORIES, formatJobReference, getCategoryName } from '@kaamgar/shared'
import { Badge, Button } from '@/ui'
import { buildGoogleMapsDirectionsUrl } from '@/utils/maps'
import type { WorkerBookingRow } from '../../types'
import { WorkerPaymentCard } from './WorkerPaymentCard'
import { BookingStatusActions } from './BookingStatusActions'

interface WorkerBookingCardProps {
  booking: WorkerBookingRow
  isRepeatCustomer: boolean
  isUpdating: boolean
  onOpenContactModal: (booking: WorkerBookingRow) => void
  onOpenChangeRequest: (booking: WorkerBookingRow) => void
  onConfirmCash: (booking: WorkerBookingRow) => void
  onViewDetails: (booking: WorkerBookingRow) => void
  onViewReceipt: (booking: WorkerBookingRow) => void
  onUpdateStatus: (bookingId: string, status: WorkerBookingRow['status']) => void | Promise<void>
  onWithdrawChangeRequest: (requestId: string) => Promise<void>
}

export const WorkerBookingCard: React.FC<WorkerBookingCardProps> = ({
  booking,
  isRepeatCustomer,
  isUpdating,
  onOpenContactModal,
  onOpenChangeRequest,
  onConfirmCash,
  onViewDetails,
  onViewReceipt,
  onUpdateStatus,
  onWithdrawChangeRequest,
}) => {
  const { t, i18n } = useTranslation()
  const [isExpanded, setIsExpanded] = useState(false)
  const [withdrawingRequestId, setWithdrawingRequestId] = useState<string | null>(null)
  const catObj = CATEGORIES.find(c => c.id === booking.category_id)
  const catName = catObj
    ? getCategoryName(catObj, i18n.language === 'hi' ? 'hi' : 'en')
    : booking.category_id

  const formattedDate = new Date(booking.scheduled_at).toLocaleDateString(
    i18n.language === 'hi' ? 'hi-IN' : 'en-IN',
    {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    }
  )
  const formattedTime = new Date(booking.scheduled_at).toLocaleTimeString(
    i18n.language === 'hi' ? 'hi-IN' : 'en-IN',
    {
      hour: '2-digit',
      minute: '2-digit',
    }
  )

  const directionsUrl = buildGoogleMapsDirectionsUrl(booking.address)

  return (
    <div
      id={`booking-${booking.id}`}
      className="p-4 rounded-2xl bg-surface-100 border border-semantic-border-light shadow-sm hover:border-brand-500/30 transition-all space-y-3"
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="font-semibold text-slate-900 dark:text-white">{catName}</p>
          <div className="mt-1 flex items-center gap-1.5 text-xs text-semantic-text-secondary">
            <Calendar className="h-3.5 w-3.5 shrink-0 text-brand-400" />
            <span>{formattedDate} at {formattedTime}</span>
          </div>
        </div>
        <Badge
          variant={
            booking.status === 'completed'
              ? 'success'
              : booking.status === 'in_progress' || booking.status === 'accepted'
              ? 'info'
              : booking.status === 'pending'
              ? 'warning'
              : 'danger'
          }
          size="sm"
        >
          {booking.status === 'in_progress'
            ? t('workerDashboard.inProgress', 'In Progress')
            : booking.status === 'payment_pending'
            ? t('bookings.paymentPending', 'Payment Pending')
            : booking.status === 'accepted'
            ? t('workerDashboard.accepted', 'Accepted')
            : booking.status}
        </Badge>
      </div>

      <div>
        <p className="truncate text-sm font-semibold text-slate-800 dark:text-slate-200">
          {booking.customer?.name || t('bookings.customer', 'Customer')}
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button
          variant="outline"
          size="md"
          onClick={() => onOpenContactModal(booking)}
          className="min-h-12 flex-1 text-xs flex items-center justify-center gap-1.5 border-emerald-500/40 text-emerald-700 dark:text-emerald-400 py-3"
        >
          <MessageCircle className="h-4 w-4" />
          <span>{t('workerDashboard.whatsapp', 'WhatsApp')}</span>
        </Button>
        {booking.customer?.phone && (
          <a
            href={`tel:${booking.customer.phone}`}
            className="min-h-12 flex-1 rounded-xl border border-slate-300 px-3 py-3 text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-50 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-800 flex items-center justify-center gap-1.5"
          >
            <Phone className="h-4 w-4" />
            <span>{t('workerDashboard.call', 'Call')}</span>
          </a>
        )}
        {directionsUrl && (
          <a
            href={directionsUrl}
            target="_blank"
            rel="noreferrer"
            className="min-h-12 flex-1 rounded-xl border border-slate-300 px-3 py-3 text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-50 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-800 flex items-center justify-center gap-1.5"
          >
            <ExternalLink className="h-4 w-4" />
            <span>{t('bookings.openInGoogleMaps', 'Maps')}</span>
          </a>
        )}
      </div>

      <div className="space-y-2">
        <Button
          variant="secondary"
          size="md"
          className="min-h-12 w-full"
          aria-expanded={isExpanded}
          aria-controls={`booking-details-${booking.id}`}
          onClick={() => setIsExpanded(!isExpanded)}
        >
          {isExpanded
            ? t('workerDashboard.hideDetails', 'Hide Details')
            : t('workerDashboard.viewDetails', 'View Details')}
        </Button>
        {['accepted', 'in_progress'].includes(booking.status) &&
          !(booking.changeRequests ?? []).some(request => request.status === 'pending') && (
            <Button
              variant="outline"
              size="md"
              onClick={() => onOpenChangeRequest(booking)}
              className="min-h-[48px] w-full text-xs border-amber-500/40 text-amber-700 dark:text-amber-400 hover:bg-amber-500/10 py-3"
            >
              {t('workerDashboard.requestAdditionalCharge', 'Request Additional Charge')}
            </Button>
          )}
        <BookingStatusActions
          booking={booking}
          isUpdating={isUpdating}
          onUpdateStatus={onUpdateStatus}
          onConfirmCash={onConfirmCash}
          onViewDetails={onViewDetails}
          onViewReceipt={onViewReceipt}
        />
      </div>

      <AnimatePresence initial={false}>
        {isExpanded && (
          <motion.div
            id={`booking-details-${booking.id}`}
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <div className="mt-4 space-y-3 border-t border-slate-200 pt-4 dark:border-slate-700">
              <div className="space-y-2 rounded-xl border border-semantic-border-light bg-surface-200/50 p-3 text-xs text-semantic-text-secondary">
                {isRepeatCustomer && (
                  <p className="inline-flex items-center gap-1 font-semibold text-slate-700 dark:text-slate-300">
                    <Sparkles className="h-3 w-3" />
                    {t('workerDashboard.repeatCustomer', 'Repeat Customer')}
                  </p>
                )}
                <div className="flex items-start gap-2">
                  <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-700 dark:text-emerald-400" />
                  <span className="break-words">
                    {booking.address || t('workerDashboard.muzaffarnagar', 'Muzaffarnagar')}
                  </span>
                </div>
                {booking.notes && (
                  <p className="whitespace-pre-wrap break-words border-t border-semantic-border-light/60 pt-2 text-semantic-text-secondary">
                    {booking.notes}
                  </p>
                )}
                <p className="border-t border-semantic-border-light/60 pt-2">
                  {t('workerDashboard.jobReference', 'Job reference')}: {formatJobReference(booking.id)}
                </p>
              </div>

              {!directionsUrl && (
                <p className="text-xs text-semantic-text-tertiary">
                  {t(
                    'bookings.customerLocationUnavailable',
                    'Customer location is not available for this booking.'
                  )}
                </p>
              )}

              <WorkerPaymentCard booking={booking} onViewReceipt={onViewReceipt} />

              {booking.changeRequests?.map(request => (
                <div
                  key={request.id}
                  className="rounded-xl border border-amber-500/25 bg-amber-500/5 p-3 text-xs"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-bold text-slate-900 dark:text-white">
                      {t('workerDashboard.additionalChargeRequest', 'Additional charge request')}
                    </span>
                    <Badge
                      variant={
                        request.status === 'approved'
                          ? 'success'
                          : request.status === 'rejected'
                          ? 'danger'
                          : 'warning'
                      }
                      size="sm"
                    >
                      {request.status === 'pending'
                        ? t('workerDashboard.pendingCustomerApproval', 'Pending customer approval')
                        : request.status}
                    </Badge>
                  </div>
                  <p className="mt-1 text-semantic-text-secondary">
                    ₹{request.amount.toFixed(2)} · {request.reason}
                  </p>
                  {request.status === 'pending' && (
                    <Button
                      variant="danger-outline"
                      size="md"
                      disabled={withdrawingRequestId !== null}
                      onClick={async () => {
                        setWithdrawingRequestId(request.id)
                        try {
                          await onWithdrawChangeRequest(request.id)
                        } finally {
                          setWithdrawingRequestId(null)
                        }
                      }}
                      className="mt-3 min-h-12 w-full py-3"
                    >
                      {withdrawingRequestId === request.id
                        ? t('workerDashboard.withdrawingRequest', 'Withdrawing...')
                        : t('workerDashboard.withdrawRequest', 'Withdraw Request')}
                    </Button>
                  )}
                </div>
              ))}

            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

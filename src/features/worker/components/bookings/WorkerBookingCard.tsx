import React from 'react'
import { useTranslation } from 'react-i18next'
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
}) => {
  const { t, i18n } = useTranslation()
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
      {/* Top line: Customer name + status badge */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-full bg-brand-500/15 border border-brand-500/30 flex items-center justify-center text-brand-400 font-bold text-xs">
            {booking.customer?.name ? booking.customer.name.charAt(0) : 'C'}
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <p className="text-xs font-bold text-slate-900 dark:text-white">
                {booking.customer?.name || t('bookings.customer', 'Customer')}
              </p>
              {isRepeatCustomer && (
                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-brand-500/15 text-brand-600 dark:text-brand-400 text-[9px] font-bold border border-brand-500/20">
                  <Sparkles className="w-2.5 h-2.5" />
                  {t('workerDashboard.repeatCustomer', 'Repeat Customer')}
                </span>
              )}
            </div>
            <p className="text-[10px] text-semantic-text-tertiary capitalize">
              {catName} {t('workerDashboard.service', 'Service')}
            </p>
          </div>
        </div>

        <span className="font-mono text-[10px] font-semibold px-2 py-0.5 rounded-lg bg-surface-200 text-semantic-text-secondary border border-semantic-border-light whitespace-nowrap">
          {formatJobReference(booking.id)}
        </span>

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

      {/* Scheduled time & Locality address */}
      <div className="space-y-1 text-xs text-semantic-text-secondary bg-surface-200/50 p-2.5 rounded-xl border border-semantic-border-light/60">
        <div className="flex items-center gap-2">
          <Calendar className="w-3.5 h-3.5 text-brand-400 shrink-0" />
          <span>
            {formattedDate} at {formattedTime}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <MapPin className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
          <span className="truncate">
            {booking.address || t('workerDashboard.muzaffarnagar', 'Muzaffarnagar')}
          </span>
        </div>
        {booking.notes && (
          <p className="text-[11px] text-semantic-text-tertiary italic pt-1 border-t border-semantic-border-light/40">
            "{booking.notes}"
          </p>
        )}
      </div>

      {/* Contact Customer Buttons */}
      <div className="flex items-center gap-2 pt-1">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onOpenContactModal(booking)}
          className="flex-1 text-xs flex items-center justify-center gap-1.5 border-emerald-500/40 text-emerald-400 hover:bg-emerald-500/10 py-1.5"
        >
          <MessageCircle className="w-3.5 h-3.5" />
          <span>{t('workerDashboard.whatsappCall', 'WhatsApp / Call')}</span>
        </Button>

        {booking.customer?.phone && (
          <a
            href={`tel:${booking.customer.phone}`}
            className="px-3 py-1.5 rounded-xl border border-semantic-border-medium hover:border-brand-500 text-xs font-semibold text-semantic-text-secondary hover:text-white transition-colors flex items-center gap-1"
          >
            <Phone className="w-3.5 h-3.5" />
            <span>{t('workerDashboard.call', 'Call')}</span>
          </a>
        )}
      </div>

      {directionsUrl ? (
        <a
          href={directionsUrl}
          target="_blank"
          rel="noreferrer"
          className="w-full rounded-xl border border-blue-500/40 px-3 py-2 text-xs font-semibold text-blue-700 dark:text-blue-300 hover:bg-blue-500/10 transition-colors flex items-center justify-center gap-1.5"
        >
          <ExternalLink className="w-3.5 h-3.5" />
          <span>{t('bookings.openInGoogleMaps', 'Open in Google Maps')}</span>
        </a>
      ) : (
        <p className="text-xs text-semantic-text-tertiary">
          {t(
            'bookings.customerLocationUnavailable',
            'Customer location is not available for this booking.'
          )}
        </p>
      )}

      {/* Payment Summary */}
      <WorkerPaymentCard
        booking={booking}
        onConfirmCash={onConfirmCash}
        onViewReceipt={onViewReceipt}
      />

      {/* Additional Change Requests */}
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
                ? t(
                    'workerDashboard.pendingCustomerApproval',
                    'Pending customer approval'
                  )
                : request.status}
            </Badge>
          </div>
          <p className="mt-1 text-semantic-text-secondary">
            Job {formatJobReference(booking.id)} • ₹{request.amount.toFixed(2)}
          </p>
          <p className="mt-1 text-semantic-text-secondary">Reason: {request.reason}</p>
        </div>
      ))}

      {/* Request Additional Charge Button */}
      {['accepted', 'in_progress'].includes(booking.status) &&
        !(booking.changeRequests ?? []).some(request => request.status === 'pending') && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => onOpenChangeRequest(booking)}
            className="w-full text-xs border-amber-500/40 text-amber-400 hover:bg-amber-500/10"
          >
            {t('workerDashboard.requestAdditionalCharge', 'Request Additional Charge')}
          </Button>
        )}

      {/* Booking Status Action Buttons */}
      <BookingStatusActions
        booking={booking}
        isUpdating={isUpdating}
        onUpdateStatus={onUpdateStatus}
        onConfirmCash={onConfirmCash}
        onViewDetails={onViewDetails}
        onViewReceipt={onViewReceipt}
      />
    </div>
  )
}

import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Button, Modal } from '@kaamgar/ui'
import type { BookingRow } from '../../types'
import { formatBookingDate, formatBookingTime, resolveServiceAndCategory } from '../../utils/bookingFormat'

interface BookingCancelModalProps {
  isOpen: boolean
  onClose: () => void
  booking: BookingRow | null
  onConfirmCancel: (reason: string) => Promise<void>
  isCancelling: boolean
  cancelError: string
}

export function BookingCancelModal({
  isOpen,
  onClose,
  booking,
  onConfirmCancel,
  isCancelling,
  cancelError,
}: BookingCancelModalProps) {
  const { t, i18n } = useTranslation()
  const [cancellationReason, setCancellationReason] = useState('')

  const handleClose = () => {
    if (!isCancelling) {
      setCancellationReason('')
      onClose()
    }
  }

  const handleConfirm = async () => {
    await onConfirmCancel(cancellationReason)
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={t('bookings.cancelConfirmTitle', 'Cancel this booking?')}
      description={t(
        'bookings.cancelConfirmDesc',
        'Are you sure you want to cancel this booking? This action cannot be undone.'
      )}
      size="md"
    >
      <div className="space-y-4">
        {cancelError && (
          <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-500 text-xs">
            {cancelError}
          </div>
        )}

        {booking && (
          <div className="p-3.5 bg-slate-50 dark:bg-zinc-800/60 border border-slate-200 dark:border-zinc-700/60 rounded-xl text-xs">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-900 dark:text-white">
                {resolveServiceAndCategory(booking.category_id, i18n.language).serviceName}
              </span>
              <span className="font-medium text-slate-600 dark:text-zinc-400">
                {booking.worker?.name || t('bookings.artisan', 'Artisan')}
              </span>
            </div>
            <p className="text-slate-500 dark:text-zinc-400 mt-1">
              {formatBookingDate(booking.scheduled_at, i18n.language)} at{' '}
              {formatBookingTime(booking.scheduled_at, i18n.language)}
            </p>
          </div>
        )}

        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-2">
            {t('bookings.cancelReasonPlaceholder', 'Reason for cancellation')}
          </label>
          <div className="flex flex-wrap gap-1.5 mb-2.5">
            {[
              { label: t('bookings.reasonChangePlans', 'Change of plans'), value: 'Change of plans' },
              { label: t('bookings.reasonFoundAnother', 'Found another service'), value: 'Found another service' },
              { label: t('bookings.reasonWrongDateTime', 'Wrong date/time selected'), value: 'Wrong date/time selected' },
              { label: t('bookings.reasonEmergency', 'Emergency'), value: 'Emergency' },
            ].map(quickReason => (
              <button
                key={quickReason.value}
                type="button"
                onClick={() => setCancellationReason(quickReason.value)}
                className={`text-xs px-2.5 py-1 rounded-full border transition-colors cursor-pointer ${
                  cancellationReason === quickReason.value
                    ? 'bg-amber-500/20 border-amber-500/50 text-amber-700 dark:text-amber-300 font-medium'
                    : 'bg-slate-100 dark:bg-zinc-800 border-slate-200 dark:border-zinc-700 text-slate-600 dark:text-zinc-400 hover:border-slate-300 dark:hover:border-zinc-600'
                }`}
              >
                {quickReason.label}
              </button>
            ))}
          </div>
          <textarea
            value={cancellationReason}
            onChange={e => setCancellationReason(e.target.value)}
            placeholder={t('bookings.cancelReasonPlaceholder', 'Enter cancellation details...')}
            rows={3}
            className="w-full px-3 py-2 bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-xl text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-amber-500"
          />
        </div>

        <div className="flex gap-2.5 justify-end pt-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={handleClose}
            disabled={isCancelling}
            className="text-xs"
          >
            {t('bookings.keepBooking', 'Keep Booking')}
          </Button>
          <Button
            variant="danger"
            size="sm"
            onClick={() => void handleConfirm()}
            loading={isCancelling}
            className="text-xs font-bold"
          >
            {t('bookings.confirmCancel', 'Confirm Cancellation')}
          </Button>
        </div>
      </div>
    </Modal>
  )
}

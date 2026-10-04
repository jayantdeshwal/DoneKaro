import { useTranslation } from 'react-i18next'
import { AlertCircle, Banknote } from 'lucide-react'
import { Avatar, Badge, Button, Modal } from '@kaamgar/ui'
import { formatJobReference } from '@kaamgar/shared'
import type { BookingRow } from '../../types'
import { resolveServiceAndCategory } from '../../utils/bookingFormat'

interface CustomerPaymentModalProps {
  booking: BookingRow | null
  onClose: () => void
  onConfirmCashPayment: (booking: BookingRow) => Promise<void>
  isSubmittingPayment: boolean
  paymentModalError: string
}

export function CustomerPaymentModal({
  booking,
  onClose,
  onConfirmCashPayment,
  isSubmittingPayment,
  paymentModalError,
}: CustomerPaymentModalProps) {
  const { t, i18n } = useTranslation()

  if (!booking) return null

  const { serviceName } = resolveServiceAndCategory(booking.category_id, i18n.language)
  const summary = booking.paymentSummary
  const quoteAmount = summary?.initial_quote_amount ?? 0
  const additionalAmount = summary?.approved_additional_amount ?? 0
  const finalAmount = summary?.final_payable_amount ?? (quoteAmount + additionalAmount)

  return (
    <Modal
      isOpen={Boolean(booking)}
      onClose={() => {
        if (!isSubmittingPayment) {
          onClose()
        }
      }}
      title={t('bookings.serviceCompleted', 'Service Completed')}
      description={`Job ${formatJobReference(booking.id)}`}
      size="md"
    >
      <div className="space-y-4">
        {paymentModalError && (
          <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-500 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{paymentModalError}</span>
          </div>
        )}

        {/* Service & Worker Summary */}
        <div className="p-3.5 bg-slate-50 dark:bg-zinc-800/60 border border-slate-200 dark:border-zinc-700/60 rounded-2xl flex items-center gap-3">
          <Avatar
            name={booking.worker?.name || t('bookings.artisan', 'Artisan')}
            size="md"
            src={booking.worker?.avatar || undefined}
          />
          <div className="min-w-0 flex-1">
            <p className="font-bold text-sm text-slate-900 dark:text-white truncate">
              {serviceName}
            </p>
            <p className="text-xs text-slate-600 dark:text-zinc-400 truncate">
              {booking.worker?.name || t('bookings.artisan', 'Artisan')}
            </p>
          </div>
          <Badge variant="warning" size="sm">
            {t('bookings.paymentRequired', 'Payment Required')}
          </Badge>
        </div>

        {/* Payment Summary Breakdown */}
        <div className="rounded-2xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4 shadow-xs">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-500 mb-3">
            {t('bookings.paymentSummary', 'Payment Summary')}
          </p>
          <div className="space-y-2 text-xs">
            <div className="flex items-center justify-between text-slate-600 dark:text-zinc-400">
              <span>{t('bookings.workerQuote', 'Worker Quote')}</span>
              <span className="font-semibold text-slate-900 dark:text-zinc-200">
                ₹{quoteAmount.toFixed(2)}
              </span>
            </div>
            {additionalAmount > 0 && (
              <div className="flex items-center justify-between text-slate-600 dark:text-zinc-400">
                <span>{t('bookings.approvedAdditionalCharges', 'Approved Additional Charges')}</span>
                <span className="font-semibold text-slate-900 dark:text-zinc-200">
                  +₹{additionalAmount.toFixed(2)}
                </span>
              </div>
            )}
            <div className="flex items-center justify-between border-t border-slate-100 dark:border-zinc-800 pt-2.5 text-sm font-bold text-slate-900 dark:text-white">
              <span>{t('bookings.finalPayableAmount', 'Total Amount')}</span>
              <span className="text-base text-amber-600 dark:text-amber-400">
                ₹{finalAmount.toFixed(2)}
              </span>
            </div>
          </div>
        </div>

        {/* Payment Method Selection - Preselected Cash */}
        <div className="rounded-2xl border border-amber-500/30 bg-amber-500/5 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 rounded-full bg-amber-500 flex items-center justify-center text-slate-950 text-xs font-black">
                ✓
              </div>
              <span className="font-bold text-sm text-slate-900 dark:text-white">
                {t('bookings.paymentMethodCash', 'Cash')}
              </span>
            </div>
            <Badge variant="primary" size="sm">
              {t('common.required', 'Default')}
            </Badge>
          </div>
          <p className="mt-2 text-xs text-slate-600 dark:text-zinc-400">
            {t('bookings.payWorkerInCash', 'Pay the worker the amount shown above in cash.')}
          </p>
          <p className="mt-1 text-[11px] text-slate-400 dark:text-zinc-500 italic">
            {t('bookings.onlinePaymentComingSoon', 'Online payment (UPI / Cards) coming soon')}
          </p>
        </div>

        {/* Footer Actions */}
        <div className="flex gap-2.5 pt-2">
          <Button
            variant="secondary"
            size="sm"
            disabled={isSubmittingPayment}
            onClick={onClose}
            className="flex-1 text-xs"
          >
            {t('common.close', 'Close')}
          </Button>
          <Button
            variant="primary"
            size="sm"
            disabled={isSubmittingPayment}
            loading={isSubmittingPayment}
            onClick={() => void onConfirmCashPayment(booking)}
            className="flex-1 text-xs font-bold bg-amber-500 hover:bg-amber-400 text-slate-950"
          >
            <Banknote className="w-3.5 h-3.5 mr-1" />
            {t('bookings.ivePaidCash', "I've Paid Cash")}
          </Button>
        </div>
      </div>
    </Modal>
  )
}

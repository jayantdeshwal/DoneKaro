import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { AlertCircle, Banknote, CheckCircle2 } from 'lucide-react'
import { CATEGORIES, formatJobReference, getCategoryName } from '@kaamgar/shared'
import { Avatar, Badge, Button, Modal } from '@/ui'
import { confirmCashReceivedByWorker } from '@/services/changeRequests'
import type { WorkerBookingRow } from '../../types'

interface ConfirmCashModalProps {
  booking: WorkerBookingRow | null
  isOpen: boolean
  onClose: () => void
  onSuccess: () => Promise<void>
  onShowSuccessMsg: (msg: string) => void
}

export const ConfirmCashModal: React.FC<ConfirmCashModalProps> = ({
  booking,
  isOpen,
  onClose,
  onSuccess,
  onShowSuccessMsg,
}) => {
  const { t, i18n } = useTranslation()
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleClose = () => {
    if (isSubmitting) return
    setError('')
    onClose()
  }

  const handleConfirm = async () => {
    if (!booking || isSubmitting) return
    setIsSubmitting(true)
    setError('')
    try {
      await confirmCashReceivedByWorker(booking.id)
      await onSuccess()
      handleClose()
      onShowSuccessMsg(
        t(
          'workerDashboard.paymentReceivedSuccess',
          'Cash payment confirmed and job completed successfully!'
        )
      )
    } catch (err) {
      await onSuccess()
      const msg = err instanceof Error ? err.message : ''
      if (msg.toLowerCase().includes('already') || msg.toLowerCase().includes('paid')) {
        handleClose()
        onShowSuccessMsg(
          t('workerDashboard.paymentAlreadyPaid', 'Payment is already confirmed.')
        )
      } else {
        setError(
          err instanceof Error
            ? err.message
            : t('bookings.paymentActionFailed', 'Unable to update the payment. Please try again.')
        )
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!booking) return null

  const cat = CATEGORIES.find(c => c.id === booking.category_id)
  const categoryName = cat
    ? getCategoryName(cat, i18n.language === 'hi' ? 'hi' : 'en')
    : booking.category_id
  const summary = booking.paymentSummary
  const quoteAmount = summary?.initial_quote_amount ?? 0
  const additionalAmount = summary?.approved_additional_amount ?? 0
  const finalAmount = summary?.final_payable_amount ?? (quoteAmount + additionalAmount)

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={t('workerDashboard.confirmCashReceivedTitle', 'Confirm Cash Received')}
      description={`Job ${formatJobReference(booking.id)}`}
      size="md"
    >
      <div className="space-y-4">
        {error && (
          <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-500 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Customer and Service Info */}
        <div className="p-3.5 bg-surface-200/60 border border-semantic-border-light rounded-2xl flex items-center gap-3">
          <Avatar
            name={booking.customer?.name || t('bookings.customer', 'Customer')}
            size="md"
            src={booking.customer?.avatar || undefined}
          />
          <div className="min-w-0 flex-1">
            <p className="font-bold text-sm text-slate-900 dark:text-white truncate">
              {booking.customer?.name || t('bookings.customer', 'Customer')}
            </p>
            <p className="text-xs text-semantic-text-secondary truncate">{categoryName}</p>
          </div>
          <Badge variant="warning" size="sm">
            {t('workerDashboard.pendingConfirmation', 'Confirmation Pending')}
          </Badge>
        </div>

        {/* Payment Summary */}
        <div className="rounded-2xl border border-semantic-border-light bg-surface-100 p-4 shadow-xs">
          <p className="text-xs font-bold uppercase tracking-wider text-semantic-text-tertiary mb-3">
            {t('bookings.paymentSummary', 'Payment Summary')}
          </p>
          <div className="space-y-2 text-xs">
            <div className="flex items-center justify-between text-semantic-text-secondary">
              <span>{t('bookings.workerQuote', 'Worker Quote')}</span>
              <span className="font-semibold text-slate-900 dark:text-zinc-200">
                ₹{quoteAmount.toFixed(2)}
              </span>
            </div>
            {additionalAmount > 0 && (
              <div className="flex items-center justify-between text-semantic-text-secondary">
                <span>{t('bookings.approvedAdditionalCharges', 'Approved Additional Charges')}</span>
                <span className="font-semibold text-slate-900 dark:text-zinc-200">
                  +₹{additionalAmount.toFixed(2)}
                </span>
              </div>
            )}
            <div className="flex items-center justify-between border-t border-semantic-border-light pt-2.5 text-sm font-bold text-slate-900 dark:text-white">
              <span>{t('bookings.amountToPay', 'Total Cash to Receive')}</span>
              <span className="text-base text-amber-500 font-black">
                ₹{finalAmount.toFixed(2)}
              </span>
            </div>
          </div>
        </div>

        {/* Payment Method Notice */}
        <div className="rounded-2xl border border-amber-500/30 bg-amber-500/5 p-3.5 text-xs">
          <div className="flex items-center gap-2 font-bold text-slate-900 dark:text-white mb-1">
            <Banknote className="w-4 h-4 text-amber-500" />
            <span>{t('bookings.paymentMethodCash', 'Cash Payment')}</span>
          </div>
          <p className="text-semantic-text-secondary">
            {t(
              'workerDashboard.confirmCashReceivedNotice',
              'By confirming, you verify that you have received this exact cash amount from the customer. The job will be marked as completed and an official receipt will be generated.'
            )}
          </p>
        </div>

        {/* Actions */}
        <div className="flex gap-2.5 pt-2">
          <Button
            variant="secondary"
            size="sm"
            disabled={isSubmitting}
            onClick={handleClose}
            className="flex-1 text-xs"
          >
            {t('common.cancel', 'Cancel')}
          </Button>
          <Button
            variant="primary"
            size="sm"
            disabled={isSubmitting}
            loading={isSubmitting}
            onClick={() => void handleConfirm()}
            className="flex-1 text-xs font-bold bg-amber-500 hover:bg-amber-400 text-slate-950"
          >
            <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
            {t('workerDashboard.confirmCashReceived', 'Confirm Cash Received')}
          </Button>
        </div>
      </div>
    </Modal>
  )
}

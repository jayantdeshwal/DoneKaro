import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { formatJobReference } from '@kaamgar/shared'
import { Button, Modal } from '@/ui'
import { createBookingChangeRequest } from '@/services/changeRequests'
import type { WorkerBookingRow } from '../../types'

interface AdditionalChargeModalProps {
  booking: WorkerBookingRow | null
  isOpen: boolean
  onClose: () => void
  onSuccess: () => Promise<void>
}

export const AdditionalChargeModal: React.FC<AdditionalChargeModalProps> = ({
  booking,
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { t } = useTranslation()
  const [amount, setAmount] = useState('')
  const [reason, setReason] = useState('')
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleClose = () => {
    if (isSubmitting) return
    setAmount('')
    setReason('')
    setError('')
    onClose()
  }

  const handleSubmit = async () => {
    if (!booking) return
    const numericAmount = Number(amount)
    if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
      setError(
        t(
          'workerDashboard.additionalAmountError',
          'Enter an additional amount greater than zero.'
        )
      )
      return
    }
    if (!reason.trim()) {
      setError(
        t('workerDashboard.additionalReasonError', 'Enter a reason for the additional charge.')
      )
      return
    }

    setIsSubmitting(true)
    setError('')
    try {
      await createBookingChangeRequest({
        bookingId: booking.id,
        amount: numericAmount,
        reason,
      })
      handleClose()
      await onSuccess()
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : t(
              'workerDashboard.changeRequestError',
              'Unable to create the additional-charge request'
            )
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={t('workerDashboard.requestAdditionalCharge', 'Request Additional Charge')}
      description={
        booking
          ? `${t('workerDashboard.job', 'Job')} ${formatJobReference(booking.id)} — ${t(
              'workerDashboard.customerApprovalRequired',
              'customer approval is required.'
            )}`
          : undefined
      }
    >
      <div className="space-y-4">
        {error && (
          <p className="rounded-xl bg-rose-500/10 border border-rose-500/30 p-3 text-xs text-rose-500">
            {error}
          </p>
        )}
        <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300">
          {t('workerDashboard.additionalAmount', 'Additional amount')}
          <input
            type="number"
            min="0.01"
            step="0.01"
            value={amount}
            onChange={e => setAmount(e.target.value)}
            className="mt-1.5 w-full rounded-xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 px-3.5 py-2.5 text-sm text-slate-900 dark:text-zinc-100 focus:border-amber-500 focus:outline-none"
            placeholder="0.00"
          />
        </label>
        <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300">
          {t('workerDashboard.reason', 'Reason')}
          <textarea
            value={reason}
            onChange={e => setReason(e.target.value)}
            rows={3}
            maxLength={1000}
            className="mt-1.5 w-full rounded-xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 px-3.5 py-2.5 text-sm text-slate-900 dark:text-zinc-100 focus:border-amber-500 focus:outline-none"
            placeholder={t(
              'workerDashboard.additionalReasonPlaceholder',
              'Explain why this additional charge is needed'
            )}
          />
        </label>
        <div className="flex gap-2">
          <Button
            variant="secondary"
            className="flex-1"
            disabled={isSubmitting}
            onClick={handleClose}
          >
            {t('common.cancel', 'Cancel')}
          </Button>
          <Button
            variant="primary"
            className="flex-1"
            loading={isSubmitting}
            onClick={() => void handleSubmit()}
          >
            {t('workerDashboard.sendRequest', 'Send Request')}
          </Button>
        </div>
      </div>
    </Modal>
  )
}

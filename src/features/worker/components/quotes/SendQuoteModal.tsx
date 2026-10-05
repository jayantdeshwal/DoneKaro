import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Button, Modal } from '@/ui'
import {
  BookingQuoteRequest,
  respondToBookingQuoteRequest,
} from '@/services/quotes'

interface SendQuoteModalProps {
  request: BookingQuoteRequest | null
  isOpen: boolean
  onClose: () => void
  onSuccess: () => Promise<void>
}

export const SendQuoteModal: React.FC<SendQuoteModalProps> = ({
  request,
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { t } = useTranslation()
  const [amount, setAmount] = useState('')
  const [details, setDetails] = useState('')
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleClose = () => {
    if (isSubmitting) return
    setAmount('')
    setDetails('')
    setError('')
    onClose()
  }

  const handleSubmit = async () => {
    if (!request) return
    const numericAmount = Number(amount)
    if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
      setError(t('workerDashboard.quoteAmountError', 'Enter the quote amount submitted by you.'))
      return
    }

    setIsSubmitting(true)
    setError('')
    try {
      await respondToBookingQuoteRequest({
        requestId: request.id,
        action: 'quote',
        amount: numericAmount,
        details,
      })
      handleClose()
      await onSuccess()
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : t('workerDashboard.quoteResponseError', 'Unable to respond to quote request')
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={t('workerDashboard.sendProviderQuote', 'Send Provider Quote')}
      description={t(
        'workerDashboard.quoteDescriptionHint',
        'Enter the amount and details you choose to offer. DoneKaro does not calculate or suggest this amount.'
      )}
    >
      <div className="space-y-4">
        {error && (
          <p className="rounded-xl bg-rose-500/10 border border-rose-500/30 p-3 text-xs text-rose-500">
            {error}
          </p>
        )}
        <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300">
          {t('workerDashboard.estimatedAmount', 'Estimated Amount')}
          <input
            type="number"
            min="0.01"
            step="0.01"
            value={amount}
            onChange={e => setAmount(e.target.value)}
            className="mt-1.5 w-full rounded-xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 px-3.5 py-2.5 text-sm text-slate-900 dark:text-zinc-100 focus:border-amber-500 focus:outline-none"
            placeholder={t('workerDashboard.amountPlaceholder', 'Enter your amount')}
          />
        </label>
        <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300">
          {t('workerDashboard.description', 'Description')}
          <textarea
            value={details}
            onChange={e => setDetails(e.target.value)}
            rows={4}
            maxLength={2000}
            className="mt-1.5 w-full rounded-xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 px-3.5 py-2.5 text-sm text-slate-900 dark:text-zinc-100 focus:border-amber-500 focus:outline-none"
            placeholder={t(
              'workerDashboard.quoteDetailsPlaceholder',
              'Explain what your quote includes'
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
            {t('workerDashboard.submitQuote', 'Submit Quote')}
          </Button>
        </div>
      </div>
    </Modal>
  )
}

import React from 'react'
import { useTranslation } from 'react-i18next'
import { CheckCircle2, Clock, FileText } from 'lucide-react'
import { Badge, Button } from '@/ui'
import type { WorkerBookingRow } from '../../types'

interface WorkerPaymentCardProps {
  booking: WorkerBookingRow
  onConfirmCash: (booking: WorkerBookingRow) => void
  onViewReceipt: (booking: WorkerBookingRow) => void
}

export const WorkerPaymentCard: React.FC<WorkerPaymentCardProps> = ({
  booking,
  onConfirmCash,
  onViewReceipt,
}) => {
  const { t, i18n } = useTranslation()
  const summary = booking.paymentSummary

  if (!summary?.has_initial_quote) return null

  return (
    <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-3 text-xs">
      <p className="font-bold text-slate-900 dark:text-white">
        {t('bookings.paymentSummary', 'Payment Summary')}
      </p>
      <div className="mt-2 space-y-1 text-semantic-text-secondary">
        <div className="flex items-center justify-between gap-3">
          <span>{t('bookings.initialServiceCharge', 'Initial service charge')}</span>
          <span className="font-semibold text-slate-900 dark:text-zinc-200">
            ₹{summary.initial_quote_amount.toFixed(2)}
          </span>
        </div>
        <div className="flex items-center justify-between gap-3">
          <span>{t('bookings.approvedAdditionalCharges', 'Approved additional charges')}</span>
          <span className="font-semibold text-slate-900 dark:text-zinc-200">
            ₹{summary.approved_additional_amount.toFixed(2)}
          </span>
        </div>
        <div className="flex items-center justify-between gap-3 border-t border-emerald-500/20 pt-2 font-bold text-slate-900 dark:text-white">
          <span>
            {summary.is_final || summary.is_frozen
              ? t('bookings.finalPayableAmount', 'Final payable amount')
              : t('bookings.currentPayableAmount', 'Current payable amount')}
          </span>
          <span>₹{summary.final_payable_amount.toFixed(2)}</span>
        </div>
      </div>

      {summary.pending_additional_count > 0 && (
        <p className="mt-2 text-amber-700 dark:text-amber-300">
          {t('bookings.pendingAdditionalCharges', 'Additional charges are awaiting approval.')}
        </p>
      )}

      {/* State A: Service Finished, Payment Required from Customer */}
      {booking.status === 'payment_pending' &&
        summary.payment_status !== 'paid' &&
        summary.payment_status !== 'pending' && (
          <div className="mt-3 rounded-xl border border-amber-500/30 bg-amber-500/10 p-3.5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                <p className="font-bold text-slate-900 dark:text-white">
                  {t(
                    'workerDashboard.paymentRequiredFromCustomer',
                    'Payment Required from Customer'
                  )}
                </p>
              </div>
              <Badge variant="warning" size="sm">
                {t('bookings.paymentRequired', 'Payment Required')}
              </Badge>
            </div>
            <div className="mt-2 flex items-baseline justify-between">
              <span className="text-semantic-text-secondary">
                {t('bookings.amountToPay', 'Amount Due')}:
              </span>
              <span className="text-base font-bold text-slate-900 dark:text-white">
                ₹{summary.final_payable_amount.toFixed(2)}
              </span>
            </div>
            <p className="mt-1.5 text-[11px] text-amber-700 dark:text-amber-300">
              {t(
                'workerDashboard.waitingForCustomerPaymentConfirmation',
                'Waiting for customer payment confirmation. The customer needs to confirm the cash handover.'
              )}
            </p>
          </div>
        )}

      {/* State B: Customer Confirmed Cash, Awaiting Worker Confirmation */}
      {booking.status === 'payment_pending' && summary.payment_status === 'pending' && (
        <div className="mt-3 rounded-xl border border-amber-500/40 bg-amber-500/15 p-3.5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-amber-500 animate-spin" />
              <p className="font-bold text-amber-900 dark:text-amber-200">
                {t(
                  'workerDashboard.cashPaymentAwaitingConfirmation',
                  'Cash Payment Awaiting Confirmation'
                )}
              </p>
            </div>
            <Badge variant="warning" size="sm">
              {t('workerDashboard.pendingConfirmation', 'Confirmation Pending')}
            </Badge>
          </div>
          <p className="mt-2 text-[11px] text-slate-700 dark:text-zinc-300">
            {t(
              'workerDashboard.customerCashConfirmedDesc',
              'Customer has confirmed cash payment handover.'
            )}
          </p>
          {summary.customer_confirmed_at && (
            <p className="mt-0.5 text-[10px] text-slate-500 dark:text-zinc-400">
              {t('booking.jobDetails.customerConfirmed', 'Customer confirmed')}:{' '}
              {new Date(summary.customer_confirmed_at).toLocaleTimeString(
                i18n.language === 'hi' ? 'hi-IN' : 'en-IN',
                { hour: '2-digit', minute: '2-digit' }
              )}
            </p>
          )}
          <div className="mt-2.5 flex items-baseline justify-between border-t border-amber-500/20 pt-2 font-bold text-slate-900 dark:text-white">
            <span>{t('bookings.amountToPay', 'Amount Due')}:</span>
            <span className="text-base text-amber-600 dark:text-amber-400">
              ₹{summary.final_payable_amount.toFixed(2)} · {t('bookings.paymentMethodCash', 'Cash')}
            </span>
          </div>
          <Button
            variant="primary"
            size="sm"
            className="mt-3 w-full font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 flex items-center justify-center gap-1.5 shadow-sm"
            onClick={() => onConfirmCash(booking)}
          >
            <CheckCircle2 className="w-4 h-4" />
            {t('workerDashboard.confirmCashReceived', 'Confirm Cash Received')}
          </Button>
        </div>
      )}

      {/* State C: Paid & Authoritative Receipt Exists */}
      {booking.status === 'completed' &&
        summary.payment_status === 'paid' &&
        summary.receipt_number && (
          <div className="mt-3 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3.5 text-xs">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <span className="font-bold text-emerald-800 dark:text-emerald-300">
                  {t(
                    'workerDashboard.paymentReceivedJobCompleted',
                    'Payment Received — Job Completed'
                  )}
                </span>
              </div>
              <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded-lg bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30">
                {summary.receipt_number}
              </span>
            </div>
            <div className="mt-2 flex items-baseline justify-between">
              <span className="text-semantic-text-secondary">{t('bookings.totalPaid', 'Total Paid')}:</span>
              <span className="text-sm font-bold text-emerald-700 dark:text-emerald-300">
                ₹{summary.final_payable_amount.toFixed(2)} · {t('bookings.paymentMethodCash', 'Cash')}
              </span>
            </div>
            <p className="mt-1 text-[11px] text-slate-500 dark:text-zinc-400">
              {t('bookings.paidAt', 'Paid at')}:{' '}
              {summary.receipt_paid_at || summary.paid_at
                ? new Date(summary.receipt_paid_at || summary.paid_at || '').toLocaleString(
                    i18n.language === 'hi' ? 'hi-IN' : 'en-IN',
                    { dateStyle: 'medium', timeStyle: 'short' }
                  )
                : '—'}
            </p>
            <Button
              variant="outline"
              size="sm"
              className="mt-3 w-full text-xs font-bold flex items-center justify-center gap-1.5 text-emerald-700 dark:text-emerald-300 border-emerald-500/40 hover:bg-emerald-500/20"
              onClick={() => onViewReceipt(booking)}
            >
              <FileText className="w-3.5 h-3.5" />
              {t('workerDashboard.viewReceipt', 'View Receipt')}
            </Button>
          </div>
        )}

      {!summary.is_final &&
        summary.pending_additional_count === 0 &&
        booking.status !== 'completed' &&
        booking.status !== 'payment_pending' && (
          <p className="mt-2 text-semantic-text-tertiary">
            {t(
              'bookings.finalAmountAfterCompletion',
              'The final amount will be shown after the service is completed.'
            )}
          </p>
        )}
    </div>
  )
}

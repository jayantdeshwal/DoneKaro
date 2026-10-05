import { useTranslation } from 'react-i18next'
import { CheckCircle2, Printer, Shield, Sparkles } from 'lucide-react'
import { Button, Modal } from '@kaamgar/ui'
import { formatJobReference } from '@kaamgar/shared'
import type { BookingRow } from '../../types'
import { formatBookingDate, resolveServiceAndCategory } from '../../utils/bookingFormat'

interface OfficialReceiptModalProps {
  booking: BookingRow | null
  onClose: () => void
}

export function OfficialReceiptModal({ booking, onClose }: OfficialReceiptModalProps) {
  const { t, i18n } = useTranslation()

  if (!booking) return null

  const { serviceName } = resolveServiceAndCategory(booking.category_id, i18n.language)
  const summary = booking.paymentSummary
  const jobReference = formatJobReference(booking.id)
  const receiptNumber = summary?.receipt_number || '—'
  const paidDate = summary?.receipt_paid_at || summary?.paid_at
    ? new Date(summary.receipt_paid_at || summary.paid_at || '').toLocaleString(
        i18n.language === 'hi' ? 'hi-IN' : 'en-IN',
        {
          dateStyle: 'medium',
          timeStyle: 'short',
        }
      )
    : formatBookingDate(booking.scheduled_at, i18n.language)
  const quoteAmount = summary?.initial_quote_amount ?? 0
  const additionalAmount = summary?.approved_additional_amount ?? 0
  const finalAmount = summary?.final_payable_amount ?? (quoteAmount + additionalAmount)

  return (
    <Modal
      isOpen={Boolean(booking)}
      onClose={onClose}
      title={t('bookings.paymentReceipt', 'Payment Receipt')}
      size="md"
    >
      <div className="space-y-4">
        <style>{`
          @media print {
            body * {
              visibility: hidden !important;
            }
            #printable-receipt, #printable-receipt * {
              visibility: visible !important;
            }
            #printable-receipt {
              position: fixed !important;
              left: 0 !important;
              top: 0 !important;
              width: 100% !important;
              margin: 0 !important;
              padding: 24px !important;
              background: white !important;
              color: black !important;
              border: 1px solid #e2e8f0 !important;
              box-shadow: none !important;
              z-index: 99999 !important;
            }
            .no-print {
              display: none !important;
            }
          }
        `}</style>

        {/* Printable Receipt Paper Container */}
        <div
          id="printable-receipt"
          className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-5 shadow-sm space-y-4 text-slate-900 dark:text-white"
        >
          {/* Header Branding */}
          <div className="text-center pb-4 border-b border-slate-200 dark:border-zinc-800">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-600 dark:text-amber-400 text-xs font-bold mb-2">
              <Sparkles className="w-3.5 h-3.5" />
              <span>DONEKARO</span>
            </div>
            <p className="text-xs text-slate-500 dark:text-zinc-400 font-medium">
              DoneKaro • Muzaffarnagar
            </p>
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-white mt-1">
              {t('bookings.officialReceipt', 'Official Cash Payment Receipt')}
            </h3>
          </div>

          {/* Receipt Metadata Grid */}
          <div className="grid grid-cols-2 gap-2 text-xs py-2 border-b border-slate-100 dark:border-zinc-800">
            <div>
              <span className="text-slate-400 dark:text-zinc-500 block">
                {t('bookings.receiptNumber', 'Receipt')}
              </span>
              <span className="font-mono font-bold text-slate-900 dark:text-white">
                {receiptNumber}
              </span>
            </div>
            <div className="text-right">
              <span className="text-slate-400 dark:text-zinc-500 block">{t('bookings.jobId', 'Job')}</span>
              <span className="font-mono font-bold text-slate-900 dark:text-white">{jobReference}</span>
            </div>
            <div className="mt-1">
              <span className="text-slate-400 dark:text-zinc-500 block">{t('bookings.paidAt', 'Paid at')}</span>
              <span className="font-semibold text-slate-700 dark:text-zinc-300">{paidDate}</span>
            </div>
            <div className="text-right mt-1">
              <span className="text-slate-400 dark:text-zinc-500 block">
                {t('bookings.paymentMethod', 'Payment Method')}
              </span>
              <span className="inline-flex items-center gap-1 font-semibold text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="w-3.5 h-3.5" />
                {t('bookings.paymentMethodCash', 'Cash')}
              </span>
            </div>
          </div>

          {/* Service & Worker Details */}
          <div className="space-y-1.5 text-xs py-2 border-b border-slate-100 dark:border-zinc-800">
            <div className="flex justify-between">
              <span className="text-slate-500 dark:text-zinc-400">{t('bookings.serviceCategory', 'Service')}:</span>
              <span className="font-semibold text-slate-900 dark:text-white">{serviceName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500 dark:text-zinc-400">{t('bookings.worker', 'Worker')}:</span>
              <span className="font-semibold text-slate-900 dark:text-white">
                {booking.worker?.name || 'Verified Artisan'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500 dark:text-zinc-400">{t('common.address', 'Address')}:</span>
              <span className="font-medium text-slate-700 dark:text-zinc-300 text-right max-w-[200px] truncate">
                {booking.address}
              </span>
            </div>
          </div>

          {/* Amount Breakdown */}
          <div className="space-y-1.5 text-xs py-2">
            <div className="flex justify-between text-slate-600 dark:text-zinc-400">
              <span>{t('bookings.workerQuote', 'Worker Quote')}</span>
              <span>₹{quoteAmount.toFixed(2)}</span>
            </div>
            {additionalAmount > 0 && (
              <div className="flex justify-between text-slate-600 dark:text-zinc-400">
                <span>{t('bookings.approvedAdditionalCharges', 'Approved Additional Charges')}</span>
                <span>+₹{additionalAmount.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between items-center pt-2 border-t border-slate-200 dark:border-zinc-800 font-bold">
              <span className="text-slate-900 dark:text-white text-sm">{t('bookings.totalPaid', 'Total Paid')}</span>
              <span className="text-emerald-600 dark:text-emerald-400 text-base">
                ₹{finalAmount.toFixed(2)}
              </span>
            </div>
          </div>

          {/* Verified Footer Notice */}
          <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-[11px] text-emerald-800 dark:text-emerald-300 flex items-center gap-2">
            <Shield className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span>
              {t(
                'bookings.receiptFooterNote',
                'This receipt confirms direct cash payment received by the artisan for service in Muzaffarnagar. Verified by DoneKaro.'
              )}
            </span>
          </div>
        </div>

        {/* Action Buttons (Excluded from Print) */}
        <div className="flex gap-2.5 pt-2 no-print">
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.print()}
            className="flex-1 text-xs font-semibold flex items-center justify-center gap-1.5"
          >
            <Printer className="w-3.5 h-3.5" />
            {t('bookings.printReceipt', 'Print / Save Receipt')}
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={onClose}
            className="flex-1 text-xs font-bold bg-amber-500 hover:bg-amber-400 text-slate-950"
          >
            {t('common.close', 'Close')}
          </Button>
        </div>
      </div>
    </Modal>
  )
}

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
      <div className="space-y-4 print:space-y-0">
        <style>{`
          @page {
            size: A4 portrait;
            margin: 10mm 12mm;
          }
          @media print {
            html, body {
              margin: 0 !important;
              padding: 0 !important;
              height: auto !important;
              min-height: 0 !important;
              max-height: 100% !important;
              overflow: hidden !important;
              background: #ffffff !important;
              color: #0f172a !important;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
            #root,
            nav,
            header,
            footer,
            aside,
            .no-print {
              display: none !important;
            }
            #printable-receipt,
            #printable-receipt * {
              visibility: visible !important;
            }
            #printable-receipt {
              display: block !important;
              position: static !important;
              width: 100% !important;
              max-width: 560px !important;
              margin: 0 auto !important;
              padding: 20px 24px !important;
              background: #ffffff !important;
              color: #0f172a !important;
              border: 1px solid #cbd5e1 !important;
              border-radius: 12px !important;
              box-shadow: none !important;
              page-break-inside: avoid !important;
              break-inside: avoid !important;
              overflow: hidden !important;
            }
          }
        `}</style>

        {/* Printable Receipt Paper Container */}
        <div
          id="printable-receipt"
          className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-5 shadow-sm space-y-4 text-slate-900 dark:text-white print:block print:w-full print:max-w-[560px] print:mx-auto print:p-5 print:space-y-3 print:rounded-xl print:border print:border-slate-300 print:bg-white print:text-slate-900 print:shadow-none break-inside-avoid overflow-hidden"
        >
          {/* Header Branding */}
          <div className="text-center pb-4 print:pb-2.5 border-b border-slate-200 dark:border-zinc-800 print:border-slate-200">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-600 dark:text-amber-400 print:text-amber-700 print:border-amber-400 print:bg-amber-50 text-xs font-bold mb-2 print:mb-1">
              <Sparkles className="w-3.5 h-3.5" />
              <span>DONEKARO</span>
            </div>
            <p className="text-xs text-slate-500 dark:text-zinc-400 print:text-slate-600 font-medium">
              DoneKaro • Muzaffarnagar
            </p>
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-white print:text-slate-900 mt-1 print:mt-0.5">
              {t('bookings.officialReceipt', 'Official Cash Payment Receipt')}
            </h3>
          </div>

          {/* Receipt Metadata Grid */}
          <div className="grid grid-cols-2 gap-2 text-xs py-2 print:py-1.5 border-b border-slate-100 dark:border-zinc-800 print:border-slate-200">
            <div>
              <span className="text-slate-400 dark:text-zinc-500 print:text-slate-500 block">
                {t('bookings.receiptNumber', 'Receipt')}
              </span>
              <span className="font-mono font-bold text-slate-900 dark:text-white print:text-slate-900">
                {receiptNumber}
              </span>
            </div>
            <div className="text-right">
              <span className="text-slate-400 dark:text-zinc-500 print:text-slate-500 block">{t('bookings.jobId', 'Job')}</span>
              <span className="font-mono font-bold text-slate-900 dark:text-white print:text-slate-900">{jobReference}</span>
            </div>
            <div className="mt-1 print:mt-0.5">
              <span className="text-slate-400 dark:text-zinc-500 print:text-slate-500 block">{t('bookings.paidAt', 'Paid at')}</span>
              <span className="font-semibold text-slate-700 dark:text-zinc-300 print:text-slate-800">{paidDate}</span>
            </div>
            <div className="text-right mt-1 print:mt-0.5">
              <span className="text-slate-400 dark:text-zinc-500 print:text-slate-500 block">
                {t('bookings.paymentMethod', 'Payment Method')}
              </span>
              <span className="inline-flex items-center gap-1 font-semibold text-emerald-600 dark:text-emerald-400 print:text-emerald-700">
                <CheckCircle2 className="w-3.5 h-3.5" />
                {t('bookings.paymentMethodCash', 'Cash')}
              </span>
            </div>
          </div>

          {/* Service & Worker Details */}
          <div className="space-y-1.5 print:space-y-1 text-xs py-2 print:py-1.5 border-b border-slate-100 dark:border-zinc-800 print:border-slate-200">
            <div className="flex justify-between">
              <span className="text-slate-500 dark:text-zinc-400 print:text-slate-600">{t('bookings.serviceCategory', 'Service')}:</span>
              <span className="font-semibold text-slate-900 dark:text-white print:text-slate-900">{serviceName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500 dark:text-zinc-400 print:text-slate-600">{t('bookings.worker', 'Worker')}:</span>
              <span className="font-semibold text-slate-900 dark:text-white print:text-slate-900">
                {booking.worker?.name || 'Verified Artisan'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500 dark:text-zinc-400 print:text-slate-600">{t('common.address', 'Address')}:</span>
              <span className="font-medium text-slate-700 dark:text-zinc-300 print:text-slate-800 text-right max-w-[200px] truncate">
                {booking.address}
              </span>
            </div>
          </div>

          {/* Amount Breakdown */}
          <div className="space-y-1.5 print:space-y-1 text-xs py-2 print:py-1.5">
            <div className="flex justify-between text-slate-600 dark:text-zinc-400 print:text-slate-600">
              <span>{t('bookings.workerQuote', 'Worker Quote')}</span>
              <span>₹{quoteAmount.toFixed(2)}</span>
            </div>
            {additionalAmount > 0 && (
              <div className="flex justify-between text-slate-600 dark:text-zinc-400 print:text-slate-600">
                <span>{t('bookings.approvedAdditionalCharges', 'Approved Additional Charges')}</span>
                <span>+₹{additionalAmount.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between items-center pt-2 print:pt-1.5 border-t border-slate-200 dark:border-zinc-800 print:border-slate-200 font-bold">
              <span className="text-slate-900 dark:text-white print:text-slate-900 text-sm">{t('bookings.totalPaid', 'Total Paid')}</span>
              <span className="text-emerald-600 dark:text-emerald-400 print:text-emerald-700 text-base">
                ₹{finalAmount.toFixed(2)}
              </span>
            </div>
          </div>

          {/* Verified Footer Notice */}
          <div className="p-2.5 print:p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 print:border-emerald-300 print:bg-emerald-50 text-[11px] text-emerald-800 dark:text-emerald-300 print:text-emerald-900 flex items-center gap-2">
            <Shield className="w-4 h-4 text-emerald-600 dark:text-emerald-400 print:text-emerald-700 shrink-0" />
            <span>
              {t(
                'bookings.receiptFooterNote',
                'This receipt confirms direct cash payment received by the artisan for service in Muzaffarnagar. Verified by DoneKaro.'
              )}
            </span>
          </div>
        </div>

        {/* Action Buttons (Excluded from Print) */}
        <div className="flex gap-2.5 pt-2 no-print print:hidden">
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

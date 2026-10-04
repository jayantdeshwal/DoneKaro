import React from 'react'
import { useTranslation } from 'react-i18next'
import {
  Banknote,
  Briefcase,
  Calendar,
  FileText,
  MapPin,
  Phone,
  ShieldAlert,
  Sparkles,
  Star,
} from 'lucide-react'
import { CATEGORIES, formatJobReference, getCategoryName } from '@kaamgar/shared'
import { Badge, Button, Modal } from '@/ui'
import type { WorkerBookingRow } from '../../types'

interface CompletedJobModalProps {
  booking: WorkerBookingRow | null
  isOpen: boolean
  isRepeatCustomer: boolean
  onClose: () => void
  onOpenAssistant: (bookingId: string) => void
  onOpenSupport: (bookingId: string) => void
  onOpenReceipt: (booking: WorkerBookingRow) => void
}

export const CompletedJobModal: React.FC<CompletedJobModalProps> = ({
  booking,
  isOpen,
  isRepeatCustomer,
  onClose,
  onOpenAssistant,
  onOpenSupport,
  onOpenReceipt,
}) => {
  const { t, i18n } = useTranslation()

  if (!booking) return null

  const catObj = CATEGORIES.find(c => c.id === booking.category_id)
  const catName = catObj
    ? getCategoryName(catObj, i18n.language === 'hi' ? 'hi' : 'en')
    : booking.category_id

  const scheduledDate = new Date(booking.scheduled_at).toLocaleDateString(
    i18n.language === 'hi' ? 'hi-IN' : 'en-IN',
    {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }
  )
  const scheduledTime = new Date(booking.scheduled_at).toLocaleTimeString(
    i18n.language === 'hi' ? 'hi-IN' : 'en-IN',
    {
      hour: '2-digit',
      minute: '2-digit',
    }
  )

  const summary = booking.paymentSummary
  const initialQuote = summary?.initial_quote_amount ?? 0
  const approvedAdditional = summary?.approved_additional_amount ?? 0
  const finalAmount = summary?.final_payable_amount ?? (initialQuote + approvedAdditional)
  const paidAtStr = summary?.receipt_paid_at || summary?.paid_at
  const paidDate = paidAtStr
    ? new Date(paidAtStr).toLocaleString(i18n.language === 'hi' ? 'hi-IN' : 'en-IN', {
        dateStyle: 'medium',
        timeStyle: 'short',
      })
    : '—'

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={t('workerDashboard.completedJobDetails', 'Completed Job Details')}
      description={`${formatJobReference(booking.id)} · ${t(
        'workerDashboard.completed',
        'Completed'
      )}`}
    >
      <div className="space-y-4 pt-1 text-slate-900 dark:text-white">
        {/* Customer Header */}
        <div className="p-3.5 rounded-2xl bg-surface-100 border border-semantic-border-light flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-brand-500/20 border border-brand-500/40 flex items-center justify-center font-bold text-brand-400 text-sm">
              {booking.customer?.name ? booking.customer.name.charAt(0) : 'C'}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <p className="text-sm font-bold">
                  {booking.customer?.name || t('bookings.customer', 'Customer')}
                </p>
                {isRepeatCustomer && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-brand-500/15 text-brand-600 dark:text-brand-400 text-[10px] font-bold border border-brand-500/30">
                    <Sparkles className="w-2.5 h-2.5" />
                    {t('workerDashboard.repeatCustomer', 'Repeat Customer')}
                  </span>
                )}
              </div>
              <p className="text-xs text-semantic-text-secondary">
                {catName} {t('workerDashboard.service', 'Service')}
              </p>
            </div>
          </div>
          {booking.customer?.phone && (
            <a
              href={`tel:${booking.customer.phone}`}
              className="p-2 rounded-xl bg-surface-200 hover:bg-surface-300 text-semantic-text-primary border border-semantic-border-light transition-colors"
              title={t('workerDashboard.call', 'Call')}
            >
              <Phone className="w-4 h-4" />
            </a>
          )}
        </div>

        {/* Schedule & Location */}
        <div className="p-3 rounded-xl bg-surface-100 border border-semantic-border-light text-xs space-y-2">
          <div className="flex items-center gap-2 text-semantic-text-secondary">
            <Calendar className="w-4 h-4 text-brand-400 shrink-0" />
            <span>
              {scheduledDate} · {scheduledTime}
            </span>
          </div>
          <div className="flex items-start gap-2 text-semantic-text-secondary">
            <MapPin className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <span>{booking.address || t('workerDashboard.muzaffarnagar', 'Muzaffarnagar')}</span>
          </div>
          {booking.notes && (
            <div className="pt-2 border-t border-semantic-border-light/60">
              <span className="text-[10px] font-semibold text-semantic-text-tertiary uppercase tracking-wider block mb-0.5">
                {t('bookings.serviceNotes', 'Customer Request Notes')}
              </span>
              <p className="text-xs italic text-semantic-text-secondary">"{booking.notes}"</p>
            </div>
          )}
        </div>

        {/* Payment Summary */}
        <div className="p-3.5 rounded-xl border border-emerald-500/30 bg-emerald-500/5 text-xs space-y-2">
          <div className="flex items-center justify-between border-b border-emerald-500/20 pb-2">
            <span className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
              <Banknote className="w-4 h-4 text-emerald-500" />
              {t('bookings.paymentSummary', 'Payment Summary')}
            </span>
            <Badge variant="success" size="sm">
              {t('bookings.status.paid', 'Paid')}
            </Badge>
          </div>
          <div className="space-y-1.5 text-semantic-text-secondary">
            <div className="flex justify-between">
              <span>{t('bookings.workerQuote', 'Worker Quote')}</span>
              <span className="font-semibold text-slate-900 dark:text-zinc-200">
                ₹{initialQuote.toFixed(2)}
              </span>
            </div>
            {approvedAdditional > 0 && (
              <div className="flex justify-between">
                <span>{t('bookings.approvedAdditionalCharges', 'Approved Additional Charges')}</span>
                <span className="font-semibold text-slate-900 dark:text-zinc-200">
                  +₹{approvedAdditional.toFixed(2)}
                </span>
              </div>
            )}
            <div className="flex justify-between items-center pt-2 border-t border-emerald-500/20 font-bold text-slate-900 dark:text-white">
              <span>{t('bookings.totalPaid', 'Total Paid')}</span>
              <span className="text-emerald-600 dark:text-emerald-400 text-sm">
                ₹{finalAmount.toFixed(2)} · {t('bookings.paymentMethodCash', 'Cash')}
              </span>
            </div>
          </div>
          <div className="pt-1.5 text-[11px] text-semantic-text-tertiary flex items-center justify-between">
            <span>
              {t('bookings.paidAt', 'Paid at')}: {paidDate}
            </span>
            {summary?.receipt_number && (
              <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                {summary.receipt_number}
              </span>
            )}
          </div>
        </div>

        {/* Review Section */}
        <div className="p-3 rounded-xl bg-surface-100 border border-semantic-border-light text-xs space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
              <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
              {t('workerDashboard.customerReview', 'Customer Feedback')}
            </span>
            {booking.review ? (
              <span className="font-extrabold text-amber-500">
                {booking.review.rating.toFixed(1)} / 5.0
              </span>
            ) : (
              <span className="text-[10px] text-semantic-text-tertiary italic">
                {t('workerDashboard.noReviewYet', 'No review yet')}
              </span>
            )}
          </div>
          {booking.review?.comment ? (
            <p className="text-xs text-semantic-text-secondary italic">
              "{booking.review.comment}"
            </p>
          ) : booking.review ? (
            <p className="text-[11px] text-semantic-text-tertiary italic">
              {t('bookings.noComment', 'Rated without comment')}
            </p>
          ) : null}
        </div>

        {/* Modal Actions */}
        <div className="flex flex-wrap gap-2.5 pt-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              const bId = booking.id
              onClose()
              onOpenAssistant(bId)
            }}
            className="flex-1 text-xs font-semibold flex items-center justify-center gap-1.5 border-amber-500/40 text-amber-600 dark:text-amber-400 hover:bg-amber-500/10"
          >
            <Briefcase className="w-3.5 h-3.5" />
            <span>{i18n.language === 'hi' ? 'सारथी सलाह' : 'Sarathi Advice'}</span>
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              const bId = booking.id
              onClose()
              onOpenSupport(bId)
            }}
            className="flex-1 text-xs font-semibold flex items-center justify-center gap-1.5 border-rose-500/40 text-rose-600 dark:text-rose-400 hover:bg-rose-500/10"
          >
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>{i18n.language === 'hi' ? 'केयर / शिकायत' : 'Care & Support'}</span>
          </Button>
          {summary?.receipt_number && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                onClose()
                onOpenReceipt(booking)
              }}
              className="flex-1 text-xs font-semibold flex items-center justify-center gap-1.5 border-emerald-500/40 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>{t('workerDashboard.viewReceipt', 'View Receipt')}</span>
            </Button>
          )}
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

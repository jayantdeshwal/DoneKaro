import React from 'react'
import { useTranslation } from 'react-i18next'
import { Check, CheckCircle2, FileText, Info, Play, Star } from 'lucide-react'
import { Button } from '@/ui'
import type { WorkerBookingRow } from '../../types'

interface BookingStatusActionsProps {
  booking: WorkerBookingRow
  isUpdating: boolean
  onUpdateStatus: (bookingId: string, status: WorkerBookingRow['status']) => void | Promise<void>
  onConfirmCash: (booking: WorkerBookingRow) => void
  onViewDetails: (booking: WorkerBookingRow) => void
  onViewReceipt: (booking: WorkerBookingRow) => void
}

export const BookingStatusActions: React.FC<BookingStatusActionsProps> = ({
  booking,
  isUpdating,
  onUpdateStatus,
  onConfirmCash,
  onViewDetails,
  onViewReceipt,
}) => {
  const { t } = useTranslation()

  return (
    <>
      {/* Legacy Fallback: Direct bookings in 'pending' status */}
      {booking.status === 'pending' && (
        <div className="flex items-center gap-2 pt-1 border-t border-semantic-border-light/40">
          <Button
            variant="primary"
            size="sm"
            onClick={() => onUpdateStatus(booking.id, 'accepted')}
            disabled={isUpdating}
            className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold py-1.5 shadow-sm"
          >
            Accept Booking
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onUpdateStatus(booking.id, 'rejected')}
            disabled={isUpdating}
            className="flex-1 text-xs border-red-500/40 text-red-400 hover:bg-red-500/10 py-1.5"
          >
            Decline
          </Button>
        </div>
      )}

      {/* Phase 11 Primary Entry: Quote accepted -> Start Service */}
      {booking.status === 'accepted' && (
        <div className="pt-1 border-t border-semantic-border-light/40">
          <Button
            variant="primary"
            size="sm"
            onClick={() => onUpdateStatus(booking.id, 'in_progress')}
            disabled={isUpdating}
            className="w-full bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold py-1.5 shadow-sm flex items-center justify-center gap-1.5"
          >
            <Play className="w-3.5 h-3.5" />
            <span>{t('workerDashboard.startService', 'Start Service')}</span>
          </Button>
        </div>
      )}

      {/* In Progress -> Complete service (Transitions to payment_pending) */}
      {booking.status === 'in_progress' &&
        !(booking.changeRequests ?? []).some(r => r.status === 'pending') && (
          <div className="pt-1 border-t border-semantic-border-light/40">
            <Button
              variant="primary"
              size="sm"
              onClick={() => onUpdateStatus(booking.id, 'payment_pending')}
              disabled={isUpdating}
              className="w-full bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold py-1.5 shadow-sm flex items-center justify-center gap-1.5"
            >
              <Check className="w-3.5 h-3.5" />
              <span>
                {t(
                  'workerDashboard.serviceFinishedAwaitingPayment',
                  'Service Completed — Awaiting Payment'
                )}
              </span>
            </Button>
          </div>
        )}

      {/* Payment Pending + Customer Confirmed Cash -> Confirm Cash Received */}
      {booking.status === 'payment_pending' &&
        booking.paymentSummary?.payment_status === 'pending' && (
          <div className="pt-1 border-t border-semantic-border-light/40">
            <Button
              variant="primary"
              size="sm"
              onClick={() => onConfirmCash(booking)}
              className="w-full bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold py-1.5 shadow-sm flex items-center justify-center gap-1.5"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>{t('workerDashboard.confirmCashReceived', 'Confirm Cash Received')}</span>
            </Button>
          </div>
        )}

      {/* Completed State: Review snippet & Actions */}
      {booking.status === 'completed' && (
        <div className="space-y-2 pt-1 border-t border-semantic-border-light/40">
          <div className="rounded-xl border border-semantic-border-light bg-surface-200/40 p-2.5 text-xs space-y-1">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                {t('workerDashboard.customerReview', 'Customer Feedback')}
              </span>
              {booking.review ? (
                <div className="flex items-center gap-1">
                  <span className="font-extrabold text-amber-500">
                    {booking.review.rating.toFixed(1)}
                  </span>
                  <span className="text-[10px] text-semantic-text-tertiary">/ 5.0</span>
                </div>
              ) : (
                <span className="text-[10px] text-semantic-text-tertiary italic">
                  {t('workerDashboard.noReviewYet', 'No review yet')}
                </span>
              )}
            </div>
            {booking.review?.comment ? (
              <p className="text-xs text-semantic-text-secondary italic line-clamp-2">
                "{booking.review.comment}"
              </p>
            ) : booking.review ? (
              <p className="text-[11px] text-semantic-text-tertiary italic">
                {t('bookings.noComment', 'Rated without comment')}
              </p>
            ) : null}
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onViewDetails(booking)}
              className="flex-1 text-xs font-semibold border-semantic-border-medium hover:border-brand-500 text-semantic-text-primary py-1.5 flex items-center justify-center gap-1.5"
            >
              <Info className="w-3.5 h-3.5" />
              <span>{t('workerDashboard.viewDetails', 'View Details')}</span>
            </Button>

            {booking.paymentSummary?.receipt_number && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onViewReceipt(booking)}
                className="flex-1 text-xs font-semibold border-emerald-500/40 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10 py-1.5 flex items-center justify-center gap-1.5"
              >
                <FileText className="w-3.5 h-3.5" />
                <span>{t('workerDashboard.viewReceipt', 'View Receipt')}</span>
              </Button>
            )}
          </div>
        </div>
      )}
    </>
  )
}

import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Button, Modal, RatingStars } from '@kaamgar/ui'
import type { BookingRow } from '../../types'
import { resolveServiceAndCategory } from '../../utils/bookingFormat'

interface BookingReviewModalProps {
  isOpen: boolean
  onClose: () => void
  booking: BookingRow | null
  onSubmitReview: (rating: number, comment: string) => Promise<void>
  isSubmittingReview: boolean
  reviewError: string
}

export function BookingReviewModal({
  isOpen,
  onClose,
  booking,
  onSubmitReview,
  isSubmittingReview,
  reviewError,
}: BookingReviewModalProps) {
  const { t, i18n } = useTranslation()
  const [reviewRating, setReviewRating] = useState(5)
  const [reviewComment, setReviewComment] = useState('')

  const handleClose = () => {
    if (!isSubmittingReview) {
      setReviewRating(5)
      setReviewComment('')
      onClose()
    }
  }

  const handleSubmit = async () => {
    await onSubmitReview(reviewRating, reviewComment)
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={t('review.title', 'Rate Service')}
      size="md"
    >
      <div className="space-y-4">
        <p className="text-xs text-slate-600 dark:text-zinc-400">
          {booking?.worker?.name || t('bookings.artisan', 'Artisan')} •{' '}
          {booking ? resolveServiceAndCategory(booking.category_id, i18n.language).serviceName : ''}
        </p>

        {reviewError && (
          <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-500 text-xs">
            {reviewError}
          </div>
        )}

        <div className="flex flex-col items-center justify-center py-2">
          <RatingStars
            rating={reviewRating}
            interactive
            onChange={setReviewRating}
            size="lg"
            showValue
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-1.5">
            {t('review.placeholder', 'Your feedback')}
          </label>
          <textarea
            value={reviewComment}
            onChange={e => setReviewComment(e.target.value)}
            placeholder={t('review.placeholder', 'Share your experience with this artisan...')}
            rows={3}
            className="w-full px-3 py-2 bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-xl text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-amber-500"
          />
        </div>

        <div className="flex gap-2.5 pt-2">
          <Button
            variant="secondary"
            size="sm"
            disabled={isSubmittingReview}
            onClick={handleClose}
            className="flex-1 text-xs"
          >
            {t('common.cancel', 'Cancel')}
          </Button>
          <Button
            variant="primary"
            size="sm"
            disabled={isSubmittingReview}
            onClick={() => void handleSubmit()}
            loading={isSubmittingReview}
            className="flex-1 text-xs font-bold bg-amber-500 hover:bg-amber-400 text-slate-950"
          >
            {isSubmittingReview ? t('common.submitting', 'Submitting...') : t('review.submit', 'Submit Review')}
          </Button>
        </div>
      </div>
    </Modal>
  )
}

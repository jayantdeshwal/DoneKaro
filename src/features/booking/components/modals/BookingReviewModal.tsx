import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Button, Modal, RatingStars } from '@kaamgar/ui'
import type { BookingRow } from '../../types'
import { resolveServiceAndCategory } from '../../utils/bookingFormat'

const POSITIVE_TAGS = [
  { id: 'on_time', labelKey: 'review.tags.onTime', defaultLabel: 'On Time' },
  { id: 'polite', labelKey: 'review.tags.polite', defaultLabel: 'Polite & Professional' },
  { id: 'clean_work', labelKey: 'review.tags.cleanWork', defaultLabel: 'Clean Work' },
  { id: 'fair_pricing', labelKey: 'review.tags.fairPricing', defaultLabel: 'Fair Pricing' },
  { id: 'quick_service', labelKey: 'review.tags.quickService', defaultLabel: 'Quick Service' },
]

const CONSTRUCTIVE_TAGS = [
  { id: 'late_arrival', labelKey: 'review.tags.lateArrival', defaultLabel: 'Late Arrival' },
  { id: 'pricing_issue', labelKey: 'review.tags.pricingIssue', defaultLabel: 'Pricing Issue' },
  { id: 'cleanup_needed', labelKey: 'review.tags.cleanupNeeded', defaultLabel: 'Cleanup Needed' },
  { id: 'comm_issue', labelKey: 'review.tags.commIssue', defaultLabel: 'Communication Issue' },
]

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
  const [selectedTags, setSelectedTags] = useState<Set<string>>(new Set())

  const handleRatingChange = (newRating: number) => {
    const wasPositive = reviewRating >= 4
    const isPositive = newRating >= 4
    if (wasPositive !== isPositive) {
      setSelectedTags(new Set())
    }
    setReviewRating(newRating)
  }

  const toggleTag = (tagId: string) => {
    setSelectedTags(prev => {
      const next = new Set(prev)
      if (next.has(tagId)) {
        next.delete(tagId)
      } else {
        next.add(tagId)
      }
      return next
    })
  }

  const handleClose = () => {
    if (!isSubmittingReview) {
      setReviewRating(5)
      setReviewComment('')
      setSelectedTags(new Set())
      onClose()
    }
  }

  const handleSubmit = async () => {
    const activeTagsList = reviewRating >= 4 ? POSITIVE_TAGS : CONSTRUCTIVE_TAGS
    const selectedLabels = activeTagsList
      .filter(tag => selectedTags.has(tag.id))
      .map(tag => t(tag.labelKey, tag.defaultLabel))

    let finalComment = reviewComment.trim()
    if (selectedLabels.length > 0) {
      const tagsPrefix = `[${selectedLabels.join(', ')}]`
      finalComment = finalComment ? `${tagsPrefix} ${finalComment}` : tagsPrefix
    }

    await onSubmitReview(reviewRating, finalComment)
    setSelectedTags(new Set())
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
          <div className="p-3 bg-gray-900 border border-red-800 rounded-xl text-red-300 text-xs shadow-md">
            {reviewError}
          </div>
        )}

        <div className="flex flex-col items-center justify-center py-2">
          <RatingStars
            rating={reviewRating}
            interactive
            onChange={handleRatingChange}
            size="lg"
            showValue
          />
        </div>

        {/* Quick-tap feedback chips */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-2">
            {t('review.quickTagsLabel', 'Quick Feedback')} ({t('common.optional', 'Optional')})
          </label>
          <div className="flex flex-wrap gap-1.5">
            {(reviewRating >= 4 ? POSITIVE_TAGS : CONSTRUCTIVE_TAGS).map(tag => {
              const isSelected = selectedTags.has(tag.id)
              return (
                <button
                  key={tag.id}
                  type="button"
                  onClick={() => toggleTag(tag.id)}
                  disabled={isSubmittingReview}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all active:scale-95 cursor-pointer disabled:opacity-50 ${
                    isSelected
                      ? 'bg-amber-500/15 border-amber-500 text-amber-700 dark:text-amber-300 font-bold'
                      : 'bg-slate-50 dark:bg-zinc-800/80 border-slate-200 dark:border-zinc-700 text-slate-700 dark:text-zinc-300 hover:border-slate-300 dark:hover:border-zinc-600'
                  }`}
                >
                  {t(tag.labelKey, tag.defaultLabel)}
                </button>
              )
            })}
          </div>
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
            className="flex-1 text-xs font-bold bg-amber-500 text-slate-950 dark:bg-amber-400 dark:text-slate-950 hover:bg-amber-600 dark:hover:bg-amber-500 disabled:opacity-50"
          >
            {isSubmittingReview ? t('common.submitting', 'Submitting...') : t('review.submit', 'Submit Review')}
          </Button>
        </div>
      </div>
    </Modal>
  )
}

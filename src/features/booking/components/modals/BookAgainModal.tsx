import { useTranslation } from 'react-i18next'
import { ArrowRight, Search, UserCheck } from 'lucide-react'
import { Button, Modal } from '@kaamgar/ui'
import { formatJobReference } from '@kaamgar/shared'
import type { BookingRow } from '../../types'
import { resolveServiceAndCategory } from '../../utils/bookingFormat'

interface BookAgainModalProps {
  booking: BookingRow | null
  onClose: () => void
  onRehire: (booking: BookingRow) => void
  onBrowseAll: (booking: BookingRow) => void
}

export function BookAgainModal({
  booking,
  onClose,
  onRehire,
  onBrowseAll,
}: BookAgainModalProps) {
  const { t, i18n } = useTranslation()

  if (!booking) return null

  const { serviceName, categoryName } = resolveServiceAndCategory(booking.category_id, i18n.language)
  const jobReference = formatJobReference(booking.id)
  const workerName = booking.worker?.name || t('bookings.artisan', 'Artisan')

  return (
    <Modal
      isOpen={Boolean(booking)}
      onClose={onClose}
      title={t('bookings.bookAgainTitle', 'Book This Service Again')}
      size="md"
    >
      <div className="space-y-4 text-xs">
        {/* Previous Service Context Card */}
        <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-zinc-800/60 border border-slate-200 dark:border-zinc-700/60 space-y-1.5">
          <div className="flex justify-between items-center">
            <span className="text-[11px] text-slate-500 dark:text-zinc-400">{t('bookings.serviceCategory', 'Service')}</span>
            <span className="font-bold text-slate-900 dark:text-white">
              {serviceName} {categoryName && `(${categoryName})`}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-[11px] text-slate-500 dark:text-zinc-400">{t('bookings.previousArtisan', 'Previous Artisan')}</span>
            <span className="font-semibold text-slate-800 dark:text-zinc-200">{workerName}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-[11px] text-slate-500 dark:text-zinc-400">{t('bookings.jobId', 'Previous Job ID')}</span>
            <span className="font-mono text-slate-600 dark:text-zinc-400">{jobReference}</span>
          </div>
        </div>

        <p className="text-slate-600 dark:text-zinc-400 leading-relaxed">
          {t(
            'bookings.bookAgainPrompt',
            'How would you like to book this service? You can request a quote from the same artisan or browse other verified artisans in Muzaffarnagar.'
          )}
        </p>

        {/* Selection Options */}
        <div className="space-y-3 pt-1">
          {/* Option A: Re-hire Previous Artisan */}
          <button
            type="button"
            onClick={() => onRehire(booking)}
            className="w-full text-left p-3.5 rounded-xl border border-amber-500/40 bg-amber-500/10 hover:bg-amber-500/15 dark:bg-amber-500/5 dark:hover:bg-amber-500/10 transition-colors flex items-start gap-3 group cursor-pointer"
          >
            <div className="w-8 h-8 rounded-lg bg-amber-500 text-slate-950 flex items-center justify-center shrink-0 mt-0.5">
              <UserCheck className="w-4 h-4" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <span className="font-bold text-sm text-slate-900 dark:text-white group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
                  {t('bookings.rehireWorker', 'Re-hire {{name}}', { name: workerName })}
                </span>
                <ArrowRight className="w-4 h-4 text-amber-500 group-hover:translate-x-0.5 transition-transform" />
              </div>
              <p className="text-[11px] text-slate-600 dark:text-zinc-400 mt-1">
                {t('bookings.rehireWorkerDesc', 'Book directly with your previous artisan. Address and service are prefilled.')}
              </p>
            </div>
          </button>

          {/* Option B: Browse All Artisans */}
          <button
            type="button"
            onClick={() => onBrowseAll(booking)}
            className="w-full text-left p-3.5 rounded-xl border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 hover:bg-slate-50 dark:hover:bg-zinc-800 transition-colors flex items-start gap-3 group cursor-pointer"
          >
            <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 flex items-center justify-center shrink-0 mt-0.5">
              <Search className="w-4 h-4" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <span className="font-bold text-sm text-slate-900 dark:text-white group-hover:text-slate-700 dark:group-hover:text-zinc-200 transition-colors">
                  {t('bookings.browseAllArtisans', 'Browse All Artisans')}
                </span>
                <ArrowRight className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
              </div>
              <p className="text-[11px] text-slate-600 dark:text-zinc-400 mt-1">
                {t('bookings.browseAllArtisansDesc', 'Explore and compare all available verified artisans for this service category.')}
              </p>
            </div>
          </button>
        </div>

        {/* Close Button */}
        <div className="pt-2 flex justify-end">
          <Button
            variant="outline"
            size="sm"
            onClick={onClose}
            className="text-xs"
          >
            {t('common.cancel', 'Cancel')}
          </Button>
        </div>
      </div>
    </Modal>
  )
}

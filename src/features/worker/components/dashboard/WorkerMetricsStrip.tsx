
import React from 'react'
import { useTranslation } from 'react-i18next'
import { ChevronRight, Star } from 'lucide-react'
import type { WorkerProfileRow } from '../../types'

interface WorkerMetricsStripProps {
  profile: WorkerProfileRow | null
  completedCount: number
  isLeadsTab: boolean
  onSelectCompleted: () => void
  onViewAllReviews: () => void
}

export const WorkerMetricsStrip: React.FC<WorkerMetricsStripProps> = ({
  profile,
  completedCount,
  isLeadsTab,
  onSelectCompleted,
  onViewAllReviews,
}) => {
  const { t } = useTranslation()

  return (
    <div
      className={`grid-cols-4 gap-2 mb-6 p-3 rounded-2xl bg-surface-100 border border-semantic-border-light text-center ${isLeadsTab ? 'hidden md:grid' : 'grid'
        }`}
    >
      <button
        type="button"
        onClick={onSelectCompleted}
        className="p-1 rounded-xl hover:bg-surface-200/60 transition-colors text-center cursor-pointer"
      >
        <p className="text-base font-extrabold text-emerald-400">{completedCount}</p>
        <p className="text-[10px] text-semantic-text-secondary mt-0.5">
          {t('workerDashboard.completed', 'Completed')}
        </p>
      </button>

      <div>
        <div className="flex items-center justify-center gap-0.5">
          <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
          <span className="text-base font-extrabold text-slate-900 dark:text-white">
            {profile?.rating && profile.rating > 0
              ? profile.rating.toFixed(1)
              : t('workerDashboard.noRatings', 'No ratings yet')}
          </span>
        </div>
        <p className="text-[10px] text-semantic-text-secondary mt-0.5">
          {t('workerDashboard.rating', 'Rating')}
        </p>
      </div>

      <button
        type="button"
        onClick={onViewAllReviews}
        className="p-1 rounded-xl hover:bg-surface-200/60 transition-colors text-center group cursor-pointer"
        title={t('workerDashboard.viewAllReviews', 'View All Reviews')}
      >
        <p className="text-base font-extrabold text-brand-400 group-hover:underline">
          {profile?.review_count ?? 0}
        </p>
        <p className="text-[10px] text-semantic-text-secondary mt-0.5 flex items-center justify-center gap-0.5 group-hover:text-brand-400">
          <span>{t('workerDashboard.reviews', 'Reviews')}</span>
          <ChevronRight className="w-2.5 h-2.5 opacity-70" />
        </p>
      </button>

      <div>
        <p className="text-xs font-bold text-slate-900 dark:text-white truncate mt-1">
          {profile?.service_areas?.length
            ? profile.service_areas.join(', ')
            : t('workerDashboard.noAreas', 'No areas listed')}
        </p>
        <p className="text-[10px] text-semantic-text-secondary mt-0.5">
          {t('workerDashboard.coverage', 'Coverage')}
        </p>
      </div>
    </div>
  )
}

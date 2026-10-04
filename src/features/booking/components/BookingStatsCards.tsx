import { useTranslation } from 'react-i18next'

interface BookingStatsCardsProps {
  upcomingCount: number
  completedCount: number
  totalCount: number
}

export function BookingStatsCards({
  upcomingCount,
  completedCount,
  totalCount,
}: BookingStatsCardsProps) {
  const { t } = useTranslation()

  return (
    <div className="grid grid-cols-3 gap-3 mb-6">
      <div className="p-3.5 rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 shadow-sm text-center">
        <div className="text-lg sm:text-xl font-bold text-amber-600 dark:text-amber-400">
          {upcomingCount}
        </div>
        <div className="text-[11px] font-semibold text-slate-500 dark:text-zinc-400 mt-0.5">
          {t('bookings.activeCount', 'Active')}
        </div>
      </div>
      <div className="p-3.5 rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 shadow-sm text-center">
        <div className="text-lg sm:text-xl font-bold text-emerald-600 dark:text-emerald-400">
          {completedCount}
        </div>
        <div className="text-[11px] font-semibold text-slate-500 dark:text-zinc-400 mt-0.5">
          {t('bookings.completedCount', 'Completed')}
        </div>
      </div>
      <div className="p-3.5 rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 shadow-sm text-center">
        <div className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">
          {totalCount}
        </div>
        <div className="text-[11px] font-semibold text-slate-500 dark:text-zinc-400 mt-0.5">
          {t('bookings.totalBookings', 'Total')}
        </div>
      </div>
    </div>
  )
}

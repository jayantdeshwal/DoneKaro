import { useTranslation } from 'react-i18next'
import type { BookingTab } from '../types'

interface BookingTabsProps {
  activeTab: BookingTab
  onTabChange: (tab: BookingTab) => void
  allCount: number
  upcomingCount: number
  pastCount: number
}

export function BookingTabs({
  activeTab,
  onTabChange,
  allCount,
  upcomingCount,
  pastCount,
}: BookingTabsProps) {
  const { t } = useTranslation()

  return (
    <div className="flex items-center gap-2 p-1 rounded-2xl bg-slate-200/80 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 mb-6">
      <button
        onClick={() => onTabChange('all')}
        className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
          activeTab === 'all'
            ? 'bg-white dark:bg-zinc-800 text-slate-900 dark:text-white shadow-sm'
            : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white'
        }`}
      >
        {t('bookings.allBookings', 'All')} ({allCount})
      </button>
      <button
        onClick={() => onTabChange('upcoming')}
        className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
          activeTab === 'upcoming'
            ? 'bg-white dark:bg-zinc-800 text-amber-600 dark:text-amber-400 shadow-sm'
            : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white'
        }`}
      >
        {t('bookings.activeAndUpcoming', 'Upcoming & Active')} ({upcomingCount})
      </button>
      <button
        onClick={() => onTabChange('past')}
        className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
          activeTab === 'past'
            ? 'bg-white dark:bg-zinc-800 text-slate-900 dark:text-white shadow-sm'
            : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white'
        }`}
      >
        {t('bookings.past', 'Past')} ({pastCount})
      </button>
    </div>
  )
}

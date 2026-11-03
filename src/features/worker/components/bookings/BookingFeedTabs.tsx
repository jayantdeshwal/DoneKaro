import React from 'react'
import { useTranslation } from 'react-i18next'
import { ClipboardList, RefreshCw } from 'lucide-react'
import type { TabFilter } from '../../types'

interface BookingFeedTabsProps {
  activeTab: TabFilter
  onTabChange: (tab: TabFilter) => void
  totalCount: number
  pendingCount: number
  activeCount: number
  completedCount: number
  onRefresh: () => void | Promise<void>
}

export const BookingFeedTabs: React.FC<BookingFeedTabsProps> = ({
  activeTab,
  onTabChange,
  totalCount,
  pendingCount,
  activeCount,
  completedCount,
  onRefresh,
}) => {
  const { t } = useTranslation()

  return (
    <div className="mb-4">
      <div className="flex items-center justify-between mb-3 px-1">
        <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <ClipboardList className="w-4 h-4 text-brand-400" />
          <span>{t('workerDashboard.customerJobRequests', 'Customer Job Requests')}</span>
        </h3>
        <button
          type="button"
          onClick={() => void onRefresh()}
          className="text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800 flex items-center gap-1 font-semibold rounded-lg px-2 py-1"
        >
          <RefreshCw className="w-3 h-3" />
          <span>{t('common.refresh', 'Refresh')}</span>
        </button>
      </div>

      {/* Filter Tab Pills */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        <button
          type="button"
          onClick={() => onTabChange('all')}
          className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-colors ${
            activeTab === 'all'
              ? 'bg-amber-500 text-slate-950 dark:bg-amber-400 dark:text-slate-950 hover:bg-amber-600 dark:hover:bg-amber-500 font-bold'
              : 'bg-white text-slate-700 border border-slate-300 hover:bg-slate-50 dark:bg-slate-900 dark:text-slate-200 dark:border-slate-600 dark:hover:bg-slate-800'
          }`}
        >
          {t('common.all', 'All')} ({totalCount})
        </button>
        <button
          type="button"
          onClick={() => onTabChange('pending')}
          className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-colors flex items-center gap-1.5 ${
            activeTab === 'pending'
              ? 'bg-amber-500 text-slate-950 dark:bg-amber-400 dark:text-slate-950 hover:bg-amber-600 dark:hover:bg-amber-500 font-bold shadow-xs'
              : 'bg-white text-slate-700 border border-slate-300 hover:bg-slate-50 dark:bg-slate-900 dark:text-slate-200 dark:border-slate-600 dark:hover:bg-slate-800'
          }`}
        >
          <span>{t('workerDashboard.pending', 'Pending')}</span>
          {pendingCount > 0 && (
            <span className="w-4 h-4 rounded-full bg-amber-400/20 text-amber-600 dark:text-amber-300 text-[10px] flex items-center justify-center font-bold">
              {pendingCount}
            </span>
          )}
        </button>
        <button
          type="button"
          onClick={() => onTabChange('active')}
          className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-colors ${
            activeTab === 'active'
              ? 'bg-amber-500 text-slate-950 dark:bg-amber-400 dark:text-slate-950 hover:bg-amber-600 dark:hover:bg-amber-500 font-bold'
              : 'bg-white text-slate-700 border border-slate-300 hover:bg-slate-50 dark:bg-slate-900 dark:text-slate-200 dark:border-slate-600 dark:hover:bg-slate-800'
          }`}
        >
          {t('workerDashboard.activeInProgress', 'Active / In Progress')} ({activeCount})
        </button>
        <button
          type="button"
          onClick={() => onTabChange('completed')}
          className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-colors ${
            activeTab === 'completed'
              ? 'bg-amber-500 text-slate-950 dark:bg-amber-400 dark:text-slate-950 hover:bg-amber-600 dark:hover:bg-amber-500 font-bold'
              : 'bg-white text-slate-700 border border-slate-300 hover:bg-slate-50 dark:bg-slate-900 dark:text-slate-200 dark:border-slate-600 dark:hover:bg-slate-800'
          }`}
        >
          {t('workerDashboard.completed', 'Completed')} ({completedCount})
        </button>
      </div>
    </div>
  )
}

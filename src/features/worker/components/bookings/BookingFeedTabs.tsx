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
          className="text-xs text-brand-400 hover:text-brand-300 flex items-center gap-1 font-semibold"
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
              ? 'bg-amber-500 text-slate-950 font-bold'
              : 'bg-surface-100 text-semantic-text-secondary hover:text-slate-900 dark:hover:text-white border border-semantic-border-light'
          }`}
        >
          {t('common.all', 'All')} ({totalCount})
        </button>
        <button
          type="button"
          onClick={() => onTabChange('pending')}
          className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-colors flex items-center gap-1.5 ${
            activeTab === 'pending'
              ? 'bg-amber-500 text-slate-950 font-bold shadow-xs'
              : 'bg-surface-100 text-semantic-text-secondary hover:text-slate-900 dark:hover:text-white border border-semantic-border-light'
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
              ? 'bg-blue-500 text-white font-bold'
              : 'bg-surface-100 text-semantic-text-secondary hover:text-slate-900 dark:hover:text-white border border-semantic-border-light'
          }`}
        >
          {t('workerDashboard.activeInProgress', 'Active / In Progress')} ({activeCount})
        </button>
        <button
          type="button"
          onClick={() => onTabChange('completed')}
          className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-colors ${
            activeTab === 'completed'
              ? 'bg-emerald-500 text-white font-bold'
              : 'bg-surface-100 text-semantic-text-secondary hover:text-slate-900 dark:hover:text-white border border-semantic-border-light'
          }`}
        >
          {t('workerDashboard.completed', 'Completed')} ({completedCount})
        </button>
      </div>
    </div>
  )
}

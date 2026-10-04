import React from 'react'
import { useTranslation } from 'react-i18next'
import { RefreshCw, Zap } from 'lucide-react'

interface MobileLeadsHeaderProps {
  isLeadsTab: boolean
  pendingCount: number
  isLoading: boolean
  onRefresh: () => void | Promise<void>
}

export const MobileLeadsHeader: React.FC<MobileLeadsHeaderProps> = ({
  isLeadsTab,
  pendingCount,
  isLoading,
  onRefresh,
}) => {
  const { t } = useTranslation()

  if (!isLeadsTab) return null

  return (
    <div className="md:hidden mb-4 p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200/90 dark:border-zinc-800 shadow-sm flex items-center justify-between">
      <div>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-500">
            <Zap className="w-4 h-4" />
          </div>
          <h2 className="text-base font-black text-slate-900 dark:text-white">
            {t('workerDashboard.newLeads', 'New Job Leads')}
          </h2>
          {pendingCount > 0 && (
            <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-500 text-slate-950">
              {t('workerDashboard.newCount', '{{count}} new', { count: pendingCount })}
            </span>
          )}
        </div>
        <p className="text-[11px] text-slate-500 dark:text-zinc-400 mt-1">
          {t('workerDashboard.leadsSubtitle', 'New customer service requests in Muzaffarnagar')}
        </p>
      </div>
      <button
        type="button"
        onClick={() => void onRefresh()}
        className="p-2 rounded-xl border border-slate-200 dark:border-zinc-700 text-slate-700 dark:text-zinc-200"
      >
        <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-amber-500' : ''}`} />
      </button>
    </div>
  )
}

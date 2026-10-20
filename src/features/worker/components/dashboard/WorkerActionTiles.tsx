import React from 'react'
import { useTranslation } from 'react-i18next'
import { ClipboardList, Headphones, Power, ShieldAlert } from 'lucide-react'

interface WorkerActionTilesProps {
  isOnline: boolean
  isUpdatingAvailability: boolean
  pendingCount: number
  isLeadsTab: boolean
  onToggleAvailability: () => void
  onSelectJobs: () => void
  onOpenWorkAdvice: () => void
  onOpenSupport: () => void
}

export const WorkerActionTiles: React.FC<WorkerActionTilesProps> = ({
  isOnline,
  isUpdatingAvailability,
  pendingCount,
  isLeadsTab,
  onToggleAvailability,
  onSelectJobs,
  onOpenWorkAdvice,
  onOpenSupport,
}) => {
  const { t, i18n } = useTranslation()

  return (
    <div
      className={`grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3 mb-6 ${
        isLeadsTab ? 'hidden md:grid' : 'grid'
      }`}
    >
      {/* Tile 1: Availability Toggle */}
      <button
        type="button"
        onClick={onToggleAvailability}
        disabled={isUpdatingAvailability}
        className={`p-3 sm:p-4 rounded-2xl border transition-all flex flex-col items-center justify-center text-center shadow-sm active:scale-95 ${
          isOnline
            ? 'bg-emerald-950/20 border-emerald-500/40 hover:bg-emerald-950/30'
            : 'bg-surface-100 border-semantic-border-light hover:bg-surface-200'
        }`}
      >
        <div
          className={`w-10 h-10 rounded-xl flex items-center justify-center mb-2 ${
            isOnline ? 'bg-emerald-500/20 text-emerald-400' : 'bg-surface-200 text-amber-400'
          }`}
        >
          <Power
            className={`w-5 h-5 ${isOnline ? 'animate-pulse text-emerald-400' : 'text-amber-400'}`}
          />
        </div>
        <span
          className={`text-xs font-bold leading-tight ${
            isOnline ? 'text-emerald-400' : 'text-slate-900 dark:text-zinc-200'
          }`}
        >
          {isOnline
            ? t('workerDashboard.onlineReady', 'Online (Ready)')
            : t('workerDashboard.offDuty', 'Off-Duty')}
        </span>
      </button>

      {/* Tile 2: Job Requests (Quotes + Pending Bookings) */}
      <button
        type="button"
        onClick={onSelectJobs}
        aria-label={t('workerDashboard.jobRequests', 'Job Requests')}
        className="p-3 sm:p-4 rounded-2xl bg-surface-100 border border-semantic-border-light hover:border-brand-500/40 hover:bg-surface-200/80 transition-all flex flex-col items-center justify-center text-center group shadow-sm active:scale-95"
      >
        <div className="w-10 h-10 rounded-xl bg-surface-200 group-hover:bg-brand-500/15 flex items-center justify-center text-brand-400 mb-2 transition-colors relative">
          <ClipboardList className="w-5 h-5" />
          {pendingCount > 0 && (
            <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-rose-500 text-[10px] font-bold text-white flex items-center justify-center">
              {pendingCount}
            </span>
          )}
        </div>
        <span className="text-xs font-bold text-slate-900 dark:text-zinc-200 group-hover:text-amber-600 dark:group-hover:text-brand-400 leading-tight">
          {pendingCount > 0
            ? t('workerDashboard.newRequests', '{{count}} new requests', {
                count: pendingCount,
              })
            : t('workerDashboard.jobRequests', 'Job Requests')}
        </span>
      </button>

      {/* Tile 3: Work Advice */}
      <button
        type="button"
        onClick={onOpenWorkAdvice}
        className="p-3 sm:p-4 rounded-2xl bg-surface-100 border border-semantic-border-light hover:border-blue-500/40 hover:bg-surface-200/80 transition-all flex flex-col items-center justify-center text-center group shadow-sm active:scale-95 cursor-pointer"
      >
        <div className="w-10 h-10 rounded-xl bg-surface-200 group-hover:bg-blue-500/15 flex items-center justify-center text-blue-400 mb-2 transition-colors">
          <Headphones className="w-5 h-5" />
        </div>
        <span className="text-xs font-bold text-slate-900 dark:text-zinc-200 group-hover:text-blue-500 dark:group-hover:text-blue-400 leading-tight">
          {i18n.language === 'hi' ? 'काम व सेवा सलाह' : 'Work Advice'}
        </span>
      </button>

      {/* Tile 4: Care & Support */}
      <button
        type="button"
        onClick={onOpenSupport}
        className="p-3 sm:p-4 rounded-2xl bg-surface-100 border border-semantic-border-light hover:border-rose-500/40 hover:bg-surface-200/80 transition-all flex flex-col items-center justify-center text-center group shadow-sm active:scale-95 cursor-pointer"
      >
        <div className="w-10 h-10 rounded-xl bg-surface-200 group-hover:bg-rose-500/15 flex items-center justify-center text-rose-500 mb-2 transition-colors">
          <ShieldAlert className="w-5 h-5" />
        </div>
        <span className="text-xs font-bold text-slate-900 dark:text-zinc-200 group-hover:text-rose-500 dark:group-hover:text-rose-400 leading-tight">
          {i18n.language === 'hi' ? 'केयर एवं सहायता' : 'Care & Support'}
        </span>
      </button>
    </div>
  )
}

import React from 'react'
import { useTranslation } from 'react-i18next'
import { ArrowLeft } from 'lucide-react'

interface WorkerTopBarProps {
  isLeadsTab: boolean
  isOnline: boolean
  onBack: () => void
}

export const WorkerTopBar: React.FC<WorkerTopBarProps> = ({
  isLeadsTab,
  isOnline,
  onBack,
}) => {
  const { t } = useTranslation()

  return (
    <div className="flex items-center justify-between mb-5">
      <button
        type="button"
        onClick={onBack}
        className="w-10 h-10 rounded-full bg-surface-100/90 hover:bg-surface-200 border border-semantic-border-light flex items-center justify-center text-semantic-text-primary transition-colors active:scale-95 shadow-sm"
        aria-label={t('common.back', 'Back')}
      >
        <ArrowLeft className="w-5 h-5" />
      </button>

      <span className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
        {isLeadsTab ? t('worker.newLeads', 'Incoming Leads') : t('nav.workerDashboard', 'Worker Workspace')}
      </span>

      {/* Quick Online / Offline Pill */}
      <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-surface-100 border border-semantic-border-light text-xs font-semibold">
        <span
          className={`w-2 h-2 rounded-full ${
            isOnline ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'
          }`}
        />
        <span className={isOnline ? 'text-emerald-400' : 'text-amber-400'}>
          {isOnline ? t('workerDashboard.online', 'Online') : t('workerDashboard.offDuty', 'Off-Duty')}
        </span>
      </div>
    </div>
  )
}

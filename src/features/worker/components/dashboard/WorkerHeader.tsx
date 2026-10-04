import React from 'react'
import { useTranslation } from 'react-i18next'
import { AlertCircle, CheckCircle, Clock3 } from 'lucide-react'
import type { WorkerProfileRow } from '../../types'

interface WorkerHeaderProps {
  userName?: string
  profile: WorkerProfileRow | null
  primaryCategoryName: string
  isLeadsTab: boolean
  onEditProfile: () => void
}

export const WorkerHeader: React.FC<WorkerHeaderProps> = ({
  userName,
  profile,
  primaryCategoryName,
  isLeadsTab,
  onEditProfile,
}) => {
  const { t } = useTranslation()
  const approvalStatus = profile?.approval_status ?? 'pending'

  return (
    <div
      className={`mb-6 px-1 items-start justify-between gap-3 ${
        isLeadsTab ? 'hidden md:flex' : 'flex'
      }`}
    >
      <div className="flex-1 min-w-0">
        {/* Status indicator tag */}
        <div className="flex items-center gap-1.5 mb-1.5">
          {approvalStatus === 'approved' ? (
            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/30">
              <CheckCircle className="w-3 h-3" />
              <span>{t('profile.verifiedWorker', 'Verified Partner')}</span>
            </span>
          ) : approvalStatus === 'pending' ? (
            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/30">
              <Clock3 className="w-3 h-3" />
              <span>{t('workerDashboard.underReview', 'Under Review')}</span>
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-red-400 bg-red-500/10 px-2 py-0.5 rounded-full border border-red-500/30">
              <AlertCircle className="w-3 h-3" />
              <span>{t('workerDashboard.needsChanges', 'Needs Changes')}</span>
            </span>
          )}

          <span className="text-[10px] font-bold text-brand-400 bg-brand-500/10 px-2 py-0.5 rounded-full border border-brand-500/30 capitalize">
            {primaryCategoryName}
          </span>
        </div>

        {/* Bold Worker Full Name */}
        <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight truncate">
          {userName || t('workerDashboard.verifiedProfessional', 'Verified Professional')}
        </h1>

        {/* Trade details & experience */}
        <p className="text-xs text-semantic-text-secondary mt-0.5">
          {profile?.experience_years
            ? t('workerDashboard.yearsExperience', '{{count}} years experience', {
                count: profile.experience_years,
              })
            : t('workerDashboard.localProfessional', 'Local Professional')}{' '}
          • Muzaffarnagar
        </p>
      </div>

      {/* Top Right Action Button: Edit Profile */}
      <button
        type="button"
        onClick={onEditProfile}
        className="shrink-0 px-4 py-1.5 rounded-full border border-semantic-border-medium hover:border-brand-500 text-xs font-semibold text-semantic-text-primary hover:text-brand-400 transition-colors shadow-sm active:scale-95"
      >
        {t('common.edit', 'Edit Profile')}
      </button>
    </div>
  )
}

import { useTranslation } from 'react-i18next'
import { ArrowLeft, CheckCircle, AlertCircle, Clock } from 'lucide-react'

interface ProfileHeaderProps {
  name: string
  phone: string
  isWorker: boolean
  isAdmin: boolean
  workerApprovalStatus?: string
  saveSuccessMsg: string
  saveErrorMsg: string
  onBack: () => void
  onEditClick: () => void
}

export function ProfileHeader({
  name,
  phone,
  isWorker,
  isAdmin,
  workerApprovalStatus,
  saveSuccessMsg,
  saveErrorMsg,
  onBack,
  onEditClick,
}: ProfileHeaderProps) {
  const { t, i18n } = useTranslation()
  const isHindi = i18n.language === 'hi'

  const isProfileComplete = Boolean(name && phone)
  const userDisplayName = name || (isWorker ? (isHindi ? 'सेवा साथी' : 'Service Partner') : (isHindi ? 'नागरिक' : 'Customer'))
  const userDisplayPhone = phone
    ? (phone.startsWith('+91') ? phone : `+91 ${phone}`)
    : 'No phone number set'

  return (
    <div>
      {/* 1. TOP BAR WITH BACK BUTTON */}
      <div className="flex items-center justify-between mb-5">
        <button
          type="button"
          onClick={onBack}
          className="w-10 h-10 rounded-full bg-white dark:bg-zinc-800 hover:bg-slate-100 dark:hover:bg-zinc-700 border border-slate-200 dark:border-zinc-700 flex items-center justify-center text-slate-700 dark:text-zinc-200 transition-colors active:scale-95 shadow-xs"
          aria-label="Go Back"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>

        <span className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
          {t('profile.title', 'My Account')}
        </span>

        <div className="w-10" />
      </div>

      {/* Notifications & Alerts */}
      {saveSuccessMsg && (
        <div className="mb-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs flex items-center gap-2 animate-fadeIn">
          <CheckCircle className="w-4 h-4 shrink-0" />
          <span>{saveSuccessMsg}</span>
        </div>
      )}
      {saveErrorMsg && (
        <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-center gap-2 animate-fadeIn">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{saveErrorMsg}</span>
        </div>
      )}

      {/* 2. PROFILE IDENTITY HEADER */}
      <div className="mb-6 px-1 flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          {/* Status indicator tag */}
          <div className="flex items-center gap-1.5 mb-1.5">
            {!isProfileComplete ? (
              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-red-400 bg-red-500/10 px-2 py-0.5 rounded-full border border-red-500/30">
                <AlertCircle className="w-3 h-3" />
                <span>{t('profile.incompleteProfile', 'Incomplete profile')}</span>
              </span>
            ) : isWorker ? (
              workerApprovalStatus === 'approved' ? (
                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/30">
                  <CheckCircle className="w-3 h-3" />
                  <span>{isHindi ? 'सत्यापित कामगार' : 'Verified Partner'}</span>
                </span>
              ) : workerApprovalStatus === 'rejected' ? (
                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-500 bg-rose-500/10 px-2 py-0.5 rounded-full border border-rose-500/30">
                  <AlertCircle className="w-3 h-3" />
                  <span>{isHindi ? 'सत्यापन अस्वीकृत' : 'Verification Rejected'}</span>
                </span>
              ) : workerApprovalStatus === 'pending' ? (
                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-600 dark:text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/30">
                  <Clock className="w-3 h-3" />
                  <span>{isHindi ? 'जांच चल रही है' : 'Verification In Review'}</span>
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-600 dark:text-zinc-300 bg-slate-100 dark:bg-zinc-800 px-2 py-0.5 rounded-full border border-slate-200 dark:border-zinc-700">
                  <CheckCircle className="w-3 h-3" />
                  <span>{isHindi ? 'सेवा साथी' : 'Service Partner'}</span>
                </span>
              )
            ) : (
              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                <CheckCircle className="w-3 h-3" />
                <span>{isHindi ? 'सक्रिय खाता' : 'Active Account'}</span>
              </span>
            )}

            {isAdmin && (
              <span className="text-[10px] font-bold text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded-full border border-rose-500/30">
                ADMIN
              </span>
            )}
          </div>

          {/* Bold User Name */}
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight truncate">
            {userDisplayName}
          </h1>

          {/* User Phone */}
          <p className="text-xs sm:text-sm text-slate-500 dark:text-zinc-400 mt-0.5">
            {userDisplayPhone}
          </p>
        </div>

        {/* Top Right Action Button */}
        <button
          type="button"
          onClick={onEditClick}
          className="shrink-0 px-4 py-1.5 rounded-full border border-slate-300 dark:border-zinc-700 hover:border-amber-500 bg-white dark:bg-zinc-800 text-xs font-semibold text-slate-800 dark:text-zinc-200 hover:text-amber-600 dark:hover:text-amber-400 transition-colors shadow-xs active:scale-95"
        >
          {!isProfileComplete ? t('profile.completeProfile', 'Complete') : t('profile.editProfile', 'Edit')}
        </button>
      </div>
    </div>
  )
}

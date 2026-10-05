import { useTranslation } from 'react-i18next'
import {
  Shield,
  UserCheck,
  ShieldAlert,
  Bell,
  ClipboardList,
  Power,
  Briefcase,
  Bot,
} from 'lucide-react'

interface ProfileQuickActionsProps {
  isAdmin: boolean
  isWorker: boolean
  isAvailable?: boolean
  language: string
  onNavigate: (path: string) => void
  onToggleAvailability: () => void
  onOpenSupport: () => void
  onOpenAssistant: (persona: 'worker_sarathi' | 'customer_booking') => void
}

export function ProfileQuickActions({
  isAdmin,
  isWorker,
  isAvailable = true,
  language,
  onNavigate,
  onToggleAvailability,
  onOpenSupport,
  onOpenAssistant,
}: ProfileQuickActionsProps) {
  const { t } = useTranslation()

  return (
    <div className={`gap-2.5 sm:gap-3 mb-6 ${isAdmin ? 'grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5' : 'grid grid-cols-3'}`}>
      {isAdmin ? (
        <>
          {/* Admin Card 1: Admin Dashboard */}
          <button
            type="button"
            onClick={() => onNavigate('/admin')}
            className="p-3 sm:p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200/90 dark:border-zinc-800 hover:border-rose-500/40 hover:bg-slate-50 dark:hover:bg-zinc-800/80 transition-all flex flex-col items-center justify-center text-center group shadow-xs active:scale-95"
          >
            <div className="w-10 h-10 rounded-xl bg-rose-500/15 flex items-center justify-center text-rose-500 dark:text-rose-400 mb-2 group-hover:scale-105 transition-transform">
              <Shield className="w-5 h-5" />
            </div>
            <span className="text-xs font-bold text-slate-900 dark:text-zinc-100 group-hover:text-rose-600 dark:group-hover:text-rose-400 leading-tight">
              Admin Console
            </span>
          </button>

          {/* Admin Card 2: Worker Approvals */}
          <button
            type="button"
            onClick={() => onNavigate('/admin?tab=workers')}
            className="p-3 sm:p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200/90 dark:border-zinc-800 hover:border-amber-500/40 hover:bg-slate-50 dark:hover:bg-zinc-800/80 transition-all flex flex-col items-center justify-center text-center group shadow-xs active:scale-95"
          >
            <div className="w-10 h-10 rounded-xl bg-amber-500/15 flex items-center justify-center text-amber-600 dark:text-amber-400 mb-2 group-hover:scale-105 transition-transform">
              <UserCheck className="w-5 h-5" />
            </div>
            <span className="text-xs font-bold text-slate-900 dark:text-zinc-100 group-hover:text-amber-600 dark:group-hover:text-amber-400 leading-tight">
              Worker Approvals
            </span>
          </button>

          {/* Admin Card 3: Support Management */}
          <button
            type="button"
            onClick={() => onNavigate('/admin?tab=management')}
            className="p-3 sm:p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200/90 dark:border-zinc-800 hover:border-rose-500/40 hover:bg-slate-50 dark:hover:bg-zinc-800/80 transition-all flex flex-col items-center justify-center text-center group shadow-xs active:scale-95"
          >
            <div className="w-10 h-10 rounded-xl bg-rose-500/15 flex items-center justify-center text-rose-500 dark:text-rose-400 mb-2 group-hover:scale-105 transition-transform">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <span className="text-xs font-bold text-slate-900 dark:text-zinc-100 group-hover:text-rose-600 dark:group-hover:text-rose-400 leading-tight">
              Management
            </span>
          </button>

          {/* Admin Card 4: Platform Alerts */}
          <button
            type="button"
            onClick={() => onNavigate('/admin?tab=notifications')}
            className="p-3 sm:p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200/90 dark:border-zinc-800 hover:border-blue-500/40 hover:bg-slate-50 dark:hover:bg-zinc-800/80 transition-all flex flex-col items-center justify-center text-center group shadow-xs active:scale-95"
          >
            <div className="w-10 h-10 rounded-xl bg-blue-500/15 flex items-center justify-center text-blue-600 dark:text-blue-400 mb-2 group-hover:scale-105 transition-transform">
              <Bell className="w-5 h-5" />
            </div>
            <span className="text-xs font-bold text-slate-900 dark:text-zinc-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 leading-tight">
              Platform Alerts
            </span>
          </button>

          {/* Admin Card 5: Manage Administrators */}
          <button
            type="button"
            onClick={() => onNavigate('/admin?tab=admins')}
            className="p-3 sm:p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-amber-500/40 hover:border-amber-500 hover:bg-amber-50/50 dark:hover:bg-amber-950/20 transition-all flex flex-col items-center justify-center text-center group shadow-xs active:scale-95"
          >
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-600 dark:text-amber-400 mb-2 group-hover:scale-105 transition-transform">
              <Shield className="w-5 h-5 text-amber-500" />
            </div>
            <span className="text-xs font-bold text-amber-600 dark:text-amber-400 leading-tight">
              Administrators
            </span>
          </button>
        </>
      ) : (
        <>
          {/* Card 1: My Bookings */}
          <button
            type="button"
            onClick={() => onNavigate('/bookings')}
            className="p-3 sm:p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200/90 dark:border-zinc-800 hover:border-amber-500/40 hover:bg-slate-50 dark:hover:bg-zinc-800/80 transition-all flex flex-col items-center justify-center text-center group shadow-xs active:scale-95"
          >
            <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-zinc-800 group-hover:bg-amber-500/15 flex items-center justify-center text-amber-600 dark:text-brand-400 mb-2 transition-colors">
              <ClipboardList className="w-5 h-5" />
            </div>
            <span className="text-xs font-bold text-slate-900 dark:text-zinc-100 group-hover:text-amber-600 dark:group-hover:text-amber-400 leading-tight">
              {t('profile.myBookings', 'My bookings')}
            </span>
          </button>

          {/* Card 2: Worker Mode / Become a Worker */}
          {isWorker ? (
            <button
              type="button"
              onClick={onToggleAvailability}
              className="p-3 sm:p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200/90 dark:border-zinc-800 hover:border-emerald-500/40 hover:bg-slate-50 dark:hover:bg-zinc-800/80 transition-all flex flex-col items-center justify-center text-center group shadow-xs active:scale-95"
            >
              <div className="w-10 h-10 rounded-xl bg-emerald-500/15 flex items-center justify-center text-emerald-600 dark:text-emerald-400 mb-2">
                <Power className={`w-5 h-5 ${isAvailable ? 'animate-pulse text-emerald-600 dark:text-emerald-400' : 'text-amber-500'}`} />
              </div>
              <span className="text-xs font-bold text-slate-900 dark:text-zinc-100 leading-tight">
                {isAvailable ? 'Online / Ready' : 'Offline'}
              </span>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => onNavigate('/register/worker')}
              className="p-3 sm:p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200/90 dark:border-zinc-800 hover:border-emerald-500/40 hover:bg-slate-50 dark:hover:bg-zinc-800/80 transition-all flex flex-col items-center justify-center text-center group shadow-xs active:scale-95"
            >
              <div className="w-10 h-10 rounded-xl bg-emerald-500/15 flex items-center justify-center text-emerald-600 dark:text-emerald-400 mb-2">
                <Briefcase className="w-5 h-5" />
              </div>
              <span className="text-xs font-bold text-slate-900 dark:text-zinc-100 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 leading-tight">
                {t('profile.becomeWorker', 'Earn with Jugnu')}
              </span>
            </button>
          )}

          {/* Card 3: Support */}
          <button
            type="button"
            onClick={() => {
              if (isWorker) {
                onOpenAssistant('worker_sarathi')
              } else {
                onOpenSupport()
              }
            }}
            className="p-3 sm:p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200/90 dark:border-zinc-800 hover:border-blue-500/40 hover:bg-slate-50 dark:hover:bg-zinc-800/80 transition-all flex flex-col items-center justify-center text-center group shadow-xs active:scale-95"
          >
            <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-zinc-800 group-hover:bg-blue-500/15 flex items-center justify-center text-blue-600 dark:text-blue-400 mb-2 transition-colors">
              {isWorker ? (
                <Bot className="w-5 h-5 text-amber-600 dark:text-brand-400" />
              ) : (
                <ShieldAlert className="w-5 h-5 text-rose-500" />
              )}
            </div>
            <span className="text-xs font-bold text-slate-900 dark:text-zinc-100 group-hover:text-amber-600 dark:group-hover:text-brand-400 leading-tight">
              {isWorker ? 'सारथी AI' : (language === 'hi' ? 'केयर एवं सहायता' : 'Care & Support')}
            </span>
          </button>
        </>
      )}
    </div>
  )
}

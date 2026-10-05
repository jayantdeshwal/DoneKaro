import { useTranslation } from 'react-i18next'
import { Badge, Button } from '@kaamgar/ui'
import {
  Shield,
  ShieldAlert,
  UserCheck,
  Bell,
  MapPin,
  Mail,
  Globe,
  LogOut,
  Calendar,
  Briefcase,
  Star,
  Smartphone,
  FileText,
  HelpCircle,
  Info,
  ChevronRight,
  Share2,
  Gift,
} from 'lucide-react'
import { triggerPWAInstall } from '@/components/PWAInstallPrompt'
import type { OpenSupportOptions } from '@/features/support'
import type { LiveWorkerDetails } from '../types'

interface ProfileMenuListProps {
  isAdmin: boolean
  isWorker: boolean
  workerDetails: LiveWorkerDetails | null
  email?: string | null
  language: string
  onNavigate: (path: string) => void
  onToggleLanguage: () => void
  onOpenAddressModal: () => void
  onOpenEmailModal: () => void
  onOpenLogoutModal: () => void
  onOpenSupport: (options?: OpenSupportOptions) => void
  onOpenAssistant: (persona: 'worker_sarathi' | 'customer_booking') => void
}

export function ProfileMenuList({
  isAdmin,
  isWorker,
  workerDetails,
  email,
  language,
  onNavigate,
  onToggleLanguage,
  onOpenAddressModal,
  onOpenEmailModal,
  onOpenLogoutModal,
  onOpenSupport,
  onOpenAssistant,
}: ProfileMenuListProps) {
  const { t } = useTranslation()

  // Native share / WhatsApp referral
  const handleShareApp = () => {
    const shareText = language === 'hi'
      ? 'DoneKaro: बिना किसी कमीशन के सीधे मुजफ्फरनगर के सत्यापित इलेक्ट्रीशियन, प्लंबर व एसी कारीगर बुक करें! देखें: https://donekaro.app'
      : 'DoneKaro: Hire verified local Electricians, Plumbers, Cleaning & AC technicians with 0% commission! Visit: https://donekaro.app'

    if (typeof navigator !== 'undefined' && navigator.share) {
      navigator.share({
        title: 'DoneKaro',
        text: shareText,
        url: window.location.origin,
      }).catch(() => {})
    } else {
      window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(shareText)}`, '_blank')
    }
  }

  return (
    <>
      <div className="space-y-1">
        {isAdmin ? (
          /* Admin Specific Menu Rows */
          <>
            {/* Option to Open and Manage Administrators directly from Account */}
            <div
              onClick={() => onNavigate('/admin?tab=admins')}
              className="flex items-center justify-between py-3.5 px-3.5 rounded-2xl bg-amber-500/10 dark:bg-amber-500/15 border border-amber-500/30 hover:bg-amber-500/20 cursor-pointer transition-all group shadow-xs mb-2"
            >
              <div className="flex items-center gap-3.5">
                <div className="w-9 h-9 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center font-bold shadow-xs">
                  <Shield className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-amber-600 dark:group-hover:text-amber-400 block">
                    Manage Administrators
                  </span>
                  <span className="text-[11px] text-slate-600 dark:text-zinc-400">
                    View administrator team list, add sub-admins & configure privileges
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-500 text-slate-950">
                  Open
                </span>
                <ChevronRight className="w-4 h-4 text-amber-500 group-hover:translate-x-0.5 transition-transform" />
              </div>
            </div>

            <div
              onClick={() => onNavigate('/admin')}
              className="flex items-center justify-between py-3.5 px-3 rounded-xl hover:bg-slate-100 dark:hover:bg-zinc-800/70 cursor-pointer transition-colors group"
            >
              <div className="flex items-center gap-3.5">
                <Shield className="w-5 h-5 text-rose-500 dark:text-rose-400" />
                <span className="text-sm font-medium text-slate-900 dark:text-zinc-100 group-hover:text-rose-600 dark:group-hover:text-rose-400">
                  Admin Management Portal
                </span>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-400 dark:text-zinc-500 group-hover:text-rose-500 group-hover:translate-x-0.5 transition-all" />
            </div>

            <div
              onClick={() => onNavigate('/admin?tab=management')}
              className="flex items-center justify-between py-3.5 px-3 rounded-xl hover:bg-slate-100 dark:hover:bg-zinc-800/70 cursor-pointer transition-colors group"
            >
              <div className="flex items-center gap-3.5">
                <ShieldAlert className="w-5 h-5 text-rose-500 dark:text-rose-400" />
                <span className="text-sm font-medium text-slate-900 dark:text-zinc-100 group-hover:text-rose-600 dark:group-hover:text-rose-400">
                  {language === 'hi' ? 'शिकायत एवं सुझाव प्रबंधन' : 'Support Management (Complaints & Suggestions)'}
                </span>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-400 dark:text-zinc-500 group-hover:text-rose-500 group-hover:translate-x-0.5 transition-all" />
            </div>

            <div
              onClick={() => onNavigate('/admin?tab=workers')}
              className="flex items-center justify-between py-3.5 px-3 rounded-xl hover:bg-slate-100 dark:hover:bg-zinc-800/70 cursor-pointer transition-colors group"
            >
              <div className="flex items-center gap-3.5">
                <UserCheck className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                <span className="text-sm font-medium text-slate-900 dark:text-zinc-100 group-hover:text-amber-600 dark:group-hover:text-amber-400">
                  Pending Worker ID Approvals
                </span>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-400 dark:text-zinc-500 group-hover:text-amber-500 group-hover:translate-x-0.5 transition-all" />
            </div>

            <div
              onClick={() => onNavigate('/admin?tab=notifications')}
              className="flex items-center justify-between py-3.5 px-3 rounded-xl hover:bg-slate-100 dark:hover:bg-zinc-800/70 cursor-pointer transition-colors group"
            >
              <div className="flex items-center gap-3.5">
                <Bell className="w-5 h-5 text-amber-600 dark:text-brand-400" />
                <span className="text-sm font-medium text-slate-900 dark:text-zinc-100 group-hover:text-amber-600 dark:group-hover:text-brand-400">
                  Platform Notifications & Alerts
                </span>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-400 dark:text-zinc-500 group-hover:text-amber-500 group-hover:translate-x-0.5 transition-all" />
            </div>

            <div
              onClick={onOpenAddressModal}
              className="flex items-center justify-between py-3.5 px-3 rounded-xl hover:bg-slate-100 dark:hover:bg-zinc-800/70 cursor-pointer transition-colors group"
            >
              <div className="flex items-center gap-3.5">
                <MapPin className="w-5 h-5 text-slate-500 dark:text-zinc-400 group-hover:text-amber-600 dark:group-hover:text-brand-400" />
                <span className="text-sm font-medium text-slate-900 dark:text-zinc-100 group-hover:text-amber-600 dark:group-hover:text-brand-400">
                  Service Localities (251001 & 251002)
                </span>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-400 dark:text-zinc-500 group-hover:text-amber-500 group-hover:translate-x-0.5 transition-all" />
            </div>

            <div
              onClick={onOpenEmailModal}
              className="flex items-center justify-between py-3.5 px-3 rounded-xl hover:bg-slate-100 dark:hover:bg-zinc-800/70 cursor-pointer transition-colors group"
            >
              <div className="flex items-center gap-3.5">
                <Mail className="w-5 h-5 text-slate-500 dark:text-zinc-400 group-hover:text-amber-600 dark:group-hover:text-brand-400" />
                <span className="text-sm font-medium text-slate-900 dark:text-zinc-100 group-hover:text-amber-600 dark:group-hover:text-brand-400">
                  Admin Email & Security
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-xs text-slate-500 dark:text-zinc-400 truncate max-w-[130px]">
                  {email || 'Add Email'}
                </span>
                <ChevronRight className="w-4 h-4 text-slate-400 dark:text-zinc-500 group-hover:text-amber-500 group-hover:translate-x-0.5 transition-all" />
              </div>
            </div>

            <div
              onClick={onToggleLanguage}
              className="flex items-center justify-between py-3.5 px-3 rounded-xl hover:bg-slate-100 dark:hover:bg-zinc-800/70 cursor-pointer transition-colors group"
            >
              <div className="flex items-center gap-3.5">
                <Globe className="w-5 h-5 text-slate-500 dark:text-zinc-400 group-hover:text-amber-600 dark:group-hover:text-brand-400" />
                <span className="text-sm font-medium text-slate-900 dark:text-zinc-100 group-hover:text-amber-600 dark:group-hover:text-brand-400">
                  {language === 'en' ? 'App Language' : 'ऐप की भाषा'}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="brand" size="sm" className="font-semibold">
                  {language === 'en' ? 'English' : 'हिंदी'}
                </Badge>
                <ChevronRight className="w-4 h-4 text-slate-400 dark:text-zinc-500 group-hover:text-amber-500 group-hover:translate-x-0.5 transition-all" />
              </div>
            </div>

            <div
              onClick={onOpenLogoutModal}
              className="flex items-center justify-between py-3.5 px-3 rounded-xl hover:bg-rose-50 dark:hover:bg-red-500/10 cursor-pointer transition-colors group"
            >
              <div className="flex items-center gap-3.5">
                <LogOut className="w-5 h-5 text-rose-500 dark:text-red-400" />
                <span className="text-sm font-medium text-rose-600 dark:text-red-400">
                  {t('nav.logout', 'Log out')}
                </span>
              </div>
              <ChevronRight className="w-4 h-4 text-rose-400/60 group-hover:translate-x-0.5 transition-all" />
            </div>
          </>
        ) : (
          /* Customer & Worker Menu Rows */
          <>
            {/* Row: My Bookings / Orders */}
            <div
              onClick={() => onNavigate('/bookings')}
              className="flex items-center justify-between py-3.5 px-3 rounded-xl hover:bg-slate-100 dark:hover:bg-zinc-800/70 cursor-pointer transition-colors group"
            >
              <div className="flex items-center gap-3.5">
                <Calendar className="w-5 h-5 text-slate-500 dark:text-zinc-400 group-hover:text-amber-600 dark:group-hover:text-brand-400" />
                <span className="text-sm font-medium text-slate-900 dark:text-zinc-100 group-hover:text-amber-600 dark:group-hover:text-brand-400">
                  {t('profile.myBookings', 'My bookings')}
                </span>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-400 dark:text-zinc-500 group-hover:text-amber-500 group-hover:translate-x-0.5 transition-all" />
            </div>

            {/* Row: Worker Dashboard (Worker only) */}
            {isWorker && (
              <div
                onClick={() => onNavigate('/worker/dashboard')}
                className="flex items-center justify-between py-3.5 px-3 rounded-xl hover:bg-slate-100 dark:hover:bg-zinc-800/70 cursor-pointer transition-colors group"
              >
                <div className="flex items-center gap-3.5">
                  <Briefcase className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                  <span className="text-sm font-medium text-slate-900 dark:text-zinc-100 group-hover:text-emerald-600 dark:group-hover:text-emerald-400">
                    {t('nav.workerDashboard', 'Worker Dashboard')}
                  </span>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400 dark:text-zinc-500 group-hover:text-emerald-500 group-hover:translate-x-0.5 transition-all" />
              </div>
            )}

            {/* Row: My Rating & Reviews (Worker only) */}
            {isWorker && (
              <div
                onClick={() => onNavigate('/worker/reviews')}
                className="flex items-center justify-between py-3.5 px-3 rounded-xl hover:bg-slate-100 dark:hover:bg-zinc-800/70 cursor-pointer transition-colors group"
              >
                <div className="flex items-center gap-3.5">
                  <Star className="w-5 h-5 text-amber-500 dark:text-amber-400" />
                  <span className="text-sm font-medium text-slate-900 dark:text-zinc-100 group-hover:text-amber-600 dark:group-hover:text-brand-400">
                    {t('profile.reviewsRatings', 'My rating & reviews')}
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  {workerDetails && workerDetails.rating > 0 && (
                    <span className="text-xs font-bold text-amber-600 dark:text-amber-400">
                      ★ {workerDetails.rating.toFixed(1)}
                    </span>
                  )}
                  <ChevronRight className="w-4 h-4 text-slate-400 dark:text-zinc-500 group-hover:text-amber-500 group-hover:translate-x-0.5 transition-all" />
                </div>
              </div>
            )}

            {/* Row: Manage Addresses & Localities */}
            <div
              onClick={onOpenAddressModal}
              className="flex items-center justify-between py-3.5 px-3 rounded-xl hover:bg-slate-100 dark:hover:bg-zinc-800/70 cursor-pointer transition-colors group"
            >
              <div className="flex items-center gap-3.5">
                <MapPin className="w-5 h-5 text-slate-500 dark:text-zinc-400 group-hover:text-amber-600 dark:group-hover:text-brand-400" />
                <span className="text-sm font-medium text-slate-900 dark:text-zinc-100 group-hover:text-amber-600 dark:group-hover:text-brand-400">
                  {t('profile.manageAddresses', 'Manage addresses & localities')}
                </span>
              </div>
              <div className="flex items-center gap-1 text-xs text-slate-500 dark:text-zinc-400">
                <span>Muzaffarnagar</span>
                <ChevronRight className="w-4 h-4 text-slate-400 dark:text-zinc-500 group-hover:text-amber-500 group-hover:translate-x-0.5 transition-all" />
              </div>
            </div>

            {/* Row: Email & Notifications */}
            <div
              onClick={onOpenEmailModal}
              className="flex items-center justify-between py-3.5 px-3 rounded-xl hover:bg-slate-100 dark:hover:bg-zinc-800/70 cursor-pointer transition-colors group"
            >
              <div className="flex items-center gap-3.5">
                <Mail className="w-5 h-5 text-slate-500 dark:text-zinc-400 group-hover:text-amber-600 dark:group-hover:text-brand-400" />
                <span className="text-sm font-medium text-slate-900 dark:text-zinc-100 group-hover:text-amber-600 dark:group-hover:text-brand-400">
                  {t('profile.emailReceipts', 'Email & notifications')}
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-xs text-slate-500 dark:text-zinc-400 truncate max-w-[130px]">
                  {email || 'Add Email'}
                </span>
                <ChevronRight className="w-4 h-4 text-slate-400 dark:text-zinc-500 group-hover:text-amber-500 group-hover:translate-x-0.5 transition-all" />
              </div>
            </div>

            {/* Row: App Language Toggle */}
            <div
              onClick={onToggleLanguage}
              className="flex items-center justify-between py-3.5 px-3 rounded-xl hover:bg-slate-100 dark:hover:bg-zinc-800/70 cursor-pointer transition-colors group"
            >
              <div className="flex items-center gap-3.5">
                <Globe className="w-5 h-5 text-slate-500 dark:text-zinc-400 group-hover:text-amber-600 dark:group-hover:text-brand-400" />
                <span className="text-sm font-medium text-slate-900 dark:text-zinc-100 group-hover:text-amber-600 dark:group-hover:text-brand-400">
                  {language === 'en' ? 'App Language' : 'ऐप की भाषा'}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="brand" size="sm" className="font-semibold">
                  {language === 'en' ? 'English' : 'हिंदी'}
                </Badge>
                <ChevronRight className="w-4 h-4 text-slate-400 dark:text-zinc-500 group-hover:text-amber-500 group-hover:translate-x-0.5 transition-all" />
              </div>
            </div>

            {/* Row: Dedicated PWA Install Button */}
            <div
              onClick={() => triggerPWAInstall()}
              className="flex items-center justify-between py-3.5 px-3 rounded-xl hover:bg-slate-100 dark:hover:bg-zinc-800/70 cursor-pointer transition-colors group"
            >
              <div className="flex items-center gap-3.5">
                <Smartphone className="w-5 h-5 text-amber-600 dark:text-brand-400" />
                <span className="text-sm font-semibold text-amber-700 dark:text-brand-400">
                  {t('pwa.installApp', 'Install Mobile App')}
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] bg-amber-500/15 text-amber-800 dark:text-brand-300 font-bold px-2 py-0.5 rounded-full border border-amber-500/30">
                  Fast & Offline
                </span>
                <ChevronRight className="w-4 h-4 text-amber-600 dark:text-brand-400 group-hover:translate-x-0.5 transition-all" />
              </div>
            </div>

            {/* Row: Care & Support (Formal Complaints & Suggestions) */}
            <div
              onClick={() => onOpenSupport()}
              className="flex items-center justify-between py-3.5 px-3 rounded-xl hover:bg-slate-100 dark:hover:bg-zinc-800/70 cursor-pointer transition-colors group"
            >
              <div className="flex items-center gap-3.5">
                <ShieldAlert className="w-5 h-5 text-rose-500 group-hover:text-rose-600 transition-colors" />
                <div className="flex flex-col">
                  <span className="text-sm font-medium text-slate-900 dark:text-zinc-100 group-hover:text-rose-600 dark:group-hover:text-rose-400">
                    {language === 'hi' ? 'केयर एवं सहायता (शिकायत / सुझाव)' : 'Care & Support (Complaint / Suggestion)'}
                  </span>
                  <span className="text-[11px] text-slate-500 dark:text-zinc-400">
                    {language === 'hi' ? 'आधिकारिक समस्या समाधान व सुझाव दर्ज करें' : 'Official issue resolution & feedback'}
                  </span>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-400 dark:text-zinc-500 group-hover:text-rose-500 group-hover:translate-x-0.5 transition-all" />
            </div>

            {/* Row: My Support Requests */}
            <div
              onClick={() => onOpenSupport({ defaultTab: 'history' })}
              className="flex items-center justify-between py-3.5 px-3 rounded-xl hover:bg-slate-100 dark:hover:bg-zinc-800/70 cursor-pointer transition-colors group"
            >
              <div className="flex items-center gap-3.5">
                <FileText className="w-5 h-5 text-slate-500 dark:text-zinc-400 group-hover:text-amber-600 dark:group-hover:text-brand-400" />
                <div className="flex flex-col">
                  <span className="text-sm font-medium text-slate-900 dark:text-zinc-100 group-hover:text-amber-600 dark:group-hover:text-brand-400">
                    {language === 'hi' ? 'मेरे सहायता अनुरोध' : 'My Support Requests'}
                  </span>
                  <span className="text-[11px] text-slate-500 dark:text-zinc-400">
                    {language === 'hi' ? 'शिकायतों की लाइव स्थिति और टोकन जांचें' : 'View status of your submitted requests'}
                  </span>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-400 dark:text-zinc-500 group-hover:text-amber-500 group-hover:translate-x-0.5 transition-all" />
            </div>

            {/* Row: Help Center & AI Assistant */}
            <div
              onClick={() => onOpenAssistant(isWorker ? 'worker_sarathi' : 'customer_booking')}
              className="flex items-center justify-between py-3.5 px-3 rounded-xl hover:bg-slate-100 dark:hover:bg-zinc-800/70 cursor-pointer transition-colors group"
            >
              <div className="flex items-center gap-3.5">
                <HelpCircle className="w-5 h-5 text-slate-500 dark:text-zinc-400 group-hover:text-amber-600 dark:group-hover:text-brand-400" />
                <div className="flex flex-col">
                  <span className="text-sm font-medium text-slate-900 dark:text-zinc-100 group-hover:text-amber-600 dark:group-hover:text-brand-400">
                    {t('profile.faqsHelp', 'Help Center & FAQs')}
                  </span>
                  <span className="text-[11px] text-slate-500 dark:text-zinc-400">
                    {language === 'hi' ? 'AI सहायक से प्रश्न पूछें' : 'Ask questions with AI Assistant'}
                  </span>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-400 dark:text-zinc-500 group-hover:text-amber-500 group-hover:translate-x-0.5 transition-all" />
            </div>

            {/* Row: About DoneKaro */}
            <div
              onClick={() => onNavigate('/')}
              className="flex items-center justify-between py-3.5 px-3 rounded-xl hover:bg-slate-100 dark:hover:bg-zinc-800/70 cursor-pointer transition-colors group"
            >
              <div className="flex items-center gap-3.5">
                <Info className="w-5 h-5 text-slate-500 dark:text-zinc-400 group-hover:text-amber-600 dark:group-hover:text-brand-400" />
                <span className="text-sm font-medium text-slate-900 dark:text-zinc-100 group-hover:text-amber-600 dark:group-hover:text-brand-400">
                  {t('profile.aboutApp', 'About DoneKaro')}
                </span>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-400 dark:text-zinc-500 group-hover:text-amber-500 group-hover:translate-x-0.5 transition-all" />
            </div>

            {/* Row: Log Out */}
            <div
              onClick={onOpenLogoutModal}
              className="flex items-center justify-between py-3.5 px-3 rounded-xl hover:bg-rose-50 dark:hover:bg-red-500/10 cursor-pointer transition-colors group"
            >
              <div className="flex items-center gap-3.5">
                <LogOut className="w-5 h-5 text-rose-500 dark:text-red-400" />
                <span className="text-sm font-medium text-rose-600 dark:text-red-400">
                  {t('nav.logout', 'Log out')}
                </span>
              </div>
              <ChevronRight className="w-4 h-4 text-rose-400/60 group-hover:translate-x-0.5 transition-all" />
            </div>
          </>
        )}
      </div>

      {/* 5. REFER & SHARE CARD AT BOTTOM (Hidden for Admin) */}
      {!isAdmin && (
        <>
          <div className="border-t border-slate-200/80 dark:border-semantic-border-light/60 my-6" />
          <div className="p-5 rounded-3xl bg-gradient-to-r from-purple-50 via-white to-amber-50 dark:from-purple-950/40 dark:via-zinc-900 dark:to-brand-500/10 border border-purple-200/80 dark:border-purple-500/30 flex items-center justify-between gap-4 shadow-sm dark:shadow-xl">
            <div className="flex-1 min-w-0">
              <h3 className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-white mb-1">
                {t('profile.referTitle', 'Share DoneKaro & Earn Goodwill')}
              </h3>
              <p className="text-xs text-slate-600 dark:text-zinc-400 leading-relaxed mb-3">
                {t('profile.referDesc', 'Help your friends and family find verified local electricians, plumbers, and technicians without middlemen.')}
              </p>
              <Button
                variant="primary"
                size="sm"
                onClick={handleShareApp}
                className="bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs px-4 py-1.5 shadow-md shadow-purple-600/30 flex items-center gap-1.5 cursor-pointer"
              >
                <Share2 className="w-3.5 h-3.5" />
                <span>{t('profile.referNow', 'Refer now')}</span>
              </Button>
            </div>

            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-purple-100 dark:bg-purple-500/20 border border-purple-200 dark:border-purple-500/30 flex items-center justify-center text-purple-600 dark:text-purple-300 shrink-0 shadow-inner">
              <Gift className="w-8 h-8 sm:w-10 sm:h-10 text-purple-600 dark:text-purple-300" />
            </div>
          </div>
        </>
      )}
    </>
  )
}

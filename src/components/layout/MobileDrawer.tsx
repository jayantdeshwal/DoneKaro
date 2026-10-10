import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useLanguage } from '../../context/LanguageContext'
import { useAuth } from '../../context/AuthContext'
import { useTheme } from '../../context/ThemeContext'
import { useAiAssistant } from '@/features/ai-support'
import { useSupport } from '@/features/support'
import { Avatar, Badge } from '@kaamgar/ui'
import {
  X,
  User,
  LogOut,
  Shield,
  Globe,
  ShieldAlert,
  Sun,
  Moon,
  Bot,
  Sparkles,
  ArrowLeft,
  ChevronRight,
  ShieldCheck,
  Home,
  Calendar,
  Briefcase,
  Grid,
  Search,
  Bell,
  FileText,
} from 'lucide-react'
import AppLogo from '../common/AppLogo'

export interface MobileDrawerProps {
  isOpen: boolean
  onClose: () => void
}

export function MobileDrawer({ isOpen, onClose }: MobileDrawerProps) {
  const { t } = useTranslation()
  const { language, toggleLanguage } = useLanguage()
  const { isDark, toggleTheme } = useTheme()
  const { user, isAuthenticated, isWorker, isAdmin, isSuperAdmin, logout } = useAuth()
  const { openAssistant } = useAiAssistant()
  const { openSupport } = useSupport()
  const navigate = useNavigate()

  if (!isOpen) return null

  const handleBackToLogin = () => {
    sessionStorage.removeItem('donekaro_guest_mode')
    window.dispatchEvent(new Event('storage'))
    onClose()
    navigate('/login')
  }

  const handleNavigate = (path: string) => {
    onClose()
    navigate(path)
  }

  return (
    <div className="fixed inset-0 z-[9999] md:hidden" role="dialog" aria-modal="true" aria-label="Mobile Navigation Sidebar">
      {/* Fullscreen Backdrop Blur Overlay */}
      <div
        className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs transition-opacity cursor-pointer animate-fade-in"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Slide-In Aside from Left (Reference 22.jpeg & 23.jpeg) */}
      <aside className="fixed inset-y-0 left-0 w-[86vw] max-w-xs sm:max-w-sm bg-white dark:bg-zinc-950 shadow-2xl border-r border-slate-200 dark:border-zinc-800 flex flex-col z-[10000] animate-slide-right overflow-y-auto pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)]">
        {/* 1. Header: Logo & Close X Button */}
        <div className="flex items-center justify-between p-4 border-b border-slate-100 dark:border-zinc-800/80 sticky top-0 bg-white/95 dark:bg-zinc-950/95 backdrop-blur-md z-10">
          <div className="flex items-center gap-2.5">
            <AppLogo className="w-8 h-8" />
            <div>
              <span className="font-extrabold text-base text-slate-900 dark:text-zinc-100 block leading-tight">
                {t('app.name')}
              </span>
              <span className="text-[10px] text-amber-600 dark:text-amber-400 font-semibold tracking-wide">
                {t('app.tagline')}
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-full flex items-center justify-center text-slate-500 hover:text-slate-900 dark:text-zinc-400 dark:hover:text-zinc-100 bg-slate-100 dark:bg-zinc-800/80 hover:bg-slate-200 dark:hover:bg-zinc-700 transition-colors cursor-pointer"
            aria-label="Close sidebar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 2. User Account Identity & Verified Trust Badge (Reference 23.jpeg) */}
        <div className="p-4 border-b border-slate-100 dark:border-zinc-800/80 bg-slate-50/70 dark:bg-zinc-900/50">
          {isAuthenticated ? (
            <div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 min-w-0">
                  <Avatar name={user?.name} size="md" src={user?.avatar_url || undefined} />
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-slate-900 dark:text-zinc-100 truncate">{user?.name}</p>
                    <p className="text-xs text-slate-500 dark:text-zinc-400 truncate mt-0.5">{user?.phone || 'Logged In'}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => handleNavigate('/profile')}
                  className="shrink-0 text-xs font-semibold text-amber-600 dark:text-amber-400 hover:text-amber-500 flex items-center gap-0.5 px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 active:scale-95 transition-all"
                >
                  <span>{language === 'hi' ? 'प्रोफ़ाइल' : 'Profile'}</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Account Status Card */}
              <div className="mt-3 py-2 px-3 rounded-xl bg-slate-100 dark:bg-zinc-800/80 border border-slate-200/80 dark:border-zinc-700/80 flex items-center justify-between">
                <div className="flex items-center gap-2 min-w-0">
                  {isAdmin ? (
                    <Shield className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
                  ) : isWorker ? (
                    <Briefcase className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
                  ) : (
                    <User className="w-4 h-4 text-slate-600 dark:text-zinc-400 shrink-0" />
                  )}
                  <span className="text-[11px] font-bold text-slate-800 dark:text-zinc-200 truncate">
                    {isAdmin
                      ? (isSuperAdmin ? 'Admin Console • Super Admin' : 'Admin Console • Administrator')
                      : isWorker
                      ? (language === 'hi' ? 'DoneKaro सेवा साथी खाता' : 'DoneKaro Service Partner')
                      : (language === 'hi' ? 'सक्रिय नागरिक खाता' : 'Active DoneKaro Account')}
                  </span>
                </div>
                <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20 shrink-0">
                  {language === 'hi' ? 'सक्रिय' : 'Active'}
                </span>
              </div>
            </div>
          ) : (
            <div className="space-y-2.5">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-amber-500/15 flex items-center justify-center text-amber-500">
                  <User className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-900 dark:text-zinc-100">{t('common.welcome', 'Welcome!')}</p>
                  <p className="text-xs text-slate-500 dark:text-zinc-400">{t('common.guestMode', 'Exploring as Guest')}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => handleNavigate('/login')}
                  className="w-full py-2 text-xs font-bold rounded-xl bg-amber-500 text-slate-950 shadow-xs hover:bg-amber-400 transition-colors cursor-pointer text-center"
                >
                  {t('nav.loginSignup', 'Login / Register')}
                </button>
                <button
                  type="button"
                  onClick={() => handleNavigate('/register/worker')}
                  className="w-full py-2 text-xs font-bold rounded-xl border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-slate-800 dark:text-zinc-200 hover:bg-slate-50 dark:hover:bg-zinc-700 transition-colors cursor-pointer text-center"
                >
                  {t('nav.becomeWorker', 'Earn as Worker')}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* 3. Navigation Rows & Groups (Reference 22.jpeg: dual-line rows with chevrons) */}
        <div className="flex-1 p-3 space-y-4 overflow-y-auto">
          {/* Group A: Activities & Core Navigation */}
          <div>
            <p className="px-2 text-[10px] font-extrabold text-slate-400 dark:text-zinc-500 uppercase tracking-wider mb-1.5">
              {language === 'hi' ? 'मुख्य गतिविधियाँ' : 'Main Activities'}
            </p>
            <div className="space-y-1">
              <button
                type="button"
                onClick={() => handleNavigate('/')}
                className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-zinc-850 active:scale-[0.99] transition-all text-left group"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                    <Home className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-slate-900 dark:text-zinc-100 group-hover:text-amber-600 dark:group-hover:text-amber-400">
                      {t('nav.home', 'Home')}
                    </p>
                    <p className="text-[11px] text-slate-500 dark:text-zinc-400 leading-tight truncate">
                      {language === 'hi' ? 'मुख्य पृष्ठ एवं सेवाएँ' : 'Discovery & local services'}
                    </p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400 dark:text-zinc-500 group-hover:translate-x-0.5 transition-transform" />
              </button>

              {isAuthenticated && !isAdmin && !isWorker && (
                <button
                  type="button"
                  onClick={() => handleNavigate('/bookings')}
                  className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-zinc-855 active:scale-[0.99] transition-all text-left group"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                      <Calendar className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-slate-900 dark:text-zinc-100 group-hover:text-blue-600 dark:group-hover:text-blue-400">
                        {t('nav.bookings', 'My Bookings')}
                      </p>
                      <p className="text-[11px] text-slate-500 dark:text-zinc-400 leading-tight truncate">
                        {language === 'hi' ? 'सक्रिय व पिछली बुकिंग' : 'Active and completed orders'}
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400 dark:text-zinc-500 group-hover:translate-x-0.5 transition-transform" />
                </button>
              )}

              {isWorker && (
                <button
                  type="button"
                  onClick={() => handleNavigate('/worker/dashboard')}
                  className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-zinc-850 active:scale-[0.99] transition-all text-left group"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                      <Briefcase className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-slate-900 dark:text-zinc-100 group-hover:text-emerald-600 dark:group-hover:text-emerald-400">
                        {t('nav.workerDashboard', 'Worker Dashboard')}
                      </p>
                      <p className="text-[11px] text-slate-500 dark:text-zinc-400 leading-tight truncate">
                        {language === 'hi' ? 'काम अनुरोध, लीड्स व आय' : 'Jobs, leads, quotes & earnings'}
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400 dark:text-zinc-500 group-hover:translate-x-0.5 transition-transform" />
                </button>
              )}

              {isAdmin && (
                <button
                  type="button"
                  onClick={() => handleNavigate('/admin')}
                  className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-zinc-850 active:scale-[0.99] transition-all text-left group"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-lg bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
                      <Shield className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-slate-900 dark:text-zinc-100 group-hover:text-rose-600 dark:group-hover:text-rose-400">
                        {t('nav.adminDashboard', 'Admin Dashboard')}
                      </p>
                      <p className="text-[11px] text-slate-500 dark:text-zinc-400 leading-tight truncate">
                        {language === 'hi' ? 'सत्यापन, निगरानी व टीम' : 'Approvals, metrics & team'}
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400 dark:text-zinc-500 group-hover:translate-x-0.5 transition-transform" />
                </button>
              )}

              <button
                type="button"
                onClick={() => handleNavigate('/categories')}
                className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-zinc-850 active:scale-[0.99] transition-all text-left group"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
                    <Grid className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-slate-900 dark:text-zinc-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400">
                      {t('nav.category', 'All Categories')}
                    </p>
                    <p className="text-[11px] text-slate-500 dark:text-zinc-400 leading-tight truncate">
                      {language === 'hi' ? 'इलेक्ट्रीशियन, प्लंबर व अन्य' : 'Electrician, Plumber, AC & More'}
                    </p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400 dark:text-zinc-500 group-hover:translate-x-0.5 transition-transform" />
              </button>

              <button
                type="button"
                onClick={() => handleNavigate('/search')}
                className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-zinc-850 active:scale-[0.99] transition-all text-left group"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-sky-500/10 text-sky-600 dark:text-sky-400 flex items-center justify-center shrink-0">
                    <Search className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-slate-900 dark:text-zinc-100 group-hover:text-sky-600 dark:group-hover:text-sky-400">
                      {t('nav.search', 'Search & Hire')}
                    </p>
                    <p className="text-[11px] text-slate-500 dark:text-zinc-400 leading-tight truncate">
                      {language === 'hi' ? 'मुजफ्फरनगर के सत्यापित कामगार खोजें' : 'Filter by locality and rating'}
                    </p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400 dark:text-zinc-500 group-hover:translate-x-0.5 transition-transform" />
              </button>

              {isAuthenticated && (
                <button
                  type="button"
                  onClick={() => handleNavigate('/notifications')}
                  className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-zinc-850 active:scale-[0.99] transition-all text-left group"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                      <Bell className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-slate-900 dark:text-zinc-100 group-hover:text-amber-600 dark:group-hover:text-amber-400">
                        {t('nav.alerts', 'Notifications & Alerts')}
                      </p>
                      <p className="text-[11px] text-slate-500 dark:text-zinc-400 leading-tight truncate">
                        {language === 'hi' ? 'बुकिंग अपडेट व सूचनाएँ' : 'Booking updates and status'}
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400 dark:text-zinc-500 group-hover:translate-x-0.5 transition-transform" />
                </button>
              )}
            </div>
          </div>

          {/* Group B: Preferences & Appearance */}
          <div className="pt-2 border-t border-slate-100 dark:border-zinc-800/80">
            <p className="px-2 text-[10px] font-extrabold text-slate-400 dark:text-zinc-500 uppercase tracking-wider mb-1.5">
              {t('nav.preferences', 'Preferences')}
            </p>
            <div className="space-y-1">
              {/* Theme Toggle */}
              <button
                type="button"
                onClick={toggleTheme}
                className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-zinc-850 active:scale-[0.99] transition-all text-left group"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                    {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-700" />}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-slate-900 dark:text-zinc-100">
                      {isDark ? 'Light Theme' : 'Dark Theme'}
                    </p>
                    <p className="text-[11px] text-slate-500 dark:text-zinc-400 leading-tight">
                      {isDark ? 'सफेद थीम पर स्विच करें' : 'नाइट थीम पर स्विच करें'}
                    </p>
                  </div>
                </div>
                <Badge variant={isDark ? 'primary' : 'default'} size="sm">
                  {isDark ? 'Dark' : 'Light'}
                </Badge>
              </button>

              {/* Language Switcher */}
              <button
                type="button"
                onClick={toggleLanguage}
                className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-zinc-850 active:scale-[0.99] transition-all text-left group"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                    <Globe className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-slate-900 dark:text-zinc-100">
                      {language === 'en' ? 'हिन्दी में बदलें' : 'Switch to English'}
                    </p>
                    <p className="text-[11px] text-slate-500 dark:text-zinc-400 leading-tight">
                      {language === 'en' ? 'English Active' : 'हिंदी सक्रिय है'}
                    </p>
                  </div>
                </div>
                <Badge variant="outline" size="sm" className="font-bold text-amber-600 dark:text-amber-400">
                  {language === 'en' ? 'EN' : 'हिन्दी'}
                </Badge>
              </button>
            </div>
          </div>

          {/* Group C: Support, AI & Legal */}
          <div className="pt-2 border-t border-slate-100 dark:border-zinc-800/80">
            <p className="px-2 text-[10px] font-extrabold text-slate-400 dark:text-zinc-500 uppercase tracking-wider mb-1.5">
              {language === 'hi' ? 'सहायता एवं जानकारी' : 'Support & Legal'}
            </p>
            <div className="space-y-1">
              {/* Care & Support */}
              <button
                type="button"
                onClick={() => {
                  onClose()
                  if (isAdmin) {
                    navigate('/admin?tab=management')
                  } else {
                    openSupport()
                  }
                }}
                className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-zinc-850 active:scale-[0.99] transition-all text-left group"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
                    <ShieldAlert className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-slate-900 dark:text-zinc-100 group-hover:text-rose-600 dark:group-hover:text-rose-400">
                      {isAdmin
                        ? (language === 'hi' ? 'प्रबंधन पोर्टल' : 'Support Oversight')
                        : (language === 'hi' ? 'केयर एवं सहायता' : 'Care & Support')}
                    </p>
                    <p className="text-[11px] text-slate-500 dark:text-zinc-400 leading-tight truncate">
                      {language === 'hi' ? 'शिकायत, सुझाव व समाधान' : 'Official dispute resolution'}
                    </p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400 dark:text-zinc-500 group-hover:translate-x-0.5 transition-transform" />
              </button>

              {/* AI Assistant (Authenticated Non-Admin) */}
              {isAuthenticated && !isAdmin && (
                <button
                  type="button"
                  onClick={() => {
                    onClose()
                    openAssistant(isWorker ? 'worker_sarathi' : 'customer_booking')
                  }}
                  className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-zinc-850 active:scale-[0.99] transition-all text-left group"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-lg bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                      <Bot className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-slate-900 dark:text-zinc-100 group-hover:text-amber-600 dark:group-hover:text-amber-400">
                        {language === 'hi' ? 'AI सहायक' : 'AI Assistant'}
                      </p>
                      <p className="text-[11px] text-slate-500 dark:text-zinc-400 leading-tight truncate">
                        {language === 'hi' ? 'बुकिंग व काम सलाह' : 'Guidance & smart assistance'}
                      </p>
                    </div>
                  </div>
                  <Sparkles className="w-4 h-4 text-amber-500" />
                </button>
              )}

              {/* Terms & Conditions */}
              <button
                type="button"
                onClick={() => handleNavigate('/terms')}
                className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-zinc-850 active:scale-[0.99] transition-all text-left group"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-slate-500/10 text-slate-600 dark:text-zinc-400 flex items-center justify-center shrink-0">
                    <FileText className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-slate-900 dark:text-zinc-100">
                      {language === 'hi' ? 'नियम एवं शर्तें' : 'Terms & Conditions'}
                    </p>
                    <p className="text-[11px] text-slate-500 dark:text-zinc-400 leading-tight truncate">
                      {language === 'hi' ? 'कानूनी शर्तें एवं नियम' : 'Policies & platform rules'}
                    </p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400 dark:text-zinc-500 group-hover:translate-x-0.5 transition-transform" />
              </button>
            </div>
          </div>
        </div>

        {/* 4. Footer: Logout / Back to Login + Version Stamp (Reference 22.jpeg) */}
        <div className="p-4 border-t border-slate-100 dark:border-zinc-800/80 bg-slate-50/70 dark:bg-zinc-900/60 mt-auto">
          {isAuthenticated ? (
            <button
              type="button"
              onClick={() => {
                onClose()
                void logout()
              }}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 font-bold text-xs sm:text-sm border border-rose-500/20 active:scale-[0.98] transition-all cursor-pointer shadow-xs"
            >
              <LogOut className="w-4 h-4" />
              <span>{t('nav.logout', 'Sign Out')} ({language === 'hi' ? 'लॉग आउट' : 'Sign Out'})</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={handleBackToLogin}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 dark:text-amber-400 font-bold text-xs sm:text-sm border border-amber-500/20 active:scale-[0.98] transition-all cursor-pointer shadow-xs"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>{t('common.backToLogin', 'Back to Login')} ({language === 'hi' ? 'लॉगिन' : 'Login'})</span>
            </button>
          )}

          {/* Platform Identity Stamp */}
          <div className="mt-3 text-center">
            <p className="text-[10px] text-slate-400 dark:text-zinc-500 font-medium">
              {language === 'hi' ? 'DoneKaro • मुज़फ़्फ़रनगर स्थानीय सेवाएँ' : 'DoneKaro • Muzaffarnagar Urban Services'}
            </p>
          </div>
        </div>
      </aside>
    </div>
  )
}

import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useLanguage } from '../../context/LanguageContext'
import { useAuth } from '../../context/AuthContext'
import { useTheme } from '../../context/ThemeContext'
import { useAiAssistant } from '@/features/ai-support'
import { useSupport } from '@/features/support'
import { Avatar, Badge } from '@kaamgar/ui'
import {
  X, User, LogOut, Shield, Globe, ShieldAlert,
  Sun, Moon, Bot, Sparkles, ArrowLeft
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
  const { user, isAuthenticated, isWorker, isAdmin, logout } = useAuth()
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

  return (
    <div className="fixed inset-0 z-[9999] md:hidden" role="dialog" aria-modal="true" aria-label="Mobile Navigation Sidebar">
      {/* Fullscreen Backdrop Blur Overlay */}
      <div
        className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs transition-opacity cursor-pointer animate-fade-in"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Slide-In Aside from Left */}
      <aside className="fixed inset-y-0 left-0 w-[85vw] max-w-xs sm:max-w-sm bg-white dark:bg-zinc-950 shadow-2xl border-r border-slate-200 dark:border-zinc-800 flex flex-col z-[10000] animate-slide-right overflow-y-auto pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)]">
        {/* 1. Sidebar Header: Logo & Close X Button */}
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

        {/* 2. User Profile / Guest Card */}
        <div className="p-4 border-b border-slate-100 dark:border-zinc-800/80 bg-slate-50/70 dark:bg-zinc-900/50">
          {isAuthenticated ? (
            <div className="flex items-center gap-3">
              <Avatar name={user?.name} size="md" src={user?.avatar_url || undefined} />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-slate-900 dark:text-zinc-100 truncate">{user?.name}</p>
                <p className="text-xs text-slate-500 dark:text-zinc-400 truncate mt-0.5">{user?.phone || 'Logged In'}</p>
                <div className="mt-1.5 flex items-center gap-1.5">
                  {isAdmin && <Badge variant="danger" size="sm">{t('nav.roleAdmin', 'Admin')}</Badge>}
                  {isWorker && !isAdmin && <Badge variant="success" size="sm">{t('nav.roleWorker', 'Worker')}</Badge>}
                  {!isWorker && !isAdmin && <Badge variant="info" size="sm">{t('nav.roleCustomer', 'Customer')}</Badge>}
                </div>
                {isAdmin && (
                  <button
                    type="button"
                    onClick={() => {
                      onClose()
                      navigate('/admin?tab=admins')
                    }}
                    className="mt-2 w-full flex items-center justify-center gap-2 py-1.5 px-3 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-600 dark:text-amber-400 text-xs font-bold hover:bg-amber-500/25 transition-colors cursor-pointer"
                  >
                    <Shield className="w-3.5 h-3.5" />
                    <span>Manage Administrators</span>
                  </button>
                )}
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
                  onClick={() => { onClose(); navigate('/login') }}
                  className="w-full py-2 text-xs font-bold rounded-xl bg-amber-500 text-slate-950 shadow-xs hover:bg-amber-400 transition-colors cursor-pointer text-center"
                >
                  {t('nav.loginSignup', 'Login / Register')}
                </button>
                <button
                  type="button"
                  onClick={() => { onClose(); navigate('/register/worker') }}
                  className="w-full py-2 text-xs font-bold rounded-xl border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-slate-800 dark:text-zinc-200 hover:bg-slate-50 dark:hover:bg-zinc-700 transition-colors cursor-pointer text-center"
                >
                  {t('nav.becomeWorker', 'Earn as Worker')}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* 3. PROMINENT APP OPTIONS & PREFERENCES */}
        <div className="p-3 border-t border-slate-100 dark:border-zinc-800/80 space-y-2.5">
          <p className="px-1 text-[11px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider">
            {t('nav.preferences', 'Options & Preferences')}
          </p>

          {/* Option 1: Light & Dark Theme Toggle Button */}
          <button
            type="button"
            onClick={toggleTheme}
            className="w-full flex items-center justify-between p-3 rounded-2xl border border-slate-200 dark:border-zinc-800 bg-slate-50/80 dark:bg-zinc-900/60 hover:bg-slate-100 dark:hover:bg-zinc-850 active:scale-[0.98] transition-all cursor-pointer"
            aria-label="Toggle Light and Dark Theme"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-amber-500/15 flex items-center justify-center text-amber-500">
                {isDark ? <Sun className="w-5 h-5 text-amber-400" /> : <Moon className="w-5 h-5 text-slate-700" />}
              </div>
              <div className="text-left">
                <p className="text-sm font-bold text-slate-900 dark:text-zinc-100">
                  {isDark ? 'Light Theme (सफेद थीम)' : 'Dark Theme (नाइट थीम)'}
                </p>
                <p className="text-[11px] text-slate-500 dark:text-zinc-400">
                  {isDark ? 'सफेद मोड पर स्विच करें' : 'नाइट मोड पर स्विच करें'}
                </p>
              </div>
            </div>
            <Badge variant={isDark ? 'primary' : 'default'} size="sm" className="font-bold">
              {isDark ? 'Dark' : 'Light'}
            </Badge>
          </button>

          {/* Option 2: Language Switcher Button (English / Hindi) */}
          <button
            type="button"
            onClick={toggleLanguage}
            className="w-full flex items-center justify-between p-3 rounded-2xl border border-slate-200 dark:border-zinc-800 bg-slate-50/80 dark:bg-zinc-900/60 hover:bg-slate-100 dark:hover:bg-zinc-850 active:scale-[0.98] transition-all cursor-pointer"
            aria-label="Toggle Language"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-blue-500/15 flex items-center justify-center text-blue-500">
                <Globe className="w-5 h-5" />
              </div>
              <div className="text-left">
                <p className="text-sm font-bold text-slate-900 dark:text-zinc-100">
                  {language === 'en' ? 'हिन्दी में बदलें' : 'Switch to English'}
                </p>
                <p className="text-[11px] text-slate-500 dark:text-zinc-400">
                  {language === 'en' ? 'English Language Active' : 'हिंदी भाषा सक्रिय है'}
                </p>
              </div>
            </div>
            <Badge variant="outline" size="sm" className="font-bold text-amber-600 dark:text-amber-400 border-slate-200 dark:border-zinc-700">
              {language === 'en' ? 'EN' : 'हिन्दी'}
            </Badge>
          </button>

          {/* Option 3: Care & Support (Customer / Worker) OR Management (Admin) */}
          <div className="rounded-2xl border border-rose-500/30 bg-gradient-to-br from-rose-500/10 via-rose-500/5 to-transparent p-3 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-rose-500/15 text-rose-600 dark:text-rose-400 flex items-center justify-center font-bold shadow-xs">
                  <ShieldAlert className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-900 dark:text-white">
                    {isAdmin
                      ? (language === 'hi' ? 'प्रबंधन' : 'Management')
                      : (language === 'hi' ? 'केयर एवं सहायता' : 'Care & Support')}
                  </p>
                  <p className="text-[10px] text-slate-600 dark:text-zinc-400">
                    {isAdmin
                      ? (language === 'hi' ? 'शिकायत एवं सुझाव प्रबंधन' : 'Complaints & suggestions oversight')
                      : (language === 'hi' ? 'शिकायत, सुझाव व अनुरोध स्थिति' : 'Complaints, suggestions & requests')}
                  </p>
                </div>
              </div>
            </div>

            <div className="pt-1">
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
                className="w-full flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-xl bg-rose-600 text-white font-bold text-xs shadow-xs hover:bg-rose-500 active:scale-95 transition-all cursor-pointer text-center"
              >
                <ShieldAlert className="w-3.5 h-3.5" />
                <span>
                  {isAdmin
                    ? (language === 'hi' ? 'प्रबंधन खोलें' : 'Open Management')
                    : (language === 'hi' ? 'केयर डेस्क खोलें' : 'Open Care & Support')}
                </span>
              </button>
            </div>
          </div>

          {/* Option 4: AI Support Assistant (Authenticated Non-Admin only) */}
          {isAuthenticated && !isAdmin && (
            <div className="rounded-2xl border border-amber-500/30 bg-gradient-to-br from-amber-500/10 via-amber-500/5 to-transparent p-3 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center font-bold shadow-xs">
                    <Bot className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-900 dark:text-white">
                      {language === 'hi' ? 'AI सहायक' : 'AI Assistant'}
                    </p>
                    <p className="text-[10px] text-slate-600 dark:text-zinc-400">
                      {language === 'hi' ? 'बुकिंग सवाल एवं सलाह' : 'Personalized questions & guidance'}
                    </p>
                  </div>
                </div>
              </div>

              <div className="pt-1">
                <button
                  type="button"
                  onClick={() => {
                    onClose()
                    openAssistant(isWorker ? 'worker_sarathi' : 'customer_booking')
                  }}
                  className="w-full flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-xl bg-amber-500 text-slate-950 font-bold text-xs shadow-xs hover:bg-amber-400 active:scale-95 transition-all cursor-pointer text-center"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>{language === 'hi' ? 'AI से पूछें' : 'Ask AI Assistant'}</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* 4. Prominent Logout / Back to Login Button */}
        <div className="p-4 border-t border-slate-100 dark:border-zinc-800/80 bg-slate-50/70 dark:bg-zinc-900/60 mt-auto">
          {isAuthenticated ? (
            <button
              type="button"
              onClick={() => {
                onClose()
                void logout()
              }}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-2xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 font-bold text-sm border border-rose-500/20 active:scale-[0.98] transition-all cursor-pointer shadow-xs"
            >
              <LogOut className="w-4.5 h-4.5" />
              <span>{t('nav.logout', 'Sign Out')} (लॉग आउट)</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={handleBackToLogin}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-2xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 dark:text-amber-400 font-bold text-sm border border-amber-500/20 active:scale-[0.98] transition-all cursor-pointer shadow-xs"
            >
              <ArrowLeft className="w-4.5 h-4.5" />
              <span>{t('common.backToLogin', 'Back to Login')} (लॉगिन पर जाएं)</span>
            </button>
          )}
        </div>
      </aside>
    </div>
  )
}

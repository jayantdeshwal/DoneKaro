import { NavLink, useNavigate, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useLanguage } from '../../context/LanguageContext'
import { useAuth } from '../../context/AuthContext'
import { useNotifications } from '../../context/NotificationContext'
import { useAiAssistant } from '@/features/ai-support'
import { useTheme } from '../../context/ThemeContext'
import { Button, Badge } from '@kaamgar/ui'
import { Menu, Globe, Sun, Moon, Bot, ArrowLeft } from 'lucide-react'
import AppLogo from '../common/AppLogo'
import { UserMenuDropdown } from './UserMenuDropdown'
import { getNavItems } from './navConfig'

export interface AppHeaderProps {
  onOpenMobileMenu: () => void
}

export function AppHeader({ onOpenMobileMenu }: AppHeaderProps) {
  const { t } = useTranslation()
  const { language, toggleLanguage } = useLanguage()
  const { isDark, toggleTheme } = useTheme()
  const { isAuthenticated, isWorker, isAdmin } = useAuth()
  const { unreadCount } = useNotifications()
  const { openAssistant } = useAiAssistant()
  const location = useLocation()
  const navigate = useNavigate()

  const brandHomePath = isAdmin ? '/admin' : '/'
  const navItems = getNavItems(t, isAuthenticated, isWorker, isAdmin, unreadCount)
  const isActive = (path: string) =>
    location.pathname === path || (path !== '/' && location.pathname.startsWith(path))

  const handleBackToLogin = () => {
    sessionStorage.removeItem('donekaro_guest_mode')
    window.dispatchEvent(new Event('storage'))
    navigate('/login')
  }

  return (
    <header className="sticky top-0 z-40 bg-white/85 dark:bg-zinc-950/90 backdrop-blur-md border-b border-slate-200/80 dark:border-zinc-800/80 transition-colors pt-[env(safe-area-inset-top)]">
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8" aria-label="Main navigation">
        {/* ========================================================= */}
        {/* MOBILE TOP BAR (Visible on screens < 768px: md:hidden)   */}
        {/* Left: 3-lines menu + DoneKaro Brand | Right: AI Support  */}
        {/* ========================================================= */}
        <div className="flex md:hidden h-14 items-center justify-between">
          {/* Left Group: 3-lines button + DoneKaro logo & name placed close together */}
          <div className="flex items-center gap-2 min-w-0">
            <button
              type="button"
              onClick={onOpenMobileMenu}
              className="flex items-center justify-center w-9 h-9 -ml-1 rounded-xl text-slate-700 dark:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-800/80 active:scale-95 transition-all cursor-pointer shrink-0"
              aria-label="Open navigation sidebar"
              title="Menu"
            >
              <Menu className="w-6 h-6" />
            </button>

            <NavLink to={brandHomePath} className="flex items-center gap-2 min-w-0" aria-label={t('app.name')}>
              <AppLogo className="w-8 h-8 rounded-xl shrink-0 shadow-sm" />
              <span className="font-black text-lg tracking-tight text-slate-900 dark:text-white truncate">
                {t('app.name')}
              </span>
            </NavLink>
          </div>

          {/* Top Right: AI Support Button (Authenticated Non-Admin only) */}
          {isAuthenticated && !isAdmin && (
            <button
              type="button"
              onClick={() => openAssistant(isWorker ? 'worker_sarathi' : 'customer_booking')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 font-extrabold text-xs shadow-md shadow-amber-500/25 hover:brightness-105 active:scale-95 transition-all border border-amber-400/40 cursor-pointer shrink-0"
              aria-label="AI Support"
              title="AI Support Assistant"
            >
              <Bot className="w-3.5 h-3.5 text-slate-950 animate-bounce" />
              <span className="tracking-tight">{t('nav.aiSupport', 'AI Support')}</span>
            </button>
          )}
        </div>

        {/* ========================================================= */}
        {/* DESKTOP TOP BAR (Laptop/Desktop: hidden md:flex)          */}
        {/* 100% UNCHANGED: Left logo+nav, Right theme+lang+profile   */}
        {/* ========================================================= */}
        <div className="hidden md:flex h-16 items-center justify-between">
          <div className="flex items-center gap-6">
            <NavLink to={brandHomePath} className="flex items-center gap-2.5" aria-label={t('app.name')}>
              <AppLogo className="w-9 h-9 rounded-xl shadow-sm" />
              <span className="font-black text-xl text-slate-900 dark:text-white">
                {t('app.name')}
              </span>
            </NavLink>

            {/* Navigation Items (Distinct per Role) */}
            <div className="flex items-center gap-1 bg-slate-100/90 dark:bg-zinc-900/80 border border-slate-200/80 dark:border-zinc-800 rounded-2xl p-1">
              {navItems.map(({ path, label, icon: Icon, badge }) => (
                <NavLink
                  key={path}
                  to={path}
                  className={({ isActive: isLinkActive }) =>
                    `flex items-center gap-2 px-3 py-1.5 rounded-xl text-sm font-semibold transition-all ${
                      isLinkActive
                        ? 'bg-white dark:bg-zinc-800 text-amber-600 dark:text-amber-400 shadow-xs border border-slate-200/80 dark:border-zinc-700'
                        : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-100 hover:bg-white/60 dark:hover:bg-zinc-800/60'
                    }`
                  }
                  aria-current={isActive(path) ? 'page' : undefined}
                >
                  <Icon className="w-4 h-4" aria-hidden="true" />
                  <span>{label}</span>
                  {Boolean(badge && badge > 0) && (
                    <Badge variant="danger" size="sm" className="ml-1">
                      {badge}
                    </Badge>
                  )}
                </NavLink>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-2.5">
            {/* Theme Switcher Button */}
            <button
              type="button"
              onClick={toggleTheme}
              className="flex items-center justify-center w-8 h-8 rounded-full border border-slate-200 dark:border-zinc-700 bg-white/80 dark:bg-zinc-800 text-slate-700 dark:text-amber-400 hover:bg-slate-100 dark:hover:bg-zinc-700 hover:scale-105 active:scale-95 transition-all shadow-xs cursor-pointer"
              aria-label={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
              title={isDark ? 'Light Theme (सफेद थीम)' : 'Dark Theme (नाइट थीम)'}
            >
              {isDark ? (
                <Sun className="w-4 h-4 text-amber-400" />
              ) : (
                <Moon className="w-4 h-4 text-slate-700" />
              )}
            </button>

            {/* Language Switcher Button */}
            <button
              onClick={toggleLanguage}
              className="flex items-center gap-1.5 px-2.5 py-1.5 border border-slate-200 dark:border-zinc-700 bg-white/80 dark:bg-zinc-800 rounded-full text-xs font-semibold text-slate-700 dark:text-zinc-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-zinc-700 transition-all shadow-xs cursor-pointer"
              aria-label={language === 'en' ? 'Switch to Hindi' : 'Switch to English'}
              title={language === 'en' ? 'हिन्दी में बदलें' : 'Switch to English'}
            >
              <Globe className="w-3.5 h-3.5 text-amber-500" />
              <span className="font-hindi tracking-wide">{language === 'en' ? 'EN' : 'हि'}</span>
            </button>

            {isAuthenticated ? (
              <UserMenuDropdown />
            ) : (
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleBackToLogin}
                  className="text-xs text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white flex items-center gap-1.5 cursor-pointer"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>{t('common.backToLogin', 'Back to Login')}</span>
                </Button>
                <Button variant="ghost" size="sm" onClick={() => navigate('/login')}>
                  {t('nav.loginSignup', 'Login / Sign Up')}
                </Button>
                <Button variant="primary" size="sm" onClick={() => navigate('/register/worker')}>
                  {t('nav.becomeWorker')}
                </Button>
              </div>
            )}
          </div>
        </div>
      </nav>
    </header>
  )
}

import { useState, useRef, useEffect } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useLanguage } from '../../context/LanguageContext'
import { useAuth } from '../../context/AuthContext'
import { useTheme } from '../../context/ThemeContext'
import { useSupport } from '@/features/support'
import { Avatar, Badge } from '@kaamgar/ui'
import {
  User, LogOut, Shield, Briefcase, ChevronDown,
  Globe, ShieldAlert, Sun, Moon
} from 'lucide-react'

export function UserMenuDropdown() {
  const { t } = useTranslation()
  const { language, toggleLanguage } = useLanguage()
  const { isDark, toggleTheme } = useTheme()
  const { user, isWorker, isAdmin, logout } = useAuth()
  const { openSupport } = useSupport()
  const navigate = useNavigate()

  const [isOpen, setIsOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      document.addEventListener('keydown', handleKeyDown)
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen])

  return (
    <div className="relative" ref={menuRef}>
      <button
        type="button"
        onClick={() => setIsOpen(prev => !prev)}
        className={`flex items-center gap-2.5 py-1 pl-1.5 pr-3 rounded-full border transition-all duration-150 cursor-pointer ${
          isOpen
            ? 'bg-slate-100 dark:bg-zinc-800 border-amber-500/50 shadow-xs'
            : 'bg-white/80 dark:bg-zinc-800/80 border-slate-200 dark:border-zinc-700 hover:border-slate-300 dark:hover:border-zinc-600 hover:bg-slate-50 dark:hover:bg-zinc-750'
        }`}
        aria-expanded={isOpen}
        aria-haspopup="true"
        aria-label="User profile menu"
      >
        <Avatar name={user?.name} size="sm" src={user?.avatar_url || undefined} />
        <div className="hidden sm:flex flex-col text-left leading-tight">
          <span className="text-sm font-bold text-slate-900 dark:text-zinc-100 truncate max-w-[130px]">
            {user?.name}
          </span>
          <span className={`text-[11px] font-medium leading-none ${
            isAdmin ? 'text-rose-500 dark:text-rose-400' : isWorker ? 'text-emerald-600 dark:text-emerald-400' : 'text-blue-600 dark:text-blue-400'
          }`}>
            {isAdmin ? t('nav.roleAdmin', 'Admin') : isWorker ? t('nav.roleWorker', 'Worker') : t('nav.roleCustomer', 'Customer')}
          </span>
        </div>
        <ChevronDown className={`w-4 h-4 text-slate-400 dark:text-zinc-500 transition-transform duration-200 ${
          isOpen ? 'rotate-180 text-amber-500' : ''
        }`} />
      </button>

      {isOpen && (
        <div
          className="absolute right-0 mt-2 w-72 bg-white dark:bg-zinc-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-zinc-800 py-2 z-50 animate-in"
          role="menu"
          aria-orientation="vertical"
        >
          {/* User Info Header */}
          <div className="px-4 py-3 border-b border-slate-100 dark:border-zinc-800">
            <div className="flex items-center gap-3">
              <Avatar name={user?.name} size="md" src={user?.avatar_url || undefined} />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold text-slate-900 dark:text-zinc-100 truncate">{user?.name}</p>
                <p className="text-xs text-slate-500 dark:text-zinc-400 truncate mt-0.5">{user?.phone || 'Logged In'}</p>
                <div className="mt-1.5">
                  {isAdmin && <Badge variant="danger" size="sm">{t('nav.roleAdmin', 'Admin')}</Badge>}
                  {isWorker && !isAdmin && <Badge variant="success" size="sm">{t('nav.roleWorker', 'Worker')}</Badge>}
                  {!isWorker && !isAdmin && <Badge variant="info" size="sm">{t('nav.roleCustomer', 'Customer')}</Badge>}
                </div>
              </div>
            </div>
          </div>

          {/* Primary Options */}
          <div className="py-1">
            {/* Profile Link */}
            <NavLink
              to="/profile"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-slate-700 dark:text-zinc-200 hover:bg-slate-50 dark:hover:bg-zinc-800 hover:text-amber-600 dark:hover:text-amber-400 transition-colors"
              role="menuitem"
            >
              <div className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-zinc-800 flex items-center justify-center text-amber-500">
                <User className="w-4 h-4" />
              </div>
              <div className="flex flex-col text-left">
                <span className="font-semibold">{t('nav.profile')}</span>
                <span className="text-[11px] text-slate-500 dark:text-zinc-400 font-normal">{t('nav.accountPreferences', 'Account & preferences')}</span>
              </div>
            </NavLink>

            {/* Become a Worker - Only for Customer */}
            {!isWorker && !isAdmin && (
              <button
                type="button"
                onClick={() => {
                  setIsOpen(false)
                  navigate('/register/worker')
                }}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/25 transition-colors text-left group cursor-pointer"
                role="menuitem"
              >
                <div className="w-8 h-8 rounded-xl bg-emerald-500/15 flex items-center justify-center text-emerald-600 dark:text-emerald-400 group-hover:bg-emerald-500/25 transition-colors">
                  <Briefcase className="w-4 h-4" />
                </div>
                <div className="flex flex-col text-left flex-1">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold">{t('nav.becomeWorker')}</span>
                    <span className="text-[10px] bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 px-1.5 py-0.5 rounded font-bold uppercase tracking-wider">Earn</span>
                  </div>
                  <span className="text-[11px] text-slate-500 dark:text-zinc-400 font-normal">{t('nav.registerToGetJobs', 'Register to get customer jobs')}</span>
                </div>
              </button>
            )}

            {/* Worker Dashboard Link */}
            {isWorker && (
              <NavLink
                to="/worker/dashboard"
                onClick={() => setIsOpen(false)}
                className="flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-slate-700 dark:text-zinc-200 hover:bg-slate-50 dark:hover:bg-zinc-800 hover:text-amber-600 dark:hover:text-amber-400 transition-colors"
                role="menuitem"
              >
                <div className="w-8 h-8 rounded-xl bg-amber-500/15 flex items-center justify-center text-amber-500">
                  <Briefcase className="w-4 h-4" />
                </div>
                <div className="flex flex-col text-left">
                  <span className="font-semibold">{t('nav.workerDashboard')}</span>
                  <span className="text-[11px] text-slate-500 dark:text-zinc-400 font-normal">{t('nav.manageJobsAvailability', 'Manage jobs & availability')}</span>
                </div>
              </NavLink>
            )}

            {/* Admin Dashboard & Manage Administrators Links */}
            {isAdmin && (
              <>
                <NavLink
                  to="/admin"
                  onClick={() => setIsOpen(false)}
                  className="flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-slate-700 dark:text-zinc-200 hover:bg-slate-50 dark:hover:bg-zinc-800 hover:text-amber-600 dark:hover:text-amber-400 transition-colors"
                  role="menuitem"
                >
                  <div className="w-8 h-8 rounded-xl bg-rose-500/15 flex items-center justify-center text-rose-500">
                    <Shield className="w-4 h-4" />
                  </div>
                  <div className="flex flex-col text-left">
                    <span className="font-semibold">{t('nav.adminDashboard')}</span>
                    <span className="text-[11px] text-slate-500 dark:text-zinc-400 font-normal">{t('nav.platformManagement', 'Platform management')}</span>
                  </div>
                </NavLink>

                <NavLink
                  to="/admin?tab=admins"
                  onClick={() => setIsOpen(false)}
                  className="flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/25 transition-colors"
                  role="menuitem"
                >
                  <div className="w-8 h-8 rounded-xl bg-amber-500/15 flex items-center justify-center text-amber-500">
                    <Shield className="w-4 h-4" />
                  </div>
                  <div className="flex flex-col text-left">
                    <span className="font-semibold">Manage Administrators</span>
                    <span className="text-[11px] text-slate-500 dark:text-zinc-400 font-normal">Team & console privileges</span>
                  </div>
                </NavLink>
              </>
            )}

            {/* Care & Support (Customer / Worker) OR Management (Admin) */}
            <button
              type="button"
              onClick={() => {
                setIsOpen(false)
                if (isAdmin) {
                  navigate('/admin?tab=management')
                } else {
                  openSupport()
                }
              }}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-slate-700 dark:text-zinc-200 hover:bg-slate-50 dark:hover:bg-zinc-800 hover:text-rose-600 dark:hover:text-rose-400 transition-colors text-left cursor-pointer"
              role="menuitem"
            >
              <div className="w-8 h-8 rounded-xl bg-rose-500/15 flex items-center justify-center text-rose-500">
                <ShieldAlert className="w-4 h-4" />
              </div>
              <div className="flex flex-col text-left">
                <span className="font-semibold">
                  {isAdmin
                    ? (language === 'hi' ? 'प्रबंधन' : 'Management')
                    : (language === 'hi' ? 'केयर एवं सहायता' : 'Care & Support')}
                </span>
                <span className="text-[11px] text-slate-500 dark:text-zinc-400 font-normal">
                  {isAdmin
                    ? (language === 'hi' ? 'शिकायत एवं सुझाव प्रबंधन' : 'Complaints & suggestions oversight')
                    : (language === 'hi' ? 'शिकायत, सुझाव व अनुरोध स्थिति' : 'Complaints, suggestions & requests')}
                </span>
              </div>
            </button>
          </div>

          {/* Theme Toggle Section */}
          <div className="pt-1 mt-1 border-t border-slate-100 dark:border-zinc-800">
            <button
              type="button"
              onClick={toggleTheme}
              className="w-full flex items-center justify-between px-4 py-2.5 text-sm font-medium text-slate-700 dark:text-zinc-200 hover:bg-slate-50 dark:hover:bg-zinc-800 transition-colors text-left cursor-pointer"
              role="menuitem"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-amber-500/15 flex items-center justify-center text-amber-500">
                  {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                </div>
                <div className="flex flex-col text-left">
                  <span className="font-semibold text-slate-900 dark:text-zinc-100">{isDark ? 'Light Theme (सफेद)' : 'Dark Theme (नाइट)'}</span>
                  <span className="text-[11px] text-slate-500 dark:text-zinc-400 font-normal">
                    {isDark ? 'Switch to clean white mode' : 'Switch to midnight dark mode'}
                  </span>
                </div>
              </div>
              <Badge variant={isDark ? 'primary' : 'default'} size="sm">
                {isDark ? 'Dark' : 'Light'}
              </Badge>
            </button>
          </div>

          {/* Language Switch Section */}
          <div className="pt-1 mt-1 border-t border-slate-100 dark:border-zinc-800">
            <button
              type="button"
              onClick={toggleLanguage}
              className="w-full flex items-center justify-between px-4 py-2.5 text-sm font-medium text-slate-700 dark:text-zinc-200 hover:bg-slate-50 dark:hover:bg-zinc-800 transition-colors text-left cursor-pointer"
              role="menuitem"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-zinc-800 flex items-center justify-center text-amber-500">
                  <Globe className="w-4 h-4" />
                </div>
                <div className="flex flex-col text-left">
                  <span className="font-semibold text-slate-900 dark:text-zinc-100">{t('common.language', 'Language')}</span>
                  <span className="text-[11px] text-slate-500 dark:text-zinc-400 font-normal">
                    {language === 'en' ? 'Switch to हिन्दी' : 'Switch to English'}
                  </span>
                </div>
              </div>
              <Badge variant="outline" size="sm" className="font-semibold text-amber-600 dark:text-amber-400 border-slate-200 dark:border-zinc-700">
                {language === 'en' ? 'EN' : 'हि'}
              </Badge>
            </button>
          </div>

          {/* Sign Out Section */}
          <div className="pt-1 mt-1 border-t border-slate-100 dark:border-zinc-800">
            <button
              type="button"
              onClick={() => {
                setIsOpen(false)
                void logout()
              }}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/25 transition-colors text-left cursor-pointer"
              role="menuitem"
            >
              <div className="w-8 h-8 rounded-xl bg-rose-500/10 flex items-center justify-center text-rose-500">
                <LogOut className="w-4 h-4" />
              </div>
              <div className="flex flex-col text-left">
                <span className="font-semibold">{t('nav.logout')}</span>
                <span className="text-[11px] text-slate-500 dark:text-zinc-400 font-normal">{t('nav.securelySignOut', 'Securely sign out')}</span>
              </div>
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

import { NavLink, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../../context/AuthContext'
import { useNotifications } from '../../context/NotificationContext'
import { useAiAssistant } from '@/features/ai-support'
import { getBottomTabs } from './navConfig'

export function BottomNavigation() {
  const { t } = useTranslation()
  const { isAuthenticated, isWorker, isAdmin } = useAuth()
  const { unreadCount } = useNotifications()
  const { openAssistant } = useAiAssistant()
  const location = useLocation()

  const bottomTabs = getBottomTabs(
    t,
    isAuthenticated,
    isWorker,
    isAdmin,
    unreadCount,
    () => openAssistant('customer_booking')
  )

  return (
    <nav
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-zinc-950/95 backdrop-blur-xl border-t border-slate-200/80 dark:border-zinc-800 shadow-[0_-4px_20px_rgba(0,0,0,0.08)] transition-colors px-1 py-1 pb-[max(0.35rem,env(safe-area-inset-bottom))]"
      aria-label="Mobile bottom navigation"
    >
      <div className="grid grid-cols-5 items-center justify-around max-w-md mx-auto">
        {bottomTabs.map((tab) => {
          const Icon = tab.icon
          const currentTabParam = new URLSearchParams(location.search).get('tab')
          const targetTabParam = tab.path && tab.path.includes('?') ? new URLSearchParams(tab.path.split('?')[1]).get('tab') : null
          const isTabActive = tab.path
            ? tab.path === '/'
              ? (location.pathname === '/' || location.pathname === '/home') && !location.search
              : targetTabParam
              ? location.pathname === tab.path.split('?')[0] && currentTabParam === targetTabParam
              : location.pathname === tab.path && (!currentTabParam || currentTabParam === 'dashboard' || currentTabParam === 'overview')
            : false

          if (tab.action) {
            return (
              <button
                key={tab.id}
                type="button"
                onClick={tab.action}
                className="flex flex-col items-center justify-center py-1 px-0.5 text-slate-500 dark:text-zinc-400 hover:text-amber-500 active:scale-95 transition-all relative cursor-pointer"
                aria-label={tab.label}
              >
                <div className="relative p-1 rounded-xl transition-all">
                  <Icon className="w-5 h-5 transition-transform" />
                  {Boolean(tab.badge && tab.badge > 0) && (
                    <span className="absolute -top-1 -right-1 flex h-4 min-w-[16px] px-1 items-center justify-center rounded-full bg-rose-500 text-[10px] font-extrabold text-white">
                      {tab.badge}
                    </span>
                  )}
                </div>
                <span className="text-[10px] font-semibold tracking-tight truncate max-w-[64px] mt-0.5">
                  {tab.label}
                </span>
              </button>
            )
          }

          return (
            <NavLink
              key={tab.id}
              to={tab.path || '/'}
              onClick={() => {
                window.scrollTo({ top: 0, behavior: 'smooth' })
              }}
              className={() =>
                `flex flex-col items-center justify-center py-1 px-0.5 transition-all relative ${
                  isTabActive
                    ? 'text-amber-600 dark:text-amber-400 font-bold'
                    : 'text-slate-500 dark:text-zinc-400 hover:text-slate-800 dark:hover:text-zinc-200 font-medium'
                }`
              }
              aria-label={tab.label}
            >
              <div className={`relative p-1 rounded-xl transition-all ${isTabActive ? 'bg-amber-500/15 scale-105' : ''}`}>
                <Icon className={`w-5 h-5 transition-transform ${isTabActive ? 'stroke-[2.5]' : 'stroke-2'}`} />
                {Boolean(tab.badge && tab.badge > 0) && (
                  <span className="absolute -top-1 -right-1 flex h-4 min-w-[16px] px-1 items-center justify-center rounded-full bg-rose-500 text-[10px] font-extrabold text-white">
                    {tab.badge}
                  </span>
                )}
              </div>
              <span className="text-[10px] tracking-tight truncate max-w-[64px] mt-0.5 leading-tight">
                {tab.label}
              </span>
              {isTabActive && (
                <span className="w-1 h-1 rounded-full bg-amber-500 mt-0.5 animate-pulse" />
              )}
            </NavLink>
          )
        })}
      </div>
    </nav>
  )
}

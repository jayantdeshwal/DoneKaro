import { useTranslation } from 'react-i18next'
import { motion } from 'framer-motion'
import {
  LayoutDashboard,
  Users,
  Bell,
  Shield,
  ShieldAlert,
  House,
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import type { AdminTabType, AdminTeamMember } from '../types'

type AdminTabBarItem = {
  key: AdminTabType | 'homepage'
  label: string
  icon: typeof LayoutDashboard
  badge?: number
  badgeVariant?: 'danger' | 'warning'
}

interface AdminTabBarProps {
  activeTab: AdminTabType
  setActiveTab: (tab: AdminTabType) => void
  setSearchParams: (params: { tab: string }) => void
  unreadNotifsCount: number
  adminTeam: AdminTeamMember[]
}

export function AdminTabBar({
  activeTab,
  setActiveTab,
  setSearchParams,
  unreadNotifsCount,
  adminTeam,
}: AdminTabBarProps) {
  const { t } = useTranslation()
  const navigate = useNavigate()

  const tabs: AdminTabBarItem[] = [
    { key: 'dashboard', label: t('admin.dashboard', 'Dashboard'), icon: LayoutDashboard },
    { key: 'customers', label: t('admin.allCustomers', 'Customers'), icon: Users },
    { key: 'homepage', label: 'Homepage', icon: House },
    {
      key: 'notifications',
      label: t('admin.alerts', 'Alerts'),
      icon: Bell,
      badge: unreadNotifsCount > 0 ? unreadNotifsCount : undefined,
      badgeVariant: 'danger',
    },
    {
      key: 'admins',
      label: 'Administrators',
      icon: Shield,
      badge: adminTeam.length > 0 ? adminTeam.length : undefined,
    },
    {
      key: 'management',
      label: 'Management',
      icon: ShieldAlert,
    },
  ]

  return (
    <div
      className={`items-center gap-1.5 p-1.5 bg-white dark:bg-zinc-900 border border-slate-200/90 dark:border-zinc-800 rounded-2xl mb-8 shadow-xs ${
        activeTab !== 'dashboard' && activeTab !== 'overview'
          ? 'hidden md:flex'
          : 'grid grid-cols-2 sm:grid-cols-3 md:flex'
      }`}
    >
      {tabs.map(tab => {
        const isActive =
          (tab.key !== 'homepage' && activeTab === tab.key) ||
          (tab.key === 'dashboard' && (activeTab === 'dashboard' || activeTab === 'overview'))

        return (
          <button
            key={tab.key}
            onClick={() => {
              if (tab.key === 'homepage') {
                navigate('/', { state: { showPublicHome: true } })
                return
              }
              setActiveTab(tab.key)
              setSearchParams({ tab: tab.key })
            }}
            className={`relative flex min-h-[48px] items-center justify-center gap-2 px-2 sm:px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
              isActive
                ? 'text-slate-950 font-bold'
                : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-100 hover:bg-slate-100 dark:hover:bg-zinc-800/50'
            }`}
          >
            {isActive && (
              <motion.div
                layoutId="activeAdminTabHighlight"
                className="absolute inset-0 bg-amber-500 rounded-xl shadow-md"
                transition={{ type: 'spring', stiffness: 350, damping: 30 }}
              />
            )}
            <span className="relative z-10 flex items-center gap-2">
              <tab.icon className="w-4 h-4" />
              <span>{tab.label}</span>
              {tab.badge !== undefined && tab.badge > 0 && (
                <span
                  className={`text-[10px] font-extrabold px-1.5 py-0.5 rounded-full ${
                    isActive
                      ? 'bg-slate-950/20 text-slate-950'
                      : tab.badgeVariant === 'warning'
                      ? 'bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/30'
                      : 'bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-500/30'
                  }`}
                >
                  {tab.badge}
                </span>
              )}
            </span>
          </button>
        )
      })}
    </div>
  )
}

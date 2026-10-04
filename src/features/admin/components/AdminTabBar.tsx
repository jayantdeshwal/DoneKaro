import { useTranslation } from 'react-i18next'
import { motion } from 'framer-motion'
import {
  LayoutDashboard,
  Truck,
  Users,
  Calendar,
  Bell,
  Shield,
  ShieldAlert,
} from 'lucide-react'
import type { AdminTabType, AdminWorkerRow, AdminTeamMember } from '../types'

interface AdminTabBarProps {
  activeTab: AdminTabType
  setActiveTab: (tab: AdminTabType) => void
  setWorkerStatusFilter: (status: 'all' | 'pending' | 'approved' | 'rejected') => void
  setSearchParams: (params: { tab: string }) => void
  pendingWorkers: AdminWorkerRow[]
  unreadNotifsCount: number
  adminTeam: AdminTeamMember[]
}

export function AdminTabBar({
  activeTab,
  setActiveTab,
  setWorkerStatusFilter,
  setSearchParams,
  pendingWorkers,
  unreadNotifsCount,
  adminTeam,
}: AdminTabBarProps) {
  const { t } = useTranslation()

  const tabs = [
    { key: 'dashboard', label: t('admin.dashboard', 'Dashboard'), icon: LayoutDashboard },
    {
      key: 'workers',
      label: t('admin.approvals', 'Approvals'),
      icon: Truck,
      badge: pendingWorkers.length,
      badgeVariant: 'warning',
    },
    { key: 'customers', label: t('admin.allCustomers', 'Customers'), icon: Users },
    { key: 'bookings', label: t('admin.allBookings', 'All Bookings'), icon: Calendar },
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
      className={`items-center gap-1.5 p-1.5 bg-white dark:bg-zinc-900 border border-slate-200/90 dark:border-zinc-800 rounded-2xl mb-8 overflow-x-auto no-scrollbar shadow-xs ${
        activeTab !== 'dashboard' && activeTab !== 'overview' ? 'hidden md:flex' : 'flex'
      }`}
    >
      {tabs.map(tab => {
        const isActive =
          activeTab === tab.key ||
          (tab.key === 'dashboard' && (activeTab === 'dashboard' || activeTab === 'overview'))

        return (
          <button
            key={tab.key}
            onClick={() => {
              if (tab.key === 'workers') {
                setWorkerStatusFilter('all')
              }
              setActiveTab(tab.key as any)
              setSearchParams({ tab: tab.key })
            }}
            className={`relative flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all shrink-0 cursor-pointer ${
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

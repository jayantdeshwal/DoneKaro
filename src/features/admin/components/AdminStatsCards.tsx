import { useTranslation } from 'react-i18next'
import { motion } from 'framer-motion'
import {
  Truck,
  Users,
  Calendar,
  Clock,
  CheckCircle,
  Activity,
  ChevronRight,
} from 'lucide-react'
import type { AdminStats, AdminTabType, AdminWorkerRow } from '../types'

interface AdminStatsCardsProps {
  stats: AdminStats | null
  isLoadingStats: boolean
  pendingWorkers: AdminWorkerRow[]
  activeTab: AdminTabType
  setActiveTab: (tab: AdminTabType) => void
  setWorkerStatusFilter: (status: 'all' | 'pending' | 'approved' | 'rejected') => void
  setSearchParams: (params: { tab: string }) => void
}

export function AdminStatsCards({
  stats,
  isLoadingStats,
  pendingWorkers,
  activeTab,
  setActiveTab,
  setWorkerStatusFilter,
  setSearchParams,
}: AdminStatsCardsProps) {
  const { t } = useTranslation()

  return (
    <div
      className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8 ${
        activeTab !== 'dashboard' && activeTab !== 'overview' ? 'hidden md:grid' : ''
      }`}
    >
      {/* Card 1: Total Workers */}
      <motion.div
        whileHover={{ y: -3, scale: 1.01 }}
        whileTap={{ scale: 0.99 }}
        onClick={() => {
          setWorkerStatusFilter('all')
          setActiveTab('workers')
          setSearchParams({ tab: 'workers' })
        }}
        className={`p-5 rounded-2xl border transition-all cursor-pointer bg-white dark:bg-zinc-900 hover:border-amber-500/50 hover:shadow-xl group relative overflow-hidden ${
          activeTab === 'workers'
            ? 'border-amber-500 ring-1 ring-amber-500/30 shadow-lg'
            : 'border-slate-200/90 dark:border-zinc-800'
        }`}
      >
        <div className="flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500 dark:text-zinc-400 uppercase tracking-wider">
              {t('admin.stats.totalWorkers')}
            </span>
            <p className="text-3xl font-extrabold text-slate-900 dark:text-white mt-1.5 font-mono">
              {isLoadingStats ? '...' : stats?.workers == null ? '—' : stats.workers}
            </p>
          </div>
          <div className="w-12 h-12 bg-amber-500/10 border border-amber-500/20 rounded-2xl flex items-center justify-center text-amber-500 group-hover:scale-110 group-hover:bg-amber-500 group-hover:text-slate-950 transition-all shadow-xs">
            <Truck className="w-6 h-6" />
          </div>
        </div>
        <div className="mt-4 pt-3 border-t border-slate-100 dark:border-zinc-800 flex items-center justify-between text-xs">
          <span className="text-amber-500 dark:text-amber-400 font-medium flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" />
            {pendingWorkers.length} pending review
          </span>
          <span className="text-amber-600 dark:text-amber-400 font-semibold group-hover:translate-x-0.5 transition-transform flex items-center gap-0.5">
            Manage <ChevronRight className="w-3.5 h-3.5" />
          </span>
        </div>
      </motion.div>

      {/* Card 2: Total Customers */}
      <motion.div
        whileHover={{ y: -3, scale: 1.01 }}
        whileTap={{ scale: 0.99 }}
        onClick={() => {
          setActiveTab('customers')
          setSearchParams({ tab: 'customers' })
        }}
        className={`p-5 rounded-2xl border transition-all cursor-pointer bg-white dark:bg-zinc-900 hover:border-emerald-500/50 hover:shadow-xl group relative overflow-hidden ${
          activeTab === 'customers'
            ? 'border-emerald-500 ring-1 ring-emerald-500/30 shadow-lg'
            : 'border-slate-200/90 dark:border-zinc-800'
        }`}
      >
        <div className="flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500 dark:text-zinc-400 uppercase tracking-wider">
              {t('admin.stats.totalCustomers')}
            </span>
            <p className="text-3xl font-extrabold text-slate-900 dark:text-white mt-1.5 font-mono">
              {isLoadingStats ? '...' : stats?.customers == null ? '—' : stats.customers}
            </p>
          </div>
          <div className="w-12 h-12 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl flex items-center justify-center text-emerald-500 group-hover:scale-110 group-hover:bg-emerald-500 group-hover:text-slate-950 transition-all shadow-xs">
            <Users className="w-6 h-6" />
          </div>
        </div>
        <div className="mt-4 pt-3 border-t border-slate-100 dark:border-zinc-800 flex items-center justify-between text-xs">
          <span className="text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1">
            <CheckCircle className="w-3.5 h-3.5" />
            Registered Clients
          </span>
          <span className="text-emerald-600 dark:text-emerald-400 font-semibold group-hover:translate-x-0.5 transition-transform flex items-center gap-0.5">
            View All <ChevronRight className="w-3.5 h-3.5" />
          </span>
        </div>
      </motion.div>

      {/* Card 3: Total Bookings */}
      <motion.div
        whileHover={{ y: -3, scale: 1.01 }}
        whileTap={{ scale: 0.99 }}
        onClick={() => {
          setActiveTab('bookings')
          setSearchParams({ tab: 'bookings' })
        }}
        className={`p-5 rounded-2xl border transition-all cursor-pointer bg-white dark:bg-zinc-900 hover:border-blue-500/50 hover:shadow-xl group relative overflow-hidden ${
          activeTab === 'bookings'
            ? 'border-blue-500 ring-1 ring-blue-500/30 shadow-lg'
            : 'border-slate-200/90 dark:border-zinc-800'
        }`}
      >
        <div className="flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500 dark:text-zinc-400 uppercase tracking-wider">
              {t('admin.stats.totalBookings')}
            </span>
            <p className="text-3xl font-extrabold text-slate-900 dark:text-white mt-1.5 font-mono">
              {isLoadingStats ? '...' : stats?.bookings == null ? '—' : stats.bookings}
            </p>
          </div>
          <div className="w-12 h-12 bg-blue-500/10 border border-blue-500/20 rounded-2xl flex items-center justify-center text-blue-500 group-hover:scale-110 group-hover:bg-blue-500 group-hover:text-slate-950 transition-all shadow-xs">
            <Calendar className="w-6 h-6" />
          </div>
        </div>
        <div className="mt-4 pt-3 border-t border-slate-100 dark:border-zinc-800 flex items-center justify-between text-xs">
          <span className="text-blue-500 dark:text-blue-400 font-medium flex items-center gap-1">
            <Activity className="w-3.5 h-3.5" />
            {isLoadingStats ? '...' : stats?.bookingStatusCounts.completed == null ? '—' : stats.bookingStatusCounts.completed} completed
          </span>
          <span className="text-blue-600 dark:text-blue-400 font-semibold group-hover:translate-x-0.5 transition-transform flex items-center gap-0.5">
            Inspect <ChevronRight className="w-3.5 h-3.5" />
          </span>
        </div>
      </motion.div>

      {/* Card 4: Pending Approvals */}
      <motion.div
        whileHover={{ y: -3, scale: 1.01 }}
        whileTap={{ scale: 0.99 }}
        onClick={() => {
          setActiveTab('workers')
          setWorkerStatusFilter('pending')
          setSearchParams({ tab: 'workers' })
        }}
        className="p-5 rounded-2xl border border-amber-500/30 bg-amber-500/5 dark:bg-amber-500/10 hover:border-amber-500/60 hover:shadow-xl group relative overflow-hidden transition-all cursor-pointer"
      >
        <div className="flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-amber-600 dark:text-amber-300 uppercase tracking-wider">
              {t('admin.stats.pendingApprovals')}
            </span>
            <p className="text-3xl font-extrabold text-amber-600 dark:text-amber-400 mt-1.5 font-mono">
              {isLoadingStats ? '...' : stats?.pendingApprovals == null ? '—' : stats.pendingApprovals}
            </p>
          </div>
          <div className="w-12 h-12 bg-amber-500/15 border border-amber-500/30 rounded-2xl flex items-center justify-center text-amber-500 group-hover:scale-110 group-hover:bg-amber-500 group-hover:text-slate-950 transition-all shadow-xs">
            <Clock className="w-6 h-6" />
          </div>
        </div>
        <div className="mt-4 pt-3 border-t border-amber-500/20 flex items-center justify-between text-xs">
          <span className="text-amber-600 dark:text-amber-400 font-medium">Action required</span>
          <span className="text-amber-600 dark:text-amber-400 font-bold group-hover:translate-x-0.5 transition-transform flex items-center gap-0.5">
            Review Queue <ChevronRight className="w-3.5 h-3.5" />
          </span>
        </div>
      </motion.div>
    </div>
  )
}

import { useNavigate } from 'react-router-dom'
import { Button } from '@kaamgar/ui'
import {
  ShieldCheck,
  Sparkles,
  MapPin,
  RefreshCw,
  ShieldAlert,
  Compass,
  ArrowUpRight,
  AlertCircle,
  CheckCircle,
} from 'lucide-react'
import type { AdminTabType } from '../types'

interface AdminHeaderBannerProps {
  user: { name?: string | null; email?: string | null } | null
  isSuperAdmin?: boolean
  activeTab: AdminTabType
  setActiveTab: (tab: AdminTabType) => void
  setSearchParams: (params: { tab: string }) => void
  refreshAll: () => Promise<void>
  isLoading: boolean
  workerError: string
  setWorkerError: (err: string) => void
  customerError: string
  setCustomerError: (err: string) => void
  bookingError: string
  setBookingError: (err: string) => void
  statsError: string
  setStatsError: (err: string) => void
  deleteSuccessMessage: string
  setDeleteSuccessMessage: (msg: string) => void
}

export function AdminHeaderBanner({
  user,
  isSuperAdmin,
  activeTab,
  setActiveTab,
  setSearchParams,
  refreshAll,
  isLoading,
  workerError,
  setWorkerError,
  customerError,
  setCustomerError,
  bookingError,
  setBookingError,
  statsError,
  setStatsError,
  deleteSuccessMessage,
  setDeleteSuccessMessage,
}: AdminHeaderBannerProps) {
  const navigate = useNavigate()

  return (
    <>
      {/* 1. EXECUTIVE IDENTITY BANNER (Profile-Aligned Glassmorphic Design) */}
      <div
        className={`relative overflow-hidden rounded-3xl bg-white dark:bg-zinc-900 border border-slate-200/90 dark:border-zinc-800 backdrop-blur-xl p-6 sm:p-8 shadow-xl mb-8 ${
          activeTab !== 'dashboard' && activeTab !== 'overview' ? 'hidden md:block' : ''
        }`}
      >
        {/* Ambient Glows */}
        <div className="absolute -right-24 -top-24 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -left-24 -bottom-24 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          {/* Identity & Status */}
          <div className="flex items-start sm:items-center gap-4 sm:gap-5">
            <div className="relative flex-shrink-0">
              <div className="w-16 h-16 sm:w-18 sm:h-18 rounded-2xl bg-gradient-to-br from-amber-500/20 via-amber-500/10 to-slate-100 dark:to-zinc-800 border border-amber-500/30 flex items-center justify-center text-amber-500 shadow-inner">
                <ShieldCheck className="w-8 h-8 sm:w-9 sm:h-9" />
              </div>
              <span className="absolute -bottom-1 -right-1 flex h-4 w-4">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-4 w-4 bg-emerald-500 border-2 border-white dark:border-zinc-900" />
              </span>
            </div>

            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-500/15 border border-amber-500/30 text-amber-600 dark:text-amber-400">
                  <Sparkles className="w-3 h-3 text-amber-500" />
                  {isSuperAdmin ? 'Super Admin Console' : 'Administrator Console'}
                </span>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  Authoritative Session
                </span>
              </div>

              <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight mt-1.5">
                DoneKaro Administration
              </h1>

              <p className="text-xs sm:text-sm text-slate-500 dark:text-zinc-400 mt-0.5 flex items-center gap-2 flex-wrap">
                <span className="font-semibold text-slate-800 dark:text-zinc-200">
                  {user?.name || user?.email || 'Console Master'}
                </span>
                <span className="text-slate-300 dark:text-zinc-600">•</span>
                <span className="text-slate-500 dark:text-zinc-400 flex items-center gap-1">
                  <MapPin className="w-3 h-3 text-amber-500" />
                  Muzaffarnagar HQ (Pincodes 251001 – 251318)
                </span>
              </p>
            </div>
          </div>

          {/* Global Actions */}
          <div className="flex items-center gap-2.5 self-start lg:self-center flex-wrap">
            <Button
              variant="outline"
              size="sm"
              onClick={refreshAll}
              disabled={isLoading}
              className="flex items-center gap-2 text-xs font-semibold px-4 py-2 rounded-xl border-slate-200 dark:border-zinc-700 hover:border-amber-500/50 hover:bg-slate-50 dark:hover:bg-zinc-800 text-slate-700 dark:text-zinc-200 transition-all shadow-xs"
            >
              <RefreshCw
                className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-amber-500' : ''}`}
              />
              Refresh Live Data
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setActiveTab('management')
                setSearchParams({ tab: 'management' })
              }}
              className="flex items-center gap-2 text-xs font-semibold px-4 py-2 rounded-xl border-slate-200 dark:border-zinc-700 hover:border-amber-500/50 hover:bg-slate-50 dark:hover:bg-zinc-800 text-slate-700 dark:text-zinc-200 transition-all shadow-xs"
            >
              <ShieldAlert className="w-3.5 h-3.5 text-rose-500" />
              Management
            </Button>

            <Button
              variant="primary"
              size="sm"
              onClick={() => navigate('/search')}
              className="flex items-center gap-2 text-xs font-bold px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-md shadow-amber-500/20 transition-all"
            >
              <Compass className="w-3.5 h-3.5" />
              Live Public Portal
              <ArrowUpRight className="w-3.5 h-3.5 opacity-70" />
            </Button>
          </div>
        </div>
      </div>

      {/* Global Notifications & Error Banners */}
      {workerError && (
        <div className="mb-6 p-4 rounded-2xl border border-red-500/30 bg-red-500/10 text-red-400 text-sm flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span>{workerError}</span>
          </div>
          <button onClick={() => setWorkerError('')} className="text-xs text-red-400 hover:underline">
            Dismiss
          </button>
        </div>
      )}
      {customerError && (
        <div className="mb-6 p-4 rounded-2xl border border-red-500/30 bg-red-500/10 text-red-400 text-sm flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span>{customerError}</span>
          </div>
          <button onClick={() => setCustomerError('')} className="text-xs text-red-400 hover:underline">
            Dismiss
          </button>
        </div>
      )}
      {bookingError && (
        <div className="mb-6 p-4 rounded-2xl border border-red-500/30 bg-red-500/10 text-red-400 text-sm flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span>{bookingError}</span>
          </div>
          <button onClick={() => setBookingError('')} className="text-xs text-red-400 hover:underline">
            Dismiss
          </button>
        </div>
      )}
      {statsError && (
        <div className="mb-6 p-4 rounded-2xl border border-red-500/30 bg-red-500/10 text-red-400 text-sm flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span>{statsError}</span>
          </div>
          <button onClick={() => setStatsError('')} className="text-xs text-red-400 hover:underline">
            Dismiss
          </button>
        </div>
      )}
      {deleteSuccessMessage && (
        <div className="mb-6 p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl text-emerald-300 text-sm flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-2.5">
            <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0" />
            <span>{deleteSuccessMessage}</span>
          </div>
          <button
            onClick={() => setDeleteSuccessMessage('')}
            className="text-emerald-400 hover:text-emerald-200 text-xs font-semibold px-2 py-1"
          >
            Dismiss
          </button>
        </div>
      )}
    </>
  )
}

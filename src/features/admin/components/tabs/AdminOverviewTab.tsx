import { useTranslation } from 'react-i18next'
import { Card, Badge, Button, Avatar } from '@kaamgar/ui'
import {
  TrendingUp,
  Activity,
  PieChart,
  Clock,
  RefreshCw,
  CheckCircle,
  Eye,
  Check,
  X,
  Truck,
  Calendar,
} from 'lucide-react'
import type {
  AdminTabType,
  AdminBooking,
  AdminWorkerRow,
  BookingTrendsData,
  CategoryDistributionItem,
  LocalityDistributionItem,
} from '../../types'
import { BOOKING_STATUS_OPTIONS, bookingStatusVariant } from '../../constants'

interface AdminOverviewTabProps {
  bookingTrendsData: BookingTrendsData
  hoveredTrendIdx: number | null
  setHoveredTrendIdx: (idx: number | null) => void
  categoryDistribution: CategoryDistributionItem[]
  localityDistribution: LocalityDistributionItem[]
  pendingWorkers: AdminWorkerRow[]
  isLoadingWorkers: boolean
  setInspectWorker: (worker: AdminWorkerRow | null) => void
  handleOpenActionModal: (worker: AdminWorkerRow, type: 'approve' | 'reject') => void
  bookings: AdminBooking[]
  isLoadingBookings: boolean
  setActiveTab: (tab: AdminTabType) => void
  setWorkerStatusFilter: (status: 'all' | 'pending' | 'approved' | 'rejected') => void
  setSearchParams: (params: { tab: string }) => void
}

export function AdminOverviewTab({
  bookingTrendsData,
  hoveredTrendIdx,
  setHoveredTrendIdx,
  categoryDistribution,
  localityDistribution,
  pendingWorkers,
  isLoadingWorkers,
  setInspectWorker,
  handleOpenActionModal,
  bookings,
  isLoadingBookings,
  setActiveTab,
  setWorkerStatusFilter,
  setSearchParams,
}: AdminOverviewTabProps) {
  const { t } = useTranslation()

  return (
    <div className="space-y-8">
      {/* Row 1: Interactive SVG Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Chart 1: 14-Day Demand Trend Area Chart (Col-span 7) */}
        <div className="lg:col-span-7 bg-white dark:bg-zinc-900 border border-slate-200/90 dark:border-zinc-800 rounded-3xl p-6 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6">
            <div>
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-amber-500" />
                <h3 className="font-bold text-base text-slate-900 dark:text-white">
                  14-Day Booking Demand Trends
                </h3>
              </div>
              <p className="text-xs text-semantic-text-secondary mt-0.5">
                Daily customer bookings & service requests across Muzaffarnagar
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold text-brand-400 bg-brand-500/10 px-2.5 py-1 rounded-lg border border-brand-500/20">
                Total: {bookingTrendsData.totalCount} Bookings
              </span>
            </div>
          </div>

          {/* SVG Area Chart Container */}
          <div className="relative w-full h-44 sm:h-52 select-none">
            {bookingTrendsData.totalCount === 0 ? (
              <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 dark:text-zinc-500">
                <Activity className="w-8 h-8 mb-2 opacity-40" />
                <p className="text-sm font-medium">No activity recorded yet</p>
                <p className="text-xs text-slate-400 dark:text-zinc-600 mt-1">Bookings created in the last 14 days will appear here</p>
              </div>
            ) : (
              <>
                <svg
                  viewBox="0 0 520 180"
                  className="w-full h-full overflow-visible"
                  preserveAspectRatio="none"
                >
                  <defs>
                    <linearGradient id="bookingTrendGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#F59E0B" stopOpacity="0.45" />
                      <stop offset="50%" stopColor="#F59E0B" stopOpacity="0.15" />
                      <stop offset="100%" stopColor="#F59E0B" stopOpacity="0.0" />
                    </linearGradient>
                  </defs>

                  {/* Horizontal Grid lines */}
                  {[35, 75, 115, 155].map((yVal, idx) => (
                    <line
                      key={idx}
                      x1="20"
                      y1={yVal}
                      x2="500"
                      y2={yVal}
                      stroke="currentColor"
                      className="text-semantic-border-light"
                      strokeDasharray="4 4"
                      strokeWidth="1"
                    />
                  ))}

                  {/* Generate SVG points */}
                  {(() => {
                    const points = bookingTrendsData.days.map((day, i) => {
                      const x = 30 + (i / 13) * 460
                      const y = 150 - (day.count / bookingTrendsData.maxCount) * 110
                      return { x, y, day }
                    })

                    const pathD = points.reduce((acc, pt, i) => {
                      return i === 0 ? `M ${pt.x},${pt.y}` : `${acc} L ${pt.x},${pt.y}`
                    }, '')

                    const areaD = `${pathD} L ${points[points.length - 1].x},160 L ${points[0].x},160 Z`

                    return (
                      <>
                        {/* Shaded Area Fill */}
                        <path d={areaD} fill="url(#bookingTrendGradient)" />
                        {/* Main Line Stroke */}
                        <path
                          d={pathD}
                          fill="none"
                          stroke="#F59E0B"
                          strokeWidth="3.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                        {/* Data Points */}
                        {points.map((pt, i) => {
                          const isHovered = hoveredTrendIdx === i
                          return (
                            <g key={i} className="cursor-pointer">
                              <circle
                                cx={pt.x}
                                cy={pt.y}
                                r={isHovered ? 6 : 3.5}
                                className="fill-amber-400 stroke-white dark:stroke-zinc-900 transition-all duration-150"
                                strokeWidth={isHovered ? 2.5 : 2}
                              />
                              {/* Invisible hover target */}
                              <circle
                                cx={pt.x}
                                cy={pt.y}
                                r={16}
                                fill="transparent"
                                onMouseEnter={() => setHoveredTrendIdx(i)}
                                onMouseLeave={() => setHoveredTrendIdx(null)}
                              />
                            </g>
                          )
                        })}
                      </>
                    )
                  })()}
                </svg>

                {/* Floating Tooltip */}
                {hoveredTrendIdx !== null && bookingTrendsData.days[hoveredTrendIdx] && (
                  <div
                    className="absolute pointer-events-none bg-slate-900/95 text-white dark:bg-zinc-800 border border-slate-700/80 rounded-xl px-2.5 py-1.5 shadow-xl text-xs z-10 -translate-x-1/2 -top-1 transition-all duration-100"
                    style={{
                      left: `${(30 + (hoveredTrendIdx / 13) * 460) / 5.2}%`,
                    }}
                  >
                    <span className="font-bold text-amber-400 block font-mono">
                      {bookingTrendsData.days[hoveredTrendIdx].count} Bookings
                    </span>
                    <span className="text-[10px] text-gray-400">
                      {bookingTrendsData.days[hoveredTrendIdx].label}
                    </span>
                  </div>
                )}

                {/* Date labels row */}
                <div className="flex justify-between text-[10px] text-semantic-text-tertiary mt-2 px-3 font-mono">
                  <span>{bookingTrendsData.days[0]?.label}</span>
                  <span>{bookingTrendsData.days[4]?.label}</span>
                  <span>{bookingTrendsData.days[9]?.label}</span>
                  <span>{bookingTrendsData.days[13]?.label}</span>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Chart 2: Category Breakdown & Locality Density (Col-span 5) */}
        <div className="lg:col-span-5 bg-white dark:bg-zinc-900 border border-slate-200/90 dark:border-zinc-800 rounded-3xl p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <PieChart className="w-4 h-4 text-emerald-500" />
                <h3 className="font-bold text-base text-slate-900 dark:text-white">
                  Top Demand Categories
                </h3>
              </div>
              <span className="text-xs text-slate-500 dark:text-zinc-400">Live Breakdown</span>
            </div>

            {/* Category Pills & Progress Bars */}
            <div className="space-y-3">
              {categoryDistribution.length === 0 ? (
                <div className="py-6 text-center text-slate-400 dark:text-zinc-500">
                  <p className="text-xs font-medium">No activity recorded yet</p>
                </div>
              ) : (
                categoryDistribution.map(cat => (
                  <div key={cat.category} className="space-y-1">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-semibold text-semantic-text-primary capitalize flex items-center gap-1.5">
                        <span
                          className="w-2.5 h-2.5 rounded-full"
                          style={{ backgroundColor: cat.color }}
                        />
                        {cat.category}
                      </span>
                      <span className="text-semantic-text-secondary font-mono">
                        {cat.count} jobs ({cat.pct}%)
                      </span>
                    </div>
                    <div className="h-2 w-full bg-surface-200 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${cat.pct}%`,
                          backgroundColor: cat.color,
                        }}
                      />
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Locality Pincode Coverage summary */}
          <div className="mt-6 pt-4 border-t border-semantic-border-light">
            <span className="text-xs font-semibold text-semantic-text-secondary uppercase tracking-wider block mb-2">
              Top Locality Density (Muzaffarnagar)
            </span>
            <div className="grid grid-cols-2 gap-2">
              {localityDistribution.length === 0 ? (
                <div className="col-span-2 py-4 text-center text-slate-400 dark:text-zinc-500">
                  <p className="text-xs font-medium">No activity recorded yet</p>
                </div>
              ) : (
                localityDistribution.slice(0, 4).map(loc => (
                  <div
                    key={loc.locality}
                    className="p-2 rounded-xl bg-surface-200/60 border border-semantic-border-light/60 text-xs flex justify-between items-center"
                  >
                    <span className="text-semantic-text-primary truncate font-medium">
                      {loc.locality}
                    </span>
                    <span className="text-brand-400 font-mono font-bold shrink-0 ml-1">
                      {loc.count}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Row 2: Live Operational Queues */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Pending Worker Approvals Card */}
        <Card className="p-6 bg-white dark:bg-zinc-900 border border-slate-200/90 dark:border-zinc-800 rounded-3xl shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
                <Clock className="w-4 h-4 text-amber-500" />
                Pending Worker Approvals
              </h3>
              <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
                Verify government ID and approve skilled partners
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setActiveTab('workers')
                setWorkerStatusFilter('pending')
                setSearchParams({ tab: 'workers' })
              }}
              className="text-xs font-semibold text-amber-600 dark:text-amber-400 border-amber-500/30 hover:bg-amber-500/10"
            >
              View All ({pendingWorkers.length})
            </Button>
          </div>

          <div className="space-y-3">
            {isLoadingWorkers ? (
              <div className="py-8 text-center text-sm text-slate-500 dark:text-zinc-400 flex items-center justify-center gap-2">
                <RefreshCw className="w-4 h-4 animate-spin text-amber-500" />
                Loading pending registrations...
              </div>
            ) : pendingWorkers.length === 0 ? (
              <div className="py-8 text-center bg-slate-50 dark:bg-zinc-800/40 rounded-2xl border border-slate-200/90 dark:border-zinc-700/60">
                <CheckCircle className="w-8 h-8 text-emerald-500 mx-auto mb-2 opacity-80" />
                <p className="text-sm font-semibold text-slate-900 dark:text-white">All caught up!</p>
                <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
                  No pending worker registrations in the queue.
                </p>
              </div>
            ) : (
              pendingWorkers.slice(0, 5).map(worker => (
                <div
                  key={worker.id}
                  className="flex items-center justify-between p-3.5 bg-slate-50 dark:bg-zinc-800/60 border border-slate-200/90 dark:border-zinc-700 rounded-2xl hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <Avatar name={worker.name} src={worker.avatar_url || undefined} size="sm" />
                    <div className="min-w-0">
                      <p className="font-semibold text-sm text-slate-900 dark:text-white truncate">
                        {worker.name}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-zinc-400 truncate">
                        {worker.categories.join(', ') || 'General Artisan'} • {worker.experience_years} yrs exp
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0 ml-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setInspectWorker(worker)}
                      title="View Worker Dossier"
                      className="p-2 text-slate-500 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white"
                    >
                      <Eye className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => handleOpenActionModal(worker, 'approve')}
                      title="Quick Approve"
                      className="bg-emerald-600 hover:bg-emerald-500 text-white p-2"
                    >
                      <Check className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={() => handleOpenActionModal(worker, 'reject')}
                      title="Quick Reject"
                      className="p-2"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>

        {/* Recent Bookings Queue Card */}
        <Card className="p-6 bg-white dark:bg-zinc-900 border border-slate-200/90 dark:border-zinc-800 rounded-3xl shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
                <Truck className="w-4 h-4 text-blue-500" />
                Live Bookings Dispatch
              </h3>
              <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
                Real-time customer booking requests across town
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setActiveTab('bookings')
                setSearchParams({ tab: 'bookings' })
              }}
              className="text-xs font-semibold text-blue-600 dark:text-blue-400 border-blue-500/30 hover:bg-blue-500/10"
            >
              View All ({bookings.length})
            </Button>
          </div>

          <div className="space-y-3">
            {isLoadingBookings ? (
              <div className="py-8 text-center text-sm text-slate-500 dark:text-zinc-400 flex items-center justify-center gap-2">
                <RefreshCw className="w-4 h-4 animate-spin text-blue-500" />
                Loading bookings...
              </div>
            ) : bookings.length === 0 ? (
              <div className="py-8 text-center bg-slate-50 dark:bg-zinc-800/40 rounded-2xl border border-slate-200/90 dark:border-zinc-700/60">
                <Calendar className="w-8 h-8 text-blue-500 mx-auto mb-2 opacity-80" />
                <p className="text-sm font-semibold text-slate-900 dark:text-white">No bookings registered yet</p>
              </div>
            ) : (
              bookings.slice(0, 5).map(booking => (
                <div
                  key={booking.id}
                  className="flex items-center justify-between p-3.5 bg-slate-50 dark:bg-zinc-800/60 border border-slate-200/90 dark:border-zinc-700 rounded-2xl hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 bg-blue-500/10 rounded-xl flex items-center justify-center text-blue-500 shrink-0">
                      <Truck className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-sm text-slate-900 dark:text-white truncate">
                        {booking.customerName} → {booking.workerName}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-zinc-400 truncate">
                        <span className="capitalize">{booking.category_id}</span> •{' '}
                        {booking.scheduled_at
                          ? new Date(booking.scheduled_at).toLocaleDateString('en-IN')
                          : 'Immediate Dispatch'}
                      </p>
                    </div>
                  </div>

                  <Badge
                    variant={bookingStatusVariant(booking.status)}
                    className="shrink-0 ml-2 capitalize"
                  >
                    {t(
                      BOOKING_STATUS_OPTIONS.find(status => status.key === booking.status)?.labelKey ?? '',
                      BOOKING_STATUS_OPTIONS.find(status => status.key === booking.status)?.fallback ?? booking.status,
                    )}
                  </Badge>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>
    </div>
  )
}

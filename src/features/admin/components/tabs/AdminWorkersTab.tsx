import { useTranslation } from 'react-i18next'
import { Card, Badge, Button, Avatar } from '@kaamgar/ui'
import {
  Truck,
  RefreshCw,
  Search,
  Star,
  Eye,
  Check,
  X,
  Trash2,
} from 'lucide-react'
import type { AdminWorkerRow, ProfileToDelete } from '../../types'
import { displayMetric } from '../../constants'

interface AdminWorkersTabProps {
  allWorkers: AdminWorkerRow[]
  filteredWorkers: AdminWorkerRow[]
  pendingWorkers: AdminWorkerRow[]
  isLoadingWorkers: boolean
  workerStatusFilter: 'all' | 'pending' | 'approved' | 'rejected'
  setWorkerStatusFilter: (status: 'all' | 'pending' | 'approved' | 'rejected') => void
  workerSearch: string
  setWorkerSearch: (val: string) => void
  loadWorkersData: () => Promise<void>
  setInspectWorker: (worker: AdminWorkerRow | null) => void
  handleOpenActionModal: (worker: AdminWorkerRow, type: 'approve' | 'reject') => void
  setProfileToDelete: (profile: ProfileToDelete | null) => void
}

export function AdminWorkersTab({
  allWorkers,
  filteredWorkers,
  pendingWorkers,
  isLoadingWorkers,
  workerStatusFilter,
  setWorkerStatusFilter,
  workerSearch,
  setWorkerSearch,
  loadWorkersData,
  setInspectWorker,
  handleOpenActionModal,
  setProfileToDelete,
}: AdminWorkersTabProps) {
  const { t } = useTranslation()

  return (
    <div className="space-y-4">
      {/* Dedicated Mobile Approvals Header */}
      <div className="md:hidden p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200/90 dark:border-zinc-800 shadow-sm flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-500">
              <Truck className="w-4 h-4" />
            </div>
            <h2 className="text-base font-black text-slate-900 dark:text-white">
              {t('admin.approvals', 'Worker Approvals')}
            </h2>
            {pendingWorkers.length > 0 && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-500 text-slate-950">
                {pendingWorkers.length} Pending
              </span>
            )}
          </div>
          <p className="text-[11px] text-slate-500 dark:text-zinc-400 mt-1">
            Verify documents and approve KYC for Muzaffarnagar workers
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={loadWorkersData}
          disabled={isLoadingWorkers}
          className="p-2 rounded-xl border border-slate-200 dark:border-zinc-700"
        >
          <RefreshCw className={`w-4 h-4 ${isLoadingWorkers ? 'animate-spin text-amber-500' : ''}`} />
        </Button>
      </div>

      <Card className="p-0 overflow-hidden bg-white dark:bg-zinc-900 border border-slate-200/90 dark:border-zinc-800 shadow-sm">
        {/* Controls Bar */}
        <div className="p-4 border-b border-slate-200/90 dark:border-zinc-800 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-50/80 dark:bg-zinc-850/60">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold text-slate-500 dark:text-zinc-400 uppercase">Filter:</span>
            {(['all', 'pending', 'approved', 'rejected'] as const).map(status => (
              <button
                key={status}
                onClick={() => setWorkerStatusFilter(status)}
                className={`px-3 py-1 text-xs font-medium rounded-full capitalize transition-colors ${
                  workerStatusFilter === status
                    ? 'bg-amber-500 text-slate-950 font-bold shadow-xs'
                    : 'bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-100'
                }`}
              >
                {status} (
                {status === 'all'
                  ? allWorkers.length
                  : allWorkers.filter(w => w.approval_status === status).length}
                )
              </button>
            ))}
          </div>

          <div className="relative min-w-[240px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-zinc-500" />
            <input
              type="text"
              placeholder="Search worker by name or phone..."
              value={workerSearch}
              onChange={e => setWorkerSearch(e.target.value)}
              className="w-full bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-slate-900 dark:text-white rounded-xl pl-9 pr-3 py-1.5 text-xs placeholder:text-slate-400 dark:placeholder:text-zinc-500 focus:outline-none focus:border-amber-500"
            />
          </div>
        </div>

        {/* Workers Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-100/90 dark:bg-zinc-800/90 border-b border-slate-200/90 dark:border-zinc-800">
              <tr>
                <th className="px-6 py-3.5 text-left text-xs font-semibold text-slate-600 dark:text-zinc-400 uppercase tracking-wider">
                  Worker
                </th>
                <th className="px-6 py-3.5 text-left text-xs font-semibold text-slate-600 dark:text-zinc-400 uppercase tracking-wider">
                  Category
                </th>
                <th className="px-6 py-3.5 text-left text-xs font-semibold text-slate-600 dark:text-zinc-400 uppercase tracking-wider">
                  Experience
                </th>
                <th className="px-6 py-3.5 text-left text-xs font-semibold text-semantic-text-secondary uppercase tracking-wider">
                  Rating
                </th>
                <th className="px-6 py-3.5 text-left text-xs font-semibold text-semantic-text-secondary uppercase tracking-wider">
                  Jobs
                </th>
                <th className="px-6 py-3.5 text-left text-xs font-semibold text-semantic-text-secondary uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3.5 text-left text-xs font-semibold text-semantic-text-secondary uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-semantic-border-light">
              {isLoadingWorkers ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-semantic-text-secondary">
                    Loading workers directory...
                  </td>
                </tr>
              ) : filteredWorkers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-slate-500 dark:text-zinc-400">
                    <p className="text-sm font-semibold text-slate-900 dark:text-white mb-1">
                      No workers found matching the "{workerStatusFilter}" filter.
                    </p>
                    <p className="text-xs text-slate-500 dark:text-zinc-400 mb-4">
                      {allWorkers.length} total worker(s) registered on the platform.
                    </p>
                    {workerStatusFilter !== 'all' && (
                      <button
                        type="button"
                        onClick={() => {
                          setWorkerStatusFilter('all')
                          setWorkerSearch('')
                        }}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500 text-slate-950 text-xs font-bold hover:bg-amber-400 transition-colors shadow-xs cursor-pointer"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                        Show All Workers ({allWorkers.length})
                      </button>
                    )}
                  </td>
                </tr>
              ) : (
                filteredWorkers.map(worker => (
                  <tr
                    key={worker.id}
                    className={`hover:bg-surface-200/40 transition-colors ${
                      worker.approval_status === 'pending' ? 'bg-amber-500/5' : ''
                    }`}
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <Avatar name={worker.name} src={worker.avatar_url || undefined} size="sm" />
                        <div>
                          <p className="font-medium text-semantic-text-primary">{worker.name}</p>
                          <p className="text-xs text-semantic-text-secondary">{worker.phone}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-semantic-text-primary capitalize">
                      {worker.categories.join(', ') || 'None'}
                    </td>
                    <td className="px-6 py-4 text-sm text-semantic-text-primary">
                      {worker.experience_years} yrs
                    </td>
                    <td className="px-6 py-4">
                      {worker.rating > 0 ? (
                        <div className="flex items-center gap-1 text-sm text-amber-400">
                          <Star className="w-3.5 h-3.5 fill-amber-400" />
                          <span>{worker.rating.toFixed(1)}</span>
                          <span className="text-xs text-semantic-text-tertiary">
                            ({worker.review_count})
                          </span>
                        </div>
                      ) : (
                        <span className="text-xs text-semantic-text-tertiary">New</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-semantic-text-primary">
                      {displayMetric(worker.completed_jobs)}
                    </td>
                    <td className="px-6 py-4">
                      <Badge
                        variant={
                          worker.approval_status === 'approved'
                            ? 'success'
                            : worker.approval_status === 'pending'
                            ? 'warning'
                            : 'danger'
                        }
                      >
                        {worker.approval_status}
                      </Badge>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setInspectWorker(worker)}
                          title="View dossier"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </Button>
                        {worker.approval_status === 'pending' && (
                          <>
                            <Button
                              variant="primary"
                              size="sm"
                              onClick={() => handleOpenActionModal(worker, 'approve')}
                              title="Approve"
                            >
                              <Check className="w-3.5 h-3.5" />
                            </Button>
                            <Button
                              variant="danger"
                              size="sm"
                              onClick={() => handleOpenActionModal(worker, 'reject')}
                              title="Reject"
                            >
                              <X className="w-3.5 h-3.5" />
                            </Button>
                          </>
                        )}
                        {worker.approval_status === 'rejected' && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleOpenActionModal(worker, 'approve')}
                            className="text-xs text-emerald-400 border-emerald-500/30"
                          >
                            Re-approve
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            setProfileToDelete({
                              id: worker.id,
                              name: worker.name,
                              phone: worker.phone,
                              role: 'worker',
                              statsHint: `${displayMetric(worker.completed_jobs)} completed jobs, ${displayMetric(worker.total_bookings)} total bookings`,
                            })
                          }
                          title="Permanently Delete Worker"
                          className="text-rose-400 hover:text-rose-300 hover:bg-rose-500/10"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}

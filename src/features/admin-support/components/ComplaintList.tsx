import React, { useState, useMemo } from 'react'
import { Search, AlertCircle, Calendar, User } from 'lucide-react'
import { AdminComplaint, AdminComplaintFilter } from '../types'
import { SupportStatusBadge } from './SupportStatusBadge'

interface ComplaintListProps {
  complaints: AdminComplaint[]
  onSelect: (complaint: AdminComplaint) => void
  currentFilter: AdminComplaintFilter
  onFilterChange: (filter: AdminComplaintFilter) => void
}

export const ComplaintList: React.FC<ComplaintListProps> = ({
  complaints,
  onSelect,
  currentFilter,
  onFilterChange,
}) => {
  const [searchTerm, setSearchTerm] = useState('')

  const filtered = useMemo(() => {
    return complaints.filter(c => {
      if (!searchTerm.trim()) return true
      const term = searchTerm.toLowerCase()
      const refToken = `cmp-${c.id.slice(0, 8)}`.toLowerCase()
      const bookingToken = `dk-${c.booking_id.slice(0, 8)}`.toLowerCase()
      const opener = (c.opened_by_user?.full_name || '').toLowerCase()
      const against = (c.against_user_profile?.full_name || '').toLowerCase()
      const reason = c.reason.toLowerCase()

      return (
        refToken.includes(term) ||
        bookingToken.includes(term) ||
        opener.includes(term) ||
        against.includes(term) ||
        reason.includes(term)
      )
    })
  }, [complaints, searchTerm])

  const counts = useMemo(() => {
    return {
      all: complaints.length,
      open: complaints.filter(c => c.status === 'open').length,
      investigating: complaints.filter(c => c.status === 'investigating').length,
      resolved: complaints.filter(c => c.status === 'resolved').length,
      dismissed: complaints.filter(c => c.status === 'dismissed').length,
    }
  }, [complaints])

  return (
    <div className="space-y-3">
      {/* Filter Chips */}
      <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1 text-xs">
        {(
          [
            { key: 'all', label: 'All', count: counts.all },
            { key: 'open', label: 'Open', count: counts.open, highlight: 'amber' },
            { key: 'investigating', label: 'Investigating', count: counts.investigating, highlight: 'blue' },
            { key: 'resolved', label: 'Resolved', count: counts.resolved, highlight: 'emerald' },
            { key: 'dismissed', label: 'Dismissed', count: counts.dismissed, highlight: 'slate' },
          ] as const
        ).map(f => {
          const isActive = currentFilter === f.key
          return (
            <button
              key={f.key}
              onClick={() => onFilterChange(f.key)}
              className={`flex min-h-[48px] items-center gap-1.5 px-3 py-3 rounded-xl font-semibold transition-all shrink-0 cursor-pointer ${
                isActive
                  ? 'bg-amber-500 text-slate-950 font-bold shadow-xs'
                  : 'bg-white dark:bg-zinc-800 text-slate-600 dark:text-zinc-400 border border-slate-200 dark:border-zinc-700 hover:bg-slate-50 dark:hover:bg-zinc-750'
              }`}
            >
              <span>{f.label}</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                  isActive
                    ? 'bg-slate-950/20 text-slate-950'
                    : 'bg-slate-100 dark:bg-zinc-700 text-slate-700 dark:text-zinc-300'
                }`}
              >
                {f.count}
              </span>
            </button>
          )
        })}
      </div>

      {/* Search Input */}
      <div className="relative">
        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          placeholder="Search by CMP/JUG ID, user name, or keyword..."
          className="min-h-[48px] w-full text-sm pl-9 pr-3 py-3 rounded-xl bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 focus:outline-none focus:ring-2 focus:ring-amber-500 text-slate-900 dark:text-white placeholder-slate-400"
        />
      </div>

      {/* Complaint Items List */}
      <div className="space-y-2">
        {filtered.length === 0 ? (
          <div className="py-12 text-center text-slate-400 space-y-2">
            <AlertCircle className="w-8 h-8 mx-auto text-slate-300 dark:text-zinc-600" />
            <p className="text-xs font-medium">No complaints match current filters.</p>
          </div>
        ) : (
          filtered.map(c => (
            <article
              key={c.id}
              className="rounded-2xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4 space-y-3"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-mono text-xs font-bold text-rose-600 dark:text-rose-400">
                    #CMP-{c.id.slice(0, 8).toUpperCase()}
                  </p>
                  <p className="mt-1 text-sm font-semibold text-slate-900 dark:text-white truncate">
                    {c.opened_by_user?.full_name || 'Complainant'}
                    <span className="ml-1 font-normal text-slate-500 dark:text-zinc-400">
                      ({c.opened_by_user?.role || 'user'})
                    </span>
                  </p>
                </div>
                <SupportStatusBadge status={c.status} />
              </div>
              <div className="flex items-center justify-between gap-2 text-xs text-slate-500 dark:text-zinc-400">
                <span className="inline-flex items-center gap-1.5">
                  <User className="h-3.5 w-3.5" />
                  Complaint
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5" />
                  {new Date(c.created_at).toLocaleDateString('en-IN', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  })}
                </span>
              </div>
              <button
                type="button"
                onClick={() => onSelect(c)}
                className="min-h-[48px] w-full rounded-xl border border-slate-300 px-4 py-3 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-800"
              >
                View Full Details
              </button>
            </article>
          ))
        )}
      </div>
    </div>
  )
}

export default ComplaintList

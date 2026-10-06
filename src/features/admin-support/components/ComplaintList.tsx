import React, { useState, useMemo } from 'react'
import { Search, AlertCircle, Calendar, User, Briefcase, ChevronRight } from 'lucide-react'
import { AdminComplaint, AdminComplaintFilter } from '../types'
import { SupportStatusBadge } from './SupportStatusBadge'

interface ComplaintListProps {
  complaints: AdminComplaint[]
  selectedId: string | null
  onSelect: (complaint: AdminComplaint) => void
  currentFilter: AdminComplaintFilter
  onFilterChange: (filter: AdminComplaintFilter) => void
}

export const ComplaintList: React.FC<ComplaintListProps> = ({
  complaints,
  selectedId,
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
    <div className="flex flex-col h-full space-y-3">
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
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-semibold transition-all shrink-0 cursor-pointer ${
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
          className="w-full text-xs pl-9 pr-3 py-2 rounded-xl bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 focus:outline-none focus:ring-2 focus:ring-amber-500 text-slate-900 dark:text-white placeholder-slate-400"
        />
      </div>

      {/* Complaint Items List */}
      <div className="flex-1 overflow-y-auto space-y-2 pr-1 min-h-[300px]">
        {filtered.length === 0 ? (
          <div className="py-12 text-center text-slate-400 space-y-2">
            <AlertCircle className="w-8 h-8 mx-auto text-slate-300 dark:text-zinc-600" />
            <p className="text-xs font-medium">No complaints match current filters.</p>
          </div>
        ) : (
          filtered.map(c => {
            const isSelected = selectedId === c.id
            const openerName = c.opened_by_user?.full_name || 'Complainant'
            const againstName = c.against_user_profile?.full_name || 'Respondent'

            return (
              <div
                key={c.id}
                onClick={() => onSelect(c)}
                className={`p-3.5 rounded-2xl border transition-all cursor-pointer space-y-2 text-xs ${
                  isSelected
                    ? 'bg-amber-500/10 border-amber-500 dark:border-amber-500/80 shadow-sm'
                    : 'bg-white dark:bg-zinc-900 border-slate-200/90 dark:border-zinc-800 hover:border-slate-300 dark:hover:border-zinc-700'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/40 px-2 py-0.5 rounded text-[11px]">
                      #CMP-{c.id.slice(0, 8).toUpperCase()}
                    </span>
                    <span className="font-mono text-[11px] text-slate-500 dark:text-zinc-400">
                      #DK-{c.booking_id.slice(0, 8).toUpperCase()}
                    </span>
                  </div>
                  <SupportStatusBadge status={c.status} />
                </div>

                <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-600 dark:text-zinc-400">
                  <div className="flex items-center gap-1.5 truncate">
                    <User className="w-3 h-3 text-amber-500 shrink-0" />
                    <span className="font-medium text-slate-800 dark:text-zinc-200 truncate">
                      By: {openerName}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 truncate">
                    <Briefcase className="w-3 h-3 text-blue-500 shrink-0" />
                    <span className="truncate">Vs: {againstName}</span>
                  </div>
                </div>

                <p className="text-slate-700 dark:text-zinc-300 line-clamp-2 text-xs leading-relaxed">
                  {c.reason}
                </p>

                <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1 border-t border-slate-100 dark:border-zinc-800/80">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {new Date(c.created_at).toLocaleDateString('en-IN', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </span>
                  <div className="flex items-center gap-0.5 text-amber-600 dark:text-amber-400 font-semibold">
                    <span>Inspect</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </div>
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}

export default ComplaintList

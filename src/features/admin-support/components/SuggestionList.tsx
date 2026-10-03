import React, { useState, useMemo } from 'react'
import { Search, AlertCircle, Calendar, User, ChevronRight, Sparkles } from 'lucide-react'
import { AdminSuggestion, AdminSuggestionFilter, SuggestionCategory } from '../types'
import { SupportStatusBadge } from './SupportStatusBadge'

interface SuggestionListProps {
  suggestions: AdminSuggestion[]
  selectedId: string | null
  onSelect: (suggestion: AdminSuggestion) => void
  currentFilter: AdminSuggestionFilter
  onFilterChange: (filter: AdminSuggestionFilter) => void
}

function getCategoryDisplay(category: SuggestionCategory): { label: string; color: string } {
  switch (category) {
    case 'app_experience':
      return { label: 'App Experience', color: 'bg-purple-50 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300 border-purple-200 dark:border-purple-800/40' }
    case 'new_feature':
      return { label: 'New Feature / Trade', color: 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800/40' }
    case 'service_coverage':
      return { label: 'Service Area', color: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/40' }
    case 'other':
      return { label: 'General Feedback', color: 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 border-amber-200 dark:border-amber-800/40' }
  }
}

export const SuggestionList: React.FC<SuggestionListProps> = ({
  suggestions,
  selectedId,
  onSelect,
  currentFilter,
  onFilterChange,
}) => {
  const [searchTerm, setSearchTerm] = useState('')

  const filtered = useMemo(() => {
    return suggestions.filter(s => {
      if (!searchTerm.trim()) return true
      const term = searchTerm.toLowerCase()
      const refToken = `sug-${s.id.slice(0, 8)}`.toLowerCase()
      const submitter = (s.submitter?.full_name || '').toLowerCase()
      const message = s.message.toLowerCase()
      const category = s.category.toLowerCase()

      return (
        refToken.includes(term) ||
        submitter.includes(term) ||
        message.includes(term) ||
        category.includes(term)
      )
    })
  }, [suggestions, searchTerm])

  const counts = useMemo(() => {
    return {
      all: suggestions.length,
      open: suggestions.filter(s => s.status === 'open').length,
      in_review: suggestions.filter(s => s.status === 'in_review').length,
      resolved: suggestions.filter(s => s.status === 'resolved').length,
      dismissed: suggestions.filter(s => s.status === 'dismissed').length,
    }
  }, [suggestions])

  return (
    <div className="flex flex-col h-full space-y-3">
      {/* Filter Chips */}
      <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1 text-xs">
        {(
          [
            { key: 'all', label: 'All', count: counts.all },
            { key: 'open', label: 'Open', count: counts.open },
            { key: 'in_review', label: 'In Review', count: counts.in_review },
            { key: 'resolved', label: 'Resolved', count: counts.resolved },
            { key: 'dismissed', label: 'Dismissed', count: counts.dismissed },
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
          placeholder="Search suggestions by SUG ID, submitter, keyword..."
          className="w-full text-xs pl-9 pr-3 py-2 rounded-xl bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 focus:outline-none focus:ring-2 focus:ring-amber-500 text-slate-900 dark:text-white placeholder-slate-400"
        />
      </div>

      {/* Items List */}
      <div className="flex-1 overflow-y-auto space-y-2 pr-1 min-h-[300px]">
        {filtered.length === 0 ? (
          <div className="py-12 text-center text-slate-400 space-y-2">
            <Sparkles className="w-8 h-8 mx-auto text-slate-300 dark:text-zinc-600" />
            <p className="text-xs font-medium">No suggestions match current filters.</p>
          </div>
        ) : (
          filtered.map(s => {
            const isSelected = selectedId === s.id
            const submitterName = s.submitter?.full_name || 'Platform User'
            const catDisplay = getCategoryDisplay(s.category)

            return (
              <div
                key={s.id}
                onClick={() => onSelect(s)}
                className={`p-3.5 rounded-2xl border transition-all cursor-pointer space-y-2 text-xs ${
                  isSelected
                    ? 'bg-amber-500/10 border-amber-500 dark:border-amber-500/80 shadow-sm'
                    : 'bg-white dark:bg-zinc-900 border-slate-200/90 dark:border-zinc-800 hover:border-slate-300 dark:hover:border-zinc-700'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/40 px-2 py-0.5 rounded text-[11px]">
                      #SUG-{s.id.slice(0, 8).toUpperCase()}
                    </span>
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${catDisplay.color}`}>
                      {catDisplay.label}
                    </span>
                  </div>
                  <SupportStatusBadge status={s.status} />
                </div>

                <div className="flex items-center gap-1.5 text-[11px] text-slate-600 dark:text-zinc-400">
                  <User className="w-3 h-3 text-amber-500 shrink-0" />
                  <span className="font-medium text-slate-800 dark:text-zinc-200">
                    From: {submitterName} ({s.submitter?.role || 'user'})
                  </span>
                </div>

                <p className="text-slate-700 dark:text-zinc-300 line-clamp-2 text-xs leading-relaxed">
                  {s.message}
                </p>

                <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1 border-t border-slate-100 dark:border-zinc-800/80">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {new Date(s.created_at).toLocaleDateString('en-IN', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </span>
                  <div className="flex items-center gap-0.5 text-amber-600 dark:text-amber-400 font-semibold">
                    <span>Review</span>
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

export default SuggestionList

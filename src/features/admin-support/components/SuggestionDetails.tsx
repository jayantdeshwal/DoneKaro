import React, { useState, useEffect } from 'react'
import {
  X,
  User,
  Phone,
  Calendar,
  CheckCircle2,
  AlertCircle,
  FileText,
  Save,
  Loader2,
  Shield,
  Sparkles,
  MessageSquare,
} from 'lucide-react'
import { AdminSuggestion, AdminSupportHistoryEntry, SuggestionStatus, SuggestionCategory } from '../types'
import { fetchAdminUserSupportHistory, updateSuggestionStatus } from '../services/adminSupportService'
import { SupportStatusBadge } from './SupportStatusBadge'

interface SuggestionDetailsProps {
  suggestion: AdminSuggestion | null
  onClose: () => void
  onUpdated: () => void
}

function getCategoryLabel(category: SuggestionCategory): string {
  switch (category) {
    case 'app_experience':
      return 'App Experience'
    case 'new_feature':
      return 'New Feature / Trade Expansion'
    case 'service_coverage':
      return 'Service Area / Coverage'
    case 'other':
      return 'General Feedback'
  }
}

export const SuggestionDetails: React.FC<SuggestionDetailsProps> = ({
  suggestion,
  onClose,
  onUpdated,
}) => {
  const [selectedStatus, setSelectedStatus] = useState<SuggestionStatus>('open')
  const [resolutionNote, setResolutionNote] = useState('')
  const [saving, setSaving] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)
  const [history, setHistory] = useState<AdminSupportHistoryEntry[]>([])
  const [historyLoading, setHistoryLoading] = useState(false)
  const [historyError, setHistoryError] = useState<string | null>(null)

  useEffect(() => {
    if (suggestion) {
      setSelectedStatus(suggestion.status)
      setResolutionNote(suggestion.resolution_note || '')
      setErrorMsg(null)
      setSuccessMsg(null)
      setHistory([])
      setHistoryError(null)
      setHistoryLoading(true)
      fetchAdminUserSupportHistory(suggestion.submitted_by)
        .then(userHistory => setHistory(userHistory.filter(item => item.id !== suggestion.id)))
        .catch(err => {
          setHistoryError(err instanceof Error ? err.message : 'Unable to load user support history.')
        })
        .finally(() => setHistoryLoading(false))
    }
  }, [suggestion])

  if (!suggestion) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-8 bg-white dark:bg-zinc-900 rounded-3xl border border-slate-200/90 dark:border-zinc-800 text-center text-slate-400 space-y-3">
        <Sparkles className="w-12 h-12 text-slate-300 dark:text-zinc-700" />
        <div>
          <p className="text-sm font-semibold text-slate-700 dark:text-zinc-300">
            No Suggestion Selected
          </p>
          <p className="text-xs text-slate-400 mt-1 max-w-xs">
            Select a feedback or suggestion entry to inspect ideas and record administrative actions.
          </p>
        </div>
      </div>
    )
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setErrorMsg(null)
    setSuccessMsg(null)

    try {
      const res = await updateSuggestionStatus({
        id: suggestion.id,
        status: selectedStatus,
        resolutionNote,
      })

      if (res.success) {
        setSuccessMsg('Suggestion status and notes updated successfully.')
        onUpdated()
        setTimeout(() => setSuccessMsg(null), 3500)
      } else {
        setErrorMsg(res.error || 'Failed to update suggestion.')
      }
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'An unexpected error occurred.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`Suggestion SUG-${suggestion.id.slice(0, 8)}`}
      className="fixed inset-0 z-[100] overflow-y-auto bg-white p-5 text-slate-900 dark:bg-zinc-950 dark:text-zinc-100 sm:p-8"
    >
      <div className="mx-auto max-w-4xl space-y-6 pb-8">
      {/* Header */}
      <div className="flex items-start justify-between gap-3 pb-4 border-b border-slate-200 dark:border-zinc-800">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="font-mono font-bold text-base text-amber-600 dark:text-amber-400">
              #SUG-{suggestion.id.slice(0, 8).toUpperCase()}
            </h3>
            <SupportStatusBadge status={suggestion.status} />
          </div>
          <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
            Submitted on{' '}
            {new Date(suggestion.created_at).toLocaleString('en-IN', {
              day: 'numeric',
              month: 'short',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            })}
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close suggestion details"
          className="flex min-h-[48px] min-w-[48px] items-center justify-center rounded-xl hover:bg-slate-100 dark:hover:bg-zinc-800 text-slate-500 hover:text-slate-700 dark:text-zinc-400 dark:hover:text-zinc-200 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Submitter & Category Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-zinc-800/50 border border-slate-200/80 dark:border-zinc-750 space-y-2">
          <span className="font-semibold text-slate-700 dark:text-zinc-300 block">
            Suggestion Category
          </span>
          <span className="font-bold text-slate-900 dark:text-white text-sm">
            {getCategoryLabel(suggestion.category)}
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-zinc-800/50 border border-slate-200/80 dark:border-zinc-750 space-y-1.5 text-[11px]">
          <span className="font-semibold text-slate-700 dark:text-zinc-300 block">
            Submitted By
          </span>
          <div className="flex items-center justify-between">
            <span className="text-slate-500">Name:</span>
            <span className="font-medium text-slate-900 dark:text-white flex items-center gap-1">
              <User className="w-3 h-3 text-amber-500" />
              {suggestion.submitter?.full_name || 'Platform User'} (
              {suggestion.submitter?.role || 'user'})
            </span>
          </div>
          {suggestion.submitter?.phone && (
            <div className="flex items-center justify-between text-slate-500">
              <span>Phone:</span>
              <span className="font-mono">{suggestion.submitter.phone}</span>
            </div>
          )}
        </div>
      </div>

      {/* Suggestion Complete Content */}
      <div className="space-y-1.5">
        <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300">
          Complete User Suggestion / Feedback
        </label>
        <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-zinc-800/70 border border-slate-200 dark:border-zinc-700 text-xs text-slate-900 dark:text-zinc-100 leading-relaxed whitespace-pre-wrap">
          {suggestion.message}
        </div>
      </div>

      <section className="space-y-3">
        <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <MessageSquare className="h-4 w-4 text-amber-500" />
          Submitter Support History
        </h4>
        {historyLoading ? (
          <p className="text-sm text-slate-500 dark:text-zinc-400">Loading user history...</p>
        ) : historyError ? (
          <p role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700 dark:border-rose-900 dark:bg-rose-950/30 dark:text-rose-300">
            {historyError}
          </p>
        ) : history.length > 0 ? (
          <ul className="divide-y divide-slate-200 rounded-xl border border-slate-200 dark:divide-zinc-800 dark:border-zinc-800">
            {history.map(item => (
              <li key={`${item.type}-${item.id}`} className="flex items-center justify-between gap-3 p-3 text-sm">
                <span className="min-w-0 truncate text-slate-700 dark:text-zinc-300">
                  {item.type === 'complaint' ? 'Complaint' : 'Suggestion'} · {item.id.slice(0, 8).toUpperCase()}
                </span>
                <span className="shrink-0 text-xs capitalize text-slate-500 dark:text-zinc-400">
                  {item.status} · {new Date(item.created_at).toLocaleDateString('en-IN')}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="rounded-xl bg-slate-50 p-3 text-sm text-slate-500 dark:bg-zinc-900 dark:text-zinc-400">
            No other support history found.
          </p>
        )}
      </section>

      {/* Admin Action & Status Form */}
      <form onSubmit={handleSave} className="space-y-4 pt-4 border-t border-slate-200 dark:border-zinc-800">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
            <Shield className="w-4 h-4 text-amber-500" />
            Administrative Response & Status
          </h4>
          {suggestion.resolved_at && (
            <span className="text-[10px] text-slate-400">
              Resolved: {new Date(suggestion.resolved_at).toLocaleDateString('en-IN')}
            </span>
          )}
        </div>

        {errorMsg && (
          <div className="p-3 rounded-xl bg-gray-900 border border-red-800 text-red-300 text-xs flex items-center gap-2 shadow-md">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div className="space-y-1">
            <label className="block text-[11px] font-semibold text-slate-700 dark:text-zinc-300">
              Review Status
            </label>
            <select
              value={selectedStatus}
              onChange={e => setSelectedStatus(e.target.value as SuggestionStatus)}
              className="min-h-[48px] w-full py-3 px-3 rounded-xl bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
            >
              <option value="open">Open (New suggestion)</option>
              <option value="in_review">In Review (Under operations review)</option>
              <option value="resolved">Resolved (Implemented or planned)</option>
              <option value="dismissed">Dismissed (Not applicable or duplicate)</option>
            </select>
          </div>
        </div>

        <div className="space-y-1">
          <label className="block text-[11px] font-semibold text-slate-700 dark:text-zinc-300">
            Internal Note / Feedback Response (Visible to user under "My Requests")
          </label>
          <textarea
            value={resolutionNote}
            onChange={e => setResolutionNote(e.target.value)}
            placeholder="Record team decision or public feedback response..."
            rows={4}
            className="w-full text-sm rounded-xl p-3 bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 focus:outline-none focus:ring-2 focus:ring-amber-500 text-slate-900 dark:text-white placeholder-slate-400 resize-y"
          />
        </div>

        <div className="sticky bottom-0 -mx-5 border-t border-slate-200 bg-white/95 p-4 backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/95 sm:-mx-8">
          <button
            type="submit"
            disabled={saving}
            className="flex min-h-[48px] w-full items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-bold bg-amber-500 text-slate-950 dark:bg-amber-400 dark:text-slate-950 hover:bg-amber-600 dark:hover:bg-amber-500 disabled:opacity-50 transition-all shadow-xs cursor-pointer"
          >
            {saving ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Saving...</span>
              </>
            ) : (
              <>
                <Save className="w-3.5 h-3.5" />
                <span>Save Response</span>
              </>
            )}
          </button>
        </div>
      </form>
      </div>
    </div>
  )
}

export default SuggestionDetails

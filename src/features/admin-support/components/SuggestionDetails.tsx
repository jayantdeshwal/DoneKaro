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
} from 'lucide-react'
import { AdminSuggestion, SuggestionStatus, SuggestionCategory } from '../types'
import { updateSuggestionStatus } from '../services/adminSupportService'
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

  useEffect(() => {
    if (suggestion) {
      setSelectedStatus(suggestion.status)
      setResolutionNote(suggestion.resolution_note || '')
      setErrorMsg(null)
      setSuccessMsg(null)
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
    <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-slate-200/90 dark:border-zinc-800 p-5 sm:p-6 space-y-6 overflow-y-auto">
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
          onClick={onClose}
          className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-zinc-800 text-slate-400 hover:text-slate-600 dark:hover:text-zinc-200 transition-colors"
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

      {/* Admin Action & Status Form */}
      <form onSubmit={handleSave} className="space-y-4 pt-2 border-t border-slate-200 dark:border-zinc-800">
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
              className="w-full py-2 px-3 rounded-xl bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
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
            className="w-full text-xs rounded-xl p-3 bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 focus:outline-none focus:ring-2 focus:ring-amber-500 text-slate-900 dark:text-white placeholder-slate-400 resize-none"
          />
        </div>

        <div className="flex justify-end gap-2.5 pt-1">
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-xs font-semibold text-slate-950 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 transition-all shadow-xs cursor-pointer"
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
  )
}

export default SuggestionDetails

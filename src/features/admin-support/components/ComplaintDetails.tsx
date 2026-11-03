import React, { useState, useEffect } from 'react'
import {
  X,
  User,
  Phone,
  Briefcase,
  Calendar,
  Clock,
  CheckCircle2,
  AlertCircle,
  FileText,
  Save,
  Loader2,
  Shield,
  MessageSquare,
  Image as ImageIcon,
} from 'lucide-react'
import { AdminComplaint, AdminComplaintAttachment, AdminSupportHistoryEntry, ComplaintStatus } from '../types'
import {
  fetchAdminComplaintAttachments,
  fetchAdminUserSupportHistory,
  updateComplaintStatus,
} from '../services/adminSupportService'
import { SupportStatusBadge } from './SupportStatusBadge'

interface ComplaintDetailsProps {
  complaint: AdminComplaint | null
  onClose: () => void
  onUpdated: () => void
}

export const ComplaintDetails: React.FC<ComplaintDetailsProps> = ({
  complaint,
  onClose,
  onUpdated,
}) => {
  const [selectedStatus, setSelectedStatus] = useState<ComplaintStatus>('open')
  const [resolutionNote, setResolutionNote] = useState('')
  const [saving, setSaving] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)
  const [history, setHistory] = useState<AdminSupportHistoryEntry[]>([])
  const [attachments, setAttachments] = useState<AdminComplaintAttachment[]>([])
  const [historyLoading, setHistoryLoading] = useState(false)
  const [historyError, setHistoryError] = useState<string | null>(null)

  useEffect(() => {
    if (complaint) {
      setSelectedStatus(complaint.status)
      setResolutionNote(complaint.resolution_note || '')
      setErrorMsg(null)
      setSuccessMsg(null)
      setHistory([])
      setAttachments([])
      setHistoryError(null)
      setHistoryLoading(true)
      Promise.all([
        fetchAdminUserSupportHistory(complaint.opened_by),
        fetchAdminComplaintAttachments(complaint.booking_id),
      ])
        .then(([userHistory, complaintAttachments]) => {
          setHistory(userHistory.filter(item => item.id !== complaint.id))
          setAttachments(complaintAttachments)
        })
        .catch(err => {
          setHistoryError(err instanceof Error ? err.message : 'Unable to load user history or attachments.')
        })
        .finally(() => setHistoryLoading(false))
    }
  }, [complaint])

  if (!complaint) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-8 bg-white dark:bg-zinc-900 rounded-3xl border border-slate-200/90 dark:border-zinc-800 text-center text-slate-400 space-y-3">
        <FileText className="w-12 h-12 text-slate-300 dark:text-zinc-700" />
        <div>
          <p className="text-sm font-semibold text-slate-700 dark:text-zinc-300">
            No Complaint Selected
          </p>
          <p className="text-xs text-slate-400 mt-1 max-w-xs">
            Select a complaint from the list to review details and record administrative resolution notes.
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
      const res = await updateComplaintStatus({
        id: complaint.id,
        status: selectedStatus,
        resolutionNote,
      })

      if (res.success) {
        setSuccessMsg('Complaint status and resolution notes updated successfully.')
        onUpdated()
        setTimeout(() => setSuccessMsg(null), 3500)
      } else {
        setErrorMsg(res.error || 'Failed to update complaint.')
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
      aria-label={`Complaint CMP-${complaint.id.slice(0, 8)}`}
      className="fixed inset-0 z-[100] overflow-y-auto bg-white p-5 text-slate-900 dark:bg-zinc-950 dark:text-zinc-100 sm:p-8"
    >
      <div className="mx-auto max-w-4xl space-y-6 pb-8">
      {/* Header */}
      <div className="flex items-start justify-between gap-3 pb-4 border-b border-slate-200 dark:border-zinc-800">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="font-mono font-bold text-base text-rose-600 dark:text-rose-400">
              #CMP-{complaint.id.slice(0, 8).toUpperCase()}
            </h3>
            <SupportStatusBadge status={complaint.status} />
          </div>
          <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
            Registered on{' '}
            {new Date(complaint.created_at).toLocaleString('en-IN', {
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
          aria-label="Close complaint details"
          className="flex min-h-[48px] min-w-[48px] items-center justify-center rounded-xl hover:bg-slate-100 dark:hover:bg-zinc-800 text-slate-500 hover:text-slate-700 dark:text-zinc-400 dark:hover:text-zinc-200 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Booking Reference & Participant Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
        {/* Associated Booking Info (Read-Only) */}
        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-zinc-800/50 border border-slate-200/80 dark:border-zinc-750 space-y-2">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-slate-700 dark:text-zinc-300">
              Booking Reference
            </span>
            <span className="font-mono font-bold text-slate-900 dark:text-white">
              #DK-{complaint.booking_id.slice(0, 8).toUpperCase()}
            </span>
          </div>
          {complaint.booking && (
            <div className="space-y-1 text-slate-600 dark:text-zinc-400 text-[11px]">
              <div className="flex justify-between">
                <span>Category:</span>
                <span className="font-medium text-slate-800 dark:text-zinc-200">
                  {complaint.booking.category_id}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Booking Status:</span>
                <span className="uppercase font-semibold text-slate-700 dark:text-zinc-300">
                  {complaint.booking.status}
                </span>
              </div>
              {complaint.booking.scheduled_at && (
                <div className="flex justify-between">
                  <span>Scheduled For:</span>
                  <span>{new Date(complaint.booking.scheduled_at).toLocaleDateString('en-IN')}</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Participants Info */}
        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-zinc-800/50 border border-slate-200/80 dark:border-zinc-750 space-y-2">
          <span className="font-semibold text-slate-700 dark:text-zinc-300 block">
            Participants
          </span>
          <div className="space-y-1.5 text-[11px]">
            <div className="flex items-center justify-between">
              <span className="text-slate-500">Complainant:</span>
              <span className="font-medium text-slate-900 dark:text-white flex items-center gap-1">
                <User className="w-3 h-3 text-amber-500" />
                {complaint.opened_by_user?.full_name || 'User'} (
                {complaint.opened_by_user?.role || 'customer'})
              </span>
            </div>
            {complaint.opened_by_user?.phone && (
              <div className="flex items-center justify-between text-slate-500">
                <span>Phone:</span>
                <span className="font-mono">{complaint.opened_by_user.phone}</span>
              </div>
            )}
            <div className="flex items-center justify-between pt-1 border-t border-slate-200 dark:border-zinc-700">
              <span className="text-slate-500">Respondent:</span>
              <span className="font-medium text-slate-900 dark:text-white flex items-center gap-1">
                <Briefcase className="w-3 h-3 text-blue-500" />
                {complaint.against_user_profile?.full_name || 'Worker'} (
                {complaint.against_user_profile?.role || 'worker'})
              </span>
            </div>
            {complaint.against_user_profile?.phone && (
              <div className="flex items-center justify-between text-slate-500">
                <span>Phone:</span>
                <span className="font-mono">{complaint.against_user_profile.phone}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Complaint Statement */}
      <div className="space-y-1.5">
        <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300">
          Complainant Statement & Reason
        </label>
        <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-zinc-800/70 border border-slate-200 dark:border-zinc-700 text-xs text-slate-900 dark:text-zinc-100 leading-relaxed whitespace-pre-wrap">
          {complaint.reason}
        </div>
      </div>

      <section className="space-y-3">
        <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <ImageIcon className="h-4 w-4 text-amber-500" />
          Attached Images
        </h4>
        {historyLoading ? (
          <p className="text-sm text-slate-500 dark:text-zinc-400">Loading complaint evidence and user history...</p>
        ) : attachments.length > 0 ? (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {attachments.map(attachment => attachment.signed_url ? (
              <a
                key={attachment.id}
                href={attachment.signed_url}
                target="_blank"
                rel="noreferrer"
                className="block overflow-hidden rounded-xl border border-slate-200 dark:border-zinc-700"
              >
                <img
                  src={attachment.signed_url}
                  alt="Complaint evidence"
                  className="aspect-square w-full object-cover"
                />
              </a>
            ) : (
              <div key={attachment.id} className="flex aspect-square items-center justify-center rounded-xl border border-slate-200 dark:border-zinc-700 text-xs text-slate-500 dark:text-zinc-400">
                Image preview unavailable
              </div>
            ))}
          </div>
        ) : (
          <p className="rounded-xl bg-slate-50 p-3 text-sm text-slate-500 dark:bg-zinc-900 dark:text-zinc-400">
            No images were attached to this booking request.
          </p>
        )}
      </section>

      <section className="space-y-3">
        <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <MessageSquare className="h-4 w-4 text-amber-500" />
          Complainant Support History
        </h4>
        {historyError && (
          <p role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700 dark:border-rose-900 dark:bg-rose-950/30 dark:text-rose-300">
            {historyError}
          </p>
        )}
        {!historyLoading && !historyError && (history.length > 0 ? (
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
        ))}
      </section>

      {/* Admin Action & Resolution Form */}
      <form onSubmit={handleSave} className="space-y-4 pt-4 border-t border-slate-200 dark:border-zinc-800">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
            <Shield className="w-4 h-4 text-amber-500" />
            Administrative Resolution & Status
          </h4>
          {complaint.resolved_at && (
            <span className="text-[10px] text-slate-400">
              Resolved: {new Date(complaint.resolved_at).toLocaleDateString('en-IN')}
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
              Investigation Status
            </label>
            <select
              value={selectedStatus}
              onChange={e => setSelectedStatus(e.target.value as ComplaintStatus)}
              className="min-h-[48px] w-full py-3 px-3 rounded-xl bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
            >
              <option value="open">Open (Awaiting review)</option>
              <option value="investigating">Investigating (In progress)</option>
              <option value="resolved">Resolved (Fair resolution reached)</option>
              <option value="dismissed">Dismissed (Invalid or duplicate)</option>
            </select>
          </div>
        </div>

        <div className="space-y-1">
          <label className="block text-[11px] font-semibold text-slate-700 dark:text-zinc-300">
            Resolution Notes (Visible to complainant under "My Requests")
          </label>
          <textarea
            value={resolutionNote}
            onChange={e => setResolutionNote(e.target.value)}
            placeholder="Document administrative findings, actions taken, or reasons for closure..."
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
                <span>Save Resolution</span>
              </>
            )}
          </button>
        </div>
      </form>
      </div>
    </div>
  )
}

export default ComplaintDetails

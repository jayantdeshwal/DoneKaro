/**
 * Support History Modal
 * Displays authoritative history of complaints opened by the authenticated user.
 * Strictly reflects database fields from public.complaints and public.complaint_status.
 */

import React, { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import {
  FileText,
  X,
  Loader2,
  Clock,
  CheckCircle,
  HelpCircle,
  Ban,
  MessageSquare,
} from 'lucide-react'
import { fetchUserComplaints } from '../services/supportService'
import { ComplaintItem, ComplaintStatus } from '../types'

export interface SupportHistoryModalProps {
  isOpen: boolean
  onClose: () => void
}

export const SupportHistoryModal: React.FC<SupportHistoryModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { i18n } = useTranslation()
  const isHindi = i18n.language === 'hi'

  const [complaints, setComplaints] = useState<ComplaintItem[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (isOpen) {
      setLoading(true)
      setError(null)
      fetchUserComplaints()
        .then(list => setComplaints(list))
        .catch(() => {
          setError(
            isHindi
              ? 'शिकायत इतिहास लोड करने में असमर्थ।'
              : 'Unable to load support complaint history.'
          )
        })
        .finally(() => setLoading(false))
    }
  }, [isOpen, isHindi])

  if (!isOpen) return null

  const getStatusBadge = (status: ComplaintStatus) => {
    switch (status) {
      case 'open':
        return (
          <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400 border border-amber-200 dark:border-amber-500/30">
            <Clock className="w-3 h-3" />
            {isHindi ? 'खुली है (Open)' : 'OPEN'}
          </span>
        )
      case 'investigating':
        return (
          <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 dark:bg-blue-500/15 dark:text-blue-400 border border-blue-200 dark:border-blue-500/30">
            <HelpCircle className="w-3 h-3" />
            {isHindi ? 'जाँच जारी' : 'INVESTIGATING'}
          </span>
        )
      case 'resolved':
        return (
          <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/30">
            <CheckCircle className="w-3 h-3" />
            {isHindi ? 'समाधान पूर्ण' : 'RESOLVED'}
          </span>
        )
      case 'dismissed':
        return (
          <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 dark:bg-zinc-800 dark:text-zinc-400 border border-slate-200 dark:border-zinc-700">
            <Ban className="w-3 h-3" />
            {isHindi ? 'खारिज' : 'DISMISSED'}
          </span>
        )
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/75 backdrop-blur-sm animate-fade-in"
      onClick={e => {
        if (e.target === e.currentTarget) onClose()
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="support-history-title"
    >
      <div className="w-full sm:max-w-xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-t-3xl sm:rounded-3xl shadow-2xl flex flex-col overflow-hidden text-slate-900 dark:text-zinc-100 max-h-[92vh]">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-100 dark:border-zinc-800 flex items-center justify-between bg-slate-50/70 dark:bg-zinc-800/40">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center border border-amber-500/20">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h3 id="support-history-title" className="text-base font-bold text-slate-900 dark:text-white">
                {isHindi ? 'सहायता एवं शिकायत इतिहास' : 'Support & Complaint History'}
              </h3>
              <p className="text-xs text-slate-500 dark:text-zinc-400">
                {isHindi ? 'आपके खाते से दर्ज आधिकारिक अनुरोध' : 'Official requests submitted from your account'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-200 dark:hover:text-white dark:hover:bg-zinc-700 transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 overflow-y-auto space-y-4">
          {loading ? (
            <div className="py-16 flex flex-col items-center justify-center gap-3 text-slate-400">
              <Loader2 className="w-7 h-7 animate-spin text-amber-500" />
              <p className="text-xs">{isHindi ? 'इतिहास लोड हो रहा है...' : 'Loading history...'}</p>
            </div>
          ) : error ? (
            <div className="py-12 text-center text-rose-500 text-xs">{error}</div>
          ) : complaints.length === 0 ? (
            <div className="py-14 text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-zinc-800 text-slate-400 dark:text-zinc-500 flex items-center justify-center mx-auto">
                <FileText className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-800 dark:text-zinc-200">
                  {isHindi ? 'कोई शिकायत दर्ज नहीं है' : 'No Support Requests Found'}
                </p>
                <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1 max-w-xs mx-auto">
                  {isHindi
                    ? 'आपके खाते में कोई सक्रिय या पुरानी शिकायत नहीं है। आपकी सेवा इतिहास सुचारू है।'
                    : 'You do not have any past or active complaints on record.'}
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {complaints.map(item => (
                <div
                  key={item.id}
                  className="p-4 rounded-2xl bg-slate-50 dark:bg-zinc-800/60 border border-slate-200/80 dark:border-zinc-700/70 space-y-2.5 text-xs transition-colors hover:border-slate-300 dark:hover:border-zinc-600"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono font-bold text-slate-900 dark:text-white bg-slate-200/80 dark:bg-zinc-700 px-2 py-0.5 rounded text-[11px]">
                      #CMP-{item.id.slice(0, 8).toUpperCase()}
                    </span>
                    {getStatusBadge(item.status)}
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-zinc-400">
                    <span>
                      {isHindi ? 'बुकिंग ID' : 'Booking'}:{' '}
                      <span className="font-mono text-slate-700 dark:text-zinc-300 font-medium">
                        #DK-{item.booking_id.slice(0, 8).toUpperCase()}
                      </span>
                    </span>
                    <span>
                      {new Date(item.created_at).toLocaleDateString(isHindi ? 'hi-IN' : 'en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </span>
                  </div>

                  <p className="text-slate-800 dark:text-zinc-200 leading-relaxed bg-white dark:bg-zinc-900/60 p-2.5 rounded-xl border border-slate-200/50 dark:border-zinc-700/50">
                    {item.reason}
                  </p>

                  {item.resolution_note && (
                    <div className="p-2.5 rounded-xl bg-emerald-50/80 dark:bg-emerald-950/30 border border-emerald-200/60 dark:border-emerald-900/40 text-emerald-800 dark:text-emerald-300 text-[11px] space-y-1">
                      <div className="flex items-center gap-1.5 font-semibold text-emerald-900 dark:text-emerald-200">
                        <MessageSquare className="w-3.5 h-3.5" />
                        <span>{isHindi ? 'व्यवस्थापक समाधान टिप्पणी' : 'Admin Resolution Note'}:</span>
                      </div>
                      <p>{item.resolution_note}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-800/20 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl text-xs font-semibold bg-slate-200 hover:bg-slate-300 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-slate-800 dark:text-zinc-200 transition-colors"
          >
            {isHindi ? 'बंद करें' : 'Close'}
          </button>
        </div>
      </div>
    </div>
  )
}
export default SupportHistoryModal

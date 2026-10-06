import React, { useState, useEffect, useCallback, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Loader2, FileText, Copy, Check, MessageSquare } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { useSupport } from '../context/SupportContext'
import { fetchUserComplaints, fetchUserSuggestions } from '../services/supportService'
import { ComplaintItem, SuggestionItem } from '../types'
import { SupportStatusBadge } from './SupportStatusBadge'
import { getSuggestionCategoryLabel } from './SuggestionTab'

interface SupportHistoryTabProps {
  isHindi: boolean
}

export const SupportHistoryTab: React.FC<SupportHistoryTabProps> = ({ isHindi }) => {
  const navigate = useNavigate()
  const { isAuthenticated } = useAuth()
  const { switchTab, closeSupport } = useSupport()

  const [historyComplaints, setHistoryComplaints] = useState<ComplaintItem[]>([])
  const [historySuggestions, setHistorySuggestions] = useState<SuggestionItem[]>([])
  const [historyFilter, setHistoryFilter] = useState<'all' | 'complaints' | 'suggestions'>('all')
  const [loadingHistory, setLoadingHistory] = useState(false)
  const [historyError, setHistoryError] = useState<string | null>(null)
  const [copiedHistoryId, setCopiedHistoryId] = useState<string | null>(null)

  const copyTimerRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    return () => {
      if (copyTimerRef.current) {
        clearTimeout(copyTimerRef.current)
      }
    }
  }, [])

  const loadHistory = useCallback(() => {
    if (!isAuthenticated) {
      setLoadingHistory(false)
      setHistoryComplaints([])
      setHistorySuggestions([])
      return
    }

    setLoadingHistory(true)
    setHistoryError(null)
    Promise.all([fetchUserComplaints(), fetchUserSuggestions()])
      .then(([complaintsList, suggestionsList]) => {
        setHistoryComplaints(complaintsList)
        setHistorySuggestions(suggestionsList)
      })
      .catch(() => {
        setHistoryError(
          isHindi
            ? 'अनुरोध इतिहास लोड करने में असमर्थ।'
            : 'Unable to load support request history.'
        )
      })
      .finally(() => setLoadingHistory(false))
  }, [isAuthenticated, isHindi])

  useEffect(() => {
    loadHistory()
  }, [loadHistory])

  const handleCopy = (text: string, historyId: string) => {
    navigator.clipboard.writeText(text)
    setCopiedHistoryId(historyId)
    if (copyTimerRef.current) clearTimeout(copyTimerRef.current)
    copyTimerRef.current = setTimeout(() => setCopiedHistoryId(null), 2500)
  }

  if (!isAuthenticated) {
    return (
      <div className="py-14 text-center space-y-3">
        <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-zinc-800 text-slate-400 dark:text-zinc-500 flex items-center justify-center mx-auto">
          <FileText className="w-6 h-6" />
        </div>
        <div>
          <p className="text-sm font-semibold text-slate-800 dark:text-zinc-200">
            {isHindi ? 'अनुरोध इतिहास देखने के लिए लॉगिन करें' : 'Sign In to View Request History'}
          </p>
          <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1 max-w-xs mx-auto">
            {isHindi
              ? 'अपनी पिछली शिकायतों, सुझावों और आधिकारिक समाधानों की स्थिति देखने के लिए अपने खाते में लॉगिन करें।'
              : 'Sign in to view your past complaints, platform feedback, and official resolution status.'}
          </p>
        </div>
        <div className="pt-2">
          <button
            type="button"
            onClick={() => {
              closeSupport()
              navigate('/login')
            }}
            className="px-5 py-2.5 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-500 text-white transition-colors cursor-pointer shadow-xs"
          >
            {isHindi ? 'लॉगिन / पंजीकरण करें' : 'Sign In / Register'}
          </button>
        </div>
      </div>
    )
  }

  if (loadingHistory) {
    return (
      <div className="py-16 flex flex-col items-center justify-center gap-3 text-slate-400">
        <Loader2 className="w-7 h-7 animate-spin text-rose-500" />
        <p className="text-xs">{isHindi ? 'अनुरोध लोड हो रहे हैं...' : 'Loading support history...'}</p>
      </div>
    )
  }

  if (historyError) {
    return <div className="py-12 text-center text-rose-500 text-xs">{historyError}</div>
  }

  if (historyComplaints.length === 0 && historySuggestions.length === 0) {
    return (
      <div className="py-14 text-center space-y-3">
        <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-zinc-800 text-slate-400 dark:text-zinc-500 flex items-center justify-center mx-auto">
          <FileText className="w-6 h-6" />
        </div>
        <div>
          <p className="text-sm font-semibold text-slate-800 dark:text-zinc-200">
            {isHindi ? 'कोई शिकायत या सुझाव दर्ज नहीं है' : 'No Support Requests Found'}
          </p>
          <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1 max-w-xs mx-auto">
            {isHindi
              ? 'आपके खाते में कोई सक्रिय या पुरानी शिकायत/सुझाव नहीं है। आपकी सेवा इतिहास सुचारू है।'
              : 'You do not have any past or active support requests or feedback on record.'}
          </p>
        </div>
        <div className="flex gap-2 justify-center pt-1">
          <button
            type="button"
            onClick={() => switchTab('complaint')}
            className="px-4 py-2 rounded-xl text-xs font-semibold bg-rose-600 hover:bg-rose-500 text-white transition-colors cursor-pointer"
          >
            {isHindi ? 'शिकायत दर्ज करें' : 'File a Complaint'}
          </button>
          <button
            type="button"
            onClick={() => switchTab('suggestion')}
            className="px-4 py-2 rounded-xl text-xs font-semibold bg-amber-500 hover:bg-amber-400 text-slate-950 transition-colors cursor-pointer"
          >
            {isHindi ? 'सुझाव दें' : 'Give Suggestion'}
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {/* Filter Sub-Tabs */}
      <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-zinc-800/80 rounded-xl text-xs">
        <button
          type="button"
          onClick={() => setHistoryFilter('all')}
          className={`flex-1 py-1.5 px-2.5 rounded-lg font-semibold transition-all ${
            historyFilter === 'all'
              ? 'bg-white dark:bg-zinc-700 text-slate-900 dark:text-white shadow-xs'
              : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          {isHindi ? 'सभी' : 'All'} ({historyComplaints.length + historySuggestions.length})
        </button>
        <button
          type="button"
          onClick={() => setHistoryFilter('complaints')}
          className={`flex-1 py-1.5 px-2.5 rounded-lg font-semibold transition-all ${
            historyFilter === 'complaints'
              ? 'bg-white dark:bg-zinc-700 text-rose-600 dark:text-rose-400 shadow-xs'
              : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          {isHindi ? 'शिकायतें' : 'Complaints'} ({historyComplaints.length})
        </button>
        <button
          type="button"
          onClick={() => setHistoryFilter('suggestions')}
          className={`flex-1 py-1.5 px-2.5 rounded-lg font-semibold transition-all ${
            historyFilter === 'suggestions'
              ? 'bg-white dark:bg-zinc-700 text-amber-600 dark:text-amber-400 shadow-xs'
              : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          {isHindi ? 'सुझाव' : 'Suggestions'} ({historySuggestions.length})
        </button>
      </div>

      {/* Complaints List */}
      {(historyFilter === 'all' || historyFilter === 'complaints') &&
        historyComplaints.map(item => (
          <div
            key={`cmp-${item.id}`}
            className="p-4 rounded-2xl bg-slate-50 dark:bg-zinc-800/60 border border-slate-200/80 dark:border-zinc-700/70 space-y-2.5 text-xs transition-colors hover:border-slate-300 dark:hover:border-zinc-600"
          >
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="font-mono font-bold text-rose-700 dark:text-rose-400 bg-rose-100 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 px-2 py-0.5 rounded text-[11px]">
                  #CMP-{item.id.slice(0, 8).toUpperCase()}
                </span>
                <button
                  type="button"
                  onClick={() => handleCopy(`#CMP-${item.id.slice(0, 8).toUpperCase()}`, item.id)}
                  className="p-1 rounded text-slate-400 hover:text-slate-700 dark:hover:text-zinc-200 transition-colors"
                  title={isHindi ? 'टोकन कॉपी करें' : 'Copy Reference'}
                >
                  {copiedHistoryId === item.id ? (
                    <Check className="w-3.5 h-3.5 text-emerald-500" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>
              <SupportStatusBadge status={item.status} isHindi={isHindi} />
            </div>

            <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-zinc-400">
              <span>
                {isHindi ? 'संबंधित बुकिंग' : 'Booking'}:{' '}
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

      {/* Suggestions List */}
      {(historyFilter === 'all' || historyFilter === 'suggestions') &&
        historySuggestions.map(item => (
          <div
            key={`sug-${item.id}`}
            className="p-4 rounded-2xl bg-slate-50 dark:bg-zinc-800/60 border border-slate-200/80 dark:border-zinc-700/70 space-y-2.5 text-xs transition-colors hover:border-slate-300 dark:hover:border-zinc-600"
          >
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="font-mono font-bold text-amber-700 dark:text-amber-400 bg-amber-100 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/50 px-2 py-0.5 rounded text-[11px]">
                  #SUG-{item.id.slice(0, 8).toUpperCase()}
                </span>
                <button
                  type="button"
                  onClick={() => handleCopy(`#SUG-${item.id.slice(0, 8).toUpperCase()}`, item.id)}
                  className="p-1 rounded text-slate-400 hover:text-slate-700 dark:hover:text-zinc-200 transition-colors"
                  title={isHindi ? 'टोकन कॉपी करें' : 'Copy Reference'}
                >
                  {copiedHistoryId === item.id ? (
                    <Check className="w-3.5 h-3.5 text-emerald-500" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>
              <SupportStatusBadge status={item.status} isHindi={isHindi} />
            </div>

            <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-zinc-400">
              <span className="font-medium text-slate-700 dark:text-zinc-300">
                {getSuggestionCategoryLabel(item.category, isHindi)}
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
              {item.message}
            </p>

            {item.resolution_note && (
              <div className="p-2.5 rounded-xl bg-emerald-50/80 dark:bg-emerald-950/30 border border-emerald-200/60 dark:border-emerald-900/40 text-emerald-800 dark:text-emerald-300 text-[11px] space-y-1">
                <div className="flex items-center gap-1.5 font-semibold text-emerald-900 dark:text-emerald-200">
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>{isHindi ? 'व्यवस्थापक प्रतिक्रिया / टिप्पणी' : 'Admin Response Note'}:</span>
                </div>
                <p>{item.resolution_note}</p>
              </div>
            )}
          </div>
        ))}
    </div>
  )
}

export default SupportHistoryTab

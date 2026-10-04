import React, { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  RefreshCw,
  ShieldAlert,
  MessageSquare,
  Sparkles,
  Loader2,
  AlertCircle,
  FileCheck,
} from 'lucide-react'
import {
  AdminComplaint,
  AdminSuggestion,
  AdminSupportTab,
  AdminComplaintFilter,
  AdminSuggestionFilter,
} from '../types'
import {
  fetchAdminComplaints,
  fetchAdminSuggestions,
} from '../services/adminSupportService'
import { ComplaintList } from './ComplaintList'
import { ComplaintDetails } from './ComplaintDetails'
import { SuggestionList } from './SuggestionList'
import { SuggestionDetails } from './SuggestionDetails'

export interface AdminSupportPageProps {
  embedded?: boolean
}

export const AdminSupportPage: React.FC<AdminSupportPageProps> = ({ embedded = false }) => {
  const navigate = useNavigate()

  const [activeTab, setActiveTab] = useState<AdminSupportTab>('complaints')
  const [complaintFilter, setComplaintFilter] = useState<AdminComplaintFilter>('all')
  const [suggestionFilter, setSuggestionFilter] = useState<AdminSuggestionFilter>('all')

  const [complaints, setComplaints] = useState<AdminComplaint[]>([])
  const [suggestions, setSuggestions] = useState<AdminSuggestion[]>([])
  const [selectedComplaint, setSelectedComplaint] = useState<AdminComplaint | null>(null)
  const [selectedSuggestion, setSelectedSuggestion] = useState<AdminSuggestion | null>(null)

  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const loadData = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true)
    else setLoading(true)
    setErrorMsg(null)

    try {
      const [complaintsData, suggestionsData] = await Promise.all([
        fetchAdminComplaints(complaintFilter),
        fetchAdminSuggestions(suggestionFilter),
      ])
      setComplaints(complaintsData)
      setSuggestions(suggestionsData)

      // Sync currently selected items if refreshed
      if (selectedComplaint) {
        const found = complaintsData.find(c => c.id === selectedComplaint.id)
        if (found) setSelectedComplaint(found)
      }
      if (selectedSuggestion) {
        const found = suggestionsData.find(s => s.id === selectedSuggestion.id)
        if (found) setSelectedSuggestion(found)
      }
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Failed to load support records.')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [complaintFilter, suggestionFilter, selectedComplaint?.id, selectedSuggestion?.id])

  useEffect(() => {
    loadData()
  }, [loadData])

  const openComplaintsCount = complaints.filter(c => c.status === 'open' || c.status === 'investigating').length
  const openSuggestionsCount = suggestions.filter(s => s.status === 'open' || s.status === 'in_review').length

  const content = (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-zinc-800">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            {!embedded && (
              <button
                onClick={() => navigate('/admin')}
                className="p-2 rounded-xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 hover:bg-slate-100 dark:hover:bg-zinc-800 text-slate-700 dark:text-zinc-300 transition-colors flex items-center gap-1.5 text-xs font-semibold"
                title="Back to Admin Console"
              >
                <ArrowLeft className="w-4 h-4" />
                <span className="hidden sm:inline">Admin Console</span>
              </button>
            )}
            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 dark:text-white">
              Management: Complaints & Suggestions
            </h1>
          </div>
          <p className="text-xs text-slate-500 dark:text-zinc-400">
            Authoritative platform support oversight, dispute resolution, and feedback tracking.
          </p>
        </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={() => loadData(true)}
              disabled={refreshing || loading}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-slate-700 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-800 font-semibold text-xs transition-colors cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>
          </div>
        </div>

        {/* Global Error Banner */}
        {errorMsg && (
          <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-500 text-xs flex items-center gap-2.5">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Major Tabs */}
        <div className="flex items-center gap-2 p-1.5 bg-white dark:bg-zinc-900 border border-slate-200/90 dark:border-zinc-800 rounded-2xl w-fit shadow-xs">
          <button
            onClick={() => {
              setActiveTab('complaints')
            }}
            className={`flex items-center gap-2 px-5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
              activeTab === 'complaints'
                ? 'bg-amber-500 text-slate-950 font-bold shadow-sm'
                : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <ShieldAlert className="w-4 h-4" />
            <span>Complaints</span>
            {openComplaintsCount > 0 && (
              <span
                className={`text-[10px] font-extrabold px-1.5 py-0.2 rounded-full ${
                  activeTab === 'complaints'
                    ? 'bg-slate-950/20 text-slate-950'
                    : 'bg-rose-500 text-white'
                }`}
              >
                {openComplaintsCount}
              </span>
            )}
          </button>

          <button
            onClick={() => {
              setActiveTab('suggestions')
            }}
            className={`flex items-center gap-2 px-5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
              activeTab === 'suggestions'
                ? 'bg-amber-500 text-slate-950 font-bold shadow-sm'
                : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            <span>Suggestions</span>
            {openSuggestionsCount > 0 && (
              <span
                className={`text-[10px] font-extrabold px-1.5 py-0.2 rounded-full ${
                  activeTab === 'suggestions'
                    ? 'bg-slate-950/20 text-slate-950'
                    : 'bg-amber-500/20 text-amber-600 dark:text-amber-400'
                }`}
              >
                {openSuggestionsCount}
              </span>
            )}
          </button>
        </div>

        {/* Content Section: 2-Column Responsive Layout */}
        {loading ? (
          <div className="py-24 flex flex-col items-center justify-center gap-3 text-slate-400">
            <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
            <p className="text-xs font-medium">Loading platform support records...</p>
          </div>
        ) : activeTab === 'complaints' ? (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left Column: Complaints List */}
            <div className="lg:col-span-5 bg-white dark:bg-zinc-900 border border-slate-200/90 dark:border-zinc-800 rounded-3xl p-4 sm:p-5 shadow-sm">
              <ComplaintList
                complaints={complaints}
                selectedId={selectedComplaint?.id || null}
                onSelect={c => setSelectedComplaint(c)}
                currentFilter={complaintFilter}
                onFilterChange={f => setComplaintFilter(f)}
              />
            </div>

            {/* Right Column: Complaint Details */}
            <div className="lg:col-span-7">
              <ComplaintDetails
                complaint={selectedComplaint}
                onClose={() => setSelectedComplaint(null)}
                onUpdated={() => loadData(true)}
              />
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left Column: Suggestions List */}
            <div className="lg:col-span-5 bg-white dark:bg-zinc-900 border border-slate-200/90 dark:border-zinc-800 rounded-3xl p-4 sm:p-5 shadow-sm">
              <SuggestionList
                suggestions={suggestions}
                selectedId={selectedSuggestion?.id || null}
                onSelect={s => setSelectedSuggestion(s)}
                currentFilter={suggestionFilter}
                onFilterChange={f => setSuggestionFilter(f)}
              />
            </div>

            {/* Right Column: Suggestion Details */}
            <div className="lg:col-span-7">
              <SuggestionDetails
                suggestion={selectedSuggestion}
                onClose={() => setSelectedSuggestion(null)}
                onUpdated={() => loadData(true)}
              />
            </div>
          </div>
        )}
    </div>
  )

  if (embedded) {
    return content
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-zinc-950 text-slate-900 dark:text-zinc-100 p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        {content}
      </div>
    </div>
  )
}

export default AdminSupportPage

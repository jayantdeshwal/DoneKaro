/**
 * Care & Support Modal
 * Authoritative platform support channel for BOTH Customers and Workers.
 * Features:
 *  1. Complaint: Verified booking link, counterparty resolution, #CMP-XXXXXXXX token generation.
 *  2. Suggestion: Platform feedback without database pollution.
 *  3. My Requests: Live database status and admin resolution notes for caller's complaints.
 */

import React, { useState, useEffect, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import {
  ShieldAlert,
  MessageSquare,
  FileText,
  X,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  Briefcase,
  User,
  Calendar,
  Clock,
  HelpCircle,
  Ban,
  ArrowRight,
  ChevronRight,
  Sparkles,
} from 'lucide-react'
import { useSupport } from '../context/SupportContext'
import {
  fetchBookingDetailsForSupport,
  fetchEligibleBookingsForSupport,
  submitSupportComplaint,
  fetchUserComplaints,
  submitSupportSuggestion,
  fetchUserSuggestions,
  SupportBookingContext,
} from '../services/supportService'
import {
  ComplaintItem,
  ComplaintStatus,
  EligibleSupportBooking,
  SupportTab,
  SuggestionItem,
  SuggestionStatus,
  SuggestionCategory,
} from '../types'

function getSuggestionCategoryLabel(category: SuggestionCategory, isHindi: boolean): string {
  switch (category) {
    case 'app_experience':
      return isHindi ? 'ऐप अनुभव' : 'App Experience'
    case 'new_feature':
      return isHindi ? 'नई सुविधा / ट्रेड' : 'New Feature / Trade'
    case 'service_coverage':
      return isHindi ? 'सेवा क्षेत्र' : 'Service Area'
    case 'other':
      return isHindi ? 'सामान्य विचार' : 'General Feedback'
  }
}

export const CareSupportModal: React.FC = () => {
  const { i18n } = useTranslation()
  const isHindi = i18n.language === 'hi'

  const {
    isOpen,
    activeTab,
    selectedBookingId,
    initialReason,
    closeSupport,
    switchTab,
    setSelectedBookingId,
  } = useSupport()

  // Tab 1 (Complaint) state
  const [bookingContext, setBookingContext] = useState<SupportBookingContext | null>(null)
  const [loadingContext, setLoadingContext] = useState(false)
  const [eligibleBookings, setEligibleBookings] = useState<EligibleSupportBooking[]>([])
  const [loadingEligible, setLoadingEligible] = useState(false)
  const [reason, setReason] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [complaintError, setComplaintError] = useState<string | null>(null)
  const [createdComplaint, setCreatedComplaint] = useState<ComplaintItem | null>(null)
  const [copiedToken, setCopiedToken] = useState(false)

  // Tab 2 (Suggestion) state
  const [suggestionCategory, setSuggestionCategory] = useState<SuggestionCategory>('app_experience')
  const [suggestionText, setSuggestionText] = useState('')
  const [submittingSuggestion, setSubmittingSuggestion] = useState(false)
  const [suggestionError, setSuggestionError] = useState<string | null>(null)
  const [createdSuggestion, setCreatedSuggestion] = useState<SuggestionItem | null>(null)
  const [copiedSuggestionToken, setCopiedSuggestionToken] = useState(false)

  // Tab 3 (History) state
  const [historyComplaints, setHistoryComplaints] = useState<ComplaintItem[]>([])
  const [historySuggestions, setHistorySuggestions] = useState<SuggestionItem[]>([])
  const [historyFilter, setHistoryFilter] = useState<'all' | 'complaints' | 'suggestions'>('all')
  const [loadingHistory, setLoadingHistory] = useState(false)
  const [historyError, setHistoryError] = useState<string | null>(null)
  const [copiedHistoryId, setCopiedHistoryId] = useState<string | null>(null)

  // Reset/sync state when modal opens or selectedBookingId changes
  useEffect(() => {
    if (!isOpen) {
      setReason('')
      setComplaintError(null)
      setCreatedComplaint(null)
      setCopiedToken(false)
      setSuggestionText('')
      setSuggestionError(null)
      setCreatedSuggestion(null)
      setCopiedSuggestionToken(false)
      return
    }

    if (initialReason && !reason) {
      setReason(initialReason)
    }

    if (selectedBookingId) {
      setLoadingContext(true)
      setComplaintError(null)
      fetchBookingDetailsForSupport(selectedBookingId)
        .then(ctx => {
          setBookingContext(ctx)
          if (!ctx) {
            setComplaintError(
              isHindi
                ? 'बुकिंग सत्यापन विफल रहा। कृपया सुनिश्चित करें कि आप इस बुकिंग के प्रतिभागी हैं।'
                : 'Booking verification failed. Please ensure you are an authorized participant.'
            )
          }
        })
        .catch(() => {
          setComplaintError(
            isHindi
              ? 'बुकिंग विवरण लोड करने में असमर्थ।'
              : 'Unable to load booking details for support request.'
          )
        })
        .finally(() => setLoadingContext(false))
    } else {
      setBookingContext(null)
      // Load eligible bookings for selector
      setLoadingEligible(true)
      fetchEligibleBookingsForSupport()
        .then(list => setEligibleBookings(list))
        .catch(() => setEligibleBookings([]))
        .finally(() => setLoadingEligible(false))
    }
  }, [isOpen, selectedBookingId, initialReason, isHindi])

  // Load history when switching to history tab
  const loadHistory = useCallback(() => {
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
  }, [isHindi])

  useEffect(() => {
    if (isOpen && activeTab === 'history') {
      loadHistory()
    }
  }, [isOpen, activeTab, loadHistory])

  if (!isOpen) return null

  // Copy helper
  const handleCopy = (text: string, isHistory = false, historyId = '') => {
    navigator.clipboard.writeText(text)
    if (isHistory) {
      setCopiedHistoryId(historyId)
      setTimeout(() => setCopiedHistoryId(null), 2500)
    } else {
      setCopiedToken(true)
      setTimeout(() => setCopiedToken(false), 2500)
    }
  }

  // Handle complaint submission
  const handleComplaintSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedBookingId || submitting) return

    const trimmed = reason.trim()
    if (trimmed.length < 10) {
      setComplaintError(
        isHindi
          ? 'कृपया अपनी समस्या का विवरण कम से कम 10 अक्षरों में लिखें।'
          : 'Please describe the issue in at least 10 characters.'
      )
      return
    }

    setSubmitting(true)
    setComplaintError(null)

    try {
      const res = await submitSupportComplaint({
        bookingId: selectedBookingId,
        reason: trimmed,
      })

      if (res.success && res.complaint) {
        setCreatedComplaint(res.complaint)
      } else {
        setComplaintError(
          res.error ||
            (isHindi
              ? 'अनुरोध दर्ज करने में समस्या आई। कृपया पुनः प्रयास करें।'
              : 'Failed to submit support request. Please try again.')
        )
      }
    } catch {
      setComplaintError(
        isHindi
          ? 'सर्वर से संपर्क करने में असमर्थ। कृपया बाद में प्रयास करें।'
          : 'An unexpected error occurred. Please try again.'
      )
    } finally {
      setSubmitting(false)
    }
  }

  // Handle suggestion submission
  const handleSuggestionSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (suggestionText.trim().length < 10) return
    setSubmittingSuggestion(true)
    setSuggestionError(null)

    try {
      const res = await submitSupportSuggestion({
        category: suggestionCategory,
        message: suggestionText.trim(),
      })
      if (!res.success || !res.suggestion) {
        setSuggestionError(
          res.error || (isHindi ? 'सुझाव दर्ज करने में असमर्थ।' : 'Unable to submit your suggestion.')
        )
      } else {
        setCreatedSuggestion(res.suggestion)
        setSuggestionText('')
      }
    } catch {
      setSuggestionError(
        isHindi
          ? 'सर्वर से संपर्क करने में असमर्थ। कृपया बाद में प्रयास करें।'
          : 'An unexpected error occurred. Please try again.'
      )
    } finally {
      setSubmittingSuggestion(false)
    }
  }

  // Status badge helper
  const renderStatusBadge = (status: ComplaintStatus | SuggestionStatus) => {
    switch (status) {
      case 'open':
        return (
          <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400 border border-amber-200 dark:border-amber-500/30 uppercase">
            <Clock className="w-3 h-3" />
            {isHindi ? 'खुली है (Open)' : 'OPEN'}
          </span>
        )
      case 'investigating':
      case 'in_review':
        return (
          <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 dark:bg-blue-500/15 dark:text-blue-400 border border-blue-200 dark:border-blue-500/30 uppercase">
            <HelpCircle className="w-3 h-3" />
            {status === 'in_review' ? (isHindi ? 'समीक्षाधीन' : 'IN REVIEW') : (isHindi ? 'जाँच जारी' : 'INVESTIGATING')}
          </span>
        )
      case 'resolved':
        return (
          <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/30 uppercase">
            <CheckCircle2 className="w-3 h-3" />
            {isHindi ? 'समाधान पूर्ण' : 'RESOLVED'}
          </span>
        )
      case 'dismissed':
        return (
          <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 dark:bg-zinc-800 dark:text-zinc-400 border border-slate-200 dark:border-zinc-700 uppercase">
            <Ban className="w-3 h-3" />
            {isHindi ? 'खारिज' : 'DISMISSED'}
          </span>
        )
      default:
        return null
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/75 backdrop-blur-sm animate-fade-in"
      onClick={e => {
        if (e.target === e.currentTarget && !submitting) closeSupport()
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="care-support-modal-title"
    >
      <div className="w-full sm:max-w-xl h-[92vh] sm:h-[680px] max-h-[92vh] bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-t-3xl sm:rounded-3xl shadow-2xl flex flex-col overflow-hidden text-slate-900 dark:text-zinc-100">
        {/* Top Drag Handle for mobile */}
        <div className="w-12 h-1.5 bg-slate-300 dark:bg-zinc-700 rounded-full mx-auto mt-2.5 sm:hidden shrink-0" />

        {/* Modal Header */}
        <div className="px-5 py-3.5 border-b border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-800/80 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center border border-rose-500/20 shadow-xs">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h3 id="care-support-modal-title" className="text-sm font-bold text-slate-900 dark:text-white tracking-tight">
                {isHindi ? 'केयर एवं सहायता' : 'Care & Support'}
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-zinc-400">
                {isHindi
                  ? 'जुगनू आधिकारिक समाधान एवं शिकायत डेस्क'
                  : 'Official platform support, complaints & suggestions'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={closeSupport}
            disabled={submitting}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-200 dark:hover:text-white dark:hover:bg-zinc-700 transition-colors disabled:opacity-50 cursor-pointer"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs Bar */}
        <div className="px-4 py-2 bg-slate-50/80 dark:bg-zinc-850/80 border-b border-slate-200 dark:border-zinc-800 flex items-center gap-2 overflow-x-auto no-scrollbar shrink-0">
          <button
            type="button"
            onClick={() => switchTab('complaint')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
              activeTab === 'complaint'
                ? 'bg-rose-600 text-white font-bold shadow-xs'
                : 'bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 hover:bg-slate-200 dark:hover:bg-zinc-700'
            }`}
          >
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>{isHindi ? 'शिकायत (Complaint)' : 'Complaint'}</span>
          </button>

          <button
            type="button"
            onClick={() => switchTab('suggestion')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
              activeTab === 'suggestion'
                ? 'bg-amber-600 text-white font-bold shadow-xs'
                : 'bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 hover:bg-slate-200 dark:hover:bg-zinc-700'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>{isHindi ? 'सुझाव (Suggestion)' : 'Suggestion'}</span>
          </button>

          <button
            type="button"
            onClick={() => switchTab('history')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
              activeTab === 'history'
                ? 'bg-slate-900 dark:bg-zinc-100 text-white dark:text-zinc-900 font-bold shadow-xs'
                : 'bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 hover:bg-slate-200 dark:hover:bg-zinc-700'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>{isHindi ? 'मेरे अनुरोध (My Requests)' : 'My Requests'}</span>
          </button>
        </div>

        {/* Tab Body */}
        <div className="p-5 overflow-y-auto flex-1">
          {/* ========================================================================= */}
          {/* TAB 1: COMPLAINT                                                          */}
          {/* ========================================================================= */}
          {activeTab === 'complaint' && (
            <div>
              {createdComplaint ? (
                /* Success View */
                <div className="space-y-5 text-center py-2">
                  <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto border border-emerald-500/20 shadow-inner">
                    <CheckCircle2 className="w-8 h-8" />
                  </div>

                  <div>
                    <h4 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                      {isHindi ? 'शिकायत अनुरोध सफलतापूर्वक दर्ज हुआ' : 'Support Request Submitted'}
                    </h4>
                    <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1">
                      {isHindi
                        ? 'आपका अनुरोध सुरक्षित रूप से दर्ज कर लिया गया है।'
                        : 'Your complaint has been formally registered with Jugnu administration.'}
                    </p>
                  </div>

                  {/* Token & Details Card */}
                  <div className="p-4 rounded-2xl bg-slate-50 dark:bg-zinc-800/60 border border-slate-200 dark:border-zinc-700 text-left space-y-3 text-xs">
                    <div className="flex justify-between items-center pb-2.5 border-b border-slate-200 dark:border-zinc-700">
                      <div>
                        <span className="text-[11px] text-slate-500 dark:text-zinc-400 block font-medium">
                          {isHindi ? 'शिकायत संदर्भ संख्या' : 'Support Reference Token'}:
                        </span>
                        <span className="font-mono font-bold text-base text-rose-600 dark:text-rose-400 tracking-wider">
                          #CMP-{createdComplaint.id.slice(0, 8).toUpperCase()}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleCopy(`#CMP-${createdComplaint.id.slice(0, 8).toUpperCase()}`)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-200 hover:bg-slate-300 dark:bg-zinc-700 dark:hover:bg-zinc-650 text-slate-800 dark:text-zinc-200 font-semibold text-xs transition-colors"
                      >
                        {copiedToken ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                            <span className="text-emerald-600">{isHindi ? 'कॉपी हुआ' : 'Copied'}</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5" />
                            <span>{isHindi ? 'कॉपी करें' : 'Copy'}</span>
                          </>
                        )}
                      </button>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="text-slate-500 dark:text-zinc-400 font-medium">
                        {isHindi ? 'संबंधित बुकिंग' : 'Associated Booking'}:
                      </span>
                      <span className="font-mono font-semibold text-slate-900 dark:text-zinc-200">
                        #JUG-{createdComplaint.booking_id.slice(0, 8).toUpperCase()}
                      </span>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="text-slate-500 dark:text-zinc-400 font-medium">
                        {isHindi ? 'वर्तमान स्थिति' : 'Current Status'}:
                      </span>
                      {renderStatusBadge(createdComplaint.status)}
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="text-slate-500 dark:text-zinc-400 font-medium">
                        {isHindi ? 'दिनांक' : 'Submitted At'}:
                      </span>
                      <span className="text-slate-700 dark:text-zinc-300">
                        {new Date(createdComplaint.created_at).toLocaleString(isHindi ? 'hi-IN' : 'en-IN')}
                      </span>
                    </div>
                  </div>

                  <p className="text-[11px] text-slate-500 dark:text-zinc-400 leading-relaxed px-2">
                    {isHindi
                      ? '⚠️ जुगनू प्रशासन टीम द्वारा इसकी निष्पक्ष समीक्षा की जाएगी। आप कभी भी "मेरे अनुरोध" में इसकी स्थिति देख सकते हैं।'
                      : '⚠️ Jugnu administration will investigate this matter according to platform service standards. You can track progress under "My Requests".'}
                  </p>

                  <div className="flex flex-col sm:flex-row gap-2.5 pt-2">
                    <button
                      type="button"
                      onClick={() => {
                        setCreatedComplaint(null)
                        setReason('')
                        switchTab('history')
                      }}
                      className="flex-1 py-2.5 px-4 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-slate-800 dark:text-zinc-200 transition-colors"
                    >
                      {isHindi ? 'मेरे अनुरोध देखें' : 'View My Requests'}
                    </button>
                    <button
                      type="button"
                      onClick={closeSupport}
                      className="flex-1 py-2.5 px-4 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white transition-colors shadow-sm"
                    >
                      {isHindi ? 'समाप्त' : 'Done'}
                    </button>
                  </div>
                </div>
              ) : selectedBookingId ? (
                /* Complaint Form with Pre-selected Booking */
                <form onSubmit={handleComplaintSubmit} className="space-y-4">
                  {loadingContext ? (
                    <div className="py-8 flex flex-col items-center justify-center gap-2 text-slate-500">
                      <Loader2 className="w-6 h-6 animate-spin text-rose-500" />
                      <p className="text-xs">{isHindi ? 'बुकिंग विवरण लोड हो रहा है...' : 'Verifying booking details...'}</p>
                    </div>
                  ) : bookingContext ? (
                    <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-zinc-800/60 border border-slate-200 dark:border-zinc-700/80 space-y-2 text-xs">
                      <div className="flex items-center justify-between font-semibold text-slate-800 dark:text-zinc-200">
                        <span className="flex items-center gap-1.5">
                          <Briefcase className="w-3.5 h-3.5 text-amber-500" />
                          {bookingContext.categoryName}
                        </span>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-[11px] text-slate-500 dark:text-zinc-400">
                            #JUG-{bookingContext.bookingId.slice(0, 8).toUpperCase()}
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedBookingId(null)
                              setBookingContext(null)
                            }}
                            className="text-[10px] text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
                          >
                            {isHindi ? 'बदलें' : 'Change'}
                          </button>
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-slate-600 dark:text-zinc-400 pt-1.5 border-t border-slate-200/60 dark:border-zinc-700/60">
                        <span className="flex items-center gap-1.5">
                          <User className="w-3.5 h-3.5 text-blue-500" />
                          {bookingContext.counterpartyName}
                        </span>
                        <span className="flex items-center gap-1 text-[11px] uppercase font-semibold text-slate-500">
                          <Calendar className="w-3 h-3 text-purple-500" />
                          {bookingContext.bookingStatus}
                        </span>
                      </div>
                    </div>
                  ) : null}

                  {complaintError && (
                    <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 text-rose-700 dark:text-rose-400 text-xs flex items-start gap-2">
                      <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                      <p>{complaintError}</p>
                    </div>
                  )}

                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300">
                      {isHindi ? 'समस्या का स्पष्ट विवरण दर्ज करें' : 'Describe the Issue in Detail'}
                      <span className="text-rose-500 ml-1">*</span>
                    </label>
                    <textarea
                      value={reason}
                      onChange={e => setReason(e.target.value)}
                      placeholder={
                        isHindi
                          ? 'समस्या का कारण लिखें (उदा. अतिरिक्त नकद माँगना, काम अधूरा छोड़ना, समय पर न पहुँचना या अनुचित व्यवहार)...'
                          : 'Please describe what happened (e.g. unapproved offline cash demands, incomplete repair, conduct issues, or no-show)...'
                      }
                      rows={4}
                      maxLength={1000}
                      disabled={submitting}
                      className="w-full text-xs rounded-xl p-3 bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent text-slate-900 dark:text-white placeholder-slate-400 resize-none disabled:opacity-50"
                    />
                    <div className="flex justify-between items-center text-[10px] text-slate-400">
                      <span>{isHindi ? 'न्यूनतम 10 अक्षर आवश्यक' : 'Minimum 10 characters required'}</span>
                      <span>{reason.length}/1000</span>
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-amber-50/70 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-900/30 text-[11px] text-amber-800 dark:text-amber-300/90 leading-relaxed">
                    {isHindi
                      ? '📌 यह अनुरोध जुगनू व्यवस्थापक पैनल में दर्ज होगा और आपको एक आधिकारिक संदर्भ टोकन मिलेगा। AI सहायक स्वतः कोई शिकायत दर्ज नहीं करता।'
                      : '📌 This creates an authoritative record in the Jugnu admin panel with a unique reference token. AI Support is read-only and cannot mutate complaints.'}
                  </div>

                  <div className="flex items-center justify-end gap-2.5 pt-2">
                    <button
                      type="button"
                      onClick={() => setSelectedBookingId(null)}
                      disabled={submitting}
                      className="px-4 py-2.5 rounded-xl text-xs font-medium text-slate-600 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors disabled:opacity-50"
                    >
                      {isHindi ? 'पीछे' : 'Back'}
                    </button>
                    <button
                      type="submit"
                      disabled={submitting || reason.trim().length < 10 || !bookingContext}
                      className="px-5 py-2.5 rounded-xl text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 disabled:bg-slate-300 dark:disabled:bg-zinc-700 disabled:cursor-not-allowed transition-all shadow-sm flex items-center gap-1.5 cursor-pointer"
                    >
                      {submitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                      <span>{isHindi ? 'शिकायत दर्ज करें' : 'Submit Complaint'}</span>
                    </button>
                  </div>
                </form>
              ) : (
                /* Booking Selector View */
                <div className="space-y-4">
                  <div>
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                      {isHindi ? 'संबंधित बुकिंग चुनें' : 'Select Relevant Booking'}
                    </h4>
                    <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
                      {isHindi
                        ? 'आधिकारिक शिकायत दर्ज करने के लिए संबंधित बुकिंग का चयन करें:'
                        : 'Choose the assigned booking for which you want to submit a formal complaint:'}
                    </p>
                  </div>

                  {loadingEligible ? (
                    <div className="py-12 flex flex-col items-center justify-center gap-2 text-slate-400">
                      <Loader2 className="w-6 h-6 animate-spin text-rose-500" />
                      <p className="text-xs">{isHindi ? 'बुकिंग लोड हो रही हैं...' : 'Loading eligible bookings...'}</p>
                    </div>
                  ) : eligibleBookings.length === 0 ? (
                    <div className="p-5 rounded-2xl bg-slate-50 dark:bg-zinc-800/50 border border-slate-200 dark:border-zinc-700 text-center space-y-3 py-8">
                      <AlertCircle className="w-8 h-8 text-amber-500 mx-auto" />
                      <div>
                        <p className="text-sm font-semibold text-slate-800 dark:text-zinc-200">
                          {isHindi ? 'कोई पात्र बुकिंग उपलब्ध नहीं' : 'No Eligible Bookings Found'}
                        </p>
                        <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1 max-w-sm mx-auto leading-relaxed">
                          {isHindi
                            ? 'शिकायत केवल उन बुकिंग पर दर्ज की जा सकती है जिनमें कारीगर/ग्राहक असाइन हो चुका हो। यदि आपको सामान्य प्लेटफ़ॉर्म सुझाव देना है, तो कृपया सुझाव टैब का उपयोग करें।'
                            : 'Complaints can only be filed against bookings with an assigned artisan or customer. For general feedback, please use the Suggestion tab.'}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => switchTab('suggestion')}
                        className="px-4 py-2 rounded-xl text-xs font-semibold bg-amber-500 hover:bg-amber-400 text-slate-950 transition-colors"
                      >
                        {isHindi ? 'सुझाव भेजें' : 'Send a Suggestion Instead'}
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-2.5 max-h-[380px] overflow-y-auto pr-1">
                      {eligibleBookings.map(b => (
                        <div
                          key={b.bookingId}
                          onClick={() => setSelectedBookingId(b.bookingId)}
                          className="p-3.5 rounded-2xl bg-slate-50 dark:bg-zinc-800/60 border border-slate-200 dark:border-zinc-700/70 hover:border-rose-500/50 hover:bg-rose-50/20 dark:hover:bg-rose-950/20 transition-all cursor-pointer flex items-center justify-between group"
                        >
                          <div className="space-y-1 text-xs">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-slate-900 dark:text-zinc-100 group-hover:text-rose-600 dark:group-hover:text-rose-400 transition-colors">
                                {b.categoryName}
                              </span>
                              <span className="font-mono text-[10px] bg-slate-200 dark:bg-zinc-700 px-1.5 py-0.5 rounded text-slate-700 dark:text-zinc-300">
                                #JUG-{b.bookingId.slice(0, 8).toUpperCase()}
                              </span>
                            </div>
                            <div className="flex items-center gap-3 text-slate-500 dark:text-zinc-400 text-[11px]">
                              <span className="flex items-center gap-1">
                                <User className="w-3 h-3 text-blue-500" />
                                {b.counterpartyName}
                              </span>
                              <span className="uppercase text-[10px] font-semibold">
                                {b.bookingStatus}
                              </span>
                            </div>
                          </div>
                          <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-rose-500 group-hover:translate-x-0.5 transition-all" />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 2: SUGGESTION / FEEDBACK                                              */}
          {/* ========================================================================= */}
          {activeTab === 'suggestion' && (
            <div className="space-y-4">
              {createdSuggestion ? (
                <div className="text-center py-4 space-y-4 animate-fade-in">
                  <div className="w-14 h-14 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto border border-amber-500/20 shadow-inner">
                    <Sparkles className="w-8 h-8" />
                  </div>
                  <div>
                    <h4 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                      {isHindi ? 'सुझाव सफलतापूर्वक दर्ज हुआ' : 'Feedback Submitted Successfully'}
                    </h4>
                    <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1 max-w-sm mx-auto leading-relaxed">
                      {isHindi
                        ? 'मुज़फ्फरनगर में जुगनू को बेहतर बनाने के लिए आपका विचार सुरक्षित रूप से दर्ज कर लिया गया है।'
                        : 'Your suggestion has been formally recorded with the platform operations team.'}
                    </p>
                  </div>

                  {/* Token & Details Card */}
                  <div className="p-4 rounded-2xl bg-slate-50 dark:bg-zinc-800/60 border border-slate-200 dark:border-zinc-700 text-left space-y-3 text-xs">
                    <div className="flex justify-between items-center pb-2.5 border-b border-slate-200 dark:border-zinc-700">
                      <div>
                        <span className="text-[11px] text-slate-500 dark:text-zinc-400 block font-medium">
                          {isHindi ? 'सुझाव संदर्भ संख्या' : 'Suggestion Reference'}:
                        </span>
                        <span className="font-mono font-bold text-base text-amber-600 dark:text-amber-400 tracking-wider">
                          #SUG-{createdSuggestion.id.slice(0, 8).toUpperCase()}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleCopy(`#SUG-${createdSuggestion.id.slice(0, 8).toUpperCase()}`)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-200 hover:bg-slate-300 dark:bg-zinc-700 dark:hover:bg-zinc-650 text-slate-800 dark:text-zinc-200 font-semibold text-xs transition-colors"
                      >
                        {copiedToken ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                            <span className="text-emerald-600">{isHindi ? 'कॉपी हुआ' : 'Copied'}</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5" />
                            <span>{isHindi ? 'कॉपी करें' : 'Copy'}</span>
                          </>
                        )}
                      </button>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="text-slate-500 dark:text-zinc-400 font-medium">
                        {isHindi ? 'विषय' : 'Topic'}:
                      </span>
                      <span className="font-semibold text-slate-900 dark:text-zinc-200">
                        {getSuggestionCategoryLabel(createdSuggestion.category, isHindi)}
                      </span>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="text-slate-500 dark:text-zinc-400 font-medium">
                        {isHindi ? 'वर्तमान स्थिति' : 'Current Status'}:
                      </span>
                      {renderStatusBadge(createdSuggestion.status)}
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="text-slate-500 dark:text-zinc-400 font-medium">
                        {isHindi ? 'दिनांक' : 'Submitted At'}:
                      </span>
                      <span className="text-slate-700 dark:text-zinc-300">
                        {new Date(createdSuggestion.created_at).toLocaleString(isHindi ? 'hi-IN' : 'en-IN')}
                      </span>
                    </div>
                  </div>

                  <p className="text-[11px] text-slate-500 dark:text-zinc-400 leading-relaxed px-2">
                    {isHindi
                      ? '💡 हमारे प्रशासक नियमित रूप से सभी सुझावों की समीक्षा करते हैं। आप कभी भी "मेरे अनुरोध" में इसकी स्थिति देख सकते हैं।'
                      : '💡 Platform administrators review suggestions regularly. You can track this item anytime under "My Requests".'}
                  </p>

                  <div className="flex flex-col sm:flex-row gap-2.5 pt-2">
                    <button
                      type="button"
                      onClick={() => {
                        setCreatedSuggestion(null)
                        setSuggestionText('')
                      }}
                      className="flex-1 py-2.5 px-4 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-slate-800 dark:text-zinc-200 transition-colors"
                    >
                      {isHindi ? 'एक और सुझाव भेजें' : 'Send Another'}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setCreatedSuggestion(null)
                        switchTab('history')
                      }}
                      className="flex-1 py-2.5 px-4 rounded-xl text-xs font-semibold bg-amber-500 hover:bg-amber-400 text-slate-950 transition-colors shadow-xs"
                    >
                      {isHindi ? 'मेरे अनुरोध देखें' : 'View My Requests'}
                    </button>
                    <button
                      type="button"
                      onClick={closeSupport}
                      className="flex-1 py-2.5 px-4 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white transition-colors shadow-sm"
                    >
                      {isHindi ? 'समाप्त' : 'Done'}
                    </button>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleSuggestionSubmit} className="space-y-4">
                  <div>
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                      {isHindi ? 'सुझाव या प्लेटफ़ॉर्म फीडबैक साझा करें' : 'Share a Suggestion or Platform Feedback'}
                    </h4>
                    <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
                      {isHindi
                        ? 'क्या आप कोई नई सुविधा, नया सेवा क्षेत्र या सुधार चाहते हैं?'
                        : 'Have an idea for a new trade, service area, or app improvement in Muzaffarnagar?'}
                    </p>
                  </div>

                  {suggestionError && (
                    <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-500 text-xs flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      <span>{suggestionError}</span>
                    </div>
                  )}

                  {/* Category Chips */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300">
                      {isHindi ? 'विषय चुनें' : 'Select Topic'}
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {[
                        { id: 'app_experience', en: 'App Experience', hi: 'ऐप अनुभव' },
                        { id: 'new_feature', en: 'New Feature / Trade', hi: 'नई सुविधा / ट्रेड' },
                        { id: 'service_coverage', en: 'Service Area', hi: 'सेवा क्षेत्र' },
                        { id: 'other', en: 'General Feedback', hi: 'सामान्य विचार' },
                      ].map(cat => (
                        <button
                          key={cat.id}
                          type="button"
                          onClick={() => setSuggestionCategory(cat.id as any)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                            suggestionCategory === cat.id
                              ? 'bg-amber-500 text-slate-950 font-bold shadow-xs'
                              : 'bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-300 hover:bg-slate-200 dark:hover:bg-zinc-700'
                          }`}
                        >
                          {isHindi ? cat.hi : cat.en}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Suggestion Textarea */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300">
                      {isHindi ? 'आपका सुझाव' : 'Your Feedback'}
                      <span className="text-amber-500 ml-1">*</span>
                    </label>
                    <textarea
                      value={suggestionText}
                      onChange={e => setSuggestionText(e.target.value)}
                      placeholder={
                        isHindi
                          ? 'कृपया अपना विचार या सुझाव यहाँ लिखें...'
                          : 'Please share your detailed ideas or recommendations...'
                      }
                      rows={5}
                      maxLength={2000}
                      className="w-full text-xs rounded-xl p-3 bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent text-slate-900 dark:text-white placeholder-slate-400 resize-none"
                    />
                    <div className="flex justify-between items-center text-[10px] text-slate-400">
                      <span>{isHindi ? 'न्यूनतम 10 अक्षर आवश्यक' : 'Minimum 10 characters required'}</span>
                      <span>{suggestionText.length}/2000</span>
                    </div>
                  </div>

                  <div className="flex justify-end gap-2.5 pt-2">
                    <button
                      type="button"
                      onClick={closeSupport}
                      className="px-4 py-2.5 rounded-xl text-xs font-medium text-slate-600 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors"
                    >
                      {isHindi ? 'रद्द करें' : 'Cancel'}
                    </button>
                    <button
                      type="submit"
                      disabled={suggestionText.trim().length < 10 || submittingSuggestion}
                      className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-xs font-semibold text-slate-950 bg-amber-500 hover:bg-amber-400 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-xs cursor-pointer"
                    >
                      {submittingSuggestion ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          <span>{isHindi ? 'भेजा जा रहा है...' : 'Submitting...'}</span>
                        </>
                      ) : (
                        <span>{isHindi ? 'सुझाव भेजें' : 'Send Feedback'}</span>
                      )}
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 3: MY REQUESTS (HISTORY)                                              */}
          {/* ========================================================================= */}
          {activeTab === 'history' && (
            <div className="space-y-4">
              {loadingHistory ? (
                <div className="py-16 flex flex-col items-center justify-center gap-3 text-slate-400">
                  <Loader2 className="w-7 h-7 animate-spin text-rose-500" />
                  <p className="text-xs">{isHindi ? 'अनुरोध लोड हो रहे हैं...' : 'Loading support history...'}</p>
                </div>
              ) : historyError ? (
                <div className="py-12 text-center text-rose-500 text-xs">{historyError}</div>
              ) : historyComplaints.length === 0 && historySuggestions.length === 0 ? (
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
              ) : (
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
                              onClick={() => handleCopy(`#CMP-${item.id.slice(0, 8).toUpperCase()}`, true, item.id)}
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
                          {renderStatusBadge(item.status)}
                        </div>

                        <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-zinc-400">
                          <span>
                            {isHindi ? 'संबंधित बुकिंग' : 'Booking'}:{' '}
                            <span className="font-mono text-slate-700 dark:text-zinc-300 font-medium">
                              #JUG-{item.booking_id.slice(0, 8).toUpperCase()}
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
                              onClick={() => handleCopy(`#SUG-${item.id.slice(0, 8).toUpperCase()}`, true, item.id)}
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
                          {renderStatusBadge(item.status)}
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
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default CareSupportModal

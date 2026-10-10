import React, { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  Briefcase,
  User,
  Calendar,
  Loader2,
  ChevronRight,
  ShieldAlert,
} from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { useSupport } from '../context/SupportContext'
import {
  fetchBookingDetailsForSupport,
  fetchEligibleBookingsForSupport,
  submitSupportComplaint,
  SupportBookingContext,
} from '../services/supportService'
import { ComplaintItem, EligibleSupportBooking } from '../types'
import { SupportStatusBadge } from './SupportStatusBadge'

interface ComplaintTabProps {
  isHindi: boolean
}

export const ComplaintTab: React.FC<ComplaintTabProps> = ({ isHindi }) => {
  const navigate = useNavigate()
  const { isAuthenticated } = useAuth()
  const {
    selectedBookingId,
    initialReason,
    closeSupport,
    switchTab,
    setSelectedBookingId,
  } = useSupport()

  const [bookingContext, setBookingContext] = useState<SupportBookingContext | null>(null)
  const [loadingContext, setLoadingContext] = useState(false)
  const [eligibleBookings, setEligibleBookings] = useState<EligibleSupportBooking[]>([])
  const [loadingEligible, setLoadingEligible] = useState(false)
  const [reason, setReason] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [complaintError, setComplaintError] = useState<string | null>(null)
  const [createdComplaint, setCreatedComplaint] = useState<ComplaintItem | null>(null)
  const [copiedToken, setCopiedToken] = useState(false)

  const copyTimerRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    return () => {
      if (copyTimerRef.current) {
        clearTimeout(copyTimerRef.current)
      }
    }
  }, [])

  useEffect(() => {
    if (initialReason && !reason) {
      setReason(initialReason)
    }
  }, [initialReason, reason])

  useEffect(() => {
    if (!isAuthenticated) {
      setBookingContext(null)
      setEligibleBookings([])
      setLoadingContext(false)
      setLoadingEligible(false)
      return
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
      setLoadingEligible(true)
      fetchEligibleBookingsForSupport()
        .then(list => setEligibleBookings(list))
        .catch(() => setEligibleBookings([]))
        .finally(() => setLoadingEligible(false))
    }
  }, [selectedBookingId, isAuthenticated, isHindi])

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text)
    setCopiedToken(true)
    if (copyTimerRef.current) clearTimeout(copyTimerRef.current)
    copyTimerRef.current = setTimeout(() => setCopiedToken(false), 2500)
  }

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

  if (createdComplaint) {
    /* Success View */
    return (
      <div className="space-y-5 text-center py-2 animate-fade-in">
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
              : 'Your complaint has been formally registered with DoneKaro administration.'}
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
              #DK-{createdComplaint.booking_id.slice(0, 8).toUpperCase()}
            </span>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-slate-500 dark:text-zinc-400 font-medium">
              {isHindi ? 'वर्तमान स्थिति' : 'Current Status'}:
            </span>
            <SupportStatusBadge status={createdComplaint.status} isHindi={isHindi} />
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
            ? '⚠️ DoneKaro प्रशासन टीम द्वारा इसकी निष्पक्ष समीक्षा की जाएगी। आप कभी भी "मेरे अनुरोध" में इसकी स्थिति देख सकते हैं।'
            : '⚠️ DoneKaro administration will investigate this matter according to platform service standards. You can track progress under "My Requests".'}
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
    )
  }

  if (selectedBookingId) {
    /* Complaint Form with Pre-selected Booking */
    return (
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
                  #DK-{bookingContext.bookingId.slice(0, 8).toUpperCase()}
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
            ? '📌 यह अनुरोध DoneKaro व्यवस्थापक पैनल में दर्ज होगा और आपको एक आधिकारिक संदर्भ टोकन मिलेगा। AI सहायक स्वतः कोई शिकायत दर्ज नहीं करता।'
            : '📌 This creates an authoritative record in the DoneKaro admin panel with a unique reference token. AI Support is read-only and cannot mutate complaints.'}
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
    )
  }

  /* Booking Selector View */
  return (
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
      ) : !isAuthenticated ? (
        <div className="p-6 rounded-2xl bg-slate-50 dark:bg-zinc-800/50 border border-slate-200 dark:border-zinc-700 text-center space-y-3 py-8">
          <ShieldAlert className="w-10 h-10 text-rose-500 mx-auto" />
          <div>
            <p className="text-sm font-bold text-slate-900 dark:text-zinc-100">
              {isHindi ? 'खाता लॉगिन आवश्यक' : 'Account Login Required'}
            </p>
            <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1 max-w-sm mx-auto leading-relaxed">
              {isHindi
                ? 'आधिकारिक शिकायत दर्ज करने और उसकी प्रगति को ट्रैक करने के लिए कृपया अपने सत्यापित DoneKaro खाते में लॉगिन करें।'
                : 'To file a formal dispute and track resolution progress against verified bookings, please sign in to your DoneKaro account.'}
            </p>
          </div>
          <div className="flex gap-2 justify-center pt-2">
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
            <button
              type="button"
              onClick={() => switchTab('suggestion')}
              className="px-4 py-2.5 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 hover:bg-slate-200 dark:hover:bg-zinc-700 transition-colors"
            >
              {isHindi ? 'सुझाव देखें' : 'View Suggestions'}
            </button>
          </div>
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
                ? 'शिकायत केवल उन बुकिंग पर दर्ज की जा सकती है जिनमें कामगार/ग्राहक असाइन हो चुका हो। यदि आपको सामान्य प्लेटफ़ॉर्म सुझाव देना है, तो कृपया सुझाव टैब का उपयोग करें।'
                : 'Complaints can only be filed against bookings with an assigned worker or customer. For general feedback, please use the Suggestion tab.'}
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
                    #DK-{b.bookingId.slice(0, 8).toUpperCase()}
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
  )
}

export default ComplaintTab

/**
 * Support Request Confirmation Modal
 * Dedicated confirmation UI for reviewing and explicitly submitting a complaint.
 * Ensures the user has reviewed booking reference, trade category, and description
 * before any record is created in the database.
 */

import React, { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import {
  AlertCircle,
  CheckCircle2,
  X,
  Loader2,
  Calendar,
  Briefcase,
  User,
  ShieldAlert,
} from 'lucide-react'
import {
  fetchBookingDetailsForSupport,
  submitSupportComplaint,
  SupportBookingContext,
} from '../services/supportService'
import { ComplaintItem } from '../types'

export interface SupportRequestModalProps {
  isOpen: boolean
  onClose: () => void
  bookingId?: string | null
  initialReason?: string
  onSuccess?: (complaint: ComplaintItem) => void
  onViewHistory?: () => void
}

export const SupportRequestModal: React.FC<SupportRequestModalProps> = ({
  isOpen,
  onClose,
  bookingId,
  initialReason = '',
  onSuccess,
  onViewHistory,
}) => {
  const { t, i18n } = useTranslation()
  const isHindi = i18n.language === 'hi'

  const [bookingContext, setBookingContext] = useState<SupportBookingContext | null>(null)
  const [loadingContext, setLoadingContext] = useState(false)
  const [reason, setReason] = useState(initialReason)
  const [submitting, setSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [createdComplaint, setCreatedComplaint] = useState<ComplaintItem | null>(null)

  useEffect(() => {
    if (isOpen && bookingId) {
      setReason(initialReason || '')
      setErrorMessage(null)
      setCreatedComplaint(null)
      setLoadingContext(true)

      fetchBookingDetailsForSupport(bookingId)
        .then(ctx => {
          setBookingContext(ctx)
          if (!ctx) {
            setErrorMessage(
              isHindi
                ? 'बुकिंग सत्यापन विफल रहा। कृपया सुनिश्चित करें कि आप इस बुकिंग के प्रतिभागी हैं।'
                : 'Booking verification failed. Please ensure you are an authorized participant.'
            )
          }
        })
        .catch(() => {
          setErrorMessage(
            isHindi
              ? 'बुकिंग विवरण लोड करने में असमर्थ।'
              : 'Unable to load booking details for support request.'
          )
        })
        .finally(() => {
          setLoadingContext(false)
        })
    } else {
      setBookingContext(null)
      setReason('')
      setErrorMessage(null)
      setCreatedComplaint(null)
    }
  }, [isOpen, bookingId, initialReason, isHindi])

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!bookingId || submitting) return

    const trimmed = reason.trim()
    if (trimmed.length < 10) {
      setErrorMessage(
        isHindi
          ? 'कृपया अपनी समस्या का विवरण कम से कम 10 अक्षरों में लिखें।'
          : 'Please describe the issue in at least 10 characters.'
      )
      return
    }

    setSubmitting(true)
    setErrorMessage(null)

    try {
      const res = await submitSupportComplaint({
        bookingId,
        reason: trimmed,
      })

      if (res.success && res.complaint) {
        setCreatedComplaint(res.complaint)
        if (onSuccess) {
          onSuccess(res.complaint)
        }
      } else {
        setErrorMessage(
          res.error ||
            (isHindi
              ? 'अनुरोध दर्ज करने में समस्या आई। कृपया पुनः प्रयास करें।'
              : 'Failed to submit support request. Please try again.')
        )
      }
    } catch {
      setErrorMessage(
        isHindi
          ? 'सर्वर से संपर्क करने में असमर्थ। कृपया बाद में प्रयास करें।'
          : 'An unexpected error occurred. Please try again.'
      )
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/75 backdrop-blur-sm animate-fade-in"
      onClick={e => {
        if (e.target === e.currentTarget && !submitting) onClose()
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="support-modal-title"
    >
      <div className="w-full sm:max-w-lg bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-t-3xl sm:rounded-3xl shadow-2xl flex flex-col overflow-hidden text-slate-900 dark:text-zinc-100 max-h-[92vh]">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-100 dark:border-zinc-800 flex items-center justify-between bg-slate-50/70 dark:bg-zinc-800/40">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center border border-rose-500/20">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h3 id="support-modal-title" className="text-base font-bold text-slate-900 dark:text-white">
                {isHindi ? 'सहायता एवं शिकायत अनुरोध' : 'File a Support Request'}
              </h3>
              <p className="text-xs text-slate-500 dark:text-zinc-400">
                {isHindi
                  ? 'DoneKaro मॉडरेशन टीम द्वारा आधिकारिक समीक्षा'
                  : 'Reviewed directly by DoneKaro administration'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            disabled={submitting}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-200 dark:hover:text-white dark:hover:bg-zinc-700 transition-colors disabled:opacity-50"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 overflow-y-auto">
          {createdComplaint ? (
            /* Authoritative Success State */
            <div className="space-y-5 text-center py-3">
              <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto border border-emerald-500/20 shadow-inner">
                <CheckCircle2 className="w-8 h-8" />
              </div>

              <div>
                <h4 className="text-lg font-bold text-slate-900 dark:text-white">
                  {isHindi ? 'सहायता अनुरोध सफलतापूर्वक दर्ज हुआ' : 'Support Request Submitted'}
                </h4>
                <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1">
                  {isHindi
                    ? 'आपकी शिकायत सुरक्षित रूप से दर्ज कर ली गई है।'
                    : 'Your request has been registered in the authoritative system.'}
                </p>
              </div>

              {/* Authoritative record card */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-zinc-800/60 border border-slate-200 dark:border-zinc-700 text-left space-y-2.5 text-xs">
                <div className="flex justify-between items-center pb-2 border-b border-slate-200 dark:border-zinc-700">
                  <span className="text-slate-500 dark:text-zinc-400 font-medium">
                    {isHindi ? 'शिकायत संदर्भ संख्या' : 'Complaint Reference'}:
                  </span>
                  <span className="font-mono font-bold text-slate-900 dark:text-white bg-slate-200 dark:bg-zinc-700 px-2 py-0.5 rounded">
                    #CMP-{createdComplaint.id.slice(0, 8).toUpperCase()}
                  </span>
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
                  <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400 border border-amber-200 dark:border-amber-500/30 uppercase">
                    {createdComplaint.status}
                  </span>
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
                  ? '⚠️ DoneKaro प्रशासन टीम सेवा मानकों और सुरक्षा नियमों के तहत इसकी समीक्षा करेगी। AI सपोर्ट केवल जानकारी प्रदान करता है और इसमें स्वतः बदलाव नहीं कर सकता।'
                  : '⚠️ The DoneKaro admin team will review this incident in accordance with platform policies. AI Support is read-only and cannot alter complaint statuses.'}
              </p>

              <div className="flex flex-col sm:flex-row gap-2.5 pt-2">
                {onViewHistory && (
                  <button
                    onClick={() => {
                      onClose()
                      onViewHistory()
                    }}
                    className="flex-1 py-2.5 px-4 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-slate-800 dark:text-zinc-200 transition-colors"
                  >
                    {isHindi ? 'शिकायत इतिहास देखें' : 'View Support History'}
                  </button>
                )}
                <button
                  onClick={onClose}
                  className="flex-1 py-2.5 px-4 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white transition-colors shadow-sm"
                >
                  {isHindi ? 'समाप्त' : 'Done'}
                </button>
              </div>
            </div>
          ) : loadingContext ? (
            /* Loading Booking Context */
            <div className="py-12 flex flex-col items-center justify-center gap-3 text-slate-500">
              <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
              <p className="text-xs">{isHindi ? 'बुकिंग सत्यापन किया जा रहा है...' : 'Verifying booking context...'}</p>
            </div>
          ) : (
            /* Review & Edit Form */
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Authoritative Booking Context Preview */}
              {bookingContext && (
                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-zinc-800/60 border border-slate-200 dark:border-zinc-700/80 space-y-2 text-xs">
                  <div className="flex items-center justify-between font-semibold text-slate-800 dark:text-zinc-200">
                    <span className="flex items-center gap-1.5">
                      <Briefcase className="w-3.5 h-3.5 text-amber-500" />
                      {bookingContext.categoryName}
                    </span>
                    <span className="font-mono text-[11px] text-slate-500 dark:text-zinc-400">
                      #DK-{bookingContext.bookingId.slice(0, 8).toUpperCase()}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-slate-600 dark:text-zinc-400 pt-1 border-t border-slate-200/60 dark:border-zinc-700/60">
                    <span className="flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-blue-500" />
                      {bookingContext.counterpartyName}
                    </span>
                    <span className="flex items-center gap-1.5 text-[11px]">
                      <Calendar className="w-3.5 h-3.5 text-purple-500" />
                      {bookingContext.bookingStatus.toUpperCase()}
                    </span>
                  </div>
                </div>
              )}

              {/* Error Banner */}
              {errorMessage && (
                <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 text-rose-700 dark:text-rose-400 text-xs flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <p>{errorMessage}</p>
                </div>
              )}

              {/* Description Input */}
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
                      ? 'समस्या का कारण लिखें (उदा. बिना ऐप स्वीकृति के अतिरिक्त नकद माँगा गया, काम अधूरा छोड़ा गया, या कामगार समय पर नहीं आया)...'
                      : 'Please describe what happened (e.g. unapproved offline cash demands, incomplete repair work, no-show, or safety concerns)...'
                  }
                  rows={4}
                  maxLength={1000}
                  disabled={submitting}
                  className="w-full text-xs rounded-xl p-3 bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent text-slate-900 dark:text-white placeholder-slate-400 resize-none disabled:opacity-50"
                />
                <div className="flex justify-between items-center text-[10px] text-slate-400">
                  <span>{isHindi ? 'न्यूनतम 10 अक्षर आवश्यक' : 'Minimum 10 characters required'}</span>
                  <span>{reason.length}/1000</span>
                </div>
              </div>

              {/* Platform Assurance Notice */}
              <div className="p-3 rounded-xl bg-amber-50/70 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-900/30 text-[11px] text-amber-800 dark:text-amber-300/90 leading-relaxed">
                {isHindi
                  ? '📌 यह अनुरोध DoneKaro व्यवस्थापक पैनल में सुरक्षित रूप से दर्ज होगा। AI सहायक स्वयं कोई शिकायत दर्ज नहीं करता है।'
                  : '📌 This request will be submitted to the official DoneKaro administration panel. AI Support cannot create complaints on your behalf.'}
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={submitting}
                  className="px-4 py-2.5 rounded-xl text-xs font-medium text-slate-600 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors disabled:opacity-50"
                >
                  {isHindi ? 'रद्द करें' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  disabled={submitting || reason.trim().length < 10 || !bookingContext}
                  className="px-5 py-2.5 rounded-xl text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 disabled:bg-slate-300 dark:disabled:bg-zinc-700 disabled:cursor-not-allowed transition-all shadow-sm flex items-center gap-1.5"
                >
                  {submitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>{isHindi ? 'सहायता अनुरोध सबमिट करें' : 'Submit Support Request'}</span>
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
export default SupportRequestModal

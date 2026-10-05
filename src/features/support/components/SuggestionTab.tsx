import React, { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Sparkles, Copy, Check, AlertCircle, Loader2 } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { useSupport } from '../context/SupportContext'
import { submitSupportSuggestion } from '../services/supportService'
import { SuggestionCategory, SuggestionItem } from '../types'
import { SupportStatusBadge } from './SupportStatusBadge'

interface SuggestionTabProps {
  isHindi: boolean
}

export function getSuggestionCategoryLabel(category: SuggestionCategory, isHindi: boolean): string {
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

export const SuggestionTab: React.FC<SuggestionTabProps> = ({ isHindi }) => {
  const navigate = useNavigate()
  const { isAuthenticated } = useAuth()
  const { closeSupport, switchTab } = useSupport()

  const [suggestionCategory, setSuggestionCategory] = useState<SuggestionCategory>('app_experience')
  const [suggestionText, setSuggestionText] = useState('')
  const [submittingSuggestion, setSubmittingSuggestion] = useState(false)
  const [suggestionError, setSuggestionError] = useState<string | null>(null)
  const [createdSuggestion, setCreatedSuggestion] = useState<SuggestionItem | null>(null)
  const [copiedSuggestionToken, setCopiedSuggestionToken] = useState(false)

  const copyTimerRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    return () => {
      if (copyTimerRef.current) {
        clearTimeout(copyTimerRef.current)
      }
    }
  }, [])

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text)
    setCopiedSuggestionToken(true)
    if (copyTimerRef.current) clearTimeout(copyTimerRef.current)
    copyTimerRef.current = setTimeout(() => setCopiedSuggestionToken(false), 2500)
  }

  const handleSuggestionSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!isAuthenticated) {
      closeSupport()
      navigate('/login')
      return
    }

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

  if (createdSuggestion) {
    return (
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
              {copiedSuggestionToken ? (
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
            <SupportStatusBadge status={createdSuggestion.status} isHindi={isHindi} />
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
    )
  }

  return (
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
          disabled={!isAuthenticated ? false : (suggestionText.trim().length < 10 || submittingSuggestion)}
          className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-xs font-semibold text-slate-950 bg-amber-500 hover:bg-amber-400 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-xs cursor-pointer"
        >
          {!isAuthenticated ? (
            <span>{isHindi ? 'सुझाव भेजने के लिए लॉगिन करें' : 'Sign In to Submit Feedback'}</span>
          ) : submittingSuggestion ? (
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
  )
}

export default SuggestionTab

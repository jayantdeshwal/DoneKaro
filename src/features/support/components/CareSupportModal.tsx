/**
 * Care & Support Modal
 * Thin orchestrator component for the authoritative platform support channel.
 * Delegates tab-specific functionality to ComplaintTab, SuggestionTab, and SupportHistoryTab.
 */

import React from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { ShieldAlert, MessageSquare, FileText, X } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { useSupport } from '../context/SupportContext'
import { ComplaintTab } from './ComplaintTab'
import { SuggestionTab } from './SuggestionTab'
import { SupportHistoryTab } from './SupportHistoryTab'

export const CareSupportModal: React.FC = () => {
  const { i18n } = useTranslation()
  const isHindi = i18n.language === 'hi'
  const navigate = useNavigate()
  const { isAuthenticated } = useAuth()

  const { isOpen, activeTab, closeSupport, switchTab } = useSupport()

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/75 backdrop-blur-sm animate-fade-in"
      onClick={e => {
        if (e.target === e.currentTarget) closeSupport()
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
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-200 dark:hover:text-white dark:hover:bg-zinc-700 transition-colors cursor-pointer"
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

        {/* Guest Informational Banner */}
        {!isAuthenticated && (
          <div className="mx-4 mt-3 px-3.5 py-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-between gap-3 text-xs shrink-0">
            <p className="text-amber-800 dark:text-amber-300 leading-snug">
              {isHindi
                ? 'अतिथि मोड: औपचारिक शिकायत निवारण और अनुरोध ट्रैकिंग के लिए खाते में लॉगिन होना आवश्यक है।'
                : 'Guest Mode: Official dispute resolution, complaint tracking, and suggestions require an authenticated account.'}
            </p>
            <button
              type="button"
              onClick={() => {
                closeSupport()
                navigate('/login')
              }}
              className="px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-white font-semibold text-[11px] whitespace-nowrap transition-colors cursor-pointer shadow-xs shrink-0"
            >
              {isHindi ? 'लॉगिन' : 'Sign In'}
            </button>
          </div>
        )}

        {/* Tab Body */}
        <div className="p-5 overflow-y-auto flex-1">
          {activeTab === 'complaint' && <ComplaintTab isHindi={isHindi} />}
          {activeTab === 'suggestion' && <SuggestionTab isHindi={isHindi} />}
          {activeTab === 'history' && <SupportHistoryTab isHindi={isHindi} />}
        </div>
      </div>
    </div>
  )
}

export default CareSupportModal

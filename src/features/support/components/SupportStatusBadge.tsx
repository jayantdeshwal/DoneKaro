import React from 'react'
import { Clock, HelpCircle, CheckCircle2, Ban } from 'lucide-react'
import { ComplaintStatus, SuggestionStatus } from '../types'

interface SupportStatusBadgeProps {
  status: ComplaintStatus | SuggestionStatus
  isHindi: boolean
}

export const SupportStatusBadge: React.FC<SupportStatusBadgeProps> = ({ status, isHindi }) => {
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

export default SupportStatusBadge

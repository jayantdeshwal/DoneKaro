import {
  Loader2,
  CheckCircle2,
  Play,
  Clock,
  AlertCircle,
  XCircle,
  type LucideIcon,
} from 'lucide-react'
import type { BookingStatus } from '../types'

export interface StatusConfigItem {
  label: string
  icon: LucideIcon
  badgeClass: string
}

export const statusConfig: Record<BookingStatus, StatusConfigItem> = {
  pending: {
    label: 'Pending',
    icon: Loader2,
    badgeClass: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20',
  },
  accepted: {
    label: 'Accepted',
    icon: CheckCircle2,
    badgeClass: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20',
  },
  in_progress: {
    label: 'In Progress',
    icon: Play,
    badgeClass: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20',
  },
  completed: {
    label: 'Completed',
    icon: CheckCircle2,
    badgeClass: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20',
  },
  payment_pending: {
    label: 'Payment Pending',
    icon: Clock,
    badgeClass: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20',
  },
  rejected: {
    label: 'Declined',
    icon: AlertCircle,
    badgeClass: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20',
  },
  cancelled: {
    label: 'Cancelled',
    icon: XCircle,
    badgeClass: 'bg-slate-500/10 text-slate-600 dark:text-zinc-400 border border-slate-300 dark:border-zinc-700',
  },
  disputed: {
    label: 'Disputed',
    icon: AlertCircle,
    badgeClass: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20',
  },
}

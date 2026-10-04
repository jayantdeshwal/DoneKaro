import React from 'react'
import { useTranslation } from 'react-i18next'
import { Banknote, ChevronRight, Star } from 'lucide-react'

interface BusinessSummaryProps {
  completedJobsCount: number
  totalPaymentsReceived: number
  thisMonthPayments: number
  averageJobPayment: number
  hasCompletedPaidJobs: boolean
  onViewReviews: () => void
}

export const BusinessSummary: React.FC<BusinessSummaryProps> = ({
  completedJobsCount,
  totalPaymentsReceived,
  thisMonthPayments,
  averageJobPayment,
  hasCompletedPaidJobs,
  onViewReviews,
}) => {
  const { t } = useTranslation()

  return (
    <div className="mb-4 p-4 rounded-2xl bg-surface-100 border border-semantic-border-light shadow-sm space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-500">
            <Banknote className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              {t('workerDashboard.businessSummary', 'Business Summary')}
            </h3>
            <p className="text-[10px] text-semantic-text-secondary">
              {t(
                'workerDashboard.zeroCommissionNotice',
                '0% platform commission — 100% of cash earnings are yours'
              )}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={onViewReviews}
          className="px-2.5 py-1 rounded-xl bg-surface-200 hover:bg-surface-300 text-brand-400 text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
        >
          <Star className="w-3 h-3 fill-brand-400" />
          <span>{t('workerDashboard.customerReviews', 'Customer Reviews')}</span>
          <ChevronRight className="w-3 h-3 opacity-70" />
        </button>
      </div>

      {/* Metrics 4-tile grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
        <div className="p-3 rounded-xl bg-surface-200/50 border border-semantic-border-light/60">
          <span className="text-[10px] font-semibold text-semantic-text-tertiary block">
            {t('workerDashboard.completedJobs', 'Completed Jobs')}
          </span>
          <span className="text-base font-extrabold text-slate-900 dark:text-white mt-0.5 block">
            {completedJobsCount}
          </span>
        </div>

        <div className="p-3 rounded-xl bg-surface-200/50 border border-semantic-border-light/60">
          <span className="text-[10px] font-semibold text-semantic-text-tertiary block">
            {t('workerDashboard.paymentsReceived', 'Payments Received')}
          </span>
          <span className="text-base font-extrabold text-emerald-500 mt-0.5 block">
            ₹{totalPaymentsReceived.toFixed(2)}
          </span>
        </div>

        <div className="p-3 rounded-xl bg-surface-200/50 border border-semantic-border-light/60">
          <span className="text-[10px] font-semibold text-semantic-text-tertiary block">
            {t('workerDashboard.thisMonthPayments', 'This Month')}
          </span>
          <span className="text-base font-extrabold text-blue-500 dark:text-blue-400 mt-0.5 block">
            ₹{thisMonthPayments.toFixed(2)}
          </span>
        </div>

        <div className="p-3 rounded-xl bg-surface-200/50 border border-semantic-border-light/60">
          <span className="text-[10px] font-semibold text-semantic-text-tertiary block">
            {t('workerDashboard.averagePayment', 'Avg. per Job')}
          </span>
          <span className="text-base font-extrabold text-slate-900 dark:text-white mt-0.5 block">
            {hasCompletedPaidJobs ? `₹${averageJobPayment.toFixed(2)}` : '—'}
          </span>
        </div>
      </div>
    </div>
  )
}

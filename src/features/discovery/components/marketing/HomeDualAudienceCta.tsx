import { useTranslation } from 'react-i18next'
import { motion } from 'framer-motion'
import { Button, Badge } from '@/ui'
import { Search, Briefcase } from 'lucide-react'

interface HomeDualAudienceCtaProps {
  onCustomerCta: () => void
  onWorkerCta: () => void
}

export function HomeDualAudienceCta({
  onCustomerCta,
  onWorkerCta,
}: HomeDualAudienceCtaProps) {
  const { t } = useTranslation()

  return (
    <section className="section bg-white dark:bg-zinc-950 border-t border-slate-200 dark:border-zinc-800 py-14">
      <div className="container-app">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Card 1: For Customers */}
          <motion.div
            whileHover={{ y: -3, scale: 1.01 }}
            transition={{ type: 'spring', stiffness: 350, damping: 24 }}
            className="p-6 sm:p-7 rounded-3xl bg-gradient-to-br from-amber-50/70 via-white to-slate-50 dark:from-zinc-900 dark:via-zinc-900 dark:to-zinc-900 border border-amber-200/80 dark:border-zinc-800 relative overflow-hidden flex flex-col justify-between shadow-md dark:shadow-lg"
          >
            <div className="absolute -top-12 -right-12 w-40 h-40 bg-amber-500/10 dark:bg-brand-500/10 rounded-full blur-3xl pointer-events-none" />
            <div>
              <Badge variant="brand" size="sm" className="mb-3">
                {t('homeCta.badgeVerified')}
              </Badge>
              <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white mb-1.5">
                {t('homeCta.customerCardTitle')}
              </h3>
              <p className="text-xs text-slate-600 dark:text-zinc-400 leading-relaxed mb-5">
                {t('homeCta.customerCardSubtitle')}
              </p>
            </div>

            <div>
              <Button
                variant="primary"
                size="md"
                onClick={onCustomerCta}
                className="w-full sm:w-auto font-semibold px-6 shadow-md shadow-amber-500/20 text-xs sm:text-sm active:scale-95 cursor-pointer"
              >
                <Search className="w-4 h-4 mr-2" />
                <span>{t('homeCta.customerCardBtn')}</span>
              </Button>
            </div>
          </motion.div>

          {/* Card 2: For Workers */}
          <motion.div
            whileHover={{ y: -3, scale: 1.01 }}
            transition={{ type: 'spring', stiffness: 350, damping: 24 }}
            className="p-6 sm:p-7 rounded-3xl bg-gradient-to-br from-emerald-50/70 via-white to-slate-50 dark:from-zinc-900 dark:via-zinc-900 dark:to-zinc-900 border border-emerald-200/80 dark:border-emerald-500/30 relative overflow-hidden flex flex-col justify-between shadow-md dark:shadow-lg"
          >
            <div className="absolute -top-12 -right-12 w-40 h-40 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
            <div>
              <Badge variant="success" size="sm" className="mb-3">
                {t('homeCta.workerCardBadge', '0% Commission for Starting 3 Months')}
              </Badge>
              <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white mb-1.5">
                {t('homeCta.workerCardTitle')}
              </h3>
              <p className="text-xs text-slate-600 dark:text-zinc-400 leading-relaxed mb-5">
                {t('homeCta.workerCardSubtitle')}
              </p>
            </div>

            <div>
              <Button
                variant="outline"
                size="md"
                onClick={onWorkerCta}
                className="w-full sm:w-auto font-semibold px-6 border-emerald-600 dark:border-emerald-500/50 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 text-xs sm:text-sm active:scale-95 cursor-pointer"
              >
                <Briefcase className="w-4 h-4 mr-2" />
                <span>{t('homeCta.workerCardBtn')}</span>
              </Button>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}

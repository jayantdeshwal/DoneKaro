import { useTranslation } from 'react-i18next'
import { motion } from 'framer-motion'
import { ShieldCheck, CheckCircle2, Star } from 'lucide-react'

export function HomeReviewGuarantee() {
  const { t } = useTranslation()

  return (
    <section className="py-12 sm:py-16 bg-slate-50/60 dark:bg-zinc-900/50 border-b border-slate-200 dark:border-zinc-800 relative overflow-hidden">
      <div className="container-app relative z-10">
        <div className="max-w-3xl mx-auto text-center mb-10">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ type: 'spring', stiffness: 350, damping: 24 }}
            className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/25 text-emerald-700 dark:text-emerald-400 text-xs font-semibold tracking-wide mb-3 shadow-sm"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span>{t('home.reviewGuaranteeBadge')}</span>
          </motion.div>

          <motion.h2
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ type: 'spring', stiffness: 350, damping: 24, delay: 0.05 }}
            className="text-xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight"
          >
            {t('home.reviewGuaranteeTitle')}
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ type: 'spring', stiffness: 350, damping: 24, delay: 0.1 }}
            className="text-xs sm:text-sm text-slate-600 dark:text-zinc-400 mt-2 max-w-2xl mx-auto leading-relaxed"
          >
            {t('home.reviewGuaranteeSubtitle')}
          </motion.p>
        </div>

        <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-5">
          <motion.div
            whileHover={{ y: -3, scale: 1.02 }}
            transition={{ type: 'spring', stiffness: 350, damping: 24 }}
            className="p-5 rounded-2xl bg-white dark:bg-zinc-900/80 border border-slate-200/90 dark:border-zinc-800 hover:border-emerald-500/40 dark:hover:border-emerald-500/50 transition-all shadow-sm hover:shadow-md flex flex-col items-center text-center"
          >
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 dark:bg-emerald-500/15 border border-emerald-500/25 dark:border-emerald-500/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400 mb-3">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-sm text-slate-900 dark:text-white mb-1.5">
              {t('home.reviewPillar1Title')}
            </h3>
            <p className="text-xs text-slate-600 dark:text-zinc-400 leading-relaxed">
              {t('home.reviewPillar1Desc')}
            </p>
          </motion.div>

          <motion.div
            whileHover={{ y: -3, scale: 1.02 }}
            transition={{ type: 'spring', stiffness: 350, damping: 24 }}
            className="p-5 rounded-2xl bg-white dark:bg-zinc-900/80 border border-slate-200/90 dark:border-zinc-800 hover:border-amber-500/40 dark:hover:border-amber-500/50 transition-all shadow-sm hover:shadow-md flex flex-col items-center text-center"
          >
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 dark:bg-amber-500/15 border border-amber-500/25 dark:border-amber-500/30 flex items-center justify-center text-amber-600 dark:text-amber-400 mb-3">
              <Star className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-sm text-slate-900 dark:text-white mb-1.5">
              {t('home.reviewPillar2Title')}
            </h3>
            <p className="text-xs text-slate-600 dark:text-zinc-400 leading-relaxed">
              {t('home.reviewPillar2Desc')}
            </p>
          </motion.div>

          <motion.div
            whileHover={{ y: -3, scale: 1.02 }}
            transition={{ type: 'spring', stiffness: 350, damping: 24 }}
            className="p-5 rounded-2xl bg-white dark:bg-zinc-900/80 border border-slate-200/90 dark:border-zinc-800 hover:border-blue-500/40 dark:hover:border-blue-500/50 transition-all shadow-sm hover:shadow-md flex flex-col items-center text-center"
          >
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 dark:bg-blue-500/15 border border-blue-500/25 dark:border-blue-500/30 flex items-center justify-center text-blue-600 dark:text-blue-400 mb-3">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-sm text-slate-900 dark:text-white mb-1.5">
              {t('home.reviewPillar3Title')}
            </h3>
            <p className="text-xs text-slate-600 dark:text-zinc-400 leading-relaxed">
              {t('home.reviewPillar3Desc')}
            </p>
          </motion.div>
        </div>
      </div>
    </section>
  )
}

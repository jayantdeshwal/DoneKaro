import { useTranslation } from 'react-i18next'
import { motion } from 'framer-motion'
import { AlertCircle, CheckCircle2, Check, X, XCircle } from 'lucide-react'

export function HomeProblemSection() {
  const { t } = useTranslation()

  return (
    <section className="py-12 sm:py-16 bg-white dark:bg-zinc-950 border-b border-slate-200 dark:border-zinc-800 relative overflow-hidden">
      {/* Subtle Ambient Glow */}
      <div className="absolute top-0 right-1/4 w-80 h-80 bg-rose-500/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-1/4 w-80 h-80 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />

      <div className="container-app relative z-10">
        <div className="max-w-3xl mx-auto text-center mb-10">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ type: 'spring', stiffness: 350, damping: 24 }}
            className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/25 text-amber-700 dark:text-amber-400 text-xs font-semibold tracking-wide mb-3 shadow-sm"
          >
            <AlertCircle className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
            <span>{t('home.problemBadge')}</span>
          </motion.div>

          <motion.h2
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ type: 'spring', stiffness: 350, damping: 24, delay: 0.05 }}
            className="text-xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight leading-tight"
          >
            {t('home.problemTitle')}
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ type: 'spring', stiffness: 350, damping: 24, delay: 0.1 }}
            className="text-xs sm:text-sm text-slate-600 dark:text-zinc-400 mt-2 max-w-2xl mx-auto leading-relaxed"
          >
            {t('home.problemSubtitle')}
          </motion.p>
        </div>

        {/* Interactive Comparison Columns */}
        <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6">
          {/* The Old Unorganized Way */}
          <motion.div
            initial={{ opacity: 0, x: -24 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            whileHover={{ y: -6, scale: 1.012 }}
            transition={{ type: 'spring', stiffness: 350, damping: 25 }}
            className="rounded-3xl p-5 sm:p-6 bg-rose-50/50 dark:bg-zinc-900/90 border border-rose-200 dark:border-rose-500/30 relative overflow-hidden shadow-xl hover:border-rose-300 dark:hover:border-rose-500/50 hover:shadow-2xl transition-all"
          >
            <div className="flex items-center justify-between pb-4 mb-4 border-b border-rose-200 dark:border-rose-500/20">
              <div>
                <h3 className="text-sm sm:text-base font-extrabold text-rose-600 dark:text-rose-400 flex items-center gap-2">
                  <XCircle className="w-5 h-5 text-rose-500 dark:text-rose-400 shrink-0" />
                  <span>{t('home.problemOldHeader')}</span>
                </h3>
                <p className="text-[11px] text-slate-500 dark:text-zinc-400 mt-0.5">
                  {t('home.problemOldSub')}
                </p>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-100 dark:bg-rose-500/15 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-500/30">
                Unreliable
              </span>
            </div>

            <div className="space-y-3">
              {[
                { title: t('home.problem1OldTitle'), desc: t('home.problem1OldDesc') },
                { title: t('home.problem2OldTitle'), desc: t('home.problem2OldDesc') },
                { title: t('home.problem3OldTitle'), desc: t('home.problem3OldDesc') },
              ].map((item, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-2xl bg-white/90 dark:bg-zinc-950/70 border border-rose-100 dark:border-rose-500/20 flex items-start gap-3 transition-colors hover:bg-white dark:hover:bg-zinc-950/90 shadow-xs"
                >
                  <div className="w-6 h-6 rounded-full bg-rose-100 dark:bg-rose-500/15 border border-rose-200 dark:border-rose-500/30 flex items-center justify-center text-rose-600 dark:text-rose-400 shrink-0 mt-0.5">
                    <X className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white leading-tight">
                      {item.title}
                    </h4>
                    <p className="text-[11px] text-slate-600 dark:text-zinc-400 mt-0.5 leading-snug">
                      {item.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          {/* The DoneKaro Standard */}
          <motion.div
            initial={{ opacity: 0, x: 24 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            whileHover={{ y: -6, scale: 1.012 }}
            transition={{ type: 'spring', stiffness: 350, damping: 25 }}
            className="rounded-3xl p-5 sm:p-6 bg-emerald-50/50 dark:bg-zinc-900/90 border border-emerald-200 dark:border-emerald-500/30 relative overflow-hidden shadow-xl hover:border-emerald-300 dark:hover:border-emerald-500/60 hover:shadow-2xl transition-all"
          >
            <div className="flex items-center justify-between pb-4 mb-4 border-b border-emerald-200 dark:border-emerald-500/20">
              <div>
                <h3 className="text-sm sm:text-base font-extrabold text-emerald-700 dark:text-emerald-400 flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <span>{t('home.problemNewHeader')}</span>
                </h3>
                <p className="text-[11px] text-slate-500 dark:text-zinc-400 mt-0.5">
                  {t('home.problemNewSub')}
                </p>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-500/15 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-500/30">
                Direct & Trusted
              </span>
            </div>

            <div className="space-y-3">
              {[
                { title: t('home.problem1NewTitle'), desc: t('home.problem1NewDesc') },
                { title: t('home.problem2NewTitle'), desc: t('home.problem2NewDesc') },
                { title: t('home.problem3NewTitle'), desc: t('home.problem3NewDesc') },
              ].map((item, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-2xl bg-white/90 dark:bg-zinc-950/70 border border-emerald-100 dark:border-emerald-500/20 flex items-start gap-3 transition-colors hover:bg-white dark:hover:bg-zinc-950/90 shadow-xs"
                >
                  <div className="w-6 h-6 rounded-full bg-emerald-100 dark:bg-emerald-500/15 border border-emerald-200 dark:border-emerald-500/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5">
                    <Check className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white leading-tight">
                      {item.title}
                    </h4>
                    <p className="text-[11px] text-slate-600 dark:text-zinc-400 mt-0.5 leading-snug">
                      {item.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}

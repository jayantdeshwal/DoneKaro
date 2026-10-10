import { useTranslation } from 'react-i18next'
import { motion } from 'framer-motion'
import { ShieldCheck, Percent, PhoneCall, Users } from 'lucide-react'

interface HomeSocialProofProps {
  workerCount: number
}

export function HomeSocialProof({ workerCount }: HomeSocialProofProps) {
  const { t } = useTranslation()

  return (
    <section className="py-5 sm:py-6 bg-slate-50/80 dark:bg-zinc-950 border-b border-slate-200/80 dark:border-zinc-800/60">
      <div className="container-app">
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 sm:gap-3.5">
            <motion.div
              whileHover={{ y: -3, scale: 1.02 }}
              transition={{ type: 'spring', stiffness: 350, damping: 24 }}
              className="p-3.5 sm:p-4 rounded-2xl bg-white dark:bg-zinc-900/70 border border-slate-200/80 dark:border-zinc-800 hover:border-emerald-500/50 hover:shadow-md transition-all flex flex-col items-center justify-center text-center gap-1 shadow-sm"
            >
              <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400 mb-1">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <span className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                {t('home.statVerified')}
              </span>
              <span className="text-[10px] text-slate-500 dark:text-zinc-400">
                Aadhaar & Admin Approved
              </span>
            </motion.div>

            <motion.div
              whileHover={{ y: -3, scale: 1.02 }}
              transition={{ type: 'spring', stiffness: 350, damping: 24 }}
              className="p-3.5 sm:p-4 rounded-2xl bg-white dark:bg-zinc-900/70 border border-slate-200/80 dark:border-zinc-800 hover:border-amber-500/50 hover:shadow-md transition-all flex flex-col items-center justify-center text-center gap-1 shadow-sm"
            >
              <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-600 dark:text-amber-400 mb-1">
                <Percent className="w-4 h-4" />
              </div>
              <span className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                {t('home.statCommission')}
              </span>
              <span className="text-[10px] text-slate-500 dark:text-zinc-400">
                Zero Middleman Markup
              </span>
            </motion.div>

            <motion.div
              whileHover={{ y: -3, scale: 1.02 }}
              transition={{ type: 'spring', stiffness: 350, damping: 24 }}
              className="p-3.5 sm:p-4 rounded-2xl bg-white dark:bg-zinc-900/70 border border-slate-200/80 dark:border-zinc-800 hover:border-blue-500/50 hover:shadow-md transition-all flex flex-col items-center justify-center text-center gap-1 shadow-sm"
            >
              <div className="w-8 h-8 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-600 dark:text-blue-400 mb-1">
                <PhoneCall className="w-4 h-4" />
              </div>
              <span className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                {t('home.statDirect')}
              </span>
              <span className="text-[10px] text-slate-500 dark:text-zinc-400">
                {t('home.directWhatsapp', 'Direct WhatsApp & Call')}
              </span>
            </motion.div>

            <motion.div
              whileHover={{ y: -3, scale: 1.02 }}
              transition={{ type: 'spring', stiffness: 350, damping: 24 }}
              className="p-3.5 sm:p-4 rounded-2xl bg-white dark:bg-zinc-900/70 border border-slate-200/80 dark:border-zinc-800 hover:border-amber-500/50 hover:shadow-md transition-all flex flex-col items-center justify-center text-center gap-1 shadow-sm"
            >
              <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-600 dark:text-amber-400 mb-1">
                <Users className="w-4 h-4" />
              </div>
              <span className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                {workerCount > 0 ? `${workerCount}+ ${t('home.verifiedArtisans', 'Verified Workers')}` : t('home.statHyperlocal')}
              </span>
              <span className="text-[10px] text-slate-500 dark:text-zinc-400">
                {t('home.dedicatedPincodes', 'Dedicated to 251001 & 251002')}
              </span>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  )
}

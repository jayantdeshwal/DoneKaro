import { useTranslation } from 'react-i18next'
import { motion } from 'framer-motion'
import { Sparkles } from 'lucide-react'

export function HomeHeroSection() {
  const { t } = useTranslation()

  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-white via-slate-50/60 to-white dark:from-zinc-950 dark:via-zinc-900 dark:to-zinc-950 pt-8 sm:pt-14 pb-8 border-b border-slate-200/80 dark:border-zinc-800/60">
      {/* Subtle Ambient Background Glow */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-96 sm:w-[600px] h-64 bg-amber-500/10 dark:bg-brand-500/10 rounded-full blur-3xl" />
      </div>

      <div className="container-app relative z-10">
        <div className="max-w-4xl mx-auto text-center">
          {/* Hyperlocal Trust Badge */}
          <motion.div
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: 'spring', stiffness: 350, damping: 24 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-700 dark:text-amber-400 text-xs font-semibold tracking-wide mb-3.5 shadow-sm backdrop-blur-xs"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
            <span>{t('home.heroBadge')}</span>
          </motion.div>

          {/* Main Headline */}
          <motion.h1
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: 'spring', stiffness: 350, damping: 24, delay: 0.05 }}
            className="text-2xl sm:text-4xl lg:text-5xl font-black tracking-tight text-slate-900 dark:text-white leading-tight mb-3 sm:mb-4 drop-shadow-xs"
          >
            {t('home.heroTitle')}
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: 'spring', stiffness: 350, damping: 24, delay: 0.1 }}
            className="text-xs sm:text-sm md:text-base text-slate-600 dark:text-zinc-400 max-w-2xl mx-auto leading-relaxed"
          >
            {t('home.heroSubtitle')}
          </motion.p>
        </div>
      </div>
    </section>
  )
}

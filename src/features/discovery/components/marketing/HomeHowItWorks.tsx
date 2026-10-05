import { useTranslation } from 'react-i18next'
import { motion } from 'framer-motion'
import { Button } from '@/ui'
import { Bot } from 'lucide-react'

interface HomeHowItWorksProps {
  onOpenAiAssistant: () => void
}

export function HomeHowItWorks({ onOpenAiAssistant }: HomeHowItWorksProps) {
  const { t } = useTranslation()

  return (
    <section className="section bg-white dark:bg-zinc-950 py-12 sm:py-16 border-b border-slate-200 dark:border-zinc-800">
      <div className="container-app">
        <div className="text-center max-w-2xl mx-auto mb-10">
          <h2 className="text-xl sm:text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
            {t('home.howTitle')}
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-zinc-400 mt-1.5 leading-relaxed">
            {t('home.howSubtitle')}
          </p>
        </div>

        {/* Timeline Grid with Connected Glowing Rail */}
        <div className="relative">
          {/* Connected Glowing Timeline Bar behind steps on desktop */}
          <div className="hidden md:block absolute top-7 left-14 right-14 h-1 bg-slate-200 dark:bg-zinc-800 rounded-full z-0 pointer-events-none overflow-hidden">
            <motion.div
              initial={{ width: '0%' }}
              whileInView={{ width: '100%' }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 1.2, ease: 'easeOut' }}
              className="h-full bg-gradient-to-r from-amber-500 via-amber-400 to-emerald-400 rounded-full shadow-lg shadow-amber-500/30 dark:shadow-brand-500/50"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 relative z-10">
            {[
              {
                step: '01',
                title: t('home.howStep1Title'),
                desc: t('home.howStep1Desc'),
                badge: t('home.howStep1Badge'),
              },
              {
                step: '02',
                title: t('home.howStep2Title'),
                desc: t('home.howStep2Desc'),
                badge: t('home.howStep2Badge'),
              },
              {
                step: '03',
                title: t('home.howStep3Title'),
                desc: t('home.howStep3Desc'),
                badge: t('home.howStep3Badge'),
              },
              {
                step: '04',
                title: t('home.howStep4Title'),
                desc: t('home.howStep4Desc'),
                badge: t('home.howStep4Badge'),
              },
            ].map((item, idx) => (
              <motion.div
                key={item.step}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.2 }}
                transition={{ type: 'spring', stiffness: 350, damping: 24, delay: idx * 0.1 }}
                whileHover={{ y: -6, scale: 1.02 }}
                className="relative p-5 rounded-2xl bg-slate-50/70 dark:bg-zinc-900/80 border border-slate-200/90 dark:border-zinc-800 hover:border-amber-500/60 dark:hover:border-amber-500/50 transition-all shadow-sm hover:shadow-md group"
              >
                <div className="flex items-center justify-between mb-3.5">
                  <div className="w-10 h-10 rounded-xl bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 flex items-center justify-center text-amber-600 dark:text-amber-400 font-mono font-black text-base shadow-xs group-hover:bg-amber-500 group-hover:text-white transition-all">
                    {item.step}
                  </div>
                  <span className="text-[10px] font-semibold text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-200/80 dark:border-amber-500/20">
                    {item.badge}
                  </span>
                </div>
                <h3 className="font-bold text-sm text-slate-900 dark:text-white mb-1.5 group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
                  {item.title}
                </h3>
                <p className="text-xs text-slate-600 dark:text-zinc-400 leading-relaxed">
                  {item.desc}
                </p>
              </motion.div>
            ))}
          </div>
        </div>

        {/* AI Assistant Quick Help Launcher Banner */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ type: 'spring', stiffness: 350, damping: 24 }}
          className="mt-8 max-w-2xl mx-auto p-4 rounded-2xl bg-gradient-to-r from-amber-500/10 via-purple-500/10 to-amber-500/10 dark:from-zinc-900 dark:via-zinc-900 dark:to-zinc-900 border border-amber-500/25 dark:border-amber-500/30 flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left shadow-md"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/15 dark:bg-amber-500/20 border border-amber-500/25 dark:border-amber-500/30 flex items-center justify-center text-amber-600 dark:text-amber-400 shrink-0">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                {t('home.aiUnsure', 'Not sure what repair you need?')}
              </h4>
              <p className="text-[11px] text-slate-600 dark:text-zinc-400">
                {t('home.aiDescription', 'Get AI assistance with understanding your service request.')}
              </p>
            </div>
          </div>
          <Button
            variant="primary"
            size="sm"
            onClick={onOpenAiAssistant}
            className="text-xs font-bold px-4 py-1.5 shrink-0 shadow-md shadow-amber-500/20 active:scale-95 cursor-pointer"
          >
            <span>{t('home.askAi', 'Ask AI →')}</span>
          </Button>
        </motion.div>
      </div>
    </section>
  )
}

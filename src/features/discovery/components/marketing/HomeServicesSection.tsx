import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  Zap,
  Scissors,
  Flower2,
  Snowflake,
  Sparkles,
  ArrowRight,
  Grid,
} from 'lucide-react'

interface HomeServicesSectionProps {
  onQuickPick: (categoryId: string) => void
  onOpenAllServices: () => void
  onQuickEmergencyFilter: () => void
}

export function HomeServicesSection({
  onQuickPick,
  onOpenAllServices,
  onQuickEmergencyFilter,
}: HomeServicesSectionProps) {
  const { t } = useTranslation()

  return (
    <section className="py-10 sm:py-14 bg-slate-50/60 dark:bg-zinc-900/50 border-b border-slate-200 dark:border-zinc-800">
      <div className="container-app relative z-10">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-5 px-1">
            <div>
              <h2 className="text-base sm:text-xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                <span>{t('home.popularCategories', 'Popular Services')}</span>
                <span className="text-[10px] bg-amber-500/15 text-amber-700 dark:text-amber-400 font-bold px-2 py-0.5 rounded-full border border-amber-500/30">
                  {t('home.sameDay', 'Same-Day')}
                </span>
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-zinc-400 mt-0.5">
                {t('home.servicesSubtitle', 'Book verified local technicians with 0% commission')}
              </p>
            </div>

            <Link
              to="/search"
              className="text-xs sm:text-sm font-bold text-amber-600 dark:text-amber-400 hover:text-amber-700 dark:hover:text-amber-300 flex items-center gap-1 transition-colors"
            >
              <span>{t('common.viewAll', 'View All')}</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {/* Grid of 6 Clean Cards with Motion Micro-Interactions */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
            {/* Card 1: InstaHelp (Emergency Kaamgar) */}
            <motion.div
              whileHover={{ y: -4, scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              transition={{ type: 'spring', stiffness: 350, damping: 24 }}
              onClick={onQuickEmergencyFilter}
              className="group p-4 sm:p-5 rounded-2xl bg-white dark:bg-zinc-900/80 border border-slate-200/90 dark:border-zinc-800 hover:border-amber-500/60 dark:hover:border-amber-500/60 shadow-sm hover:shadow-xl transition-all cursor-pointer relative overflow-hidden flex flex-col items-center text-center"
            >
              <div className="w-12 h-12 mb-2.5 rounded-2xl bg-amber-500/10 dark:bg-amber-500/15 border border-amber-500/25 dark:border-amber-500/30 flex items-center justify-center text-amber-600 dark:text-amber-400 group-hover:scale-110 transition-transform">
                <Zap className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
                {t('home.instaHelp', 'InstaHelp (Emergency)')}
              </h3>
              <span className="mt-1 text-[10px] font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200/60 dark:border-emerald-500/25 px-2 py-0.5 rounded-full">
                {t('home.fastestArrival', 'Verified Technicians')}
              </span>
            </motion.div>

            {/* Card 2: Parlour Service & Care */}
            <motion.div
              whileHover={{ y: -4, scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              transition={{ type: 'spring', stiffness: 350, damping: 24 }}
              onClick={() => onQuickPick('parlour_service')}
              className="group p-4 sm:p-5 rounded-2xl bg-white dark:bg-zinc-900/80 border border-slate-200/90 dark:border-zinc-800 hover:border-pink-500/60 dark:hover:border-pink-500/60 hover:shadow-xl transition-all cursor-pointer relative overflow-hidden flex flex-col items-center text-center shadow-sm"
            >
              <div className="w-12 h-12 mb-2.5 rounded-2xl bg-pink-500/10 dark:bg-pink-500/15 border border-pink-500/25 dark:border-pink-500/30 flex items-center justify-center text-pink-600 dark:text-pink-400 group-hover:scale-110 transition-transform">
                <Flower2 className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white group-hover:text-pink-600 dark:group-hover:text-pink-400 transition-colors">
                {t('categories.parlour_service', 'Parlour Service')}
              </h3>
              <span className="mt-1 text-[10px] font-semibold text-pink-700 dark:text-pink-300 bg-pink-50 dark:bg-pink-500/10 border border-pink-200/60 dark:border-pink-500/25 px-2 py-0.5 rounded-full">
                {t('home.personalCare', 'Personal Care')}
              </span>
            </motion.div>

            {/* Card 3: Carpenter & Woodwork */}
            <motion.div
              whileHover={{ y: -4, scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              transition={{ type: 'spring', stiffness: 350, damping: 24 }}
              onClick={() => onQuickPick('carpenter')}
              className="group p-4 sm:p-5 rounded-2xl bg-white dark:bg-zinc-900/80 border border-slate-200/90 dark:border-zinc-800 hover:border-amber-500/60 dark:hover:border-amber-500/60 hover:shadow-xl transition-all cursor-pointer relative overflow-hidden flex flex-col items-center text-center shadow-sm"
            >
              <div className="w-12 h-12 mb-2.5 rounded-2xl bg-amber-500/10 dark:bg-amber-500/15 border border-amber-500/25 dark:border-amber-500/30 flex items-center justify-center text-amber-600 dark:text-amber-400 group-hover:scale-110 transition-transform">
                <Scissors className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
                {t('categories.carpenter', 'Carpenter & Woodwork')}
              </h3>
              <span className="mt-1 text-[10px] font-semibold text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-500/10 border border-amber-200/60 dark:border-amber-500/25 px-2 py-0.5 rounded-full">
                {t('home.furnitureFix', 'Furniture Fix')}
              </span>
            </motion.div>

            {/* Card 4: Part-time Home Maid */}
            <motion.div
              whileHover={{ y: -4, scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              transition={{ type: 'spring', stiffness: 350, damping: 24 }}
              onClick={() => onQuickPick('part_time_maid')}
              className="group p-4 sm:p-5 rounded-2xl bg-white dark:bg-zinc-900/80 border border-slate-200/90 dark:border-zinc-800 hover:border-emerald-500/60 dark:hover:border-emerald-500/60 hover:shadow-xl transition-all cursor-pointer relative overflow-hidden flex flex-col items-center text-center shadow-sm"
            >
              <div className="w-12 h-12 mb-2.5 rounded-2xl bg-emerald-500/10 dark:bg-emerald-500/15 border border-emerald-500/25 dark:border-emerald-500/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400 group-hover:scale-110 transition-transform">
                <Sparkles className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                {t('categories.part_time_maid', 'Part-time Home Maid')}
              </h3>
              <span className="mt-1 text-[10px] font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200/60 dark:border-emerald-500/25 px-2 py-0.5 rounded-full">
                {t('home.homeHelp', 'Home Help')}
              </span>
            </motion.div>

            {/* Card 5: AC & Appliance Repair */}
            <motion.div
              whileHover={{ y: -4, scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              transition={{ type: 'spring', stiffness: 350, damping: 24 }}
              onClick={() => onQuickPick('ac_repair')}
              className="group p-4 sm:p-5 rounded-2xl bg-white dark:bg-zinc-900/80 border border-slate-200/90 dark:border-zinc-800 hover:border-cyan-500/60 dark:hover:border-cyan-500/60 hover:shadow-xl transition-all cursor-pointer relative overflow-hidden flex flex-col items-center text-center shadow-sm"
            >
              <div className="w-12 h-12 mb-2.5 rounded-2xl bg-cyan-500/10 dark:bg-cyan-500/15 border border-cyan-500/25 dark:border-cyan-500/30 flex items-center justify-center text-cyan-600 dark:text-cyan-400 group-hover:scale-110 transition-transform">
                <Snowflake className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white group-hover:text-cyan-600 dark:group-hover:text-cyan-400 transition-colors">
                {t('categories.ac_repair', 'AC Repair & Service')}
              </h3>
              <span className="mt-1 text-[10px] font-semibold text-cyan-700 dark:text-cyan-300 bg-cyan-50 dark:bg-cyan-500/10 border border-cyan-200/60 dark:border-cyan-500/25 px-2 py-0.5 rounded-full">
                {t('home.minutes', 'Repair & Service')}
              </span>
            </motion.div>

            {/* Card 6: All Services (Grid Launcher) */}
            <motion.div
              whileHover={{ y: -4, scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              transition={{ type: 'spring', stiffness: 350, damping: 24 }}
              onClick={onOpenAllServices}
              className="group p-4 sm:p-5 rounded-2xl bg-white dark:bg-zinc-900/80 border border-slate-200/90 dark:border-zinc-800 hover:border-amber-500/60 dark:hover:border-amber-500/60 hover:shadow-xl transition-all cursor-pointer relative overflow-hidden flex flex-col items-center text-center shadow-sm"
            >
              <div className="w-12 h-12 mb-2.5 rounded-2xl bg-amber-500/10 dark:bg-amber-500/15 border border-amber-500/25 dark:border-amber-500/30 flex items-center justify-center text-amber-600 dark:text-amber-400 group-hover:scale-110 transition-transform">
                <Grid className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
                {t('home.allServicesGrid', 'All Services')}
              </h3>
              <span className="mt-1 text-[10px] font-semibold text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-500/10 border border-amber-200/60 dark:border-amber-500/25 px-2 py-0.5 rounded-full">
                {t('home.moreServices', 'Electrician, Plumber +')}
              </span>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  )
}

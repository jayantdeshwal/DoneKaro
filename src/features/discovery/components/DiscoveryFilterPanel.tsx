import { useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/ui'
import {
  CATEGORIES,
  MUZAFFARNAGAR_PINCODES,
  getCategoryName,
} from '@kaamgar/shared'
import {
  Zap,
  Wrench,
  Hammer,
  Snowflake,
  Brush,
  Sparkles,
  Scissors,
  Flower2,
  MapPin,
  X,
  Grid,
  SlidersHorizontal,
  Flame,
} from 'lucide-react'
import { POPULAR_SEARCHES } from '../utils/taxonomy'
import type { CategoryWorkerStat } from '../types'

const iconMap: Record<string, any> = {
  zap: Zap,
  wrench: Wrench,
  hammer: Hammer,
  snowflake: Snowflake,
  brush: Brush,
  sparkles: Sparkles,
  scissors: Scissors,
  flower: Flower2,
}

interface DiscoveryFilterPanelProps {
  isOpen: boolean
  onClose: () => void
  selectedArea: string
  setSelectedArea: (area: string) => void
  selectedCategory: string
  setSelectedCategory: (cat: string) => void
  workerStats: Record<string, CategoryWorkerStat>
  filterButtonRef?: React.RefObject<HTMLButtonElement>
}

export function DiscoveryFilterPanel({
  isOpen,
  onClose,
  selectedArea,
  setSelectedArea,
  selectedCategory,
  setSelectedCategory,
  workerStats,
  filterButtonRef,
}: DiscoveryFilterPanelProps) {
  const { t, i18n } = useTranslation()
  const filterPanelRef = useRef<HTMLDivElement>(null)

  // Close filter panel on click outside or Escape key
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        filterPanelRef.current &&
        !filterPanelRef.current.contains(event.target as Node) &&
        filterButtonRef?.current &&
        !filterButtonRef.current.contains(event.target as Node)
      ) {
        onClose()
      }
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        onClose()
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      document.addEventListener('keydown', handleKeyDown)
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen, onClose, filterButtonRef])

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          ref={filterPanelRef}
          initial={{ opacity: 0, y: -6, scale: 0.99 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -6, scale: 0.99 }}
          transition={{ duration: 0.15 }}
          className="absolute left-3 right-3 sm:left-6 sm:right-6 top-full mt-2 z-30 p-4 sm:p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 shadow-xl max-h-[65vh] overflow-y-auto space-y-4"
        >
          {/* Header with Title & Close button */}
          <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-zinc-800">
            <div className="flex items-center gap-2">
              <SlidersHorizontal className="w-4 h-4 text-amber-500" />
              <span className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                {t('home.filterPanelTitle', 'Filter Services & Local Areas')}
              </span>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="w-7 h-7 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-slate-500 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white flex items-center justify-center transition-colors cursor-pointer"
              aria-label="Close filters"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* 1. Local Area Filter */}
          <div>
            <h4 className="text-xs font-bold text-slate-600 dark:text-zinc-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>{t('home.stickyAreasTitle', 'Select Local Area')}</span>
            </h4>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => {
                  setSelectedArea('')
                  onClose()
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors cursor-pointer ${
                  !selectedArea
                    ? 'bg-emerald-50 dark:bg-emerald-500/20 border-emerald-500 text-emerald-700 dark:text-emerald-300 font-bold'
                    : 'bg-slate-50 dark:bg-zinc-800 border-slate-200 dark:border-zinc-700 text-slate-700 dark:text-zinc-300 hover:bg-slate-100 dark:hover:text-white'
                }`}
              >
                All Muzaffarnagar
              </button>
              {MUZAFFARNAGAR_PINCODES.map(pincode => (
                <button
                  key={pincode}
                  type="button"
                  onClick={() => {
                    setSelectedArea(selectedArea === pincode ? '' : pincode)
                    onClose()
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors cursor-pointer ${
                    selectedArea === pincode
                      ? 'bg-emerald-50 dark:bg-emerald-500/20 border-emerald-500 text-emerald-700 dark:text-emerald-300 font-bold'
                      : 'bg-slate-50 dark:bg-zinc-800 border-slate-200 dark:border-zinc-700 text-slate-700 dark:text-zinc-300 hover:bg-slate-100 dark:hover:text-white'
                  }`}
                >
                  {pincode} - {pincode === '251001' ? t('home.cityNewMandi', 'City / New Mandi') : t('home.canttCivilLines', 'Cantt / Civil Lines')}
                </button>
              ))}
            </div>
          </div>

          {/* 2. Popular Search Shortcuts */}
          <div className="pt-2 border-t border-slate-200 dark:border-zinc-800">
            <h4 className="text-xs font-bold text-slate-600 dark:text-zinc-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Flame className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400" />
              <span>{t('home.stickyPopularSearches', 'Popular Searches')}</span>
            </h4>
            <div className="flex flex-wrap gap-1.5">
              {POPULAR_SEARCHES.map(item => (
                <button
                  key={item.labelKey}
                  type="button"
                  onClick={() => {
                    setSelectedCategory(item.category)
                    onClose()
                  }}
                  className="px-2.5 py-1 rounded-md text-[11px] font-medium bg-slate-50 hover:bg-slate-100 dark:bg-zinc-800/80 dark:hover:bg-zinc-700 border border-slate-200 dark:border-zinc-700 text-slate-700 dark:text-zinc-300 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
                >
                  {t(item.labelKey)}
                </button>
              ))}
            </div>
          </div>

          {/* 3. Service Category Filter */}
          <div className="pt-2 border-t border-slate-200 dark:border-zinc-800">
            <div className="flex items-center justify-between mb-2.5">
              <h4 className="text-xs font-bold text-slate-600 dark:text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
                <Grid className="w-3.5 h-3.5 text-amber-500" />
                <span>{t('home.stickyCategoriesTitle', 'Select Service Category')}</span>
              </h4>
              <span className="text-[11px] text-slate-500 dark:text-zinc-400">{t('home.tapApplyClose', 'Tap to apply & close')}</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {/* All Services option */}
              <button
                type="button"
                onClick={() => {
                  setSelectedCategory('')
                  onClose()
                }}
                className={`p-2.5 rounded-xl border text-left flex items-center gap-2.5 transition-all cursor-pointer ${
                  !selectedCategory
                    ? 'bg-amber-50 dark:bg-amber-500/20 border-amber-500 text-amber-800 dark:text-amber-300 shadow-sm'
                    : 'bg-slate-50/80 hover:bg-slate-100 dark:bg-zinc-800/80 dark:hover:bg-zinc-700 border-slate-200 dark:border-zinc-700 text-slate-800 dark:text-zinc-200'
                }`}
              >
                <div className="w-8 h-8 rounded-lg bg-amber-500/10 dark:bg-amber-500/15 border border-amber-500/25 flex items-center justify-center text-amber-600 dark:text-amber-400 shrink-0">
                  <Wrench className="w-4 h-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold truncate text-slate-900 dark:text-zinc-100">
                    {t('categories.all', 'All Services')}
                  </p>
                  <p className="text-[10px] text-slate-500 dark:text-zinc-400 truncate">
                    View all
                  </p>
                </div>
              </button>

              {/* Canonical Categories / Services */}
              {CATEGORIES.map(cat => {
                const Icon = iconMap[cat.icon as keyof typeof iconMap] || Wrench
                const isSelected = selectedCategory === cat.id
                const stat = workerStats[cat.id]
                const totalCount = stat ? stat.total : 0

                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => {
                      setSelectedCategory(cat.id)
                      onClose()
                    }}
                    className={`p-2.5 rounded-xl border text-left flex items-center gap-2.5 transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-amber-50 dark:bg-amber-500/20 border-amber-500 text-amber-800 dark:text-amber-300 shadow-sm'
                        : 'bg-slate-50/80 hover:bg-slate-100 dark:bg-zinc-800/80 dark:hover:bg-zinc-700 border-slate-200 dark:border-zinc-700 text-slate-800 dark:text-zinc-200 hover:border-amber-500/40'
                    }`}
                  >
                    <div className="w-8 h-8 rounded-lg bg-amber-500/10 dark:bg-amber-500/15 border border-amber-500/25 flex items-center justify-center text-amber-600 dark:text-amber-400 shrink-0">
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-semibold truncate text-slate-900 dark:text-zinc-100">
                        {getCategoryName(cat, i18n.language === 'hi' ? 'hi' : 'en')}
                      </p>
                      <p className="text-[10px] text-slate-500 dark:text-zinc-400 truncate">
                        {totalCount > 0 ? `${totalCount} ${t('home.verified', 'Verified')}` : t('home.sameDay', 'Same-day')}
                      </p>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Bottom Filter Controls */}
          <div className="pt-3 border-t border-slate-200 dark:border-zinc-800 flex items-center justify-between">
            <button
              type="button"
              onClick={() => {
                setSelectedCategory('')
                setSelectedArea('')
                onClose()
              }}
              className="text-xs text-slate-500 hover:text-slate-900 dark:text-zinc-400 dark:hover:text-white cursor-pointer font-medium"
            >
              {t('common.clearFilters', 'Clear Filters')}
            </button>
            <Button
              variant="primary"
              size="sm"
              onClick={onClose}
              className="text-xs font-bold px-4 cursor-pointer"
            >
              {t('common.done', 'Done')}
            </Button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

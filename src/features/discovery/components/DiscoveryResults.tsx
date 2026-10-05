import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Button, Avatar } from '@/ui'
import {
  Search,
  ShieldCheck,
  Star,
  MapPin,
  ArrowRight,
  Bot,
} from 'lucide-react'
import type { PublicWorker } from '../types'

interface DiscoveryResultsProps {
  isVisible: boolean
  searchQuery: string
  selectedCategory: string
  selectedArea: string
  matchingWorkers: PublicWorker[]
  getCategoryDisplayName: (catId: string) => string
  onClearFilters: () => void
  onSelectCategory: (catId: string) => void
  onOpenAiAssistant: () => void
}

export function DiscoveryResults({
  isVisible,
  searchQuery,
  selectedCategory,
  selectedArea,
  matchingWorkers,
  getCategoryDisplayName,
  onClearFilters,
  onSelectCategory,
  onOpenAiAssistant,
}: DiscoveryResultsProps) {
  const { t } = useTranslation()

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.section
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
          className="py-8 sm:py-10 bg-slate-50/80 dark:bg-zinc-950 border-b border-slate-200 dark:border-zinc-800 relative z-10"
        >
          <div className="container-app">
            <div className="max-w-5xl mx-auto">
              {/* Results Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
                <div>
                  <h2 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
                    <span>{t('home.verifiedArtisans', 'Verified Artisans')}</span>
                    <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/30">
                      {matchingWorkers.length} {t('home.found', 'Found')}
                    </span>
                  </h2>
                  <p className="text-xs text-slate-600 dark:text-zinc-400 mt-1">
                    {t('home.resultsSubtitle', 'Direct phone & WhatsApp connection • 0% platform fee • Aadhaar & Police verified')}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={onClearFilters}
                    className="text-xs font-semibold text-slate-500 hover:text-slate-800 dark:text-zinc-400 dark:hover:text-white px-3 py-1.5 rounded-lg border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 transition-colors cursor-pointer"
                  >
                    {t('home.clearResults', 'Clear Results')}
                  </button>
                  <Link
                    to={`/search?${new URLSearchParams({
                      ...(searchQuery ? { q: searchQuery } : {}),
                      ...(selectedCategory ? { category: selectedCategory } : {}),
                      ...(selectedArea ? { area: selectedArea } : {}),
                    }).toString()}`}
                    className="text-xs font-bold text-amber-600 dark:text-amber-400 hover:underline flex items-center gap-1"
                  >
                    <span>{t('home.fullDirectory', 'Full Directory')}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>

              {/* Worker Results Grid */}
              {matchingWorkers.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
                  {matchingWorkers.map(worker => {
                    const catName = worker.categories && worker.categories.length > 0
                      ? worker.categories.map(c => getCategoryDisplayName(c)).join(' • ')
                      : getCategoryDisplayName('electrician')

                    return (
                      <div
                        key={worker.id}
                        className="p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200/90 dark:border-zinc-800 shadow-sm hover:shadow-md hover:border-amber-500/50 dark:hover:border-amber-500/40 transition-all flex flex-col justify-between"
                      >
                        <div>
                          {/* Top row: Avatar, Name, Verification, Availability */}
                          <div className="flex items-start gap-3.5">
                            <Avatar
                              name={worker.name}
                              src={worker.avatar || undefined}
                              size="lg"
                              className="shrink-0 ring-2 ring-amber-500/20"
                            />
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-1.5">
                                <h3 className="font-bold text-sm text-slate-900 dark:text-white truncate">
                                  {worker.name}
                                </h3>
                                <span title={t('home.verifiedArtisan', 'Verified Artisan')}>
                                  <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
                                </span>
                              </div>
                              <p className="text-xs text-amber-600 dark:text-amber-400 font-semibold truncate mt-0.5" title={catName}>
                                {catName}
                              </p>
                              <div className="flex items-center gap-2 mt-1 text-[11px] text-slate-500 dark:text-zinc-400">
                                <span className="flex items-center gap-0.5 text-amber-500 font-bold">
                                  <Star className="w-3 h-3 fill-amber-500" />
                                  <span>{worker.rating > 0 ? worker.rating.toFixed(1) : t('home.noRatings', 'No ratings yet')}</span>
                                </span>
                                <span>•</span>
                                <span>{worker.reviews} {t('common.reviews', 'reviews')}</span>
                                <span>•</span>
                                <span>{worker.experience} {t('home.yearsShort', 'yrs exp')}</span>
                              </div>
                            </div>
                          </div>

                          {/* Bio / Services */}
                          {worker.bio && (
                            <p className="text-xs text-slate-600 dark:text-zinc-400 line-clamp-2 mt-3 leading-relaxed">
                              {worker.bio}
                            </p>
                          )}

                          {/* Service Areas */}
                          <div className="flex items-center gap-1.5 mt-3 text-[11px] text-slate-500 dark:text-zinc-400">
                            <MapPin className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                            <span className="truncate">
                              {t('home.areas', 'Areas')}: {worker.areas.join(', ') || t('home.allMuzaffarnagar', 'All Muzaffarnagar')}
                            </span>
                          </div>
                        </div>

                        {/* Footer action */}
                        <div className="mt-4 pt-3.5 border-t border-slate-100 dark:border-zinc-800/80 flex items-center justify-between">
                          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
                            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                            <span>{worker.available ? t('home.availableNow', 'Available Now') : t('home.acceptingCalls', 'Accepting Calls')}</span>
                          </span>
                          <Link
                            to={`/worker/${worker.id}`}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold shadow-xs active:scale-95 transition-all"
                          >
                            <span>{t('home.viewAndCall', 'View & Call')}</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </Link>
                        </div>
                      </div>
                    )
                  })}
                </div>
              ) : (
                /* Empty state when query or filter yields no approved worker */
                <div className="py-10 px-4 rounded-3xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-center max-w-xl mx-auto shadow-sm">
                  <div className="w-12 h-12 rounded-2xl bg-amber-500/10 dark:bg-amber-500/15 border border-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto mb-3">
                    <Search className="w-6 h-6" />
                  </div>
                  <h3 className="font-bold text-base text-slate-900 dark:text-white mb-1">
                    {t('home.noMatchingArtisans', 'No matching verified artisans found')}
                  </h3>
                  <p className="text-xs text-slate-600 dark:text-zinc-400 leading-relaxed max-w-md mx-auto mb-4">
                    {searchQuery
                      ? `We couldn't find an approved artisan matching "${searchQuery}" in Muzaffarnagar right now.`
                      : t('home.noApprovedMatch', 'No approved artisans match the selected category or area filters.')}
                  </p>

                  {/* Quick fallback category suggestions */}
                  <div className="mb-4">
                    <p className="text-[11px] font-semibold text-slate-500 dark:text-zinc-400 mb-2">
                      {t('home.tryCategories', 'Try one of our active categories:')}
                    </p>
                    <div className="flex flex-wrap justify-center gap-1.5">
                      {['plumber', 'electrician', 'parlour_service', 'ac_repair', 'carpenter'].map(catId => (
                        <button
                          key={catId}
                          type="button"
                          onClick={() => onSelectCategory(catId)}
                          className="px-2.5 py-1 rounded-lg text-xs font-medium bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-300 border border-slate-200 dark:border-zinc-700 transition-colors cursor-pointer"
                        >
                          {getCategoryDisplayName(catId)}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center justify-center gap-2">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={onClearFilters}
                      className="text-xs font-bold"
                    >
                      Reset All Filters
                    </Button>
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={onOpenAiAssistant}
                      className="text-xs font-bold inline-flex items-center gap-1.5"
                    >
                      <Bot className="w-3.5 h-3.5" />
                      <span>{t('home.askAiAssistant', 'Ask AI Assistant')}</span>
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </motion.section>
      )}
    </AnimatePresence>
  )
}

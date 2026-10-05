import React, { useRef, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/ui'
import { Search, MapPin, SlidersHorizontal, X, ArrowLeft } from 'lucide-react'

interface DiscoverySearchBarProps {
  searchQuery: string
  setSearchQuery: (query: string) => void
  isFilterOpen: boolean
  setIsFilterOpen: React.Dispatch<React.SetStateAction<boolean>>
  activeFilterCount: number
  selectedArea: string
  selectedCategory: string
  setSelectedArea: (area: string) => void
  setSelectedCategory: (cat: string) => void
  getCategoryDisplayName: (catId: string) => string
  isGuestMode: boolean
  onBackToLogin: () => void
  onSearchSubmit?: (e?: React.FormEvent) => void
  searchContainerRef?: React.RefObject<HTMLDivElement>
  filterButtonRef?: React.RefObject<HTMLButtonElement>
  filterPanel?: React.ReactNode
}

export function DiscoverySearchBar({
  searchQuery,
  setSearchQuery,
  isFilterOpen,
  setIsFilterOpen,
  activeFilterCount,
  selectedArea,
  selectedCategory,
  setSelectedArea,
  setSelectedCategory,
  getCategoryDisplayName,
  isGuestMode,
  onBackToLogin,
  onSearchSubmit,
  searchContainerRef,
  filterButtonRef,
  filterPanel,
}: DiscoverySearchBarProps) {
  const { t } = useTranslation()
  const searchInputRef = useRef<HTMLInputElement>(null)

  // Rotating placeholder suggestion
  const [placeholderIndex, setPlaceholderIndex] = useState(0)
  const placeholders = [
    t('categories.electrician', 'Electrician'),
    t('categories.plumber', 'Plumber'),
    t('categories.ac_repair', 'AC Repair & Service'),
    t('categories.part_time_maid', 'Part-time Home Maid'),
    t('categories.parlour_service', 'Parlour Service'),
    t('categories.carpenter', 'Carpenter'),
    t('categories.painter', 'Painter'),
    t('categories.car_mechanic', 'Car Mechanic'),
  ]

  useEffect(() => {
    const timer = setInterval(() => {
      setPlaceholderIndex(prev => (prev + 1) % placeholders.length)
    }, 2800)
    return () => clearInterval(timer)
  }, [placeholders.length])

  const hasActiveSearchOrFilter = Boolean(searchQuery.trim() || selectedCategory || selectedArea)

  const clearAllSearchAndFilters = () => {
    setSearchQuery('')
    setSelectedCategory('')
    setSelectedArea('')
  }

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    setIsFilterOpen(false)
    if (onSearchSubmit) onSearchSubmit(e)
  }

  return (
    <div
      ref={searchContainerRef}
      className="sticky top-16 z-30 bg-white/95 dark:bg-zinc-950/95 backdrop-blur-md border-b border-slate-200/80 dark:border-zinc-800 shadow-sm transition-all"
    >
      <div className="max-w-4xl mx-auto px-3 sm:px-6 py-2.5 sm:py-3 relative">
        {/* Location indicator & delivery speed banner */}
        <div className="flex items-center justify-between gap-2 mb-1.5 px-1">
          <div className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-zinc-400 min-w-0">
            {isGuestMode && (
              <button
                type="button"
                onClick={onBackToLogin}
                className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-600 dark:text-amber-400 hover:text-amber-700 mr-1 pr-1.5 border-r border-slate-200 dark:border-zinc-700 cursor-pointer shrink-0 transition-colors"
                title={t('common.backToLogin', 'Back to Login')}
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>{t('common.back', 'Back')}</span>
              </button>
            )}
            <MapPin className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
            <span className="font-semibold text-slate-900 dark:text-zinc-100 truncate">
              {selectedArea ? `${selectedArea} • ${t('home.city', 'Muzaffarnagar')}` : t('home.areaDefault', 'Muzaffarnagar (251001 & 251002)')}
            </span>
          </div>

          {/* Independent Filter Panel Toggle Button */}
          <button
            ref={filterButtonRef}
            type="button"
            onClick={() => setIsFilterOpen(prev => !prev)}
            aria-expanded={isFilterOpen}
            aria-label="Toggle filter options"
            className={`text-[11px] font-semibold flex items-center gap-1.5 px-2.5 py-1 rounded-lg border transition-all cursor-pointer ${
              isFilterOpen || activeFilterCount > 0
                ? 'bg-amber-500/10 border-amber-500/40 text-amber-700 dark:text-amber-400 dark:bg-amber-500/15'
                : 'bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 border-slate-200 dark:border-zinc-700 text-slate-700 dark:text-zinc-300'
            }`}
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>{isFilterOpen ? t('common.close', 'Close Filters') : t('common.filter', 'Filters')}</span>
            {activeFilterCount > 0 && (
              <span className="w-4 h-4 rounded-full bg-amber-500 text-white font-bold text-[10px] flex items-center justify-center">
                {activeFilterCount}
              </span>
            )}
          </button>
        </div>

        {/* Search Input Box */}
        <form
          onSubmit={handleSubmit}
          className="relative z-20 rounded-2xl border transition-all duration-200 flex items-center px-3 sm:px-4 py-2 sm:py-2.5 shadow-sm bg-white dark:bg-zinc-900 border-slate-200 dark:border-zinc-700 hover:border-amber-500/50 focus-within:border-amber-500/80 focus-within:ring-2 focus-within:ring-amber-500/20"
        >
          <Search className="w-4 h-4 sm:w-5 sm:h-5 text-amber-600 dark:text-amber-400 shrink-0 mr-2.5" />
          <input
            ref={searchInputRef}
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder={`${t('common.search', 'Search for')} '${placeholders[placeholderIndex]}' (e.g. parlour, electrician, plumber) ...`}
            className="w-full bg-transparent text-xs sm:text-sm text-slate-900 dark:text-zinc-100 placeholder:text-slate-400 dark:placeholder:text-zinc-500 focus:outline-none"
            aria-label="Search services or artisans"
          />

          {/* Clear Search Text Button */}
          {searchQuery && (
            <button
              type="button"
              onClick={() => {
                setSearchQuery('')
                searchInputRef.current?.focus()
              }}
              className="p-1 text-slate-400 hover:text-slate-700 dark:text-zinc-500 dark:hover:text-zinc-200 mr-1.5 cursor-pointer transition-colors"
              aria-label="Clear search text"
            >
              <X className="w-4 h-4" />
            </button>
          )}

          <Button
            type="submit"
            variant="primary"
            size="sm"
            className="px-3.5 sm:px-4 py-1.5 text-xs font-bold rounded-xl shadow-md shadow-brand-500/20 whitespace-nowrap active:scale-95 cursor-pointer"
          >
            {t('common.search', 'Search')}
          </Button>
        </form>

        {/* Active Filter Pills Bar */}
        {hasActiveSearchOrFilter && (
          <div className="flex flex-wrap items-center gap-1.5 mt-2 pt-2 border-t border-slate-200/60 dark:border-zinc-800/80">
            <span className="text-[11px] font-semibold text-slate-500 dark:text-zinc-400 mr-1">
              Active:
            </span>

            {/* Search Query Pill */}
            {searchQuery.trim() && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-500/10 border border-amber-500/30 text-amber-800 dark:text-amber-300">
                <span>Query: "{searchQuery.trim()}"</span>
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="hover:text-amber-950 dark:hover:text-white cursor-pointer ml-0.5"
                  aria-label="Remove search query"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}

            {/* Selected Category Pill */}
            {selectedCategory && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-500/10 border border-blue-500/30 text-blue-800 dark:text-blue-300">
                <span>Service: {getCategoryDisplayName(selectedCategory)}</span>
                <button
                  type="button"
                  onClick={() => setSelectedCategory('')}
                  className="hover:text-blue-950 dark:hover:text-white cursor-pointer ml-0.5"
                  aria-label="Remove category filter"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}

            {/* Selected Area Pill */}
            {selectedArea && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-500/10 border border-emerald-500/30 text-emerald-800 dark:text-emerald-300">
                <span>Area: {selectedArea}</span>
                <button
                  type="button"
                  onClick={() => setSelectedArea('')}
                  className="hover:text-emerald-950 dark:hover:text-white cursor-pointer ml-0.5"
                  aria-label="Remove area filter"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}

            {/* Clear All Action */}
            <button
              type="button"
              onClick={clearAllSearchAndFilters}
              className="text-[11px] font-bold text-slate-500 hover:text-rose-600 dark:text-zinc-400 dark:hover:text-rose-400 ml-auto transition-colors cursor-pointer"
            >
              Clear all
            </button>
          </div>
        )}

        {/* Filter Panel Slot */}
        {filterPanel}
      </div>
    </div>
  )
}

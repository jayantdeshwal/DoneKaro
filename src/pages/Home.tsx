import { useState, useEffect, useRef, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { motion, useScroll } from 'framer-motion'
import { Sparkles, ArrowLeft } from 'lucide-react'
import { fetchCategoryWorkerStats, fetchApprovedWorkers, CategoryWorkerStat, PublicWorker } from '@/services/workers'
import {
  getCategoryName,
  getServicesByCategoryId,
  getServiceById,
  getCategoryById,
} from '@kaamgar/shared'
import { useAiAssistant } from '@/features/ai-support'
import { useAuth } from '@/context/AuthContext'
import {
  getMatchingTaxonomyServiceIds,
  DiscoverySearchBar,
  DiscoveryFilterPanel,
  DiscoveryResults,
  HomeHeroSection,
  HomeSocialProof,
  HomeProblemSection,
  HomeServicesSection,
  HomeHowItWorks,
  HomeReviewGuarantee,
  HomeDualAudienceCta,
} from '@/features/discovery'

export default function Home() {
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()
  const aiAssistant = useAiAssistant()
  const { isAuthenticated } = useAuth()
  const isGuestMode = !isAuthenticated || (typeof window !== 'undefined' && sessionStorage.getItem('donekaro_guest_mode') === 'true')

  // Top viewport scroll progress
  const { scrollYProgress } = useScroll()

  const handleBackToLogin = () => {
    sessionStorage.removeItem('donekaro_guest_mode')
    window.dispatchEvent(new Event('storage'))
    navigate('/login')
  }

  // Search & Filter state — strictly decoupled
  const [searchQuery, setSearchQuery] = useState('')
  const [isFilterOpen, setIsFilterOpen] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState('')
  const [selectedArea, setSelectedArea] = useState('')

  // Real worker stats from database
  const [workerStats, setWorkerStats] = useState<Record<string, CategoryWorkerStat>>({})
  const [, setLoadingStats] = useState(true)

  // Live worker list from database
  const [allWorkers, setAllWorkers] = useState<PublicWorker[]>([])
  const searchContainerRef = useRef<HTMLDivElement>(null)
  const filterButtonRef = useRef<HTMLButtonElement>(null)

  // Load worker stats and public workers
  useEffect(() => {
    let isMounted = true
    Promise.all([
      fetchCategoryWorkerStats().catch(() => ({})),
      fetchApprovedWorkers().catch(() => []),
    ])
      .then(([stats, workers]) => {
        if (isMounted) {
          setWorkerStats(stats)
          setAllWorkers(workers)
        }
      })
      .finally(() => {
        if (isMounted) setLoadingStats(false)
      })

    return () => {
      isMounted = false
    }
  }, [])

  // Helper to get friendly name for any category or service
  const getCategoryDisplayName = (catId: string) => {
    const service = getServiceById(catId)
    if (service) return getCategoryName(service, i18n.language === 'hi' ? 'hi' : 'en')
    const categoryGroup = getCategoryById(catId)
    if (categoryGroup) return getCategoryName(categoryGroup, i18n.language === 'hi' ? 'hi' : 'en')
    return catId.replace(/_/g, ' ')
  }

  // Composed filter + search matching
  const matchingWorkers = useMemo(() => {
    const query = searchQuery.trim().toLowerCase()
    const matchedServiceIds = query ? getMatchingTaxonomyServiceIds(query) : new Set<string>()

    return allWorkers.filter(worker => {
      // 1. Category Filter Check (if selectedCategory is active)
      if (selectedCategory) {
        const childServices = getServicesByCategoryId(selectedCategory)
        const targetIds = new Set<string>([selectedCategory, ...childServices.map(s => s.id)])
        const matchesCat = worker.categories.some(c => targetIds.has(c))
        if (!matchesCat) return false
      }

      // 2. Area Filter Check (if selectedArea is active)
      if (selectedArea) {
        if (!worker.areas.includes(selectedArea)) return false
      }

      // 3. Search Query Check (if searchQuery is active)
      if (query) {
        const matchesName = worker.name.toLowerCase().includes(query)
        const matchesTaxonomy = matchedServiceIds.size > 0 && worker.categories.some(c => matchedServiceIds.has(c))

        if (matchedServiceIds.size > 0) {
          if (!matchesTaxonomy && !matchesName) {
            return false
          }
        } else {
          const matchesBio = (worker.bio || '').toLowerCase().includes(query)
          const matchesCategoryDirect = worker.categories.some(c => {
            const cClean = c.replace(/_/g, ' ').toLowerCase()
            return c.toLowerCase().includes(query) || cClean.includes(query) || query.includes(cClean)
          })

          if (!matchesName && !matchesBio && !matchesCategoryDirect) {
            return false
          }
        }
      }

      return true
    })
  }, [allWorkers, selectedCategory, selectedArea, searchQuery])

  const hasActiveSearchOrFilter = Boolean(searchQuery.trim() || selectedCategory || selectedArea)
  const activeFilterCount = (selectedCategory ? 1 : 0) + (selectedArea ? 1 : 0)

  const clearAllSearchAndFilters = () => {
    setSearchQuery('')
    setSelectedCategory('')
    setSelectedArea('')
  }

  const handleQuickPick = (categoryId: string) => {
    setSelectedCategory(categoryId)
    setIsFilterOpen(false)
  }

  return (
    <div className="min-h-screen bg-semantic-bg-primary text-semantic-text-primary relative">
      {/* Viewport Scroll Progress Bar */}
      <motion.div
        style={{ scaleX: scrollYProgress }}
        className="fixed top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-400 via-brand-500 to-emerald-400 origin-left z-50 shadow-sm shadow-brand-500/50 pointer-events-none"
      />

      {/* Exploration Guest Mode Banner with 1-Tap Back Button */}
      {isGuestMode && (
        <div className="bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-amber-500/10 dark:from-brand-500/15 dark:via-zinc-900 dark:to-brand-500/15 border-b border-amber-500/30 py-2 px-3 sm:px-6">
          <div className="max-w-4xl mx-auto flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-xs text-amber-800 dark:text-brand-300 font-medium truncate">
              <Sparkles className="w-3.5 h-3.5 text-amber-500 shrink-0" />
              <span className="truncate">{t('guestBar.exploringAsGuest', 'You are exploring DoneKaro in Guest Mode')}</span>
            </div>
            <button
              type="button"
              onClick={handleBackToLogin}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-white dark:bg-zinc-800 hover:bg-slate-50 dark:hover:bg-zinc-700 text-xs font-bold text-slate-900 dark:text-white transition-all cursor-pointer border border-amber-500/40 shrink-0 shadow-xs active:scale-95"
            >
              <ArrowLeft className="w-3.5 h-3.5 text-amber-500" />
              <span>{t('common.backToLogin', 'Sign In / Register')}</span>
            </button>
          </div>
        </div>
      )}

      {/* Sticky Search Bar & Filter Drawer */}
      <DiscoverySearchBar
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        isFilterOpen={isFilterOpen}
        setIsFilterOpen={setIsFilterOpen}
        activeFilterCount={activeFilterCount}
        selectedArea={selectedArea}
        selectedCategory={selectedCategory}
        setSelectedArea={setSelectedArea}
        setSelectedCategory={setSelectedCategory}
        getCategoryDisplayName={getCategoryDisplayName}
        isGuestMode={isGuestMode}
        onBackToLogin={handleBackToLogin}
        searchContainerRef={searchContainerRef}
        filterButtonRef={filterButtonRef}
        filterPanel={
          <DiscoveryFilterPanel
            isOpen={isFilterOpen}
            onClose={() => setIsFilterOpen(false)}
            selectedArea={selectedArea}
            setSelectedArea={setSelectedArea}
            selectedCategory={selectedCategory}
            setSelectedCategory={setSelectedCategory}
            workerStats={workerStats}
            filterButtonRef={filterButtonRef}
          />
        }
      />

      {/* Dynamic Search & Filter Results Section (when searching or filtering) */}
      <DiscoveryResults
        isVisible={hasActiveSearchOrFilter}
        searchQuery={searchQuery}
        selectedCategory={selectedCategory}
        selectedArea={selectedArea}
        matchingWorkers={matchingWorkers}
        getCategoryDisplayName={getCategoryDisplayName}
        onClearFilters={clearAllSearchAndFilters}
        onSelectCategory={catId => {
          setSelectedCategory(catId)
          setSearchQuery('')
        }}
        onOpenAiAssistant={() => aiAssistant?.openAssistant?.('customer_booking')}
      />

      {/* Marketing / Presentation Sections */}
      <HomeHeroSection />
      <HomeSocialProof workerCount={allWorkers.length} />
      <HomeProblemSection />
      <HomeServicesSection
        onQuickPick={handleQuickPick}
        onOpenAllServices={() => {
          setIsFilterOpen(true)
          searchContainerRef.current?.scrollIntoView({ behavior: 'smooth' })
        }}
        onQuickEmergencyFilter={() => navigate('/search?filter=quick')}
      />
      <HomeHowItWorks
        onOpenAiAssistant={() => aiAssistant?.openAssistant?.('customer_booking')}
      />
      <HomeReviewGuarantee />
      <HomeDualAudienceCta
        onCustomerCta={() => navigate('/search')}
        onWorkerCta={() => navigate('/register/worker')}
      />
    </div>
  )
}

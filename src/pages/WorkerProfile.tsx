import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useParams, Link, useNavigate, useLocation } from 'react-router-dom'
import { Button, Card, Avatar, Badge, RatingStars, Chip, Tabs, TabList, Tab, TabPanel, Modal } from '@/ui'
import { CATEGORIES, getCategoryName, getServiceById } from '@kaamgar/shared'
import { Star, MapPin, Clock, CheckCircle2, Truck, ArrowLeft, MessageCircle, Zap, Wrench, Hammer, Snowflake, Brush, Shield, ChevronDown } from 'lucide-react'
import { motion } from 'framer-motion'
import { fetchApprovedWorker } from '@/services/workers'
import { fetchWorkerReviews, ReviewItem } from '@/services/reviews'
import { useAuth } from '@/context/AuthContext'
import { getSupabaseClient } from '@/lib/supabase'

const iconComponents = {
  zap: Zap,
  wrench: Wrench,
  hammer: Hammer,
  snowflake: Snowflake,
  brush: Brush,
}

export default function WorkerProfile() {
  const { t, i18n } = useTranslation()
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const location = useLocation()
  const existingServiceRequestId = location.state?.serviceRequestId as string | undefined
  const initialServiceId = location.state?.serviceId as string | undefined
  const [selectedServiceId, setSelectedServiceId] = useState<string>(() => initialServiceId || '')
  const [worker, setWorker] = useState<any>(null)
  const [reviewsList, setReviewsList] = useState<ReviewItem[]>([])
  const [isLoadingReviews, setIsLoadingReviews] = useState(true)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [showAllReviews, setShowAllReviews] = useState(false)
  const [showContactNotice, setShowContactNotice] = useState(false)
  const { user, isAuthenticated } = useAuth()
  const [isPreviouslyHired, setIsPreviouslyHired] = useState(false)

  useEffect(() => {
    if (!isAuthenticated || !user?.id || !id) {
      setIsPreviouslyHired(false)
      return
    }
    let isMounted = true
    const supabase = getSupabaseClient()
    supabase
      .from('bookings')
      .select('id')
      .eq('customer_id', user.id)
      .eq('worker_id', id)
      .eq('status', 'completed')
      .limit(1)
      .then(({ data, error }) => {
        if (!isMounted || error || !data) return
        setIsPreviouslyHired(data.length > 0)
      })
    return () => {
      isMounted = false
    }
  }, [isAuthenticated, user?.id, id])

  useEffect(() => {
    let isMounted = true

    if (!id) {
      setError('Worker profile not found')
      setIsLoading(false)
      setIsLoadingReviews(false)
      return
    }

    Promise.all([
      fetchApprovedWorker(id),
      fetchWorkerReviews(id),
    ])
      .then(([nextWorker, liveReviews]) => {
        if (!isMounted) return
        if (!nextWorker) {
          setError('Worker profile not found')
          return
        }
        const validCategories = nextWorker.categories || []
        if (initialServiceId && validCategories.includes(initialServiceId)) {
          setSelectedServiceId(initialServiceId)
        } else if (validCategories.length === 1) {
          setSelectedServiceId(validCategories[0])
        }

        const registeredServices = validCategories
          .map(serviceId => {
            const service = getServiceById(serviceId)
            return service ? (i18n.language === 'hi' ? service.name_hi : service.name_en) : ''
          })
          .filter((service): service is string => Boolean(service))

        setWorker({
          ...nextWorker,
          category: validCategories[0] || '',
          phone: null,
          services: registeredServices,
        })
        setReviewsList(liveReviews)
      })
      .catch(() => {
        if (isMounted) setError('Unable to load worker profile')
      })
      .finally(() => {
        if (isMounted) {
          setIsLoading(false)
          setIsLoadingReviews(false)
        }
      })

    return () => {
      isMounted = false
    }
  }, [id])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-semantic-bg-secondary flex items-center justify-center text-semantic-text-secondary">
        {t('workerProfile.loading', 'Loading worker profile...')}
      </div>
    )
  }

  if (error || !worker) {
    return (
      <div className="min-h-screen bg-semantic-bg-secondary flex items-center justify-center px-4">
        <Card className="max-w-md w-full p-8 text-center">
          <h1 className="text-xl font-semibold text-semantic-text-primary">
            {error || t('errors.notFound', 'Worker profile not found')}
          </h1>
          <Link to="/search" className="mt-5 inline-flex text-brand-500 hover:text-brand-400">
            {t('common.backToSearch', 'Back to Search')}
          </Link>
        </Card>
      </div>
    )
  }

  const navigateToBooking = () => {
    const effectiveServiceId = selectedServiceId || (worker?.categories?.length === 1 ? worker.categories[0] : '')
    navigate(`/booking/${worker.id}`, {
      state: {
        serviceRequestId: existingServiceRequestId,
        serviceId: effectiveServiceId,
      },
    })
  }

  const cat = CATEGORIES.find(c => c.id === (selectedServiceId || worker.category))
  const Icon = iconComponents[(selectedServiceId || worker.category) as keyof typeof iconComponents] || Truck
  const visibleReviews = showAllReviews ? reviewsList : reviewsList.slice(0, 3)

  return (
    <div className="min-h-screen bg-semantic-bg-secondary">
      <div className="bg-semantic-bg-primary border-b border-semantic-border-light">
        <div className="container-app py-4">
          <Link to="/search" className="inline-flex items-center gap-2 text-semantic-text-secondary hover:text-semantic-text-primary text-sm font-medium transition-colors">
            <ArrowLeft className="w-4 h-4" />
            <span>{t('common.back', 'Back')} / {t('nav.search', 'Find Workers')}</span>
          </Link>
        </div>
      </div>

      <div className="container-app pt-8 pb-32">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="grid gap-8"
        >
          <div className="space-y-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="card p-6"
            >
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
                <div className="relative">
                  <Avatar name={worker.name} size="2xl" src={worker.avatar || undefined} status={worker.available ? 'online' : 'busy'} />
                  {worker.verified && (
                    <div className="absolute bottom-2 right-2">
                      <Badge variant="brand" dot className="px-2 py-1">
                        <Shield className="w-3 h-3 mr-1" />
                        {t('workerCard.verified', 'Verified')}
                      </Badge>
                    </div>
                  )}
                </div>
                <div className="flex-1 text-center sm:text-left">
                  <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2.5">
                    <h1 className="text-2xl lg:text-3xl font-bold text-semantic-text-primary">{worker.name}</h1>
                    {isPreviouslyHired && (
                      <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/25">
                        <CheckCircle2 className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                        {t('workerProfile.previouslyHiredByYou', 'Previously Hired by You')}
                      </span>
                    )}
                  </div>
                  <div className="mt-2 flex flex-wrap items-center justify-center sm:justify-start gap-4 text-semantic-text-secondary">
                    <span className="flex items-center gap-1">
                      <Icon className="w-4 h-4" />
                      {cat ? getCategoryName(cat, i18n.language === 'hi' ? 'hi' : 'en') : worker.category}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      {t('workerCard.experience', { years: worker.experience })}
                    </span>
                    <span className="flex items-center gap-1">
                      <Star className="w-4 h-4 text-amber-500" />
                      {worker.rating > 0 ? (
                        <RatingStars rating={worker.rating} size="sm" showValue />
                      ) : (
                        <span className="text-sm">{t('workerProfile.noRatings', 'No ratings yet')}</span>
                      )}
                    </span>
                    <span className="text-sm">
                      {worker.reviews > 0
                        ? t('workerProfile.multipleReviews', { count: worker.reviews })
                        : t('workerProfile.noReviews', 'No reviews yet')}
                    </span>
                  </div>
                  <div className="mt-4 flex flex-wrap justify-center sm:justify-start gap-2">
                    {worker.areas.slice(0, 3).map((area: string) => (
                      <Badge key={area} variant="outline" className="flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        {area}
                      </Badge>
                    ))}
                    {worker.areas.length > 3 && (
                      <Badge variant="outline">+ {worker.areas.length - 3} more</Badge>
                    )}
                  </div>
                </div>
                <div className="flex w-full items-center sm:w-auto">
                  <Button variant="ghost" size="lg" onClick={() => setShowContactNotice(true)}>
                    <MessageCircle className="mr-2 h-5 w-5" />
                    {t('workerProfile.contactPolicy', 'Contact Policy')}
                  </Button>
                </div>
              </div>
            </motion.div>

            <Tabs defaultValue="about" className="space-y-6">
              <TabList className="flex gap-1 bg-surface-100 dark:bg-surface-800 p-1 rounded-lg" aria-label="Worker details">
                <Tab value="about" className="px-4 py-2 text-sm font-medium rounded-md transition-colors">{t('workerProfile.about')}</Tab>
                <Tab value="services" className="px-4 py-2 text-sm font-medium rounded-md transition-colors">{t('workerProfile.services')}</Tab>
                <Tab value="reviews" className="px-4 py-2 text-sm font-medium rounded-md transition-colors">{t('workerProfile.reviews')}</Tab>
              </TabList>

              <TabPanel value="about" className="animate-in">
                <Card className="p-6">
                  <h2 className="text-lg font-semibold text-semantic-text-primary mb-4">{t('workerProfile.about')}</h2>
                  <p className="text-semantic-text-secondary whitespace-pre-line leading-relaxed">{worker.bio}</p>
                </Card>
              </TabPanel>

              <TabPanel value="services" className="animate-in">
                <Card className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold text-semantic-text-primary">{t('workerProfile.services')}</h2>
                    <Badge variant="brand">{t('workerProfile.servicesCount', { count: worker.services.length })}</Badge>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {worker.categories?.length > 0 ? worker.categories.map((cId: string) => {
                      const svc = getServiceById(cId)
                      const serviceName = svc ? (i18n.language === 'hi' ? svc.name_hi : svc.name_en) : cId
                      const isSelected = selectedServiceId === cId
                      return (
                        <Chip
                          key={cId}
                          selected={isSelected}
                          variant={isSelected ? 'default' : 'outline'}
                          onClick={() => setSelectedServiceId(cId)}
                        >
                          {serviceName} {isSelected && '✓'}
                        </Chip>
                      )
                    }) : (
                      <p className="text-sm text-semantic-text-secondary">
                        {t('workerProfile.noRegisteredServices', 'No registered services available.')}
                      </p>
                    )}
                  </div>
                </Card>
              </TabPanel>

              <TabPanel value="reviews" className="animate-in">
                <Card className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold text-semantic-text-primary">{t('workerProfile.reviews')}</h2>
                    <span className="text-sm text-semantic-text-tertiary">
                      {reviewsList.length === 1 ? t('workerProfile.singleReview', '1 Review') : t('workerProfile.multipleReviews', { count: reviewsList.length })}
                    </span>
                  </div>

                  {isLoadingReviews ? (
                    <div className="py-8 text-center text-semantic-text-secondary">{t('common.loading', 'Loading reviews...')}</div>
                  ) : reviewsList.length === 0 ? (
                    <div className="py-10 text-center">
                      <Star className="w-10 h-10 mx-auto text-semantic-text-tertiary/60 mb-3" />
                      <p className="text-semantic-text-primary font-medium">{t('workerProfile.noReviews', 'No reviews yet')}</p>
                      <p className="text-sm text-semantic-text-secondary mt-1 max-w-sm mx-auto">
                        {t('workerProfile.beFirstReview', 'Be the first customer to book and share your feedback for this worker!')}
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {visibleReviews.map((review, index) => (
                        <motion.div
                          key={review.id || index}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.05 }}
                          className="border-b border-semantic-border-light pb-4 last:border-0 last:pb-0"
                        >
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-3">
                              <Avatar name={review.customer_name} src={review.customer_avatar || undefined} size="sm" />
                              <div>
                                <p className="font-medium text-semantic-text-primary">{review.customer_name}</p>
                                <p className="text-xs text-semantic-text-tertiary">
                                  {new Date(review.created_at).toLocaleDateString('en-IN', {
                                    year: 'numeric',
                                    month: 'short',
                                    day: 'numeric',
                                  })}
                                </p>
                              </div>
                            </div>
                            <RatingStars rating={review.rating} size="sm" />
                          </div>
                          {review.comment && (
                            <p className="text-semantic-text-secondary text-sm leading-relaxed mt-1">
                              {review.comment}
                            </p>
                          )}
                        </motion.div>
                      ))}
                      {reviewsList.length > 3 && (
                        <Button
                          variant="outline"
                          className="w-full"
                          onClick={() => setShowAllReviews(showing => !showing)}
                        >
                          {showAllReviews
                            ? t('workerProfile.showFewerReviews', 'Show fewer reviews')
                            : t('workerProfile.readAllReviews', `Read all ${reviewsList.length} reviews`)}
                          <ChevronDown
                            className={`ml-2 h-4 w-4 transition-transform ${showAllReviews ? 'rotate-180' : ''}`}
                          />
                        </Button>
                      )}
                    </div>
                  )}
                </Card>
              </TabPanel>
            </Tabs>
          </div>

        </motion.div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-semantic-border-light bg-semantic-bg-primary/95 p-4 pb-[calc(1rem+env(safe-area-inset-bottom))] backdrop-blur-md">
        <div className="container-app">
          <Button
            variant="primary"
            size="lg"
            className="w-full min-h-14 text-base font-bold shadow-lg"
            disabled={!worker.available}
            onClick={navigateToBooking}
          >
            {t('workerProfile.continueToBook', 'Continue to Book')}
          </Button>
        </div>
      </div>

      {/* Direct Contact Privacy Notice Modal */}
      <Modal
        isOpen={showContactNotice}
        onClose={() => setShowContactNotice(false)}
        title={t('workerProfile.contactPolicy', 'Contact Policy')}
        description={t('workerProfile.directContactDesc', 'Worker privacy & verified connections')}
        size="sm"
      >
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-surface-200/80 border border-semantic-border-light flex items-start gap-3 text-sm">
            <Shield className="w-5 h-5 text-brand-400 shrink-0 mt-0.5" />
            <p className="text-semantic-text-secondary leading-relaxed">
              {t('workerProfile.directContactNote', 'To protect local service professionals from unsolicited calls, direct phone numbers and WhatsApp links are provided immediately once a booking request is made.')}
            </p>
          </div>
          <div className="pt-2 flex justify-end">
            <Button variant="ghost" size="sm" onClick={() => setShowContactNotice(false)}>
              {t('common.close', 'Close')}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

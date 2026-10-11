import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Button } from '@kaamgar/ui'
import {
  AlertCircle,
  ArrowLeft,
  Calendar,
  CheckCircle2,
  Clock,
  Loader2,
  RefreshCw,
  Sparkles,
} from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { useSupport } from '@/features/support'
import { getSupabaseClient } from '@/lib/supabase'
import ContactModal from '@/components/ContactModal'
import { buildCustomerToWorkerWhatsAppMessage } from '@/utils/contact'
import { sanitizeErrorMessage } from '@/utils/errors'
import { submitBookingReview } from '@/services/reviews'
import {
  type BookingChangeRequest,
  confirmCashPaymentByCustomer,
  decideBookingChangeRequest,
  selectBookingPaymentMethod,
} from '@/services/changeRequests'
import {
  type BookingQuote,
  type BookingQuoteRequest,
  acceptBookingQuote,
  cancelBookingQuoteRequest,
} from '@/services/quotes'
import {
  type BookingRow,
  type ContactModalData,
  type CustomerBookingReview,
  BookAgainModal,
  BookingCancelModal,
  BookingCard,
  HistoricalBookingSummaryCard,
  BookingReviewModal,
  BookingStatsCards,
  BookingTabs,
  CareSupportBanner,
  CompletedJobDetailsModal,
  CustomerPaymentModal,
  OfficialReceiptModal,
  QuoteRequestsSection,
  formatBookingDate,
  formatBookingTime,
  resolveServiceAndCategory,
  useBookingRealtime,
  useCustomerBookings,
} from '@/features/booking'

export default function Bookings() {
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()
  const { user } = useAuth()
  const { openSupport } = useSupport()

  const {
    allBookings,
    setAllBookings,
    upcomingBookings,
    pastBookings,
    quoteRequests,
    quotes,
    quoteWorkers,
    isLoading,
    loadError,
    setLoadError,
    activeTab,
    setActiveTab,
    loadBookings,
  } = useCustomerBookings({ userId: user?.id })

  // Real-time subscription for customer's bookings and quote requests
  useBookingRealtime({
    customerId: user?.id,
    onUpdate: loadBookings,
  })

  // Hash anchor auto-scroll
  useEffect(() => {
    const target = window.location.hash.slice(1)
    if (!target) return
    const timer = window.setTimeout(
      () => document.getElementById(target)?.scrollIntoView({ behavior: 'smooth', block: 'start' }),
      150
    )
    return () => window.clearTimeout(timer)
  }, [])

  // Review modal state
  const [showReviewModal, setShowReviewModal] = useState(false)
  const [selectedBooking, setSelectedBooking] = useState<BookingRow | null>(null)
  const [isSubmittingReview, setIsSubmittingReview] = useState(false)
  const [reviewError, setReviewError] = useState('')

  // Cancellation modal state
  const [showCancelModal, setShowCancelModal] = useState(false)
  const [cancellingBooking, setCancellingBooking] = useState<BookingRow | null>(null)
  const [isCancelling, setIsCancelling] = useState(false)
  const [cancelError, setCancelError] = useState('')

  // Status and notification banners
  const [actionSuccess, setActionSuccess] = useState('')

  // Payment states
  const [paymentActionBookingId, setPaymentActionBookingId] = useState('')
  const [paymentError, setPaymentError] = useState('')
  const [paymentModalBooking, setPaymentModalBooking] = useState<BookingRow | null>(null)
  const [paymentModalError, setPaymentModalError] = useState('')
  const [isSubmittingPayment, setIsSubmittingPayment] = useState(false)

  // Additional dialog states
  const [receiptModalBooking, setReceiptModalBooking] = useState<BookingRow | null>(null)
  const [detailsModalBooking, setDetailsModalBooking] = useState<BookingRow | null>(null)
  const [bookAgainModalBooking, setBookAgainModalBooking] = useState<BookingRow | null>(null)

  // Quote & Change Request action states
  const [quoteActionId, setQuoteActionId] = useState<string | null>(null)
  const [decidingRequestId, setDecidingRequestId] = useState<string | null>(null)
  const [changeRequestError, setChangeRequestError] = useState('')

  // Contact modal state
  const [contactModalData, setContactModalData] = useState<ContactModalData>({
    isOpen: false,
    name: '',
    roleLabel: 'Service Professional',
  })

  const handleOpenContactModal = (booking: BookingRow) => {
    const { serviceName } = resolveServiceAndCategory(booking.category_id, i18n.language)
    const formattedDate = formatBookingDate(booking.scheduled_at, i18n.language)
    const formattedTime = formatBookingTime(booking.scheduled_at, i18n.language)
    const message = buildCustomerToWorkerWhatsAppMessage({
      workerName: booking.worker?.name,
      categoryName: serviceName,
      date: formattedDate,
      time: formattedTime,
      address: booking.address,
    })

    setContactModalData({
      isOpen: true,
      name: booking.worker?.name || t('bookings.artisan', 'Worker'),
      phone: booking.worker?.phone,
      avatar: booking.worker?.avatar,
      roleLabel: t('bookings.serviceProfessional', 'Service Professional'),
      whatsappMessage: message,
      bookingContext: {
        category: serviceName,
        scheduledAt: `${formattedDate} at ${formattedTime}`,
        address: booking.address,
      },
    })
  }

  const handleChangeRequestDecision = async (
    request: BookingChangeRequest,
    decision: 'approved' | 'rejected'
  ) => {
    setDecidingRequestId(request.id)
    setChangeRequestError('')
    try {
      await decideBookingChangeRequest(request.id, decision)
      await loadBookings()
    } catch (error) {
      setChangeRequestError(
        sanitizeErrorMessage(error, 'Unable to update the additional-charge request')
      )
    } finally {
      setDecidingRequestId(null)
    }
  }

  const handleOpenPaymentModal = (booking: BookingRow) => {
    setPaymentModalBooking(booking)
    setPaymentModalError('')
  }

  const handleOpenReceiptModal = (booking: BookingRow) => {
    setReceiptModalBooking(booking)
  }

  const handleOpenDetailsModal = (booking: BookingRow) => {
    setDetailsModalBooking(booking)
  }

  const handleOpenBookAgainModal = (booking: BookingRow) => {
    setBookAgainModalBooking(booking)
  }

  const handleRehireWorker = (booking: BookingRow) => {
    const pincodeMatch = (booking.address || '').match(/\b251\d{3}\b/)
    const pincode = pincodeMatch ? pincodeMatch[0] : ''
    navigate(`/booking/${booking.worker_id}`, {
      state: {
        serviceId: booking.category_id,
        bookingDraft: {
          address: booking.address,
          pincode,
          notes: booking.notes || '',
        },
      },
    })
    setBookAgainModalBooking(null)
  }

  const handleBrowseAllWorkers = (booking: BookingRow) => {
    navigate(`/search?category=${booking.category_id}`)
    setBookAgainModalBooking(null)
  }

  const handleConfirmCustomerCashPayment = async (booking: BookingRow) => {
    if (isSubmittingPayment) return
    setIsSubmittingPayment(true)
    setPaymentModalError('')
    try {
      if (booking.paymentSummary?.payment_method !== 'cash') {
        await selectBookingPaymentMethod(booking.id, 'cash')
      }
      await confirmCashPaymentByCustomer(booking.id)
      await loadBookings()
      setPaymentModalBooking(null)
      setActionSuccess(
        t('bookings.cashPaymentSubmittedMsg', 'Cash payment submitted. Waiting for worker confirmation.')
      )
      setTimeout(() => setActionSuccess(''), 5000)
    } catch (error) {
      await loadBookings()
      const msg = error instanceof Error ? error.message : ''
      if (msg.toLowerCase().includes('already') || msg.toLowerCase().includes('paid')) {
        setPaymentModalBooking(null)
        setActionSuccess(t('bookings.paymentSuccessful', 'Payment Successful'))
        setTimeout(() => setActionSuccess(''), 4000)
      } else {
        setPaymentModalError(
          t('bookings.paymentActionFailed', 'Unable to update the payment. Please try again.')
        )
      }
    } finally {
      setIsSubmittingPayment(false)
    }
  }

  const handleCancelQuoteRequest = async (request: BookingQuoteRequest) => {
    setQuoteActionId(request.id)
    try {
      await cancelBookingQuoteRequest(request.id, 'Customer no longer wants to wait')
      await loadBookings()
    } catch (error) {
      setLoadError(sanitizeErrorMessage(error, 'Unable to cancel quote request'))
    } finally {
      setQuoteActionId(null)
    }
  }

  const handleAcceptQuote = async (quote: BookingQuote) => {
    setQuoteActionId(quote.id)
    try {
      await acceptBookingQuote(quote.id)
      setActionSuccess('Quote accepted. Your booking has been created.')
      await loadBookings()
    } catch (error) {
      setLoadError(sanitizeErrorMessage(error, 'Unable to accept quote'))
    } finally {
      setQuoteActionId(null)
    }
  }

  const handleReviewSubmit = async (rating: number, comment: string) => {
    if (!selectedBooking) return
    setIsSubmittingReview(true)
    setReviewError('')
    try {
      await submitBookingReview({
        bookingId: selectedBooking.id,
        workerId: selectedBooking.worker_id,
        rating,
        comment,
      })

      const newReview: CustomerBookingReview = {
        id: '',
        rating,
        comment,
        created_at: new Date().toISOString(),
      }

      setAllBookings(current =>
        current.map(b => (b.id === selectedBooking.id ? { ...b, hasReview: true, review: newReview } : b))
      )
      if (detailsModalBooking?.id === selectedBooking.id) {
        setDetailsModalBooking(prev => (prev ? { ...prev, hasReview: true, review: newReview } : null))
      }

      setShowReviewModal(false)
      setSelectedBooking(null)
      setActionSuccess('Thank you! Your review has been submitted successfully.')
      setTimeout(() => setActionSuccess(''), 4000)
    } catch (err) {
      setReviewError(sanitizeErrorMessage(err, 'Unable to submit review'))
    } finally {
      setIsSubmittingReview(false)
    }
  }

  const handleOpenCancelModal = (booking: BookingRow) => {
    setCancellingBooking(booking)
    setCancelError('')
    setShowCancelModal(true)
  }

  const handleCancelBooking = async (cancellationReason: string) => {
    if (!cancellingBooking) return
    setIsCancelling(true)
    setCancelError('')
    try {
      const supabase = getSupabaseClient()
      const { data: authData, error: authError } = await supabase.auth.getUser()
      if (authError) throw authError
      const customerId = authData.user?.id
      if (!customerId) throw new Error('Please sign in to cancel your booking')

      const reasonText = cancellationReason.trim()

      const { error: rpcError } = await (supabase as any).rpc('cancel_booking', {
        target_booking_id: cancellingBooking.id,
        cancellation_reason: reasonText || undefined,
      })

      if (rpcError) {
        const updatedNotes = reasonText
          ? cancellingBooking.notes
            ? `${cancellingBooking.notes}\n[Cancelled by customer: ${reasonText}]`
            : `[Cancelled by customer: ${reasonText}]`
          : cancellingBooking.notes

        const { data: updatedBooking, error: updateError } = await (supabase.from('bookings') as any)
          .update({
            status: 'cancelled',
            updated_at: new Date().toISOString(),
            notes: updatedNotes,
          })
          .eq('id', cancellingBooking.id)
          .eq('customer_id', customerId)
          .in('status', ['pending', 'accepted'])
          .select('id')
          .maybeSingle()

        if (updateError) throw updateError
        if (!updatedBooking) throw new Error('Booking could not be cancelled. It may have already been updated.')
      }

      setAllBookings(current =>
        current.map(b => (b.id === cancellingBooking.id ? { ...b, status: 'cancelled' } : b))
      )
      setShowCancelModal(false)
      setCancellingBooking(null)
      setActionSuccess(t('bookings.cancelSuccess', 'Booking cancelled successfully'))
      setTimeout(() => setActionSuccess(''), 4000)
    } catch (err) {
      setCancelError(sanitizeErrorMessage(err, 'Unable to cancel booking'))
    } finally {
      setIsCancelling(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-zinc-950 text-slate-900 dark:text-zinc-100 transition-colors pb-20">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* Navigation & Header */}
        <div className="flex items-center justify-between gap-3 mb-6">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/')}
              className="p-2 rounded-xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-slate-700 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
              title={t('bookings.backToHome', 'Back to Home')}
              aria-label={t('bookings.backToHome', 'Back to Home')}
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                  {t('bookings.title', 'My Bookings')}
                </h1>
                <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30">
                  {allBookings.length}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
                {t('bookings.subtitle', 'Manage your service appointments')}
              </p>
            </div>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => void loadBookings()}
            disabled={isLoading}
            className="flex items-center gap-1.5 text-xs font-semibold cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">{t('common.refresh', 'Refresh')}</span>
          </Button>
        </div>

        {/* Quick Stats Summary */}
        <BookingStatsCards
          upcomingCount={upcomingBookings.length}
          completedCount={allBookings.filter(b => b.status === 'completed').length}
          totalCount={allBookings.length}
        />

        {/* Care & Support Banner */}
        <CareSupportBanner upcomingBookingId={upcomingBookings[0]?.id} />

        {/* Alerts & Notifications */}
        {actionSuccess && (
          <div className="mb-6 p-4 rounded-xl border border-emerald-500/30 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
            <span className="text-xs font-medium">{actionSuccess}</span>
          </div>
        )}

        {loadError && (
          <div className="mb-6 p-4 rounded-xl border border-rose-500/30 bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-300 text-xs font-medium flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-rose-500 shrink-0" />
            <span>{loadError}</span>
          </div>
        )}

        {/* Quote Requests Section */}
        <QuoteRequestsSection
          quoteRequests={quoteRequests}
          quotes={quotes}
          quoteWorkers={quoteWorkers}
          quoteActionId={quoteActionId}
          onAcceptQuote={handleAcceptQuote}
          onCancelQuoteRequest={handleCancelQuoteRequest}
        />

        {/* Filter Navigation Tabs */}
        <BookingTabs
          activeTab={activeTab}
          onTabChange={setActiveTab}
          allCount={allBookings.length}
          upcomingCount={upcomingBookings.length}
          pastCount={pastBookings.length}
        />

        {/* Loading Spinner State */}
        {isLoading && (
          <div className="py-20 text-center">
            <Loader2 className="w-8 h-8 mx-auto text-amber-500 animate-spin mb-3" />
            <p className="text-xs font-semibold text-slate-500 dark:text-zinc-400">
              {t('bookings.loading', 'Loading bookings...')}
            </p>
          </div>
        )}

        {/* Render Bookings Content */}
        {!isLoading && (
          <div className="space-y-8">
            {/* 1. UPCOMING & ACTIVE SECTION */}
            {(activeTab === 'all' || activeTab === 'upcoming') && (
              <section className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-amber-500" />
                    <h2 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
                      {t('bookings.activeAndUpcoming', 'Upcoming & Active')}
                    </h2>
                    <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400">
                      {upcomingBookings.length}
                    </span>
                  </div>
                </div>

                {upcomingBookings.length === 0 ? (
                  <div className="p-8 sm:p-10 rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-center shadow-sm">
                    <div className="w-12 h-12 mx-auto mb-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-600 dark:text-amber-400">
                      <Calendar className="w-6 h-6" />
                    </div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-1">
                      {t('bookings.noUpcoming', 'No upcoming bookings')}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-zinc-400 max-w-sm mx-auto mb-5">
                      {t(
                        'bookings.noActiveDesc',
                        'Ready to get things fixed? Discover our verified local workers and book your service in seconds.'
                      )}
                    </p>
                    <Link to="/categories">
                      <Button
                        variant="primary"
                        size="sm"
                        className="text-xs font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 px-4 py-2 cursor-pointer"
                      >
                        <Sparkles className="w-3.5 h-3.5 mr-1.5" />
                        {t('bookings.findService', 'Find a Service')}
                      </Button>
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {upcomingBookings.map(b => (
                      <BookingCard
                        key={b.id}
                        booking={b}
                        isPast={false}
                        decidingRequestId={decidingRequestId}
                        changeRequestError={changeRequestError}
                        paymentError={paymentError}
                        paymentActionBookingId={paymentActionBookingId}
                        onChangeRequestDecision={handleChangeRequestDecision}
                        onOpenPaymentModal={handleOpenPaymentModal}
                        onOpenReceiptModal={handleOpenReceiptModal}
                        onOpenDetailsModal={handleOpenDetailsModal}
                        onOpenBookAgainModal={handleOpenBookAgainModal}
                        onOpenCancelModal={handleOpenCancelModal}
                        onOpenContactModal={handleOpenContactModal}
                        onOpenReviewModal={booking => {
                          setSelectedBooking(booking)
                          setShowReviewModal(true)
                        }}
                        onOpenSupport={openSupport}
                      />
                    ))}
                  </div>
                )}
              </section>
            )}

            {/* 2. PAST BOOKINGS SECTION */}
            {(activeTab === 'all' || activeTab === 'past') && (
              <section className="space-y-4 pt-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-slate-500 dark:text-zinc-400" />
                    <h2 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
                      {t('bookings.past', 'Past Bookings')}
                    </h2>
                    <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400">
                      {pastBookings.length}
                    </span>
                  </div>
                </div>

                {pastBookings.length === 0 ? (
                  <div className="p-8 sm:p-10 rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-center shadow-sm">
                    <div className="w-12 h-12 mx-auto mb-3 rounded-2xl bg-slate-100 dark:bg-zinc-800 flex items-center justify-center text-slate-400">
                      <Clock className="w-6 h-6" />
                    </div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-1">
                      {t('bookings.noPast', 'No past bookings yet')}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-zinc-400 max-w-sm mx-auto">
                      {t(
                        'bookings.noPastDesc',
                        'Your completed and past service appointments will be listed here.'
                      )}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {pastBookings.map(b => (
                      <HistoricalBookingSummaryCard
                        key={b.id}
                        booking={b}
                        onOpenDetails={handleOpenDetailsModal}
                        onOpenReceipt={handleOpenReceiptModal}
                      />
                    ))}
                  </div>
                )}
              </section>
            )}
          </div>
        )}
      </div>

      {/* Cancellation Confirmation Modal */}
      <BookingCancelModal
        isOpen={showCancelModal}
        onClose={() => {
          setShowCancelModal(false)
          setCancellingBooking(null)
        }}
        booking={cancellingBooking}
        onConfirmCancel={handleCancelBooking}
        isCancelling={isCancelling}
        cancelError={cancelError}
      />

      {/* Rate/Review Modal */}
      <BookingReviewModal
        isOpen={showReviewModal}
        onClose={() => {
          setShowReviewModal(false)
          setSelectedBooking(null)
          setReviewError('')
        }}
        booking={selectedBooking}
        onSubmitReview={handleReviewSubmit}
        isSubmittingReview={isSubmittingReview}
        reviewError={reviewError}
      />

      {/* Customer Payment Modal */}
      <CustomerPaymentModal
        booking={paymentModalBooking}
        onClose={() => {
          setPaymentModalBooking(null)
          setPaymentModalError('')
        }}
        onConfirmCashPayment={handleConfirmCustomerCashPayment}
        isSubmittingPayment={isSubmittingPayment}
        paymentModalError={paymentModalError}
      />

      {/* Official Receipt Modal */}
      <OfficialReceiptModal
        booking={receiptModalBooking}
        onClose={() => setReceiptModalBooking(null)}
      />

      {/* Completed Job Details Modal */}
      <CompletedJobDetailsModal
        booking={detailsModalBooking}
        onClose={() => setDetailsModalBooking(null)}
        onOpenContact={handleOpenContactModal}
        onOpenReceipt={target => {
          setDetailsModalBooking(null)
          handleOpenReceiptModal(target)
        }}
        onRateWorker={target => {
          setDetailsModalBooking(null)
          setSelectedBooking(target)
          setShowReviewModal(true)
        }}
        onBookAgain={target => {
          setDetailsModalBooking(null)
          handleOpenBookAgainModal(target)
        }}
      />

      {/* Book Again Selection Modal */}
      <BookAgainModal
        booking={bookAgainModalBooking}
        onClose={() => setBookAgainModalBooking(null)}
        onRehire={handleRehireWorker}
        onBrowseAll={handleBrowseAllWorkers}
      />

      {/* Contact Actions Modal */}
      <ContactModal
        isOpen={contactModalData.isOpen}
        onClose={() => setContactModalData(prev => ({ ...prev, isOpen: false }))}
        name={contactModalData.name}
        roleLabel={contactModalData.roleLabel}
        phone={contactModalData.phone}
        avatar={contactModalData.avatar}
        whatsappMessage={contactModalData.whatsappMessage}
        bookingContext={contactModalData.bookingContext}
      />
    </div>
  )
}

import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { CATEGORIES, getCategoryName } from '@kaamgar/shared'
import { AlertCircle, CheckCircle, ClipboardList } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { useAiAssistant } from '@/features/ai-support'
import { useSupport } from '@/features/support'
import ContactModal from '@/components/ContactModal'
import { buildWorkerToCustomerWhatsAppMessage } from '@/utils/contact'
import type { BookingQuoteRequest } from '@/services/quotes'

// Feature imports
import type { ContactModalData, WorkerBookingRow } from '@/features/worker/types'
import { useWorkerDashboardData } from '@/features/worker/hooks/useWorkerDashboardData'
import { useWorkerAvailability } from '@/features/worker/hooks/useWorkerAvailability'
import { useWorkerRealtime } from '@/features/worker/hooks/useWorkerRealtime'
import { WorkerTopBar } from '@/features/worker/components/dashboard/WorkerTopBar'
import { WorkerHeader } from '@/features/worker/components/dashboard/WorkerHeader'
import { WorkerActionTiles } from '@/features/worker/components/dashboard/WorkerActionTiles'
import { SarathiAiCard } from '@/features/worker/components/dashboard/SarathiAiCard'
import { WorkerMetricsStrip } from '@/features/worker/components/dashboard/WorkerMetricsStrip'
import { MobileLeadsHeader } from '@/features/worker/components/dashboard/MobileLeadsHeader'
import { QuoteRequestsFeed } from '@/features/worker/components/quotes/QuoteRequestsFeed'
import { SendQuoteModal } from '@/features/worker/components/quotes/SendQuoteModal'
import { BookingFeedTabs } from '@/features/worker/components/bookings/BookingFeedTabs'
import { WorkerBookingCard } from '@/features/worker/components/bookings/WorkerBookingCard'
import { BusinessSummary } from '@/features/worker/components/business/BusinessSummary'
import { AdditionalChargeModal } from '@/features/worker/components/modals/AdditionalChargeModal'
import { ConfirmCashModal } from '@/features/worker/components/modals/ConfirmCashModal'
import { CompletedJobModal } from '@/features/worker/components/modals/CompletedJobModal'
import { WorkerReceiptModal } from '@/features/worker/components/modals/WorkerReceiptModal'

export default function WorkerDashboard() {
  const { t, i18n } = useTranslation()
  const { user } = useAuth()
  const { openAssistant } = useAiAssistant()
  const { openSupport } = useSupport()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  // 1. Data orchestration
  const {
    profile,
    setProfile,
    categoriesList,
    bookings,
    isLoading,
    error,
    setError,
    updatingBookingId,
    quoteRequests,
    quoteServices,
    activeTab,
    setActiveTab,
    pendingCount,
    activeCount,
    completedCount,
    completedJobsCount,
    totalPaymentsReceived,
    thisMonthPayments,
    averageJobPayment,
    completedCountsByCustomer,
    filteredBookings,
    loadDashboardData,
    handleUpdateStatus,
  } = useWorkerDashboardData()

  // 2. Availability toggle
  const {
    isUpdatingAvailability,
    availabilitySuccessMsg,
    handleToggleAvailability,
  } = useWorkerAvailability({
    profile,
    setProfile,
    onError: setError,
  })

  // 3. Realtime subscriptions
  useWorkerRealtime({
    onDataChange: loadDashboardData,
  })

  // 4. Modal state management
  const [paymentSuccessMsg, setPaymentSuccessMsg] = useState('')
  const [quoteRequestToRespond, setQuoteRequestToRespond] = useState<BookingQuoteRequest | null>(null)
  const [changeRequestBooking, setChangeRequestBooking] = useState<WorkerBookingRow | null>(null)
  const [confirmModalBooking, setConfirmModalBooking] = useState<WorkerBookingRow | null>(null)
  const [detailsModalBooking, setDetailsModalBooking] = useState<WorkerBookingRow | null>(null)
  const [receiptModalBooking, setReceiptModalBooking] = useState<WorkerBookingRow | null>(null)

  const [contactModalData, setContactModalData] = useState<ContactModalData>({
    isOpen: false,
    name: '',
    roleLabel: 'Customer',
  })

  // Hash target scrolling
  useEffect(() => {
    const target = window.location.hash.slice(1)
    if (!target) return
    const timer = window.setTimeout(
      () => document.getElementById(target)?.scrollIntoView({ behavior: 'smooth', block: 'start' }),
      150
    )
    return () => window.clearTimeout(timer)
  }, [])

  const handleOpenContactModal = (booking: WorkerBookingRow) => {
    const formattedDate = new Date(booking.scheduled_at).toLocaleDateString(
      i18n.language === 'hi' ? 'hi-IN' : 'en-IN',
      { weekday: 'short', month: 'short', day: 'numeric' }
    )
    const formattedTime = new Date(booking.scheduled_at).toLocaleTimeString(
      i18n.language === 'hi' ? 'hi-IN' : 'en-IN',
      { hour: '2-digit', minute: '2-digit' }
    )
    const cat = CATEGORIES.find(c => c.id === booking.category_id)
    const categoryName = cat
      ? getCategoryName(cat, i18n.language === 'hi' ? 'hi' : 'en')
      : booking.category_id

    const message = buildWorkerToCustomerWhatsAppMessage({
      customerName: booking.customer?.name,
      workerName: user?.name || 'your service professional',
      categoryName,
      date: formattedDate,
      time: formattedTime,
    })

    setContactModalData({
      isOpen: true,
      name: booking.customer?.name || 'Customer',
      phone: booking.customer?.phone,
      avatar: booking.customer?.avatar,
      roleLabel: t('bookings.customer', 'Customer'),
      whatsappMessage: message,
      bookingContext: {
        category: categoryName,
        scheduledAt: `${formattedDate} at ${formattedTime}`,
        address: booking.address,
      },
    })
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-semantic-bg-primary flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-500" />
      </div>
    )
  }

  const isOnline = Boolean(profile?.is_available)
  const isLeadsTab = searchParams.get('tab') === 'leads'
  const primaryCategoryObj = CATEGORIES.find(c => categoriesList.includes(c.id))
  const primaryCategoryName = primaryCategoryObj
    ? getCategoryName(primaryCategoryObj, i18n.language === 'hi' ? 'hi' : 'en')
    : t('workerDashboard.artisanSpecialist', 'Artisan Specialist')

  const activeJob = bookings.find(
    b => b.status === 'accepted' || b.status === 'in_progress' || b.status === 'payment_pending'
  )

  return (
    <div className="min-h-screen bg-semantic-bg-primary pb-24 text-semantic-text-primary">
      <div className="max-w-xl mx-auto px-4 sm:px-6 pt-5">
        {/* 1. Top Bar */}
        <WorkerTopBar
          isLeadsTab={isLeadsTab}
          isOnline={isOnline}
          onBack={() => navigate(-1)}
        />

        {/* Notifications & Alerts */}
        {paymentSuccessMsg && (
          <div className="mb-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs flex items-center gap-2 animate-fadeIn">
            <CheckCircle className="w-4 h-4 shrink-0" />
            <span>{paymentSuccessMsg}</span>
          </div>
        )}
        {availabilitySuccessMsg && (
          <div className="mb-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs flex items-center gap-2 animate-fadeIn">
            <CheckCircle className="w-4 h-4 shrink-0" />
            <span>{availabilitySuccessMsg}</span>
          </div>
        )}
        {error && (
          <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-center gap-2 animate-fadeIn">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* 2. Worker Identity Header */}
        <WorkerHeader
          userName={user?.name}
          profile={profile}
          primaryCategoryName={primaryCategoryName}
          isLeadsTab={isLeadsTab}
          onEditProfile={() => navigate('/profile')}
        />

        {/* 3. Action Tiles */}
        <WorkerActionTiles
          isOnline={isOnline}
          isUpdatingAvailability={isUpdatingAvailability}
          pendingCount={pendingCount}
          isLeadsTab={isLeadsTab}
          onToggleAvailability={handleToggleAvailability}
          onSelectJobs={() => setActiveTab(pendingCount > 0 ? 'pending' : 'active')}
          onOpenWorkAdvice={() => openAssistant('worker_sarathi', undefined, activeJob?.id)}
          onOpenSupport={() => openSupport()}
        />

        {/* 3.5 Sarathi AI Card */}
        <SarathiAiCard
          isLeadsTab={isLeadsTab}
          onOpenAssistant={() => openAssistant('worker_sarathi', undefined, activeJob?.id)}
        />

        {/* 4. Worker Metrics Strip */}
        <WorkerMetricsStrip
          profile={profile}
          completedCount={completedCount}
          isLeadsTab={isLeadsTab}
          onSelectCompleted={() => setActiveTab('completed')}
          onViewAllReviews={() => navigate('/worker/reviews')}
        />

        {/* Divider */}
        <div className={`border-t border-semantic-border-light/60 my-4 ${isLeadsTab ? 'hidden md:block' : 'block'}`} />

        {/* Dedicated Mobile Leads Header */}
        <MobileLeadsHeader
          isLeadsTab={isLeadsTab}
          pendingCount={pendingCount}
          isLoading={isLoading}
          onRefresh={loadDashboardData}
        />

        {/* 5. Provider Quote Requests Feed */}
        <QuoteRequestsFeed
          quoteRequests={quoteRequests}
          quoteServices={quoteServices}
          onOpenSendQuote={request => setQuoteRequestToRespond(request)}
          onRefreshData={loadDashboardData}
          onError={setError}
        />

        {/* 6. Booking Feed Tabs */}
        <BookingFeedTabs
          activeTab={activeTab}
          onTabChange={setActiveTab}
          totalCount={bookings.length}
          pendingCount={pendingCount}
          activeCount={activeCount}
          completedCount={completedCount}
          onRefresh={loadDashboardData}
        />

        {/* 7. Phase 9 Business Summary */}
        {activeTab === 'completed' && (
          <BusinessSummary
            completedJobsCount={completedJobsCount}
            totalPaymentsReceived={totalPaymentsReceived}
            thisMonthPayments={thisMonthPayments}
            averageJobPayment={averageJobPayment}
            hasCompletedPaidJobs={completedCount > 0}
            onViewReviews={() => navigate('/worker/reviews')}
          />
        )}

        {/* 8. Booking Cards Feed */}
        <div className="space-y-3">
          {filteredBookings.length === 0 ? (
            <div className="p-8 rounded-2xl bg-surface-100/60 border border-semantic-border-light text-center">
              <ClipboardList className="w-10 h-10 text-semantic-text-tertiary mx-auto mb-2 opacity-50" />
              <p className="text-sm font-semibold text-semantic-text-primary">
                {t('workerDashboard.noBookingsCategory', 'No bookings in this category')}
              </p>
              <p className="text-xs text-semantic-text-secondary mt-1">
                {isOnline
                  ? t(
                      'workerDashboard.onlineEmpty',
                      'Your profile is online and visible to customers in Muzaffarnagar. New requests will appear here.'
                    )
                  : t(
                      'workerDashboard.offDutyEmpty',
                      'You are currently Off-Duty. Turn Online above to receive customer bookings.'
                    )}
              </p>
            </div>
          ) : (
            filteredBookings.map(booking => (
              <WorkerBookingCard
                key={booking.id}
                booking={booking}
                isRepeatCustomer={(completedCountsByCustomer.get(booking.customer_id) ?? 0) > 1}
                isUpdating={updatingBookingId === booking.id}
                onOpenContactModal={handleOpenContactModal}
                onOpenChangeRequest={setChangeRequestBooking}
                onConfirmCash={setConfirmModalBooking}
                onViewDetails={setDetailsModalBooking}
                onViewReceipt={setReceiptModalBooking}
                onUpdateStatus={handleUpdateStatus}
              />
            ))
          )}
        </div>
      </div>

      {/* Modals */}
      <ContactModal
        isOpen={contactModalData.isOpen}
        onClose={() => setContactModalData(prev => ({ ...prev, isOpen: false }))}
        name={contactModalData.name}
        phone={contactModalData.phone}
        avatar={contactModalData.avatar}
        roleLabel={contactModalData.roleLabel}
        whatsappMessage={contactModalData.whatsappMessage}
        bookingContext={contactModalData.bookingContext}
      />

      <SendQuoteModal
        request={quoteRequestToRespond}
        isOpen={Boolean(quoteRequestToRespond)}
        onClose={() => setQuoteRequestToRespond(null)}
        onSuccess={loadDashboardData}
      />

      <AdditionalChargeModal
        booking={changeRequestBooking}
        isOpen={Boolean(changeRequestBooking)}
        onClose={() => setChangeRequestBooking(null)}
        onSuccess={loadDashboardData}
      />

      <ConfirmCashModal
        booking={confirmModalBooking}
        isOpen={Boolean(confirmModalBooking)}
        onClose={() => setConfirmModalBooking(null)}
        onSuccess={loadDashboardData}
        onShowSuccessMsg={msg => {
          setPaymentSuccessMsg(msg)
          setTimeout(() => setPaymentSuccessMsg(''), 5000)
        }}
      />

      <CompletedJobModal
        booking={detailsModalBooking}
        isOpen={Boolean(detailsModalBooking)}
        isRepeatCustomer={
          detailsModalBooking
            ? (completedCountsByCustomer.get(detailsModalBooking.customer_id) ?? 0) > 1
            : false
        }
        onClose={() => setDetailsModalBooking(null)}
        onOpenAssistant={bId => openAssistant('worker_sarathi', undefined, bId)}
        onOpenSupport={bId => openSupport({ bookingId: bId, defaultTab: 'complaint' })}
        onOpenReceipt={b => setReceiptModalBooking(b)}
      />

      <WorkerReceiptModal
        booking={receiptModalBooking}
        isOpen={Boolean(receiptModalBooking)}
        onClose={() => setReceiptModalBooking(null)}
      />
    </div>
  )
}

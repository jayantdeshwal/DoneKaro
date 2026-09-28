import { useCallback, useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Button, Card, Avatar, Badge, RatingStars, Modal } from '@kaamgar/ui'
import { formatJobReference, getCategoryName, getServiceById, getCategoryById, JobId } from '@kaamgar/shared'
import {
  Calendar,
  Clock,
  MapPin,
  Star,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Loader2,
  MessageSquare,
  Phone,
  RefreshCw,
  Play,
  Shield,
  ArrowLeft,
  ArrowRight,
  FileText,
  Sparkles,
  Search,
  ExternalLink,
  Printer,
  Banknote,
  Info,
  UserCheck,
} from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { useAiAssistant } from '@/context/AiAssistantContext'
import { getSupabaseClient } from '@/lib/supabase'
import ContactModal from '@/components/ContactModal'
import { buildCustomerToWorkerWhatsAppMessage } from '@/utils/contact'
import { fetchCustomerReviewedBookingIds, submitBookingReview } from '@/services/reviews'
import { BookingChangeRequest, BookingPaymentSummary, confirmCashPaymentByCustomer, decideBookingChangeRequest, fetchBookingChangeRequests, fetchBookingPaymentSummaries, selectBookingPaymentMethod } from '@/services/changeRequests'
import { acceptBookingQuote, BookingQuote, BookingQuoteRequest, cancelBookingQuoteRequest, fetchCustomerQuoteData } from '@/services/quotes'

export interface CustomerBookingReview {
  id: string
  rating: number
  comment: string
  created_at: string
}

interface BookingRow {
  id: JobId
  worker_id: string
  category_id: string
  status: keyof typeof statusConfig
  scheduled_at: string
  address: string
  notes: string | null
  worker?: { name: string; avatar: string | null; phone?: string | null }
  hasReview?: boolean
  review?: CustomerBookingReview
  changeRequests?: BookingChangeRequest[]
  paymentSummary?: BookingPaymentSummary
}

interface WorkerDirectoryRow {
  id: string
  name: string
  avatar: string | null
  phone?: string | null
}

const statusConfig = {
  pending: {
    label: 'Pending',
    icon: Loader2,
    badgeClass: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20',
  },
  accepted: {
    label: 'Accepted',
    icon: CheckCircle2,
    badgeClass: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20',
  },
  in_progress: {
    label: 'In Progress',
    icon: Play,
    badgeClass: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20',
  },
  completed: {
    label: 'Completed',
    icon: CheckCircle2,
    badgeClass: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20',
  },
  payment_pending: {
    label: 'Payment Pending',
    icon: Clock,
    badgeClass: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20',
  },
  rejected: {
    label: 'Declined',
    icon: AlertCircle,
    badgeClass: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20',
  },
  cancelled: {
    label: 'Cancelled',
    icon: XCircle,
    badgeClass: 'bg-slate-500/10 text-slate-600 dark:text-zinc-400 border border-slate-300 dark:border-zinc-700',
  },
  disputed: {
    label: 'Disputed',
    icon: AlertCircle,
    badgeClass: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20',
  },
}

export default function Bookings() {
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()
  const { user } = useAuth()
  const { openAssistant } = useAiAssistant()

  const [allBookings, setAllBookings] = useState<BookingRow[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [activeTab, setActiveTab] = useState<'all' | 'upcoming' | 'past'>('all')

  // Review modal state
  const [showReviewModal, setShowReviewModal] = useState(false)
  const [selectedBooking, setSelectedBooking] = useState<BookingRow | null>(null)
  const [reviewRating, setReviewRating] = useState(5)
  const [reviewComment, setReviewComment] = useState('')
  const [isSubmittingReview, setIsSubmittingReview] = useState(false)
  const [reviewError, setReviewError] = useState('')

  // Cancellation modal state
  const [showCancelModal, setShowCancelModal] = useState(false)
  const [cancellingBooking, setCancellingBooking] = useState<BookingRow | null>(null)
  const [cancellationReason, setCancellationReason] = useState('')
  const [isCancelling, setIsCancelling] = useState(false)
  const [cancelError, setCancelError] = useState('')
  const [actionSuccess, setActionSuccess] = useState('')
  const [paymentActionBookingId, setPaymentActionBookingId] = useState('')
  const [paymentError, setPaymentError] = useState('')
  const [paymentModalBooking, setPaymentModalBooking] = useState<BookingRow | null>(null)
  const [receiptModalBooking, setReceiptModalBooking] = useState<BookingRow | null>(null)
  const [detailsModalBooking, setDetailsModalBooking] = useState<BookingRow | null>(null)
  const [bookAgainModalBooking, setBookAgainModalBooking] = useState<BookingRow | null>(null)
  const [isSubmittingPayment, setIsSubmittingPayment] = useState(false)
  const [paymentModalError, setPaymentModalError] = useState('')
  const [decidingRequestId, setDecidingRequestId] = useState('')
  const [changeRequestError, setChangeRequestError] = useState('')
  const [quoteRequests, setQuoteRequests] = useState<BookingQuoteRequest[]>([])
  const [quotes, setQuotes] = useState<BookingQuote[]>([])
  const [quoteWorkers, setQuoteWorkers] = useState<Map<string, { name: string; avatar: string | null; rating: number; reviews: number; experience: number }>>(new Map())
  const [quoteActionId, setQuoteActionId] = useState('')

  useEffect(() => {
    const target = window.location.hash.slice(1)
    if (!target) return
    const timer = window.setTimeout(() => document.getElementById(target)?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 150)
    return () => window.clearTimeout(timer)
  }, [])

  // Contact modal state
  const [contactModalData, setContactModalData] = useState<{
    isOpen: boolean
    name: string
    phone?: string | null
    avatar?: string | null
    roleLabel: string
    whatsappMessage?: string
    bookingContext?: {
      category?: string
      scheduledAt?: string
      address?: string
    }
  }>({
    isOpen: false,
    name: '',
    roleLabel: 'Service Professional',
  })

  const resolveServiceAndCategory = (categoryId: string) => {
    const service = getServiceById(categoryId)
    const category = getCategoryById(categoryId)
    const lang = i18n.language === 'hi' ? 'hi' : 'en'

    const serviceName = service ? getCategoryName(service, lang) : categoryId
    const categoryName = category ? getCategoryName(category, lang) : ''

    return { serviceName, categoryName }
  }

  const handleOpenContactModal = (booking: BookingRow) => {
    const { serviceName } = resolveServiceAndCategory(booking.category_id)
    const formattedDate = formatDate(booking.scheduled_at)
    const formattedTime = formatTime(booking.scheduled_at)
    const message = buildCustomerToWorkerWhatsAppMessage({
      workerName: booking.worker?.name,
      categoryName: serviceName,
      date: formattedDate,
      time: formattedTime,
      address: booking.address,
    })

    setContactModalData({
      isOpen: true,
      name: booking.worker?.name || t('bookings.artisan', 'Artisan'),
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

  const loadBookings = useCallback(async () => {
    setIsLoading(true)
    setLoadError('')
    try {
      const supabase = getSupabaseClient()
      let customerId = user?.id
      if (!customerId) {
        const { data: authData } = await supabase.auth.getUser()
        customerId = authData?.user?.id
      }
      if (!customerId) throw new Error('Please sign in to view your bookings')

      // Strictly isolated by customer_id
      const { data, error } = await supabase
        .from('bookings')
        .select('id, worker_id, category_id, status, scheduled_at, address, notes')
        .eq('customer_id', customerId)
        .order('scheduled_at', { ascending: false })

      if (error) throw error
      const bookings = (data ?? []) as BookingRow[]
      const workerIds = [...new Set(bookings.map(b => b.worker_id))].filter(Boolean)
      let workerById = new Map<string, WorkerDirectoryRow>()

      if (workerIds.length > 0) {
        const [{ data: workers, error: workersError }, { data: profiles }] = await Promise.all([
          supabase.from('approved_worker_directory').select('id, name, avatar').in('id', workerIds),
          supabase.from('profiles').select('id, full_name, phone, avatar_url').in('id', workerIds),
        ])

        if (!workersError && workers) {
          const profileById = new Map((profiles ?? []).map((p: any) => [p.id, p]))
          workerById = new Map(
            (workers as any[]).map(worker => {
              const prof = profileById.get(worker.id)
              return [
                worker.id,
                {
                  id: worker.id,
                  name: worker.name || prof?.full_name || 'Artisan',
                  avatar: worker.avatar || prof?.avatar_url || null,
                  phone: prof?.phone || null,
                },
              ]
            })
          )
        }
      }

      const [reviewedIds, reviewsRes] = await Promise.all([
        fetchCustomerReviewedBookingIds(customerId),
        (supabase.from('reviews') as any)
          .select('id, booking_id, rating, comment, created_at')
          .eq('customer_id', customerId),
      ])
      const reviewsByBooking = new Map<string, CustomerBookingReview>(
        ((reviewsRes.data ?? []) as any[]).map(r => [
          r.booking_id,
          {
            id: r.id,
            rating: Number(r.rating),
            comment: r.comment || '',
            created_at: r.created_at,
          },
        ])
      )

      const changeRequests = await fetchBookingChangeRequests(bookings.map(booking => booking.id))
      let paymentSummaries: BookingPaymentSummary[] = []
      try {
        paymentSummaries = await fetchBookingPaymentSummaries(bookings.map(booking => booking.id))
      } catch (summaryError) {
        console.warn('Booking payment summary unavailable:', summaryError)
      }
      const summaryByBooking = new Map(paymentSummaries.map(summary => [summary.booking_id, summary]))
      const requestsByBooking = new Map<string, BookingChangeRequest[]>()
      changeRequests.forEach(request => {
        const existing = requestsByBooking.get(request.booking_id) ?? []
        existing.push(request)
        requestsByBooking.set(request.booking_id, existing)
      })

      setAllBookings(
        bookings.map(booking => ({
          ...booking,
          worker: workerById.get(booking.worker_id),
          hasReview: reviewedIds.has(booking.id) || reviewsByBooking.has(booking.id),
          review: reviewsByBooking.get(booking.id),
          changeRequests: requestsByBooking.get(booking.id) ?? [],
          paymentSummary: summaryByBooking.get(booking.id),
        }))
      )

      const quoteData = await fetchCustomerQuoteData(customerId)
      setQuoteRequests(quoteData.requests)
      setQuotes(quoteData.quotes)
      const quoteWorkerIds = [...new Set(quoteData.requests.map(request => request.worker_id))]
      if (quoteWorkerIds.length > 0) {
        const { data: quoteWorkerRows } = await (supabase.from('approved_worker_directory') as any)
          .select('id, name, avatar, rating, reviews, experience')
          .in('id', quoteWorkerIds)
        setQuoteWorkers(new Map((quoteWorkerRows ?? []).map((worker: any) => [worker.id, {
          name: worker.name || 'Provider',
          avatar: worker.avatar || null,
          rating: Number(worker.rating ?? 0),
          reviews: Number(worker.reviews ?? 0),
          experience: Number(worker.experience ?? 0),
        }])))
      } else {
        setQuoteWorkers(new Map())
      }
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : 'Unable to load bookings')
    } finally {
      setIsLoading(false)
    }
  }, [user?.id])

  const handleChangeRequestDecision = async (request: BookingChangeRequest, decision: 'approved' | 'rejected') => {
    setDecidingRequestId(request.id)
    setChangeRequestError('')
    try {
      await decideBookingChangeRequest(request.id, decision)
      await loadBookings()
    } catch (error) {
      setChangeRequestError(error instanceof Error ? error.message : 'Unable to update the additional-charge request')
    } finally {
      setDecidingRequestId('')
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
      setActionSuccess(t('bookings.cashPaymentSubmittedMsg', 'Cash payment submitted. Waiting for worker confirmation.'))
      setTimeout(() => setActionSuccess(''), 5000)
    } catch (error) {
      await loadBookings()
      const msg = error instanceof Error ? error.message : ''
      if (msg.toLowerCase().includes('already') || msg.toLowerCase().includes('paid')) {
        setPaymentModalBooking(null)
        setActionSuccess(t('bookings.paymentSuccessful', 'Payment Successful'))
        setTimeout(() => setActionSuccess(''), 4000)
      } else {
        setPaymentModalError(t('bookings.paymentActionFailed', 'Unable to update the payment. Please try again.'))
      }
    } finally {
      setIsSubmittingPayment(false)
    }
  }

  const handleCashPaymentMethod = async (booking: BookingRow) => {
    setPaymentActionBookingId(booking.id)
    setPaymentError('')
    try {
      await selectBookingPaymentMethod(booking.id, 'cash')
      await loadBookings()
    } catch (error) {
      setPaymentError(error instanceof Error ? error.message : t('bookings.paymentActionFailed', 'Unable to update the payment. Please try again.'))
    } finally {
      setPaymentActionBookingId('')
    }
  }

  const handleCashConfirmation = async (booking: BookingRow) => {
    setPaymentActionBookingId(booking.id)
    setPaymentError('')
    try {
      if (booking.paymentSummary?.payment_method !== 'cash') {
        await selectBookingPaymentMethod(booking.id, 'cash')
      }
      await confirmCashPaymentByCustomer(booking.id)
      setActionSuccess(t('bookings.cashPaymentSubmittedMsg', 'Cash payment submitted. Waiting for worker confirmation.'))
      await loadBookings()
    } catch (error) {
      await loadBookings()
      setPaymentError(error instanceof Error ? error.message : t('bookings.paymentActionFailed', 'Unable to update the payment. Please try again.'))
    } finally {
      setPaymentActionBookingId('')
    }
  }

  const handleCancelQuoteRequest = async (request: BookingQuoteRequest) => {
    setQuoteActionId(request.id)
    try {
      await cancelBookingQuoteRequest(request.id, 'Customer no longer wants to wait')
      await loadBookings()
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : 'Unable to cancel quote request')
    } finally {
      setQuoteActionId('')
    }
  }

  const handleAcceptQuote = async (quote: BookingQuote) => {
    setQuoteActionId(quote.id)
    try {
      await acceptBookingQuote(quote.id)
      setActionSuccess('Quote accepted. Your booking has been created.')
      await loadBookings()
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : 'Unable to accept quote')
    } finally {
      setQuoteActionId('')
    }
  }

  useEffect(() => {
    void loadBookings()
  }, [loadBookings])

  // Real-time subscription for customer's bookings and quote requests
  useEffect(() => {
    const customerId = user?.id
    if (!customerId) return

    const supabase = getSupabaseClient()
    const channel = supabase
      .channel(`customer-bookings-realtime-${customerId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'bookings',
          filter: `customer_id=eq.${customerId}`,
        },
        () => {
          void loadBookings()
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'booking_quote_requests',
          filter: `customer_id=eq.${customerId}`,
        },
        () => {
          void loadBookings()
        }
      )
      .subscribe()

    return () => {
      void supabase.removeChannel(channel)
    }
  }, [user?.id, loadBookings])

  const upcomingBookings = allBookings.filter(b => ['pending', 'accepted', 'in_progress', 'payment_pending'].includes(b.status))
  const pastBookings = allBookings.filter(b => ['completed', 'rejected', 'cancelled', 'disputed'].includes(b.status))

  const formatDate = (dateStr: string) => {
    if (!dateStr) return ''
    return new Date(dateStr).toLocaleDateString(i18n.language === 'hi' ? 'hi-IN' : 'en-IN', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  const formatTime = (dateStr: string) => {
    if (!dateStr) return ''
    return new Date(dateStr).toLocaleTimeString(i18n.language === 'hi' ? 'hi-IN' : 'en-IN', {
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const handleReviewSubmit = async () => {
    if (!selectedBooking) return
    setIsSubmittingReview(true)
    setReviewError('')
    try {
      await submitBookingReview({
        bookingId: selectedBooking.id,
        workerId: selectedBooking.worker_id,
        rating: reviewRating,
        comment: reviewComment,
      })

      const newReview: CustomerBookingReview = {
        id: '',
        rating: reviewRating,
        comment: reviewComment,
        created_at: new Date().toISOString(),
      }

      setAllBookings(current =>
        current.map(b => (b.id === selectedBooking.id ? { ...b, hasReview: true, review: newReview } : b))
      )
      if (detailsModalBooking?.id === selectedBooking.id) {
        setDetailsModalBooking(prev => prev ? { ...prev, hasReview: true, review: newReview } : null)
      }

      setShowReviewModal(false)
      setSelectedBooking(null)
      setReviewRating(5)
      setReviewComment('')
      setActionSuccess('Thank you! Your review has been submitted successfully.')
      setTimeout(() => setActionSuccess(''), 4000)
    } catch (err) {
      setReviewError(err instanceof Error ? err.message : 'Unable to submit review')
    } finally {
      setIsSubmittingReview(false)
    }
  }

  const handleOpenCancelModal = (booking: BookingRow) => {
    setCancellingBooking(booking)
    setCancellationReason('')
    setCancelError('')
    setShowCancelModal(true)
  }

  const handleCancelBooking = async () => {
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
      setCancellationReason('')
      setActionSuccess(t('bookings.cancelSuccess', 'Booking cancelled successfully'))
      setTimeout(() => setActionSuccess(''), 4000)
    } catch (err) {
      setCancelError(err instanceof Error ? err.message : 'Unable to cancel booking')
    } finally {
      setIsCancelling(false)
    }
  }

  // Helper render for single booking card
  const renderBookingCard = (booking: BookingRow, isPast: boolean) => {
    const config = statusConfig[booking.status as keyof typeof statusConfig] || statusConfig.pending
    const Icon = config.icon
    const { serviceName, categoryName } = resolveServiceAndCategory(booking.category_id)
    const canCancel = booking.status === 'pending' || booking.status === 'accepted'
    const jobReference = formatJobReference(booking.id)

    return (
      <div
        key={booking.id}
        id={`booking-${booking.id}`}
        className={`bg-white dark:bg-zinc-900 border rounded-2xl p-5 shadow-sm transition-all ${
          booking.status === 'in_progress'
            ? 'border-indigo-500/50 shadow-indigo-500/5 ring-1 ring-indigo-500/20'
            : booking.status === 'accepted'
            ? 'border-blue-500/40'
            : booking.status === 'completed'
            ? 'border-slate-200 dark:border-zinc-800'
            : 'border-slate-200 dark:border-zinc-800'
        }`}
      >
        {/* Top Reference & Status Row */}
        <div className="flex items-center justify-between gap-2 mb-4 pb-3 border-b border-slate-100 dark:border-zinc-800/80">
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300">
              {jobReference}
            </span>
            {categoryName && (
              <span className="text-xs text-slate-500 dark:text-zinc-400 hidden sm:inline-block">
                • {categoryName}
              </span>
            )}
          </div>
          <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full ${config.badgeClass}`}>
            <Icon className={`w-3.5 h-3.5 ${booking.status === 'pending' ? 'animate-spin' : ''}`} />
            {t(`booking.status.${booking.status === 'in_progress' ? 'inProgress' : booking.status}`, config.label)}
          </span>
        </div>

        {/* Worker and Service Info */}
        <div className="flex items-start gap-3.5">
          <Avatar
            name={booking.worker?.name || t('bookings.artisan', 'Artisan')}
            size="lg"
            src={booking.worker?.avatar || undefined}
          />
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-base text-slate-900 dark:text-white truncate">
              {serviceName}
            </h3>
            <p className="text-sm font-medium text-slate-600 dark:text-zinc-400 truncate">
              {booking.worker?.name || t('bookings.artisan', 'Assigned Artisan')}
            </p>

            {/* Status Informational Callout */}
            {booking.status === 'accepted' && (
              <p className="mt-2 text-xs font-semibold text-blue-600 dark:text-blue-400">
                {t('bookings.acceptedMsg', 'Artisan has confirmed your booking.')}
              </p>
            )}
            {booking.status === 'in_progress' && (
              <div className="mt-2 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 text-xs font-semibold border border-indigo-500/20">
                <span className="w-2 h-2 rounded-full bg-indigo-500 animate-ping" />
                <span>{t('bookings.inProgressMsg', 'Service currently in progress.')}</span>
              </div>
            )}
            {booking.status === 'completed' && (
              <p className="mt-2 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                {t('bookings.completedMsg', 'Service completed successfully.')}
              </p>
            )}
            {booking.status === 'payment_pending' && (
              <p className="mt-2 text-xs font-semibold text-amber-600 dark:text-amber-400">
                {t('bookings.paymentPendingMsg', 'Service is finished. Payment is pending.')}
              </p>
            )}
            {booking.status === 'rejected' && (
              <p className="mt-2 text-xs font-semibold text-rose-600 dark:text-rose-400">
                {t('bookings.rejectedMsg', 'This booking request was declined by the artisan.')}
              </p>
            )}
            {booking.status === 'cancelled' && (
              <p className="mt-2 text-xs font-semibold text-slate-500 dark:text-zinc-400">
                {t('bookings.cancelledByCustomer', 'This booking was cancelled.')}
              </p>
            )}
          </div>
        </div>

        {/* Schedule & Address Details */}
        <div className="mt-4 pt-3 border-t border-slate-100 dark:border-zinc-800/80 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-600 dark:text-zinc-400">
          <div className="flex items-center gap-2">
            <Calendar className="w-3.5 h-3.5 text-amber-500 shrink-0" />
            <span className="truncate">
              <strong className="text-slate-800 dark:text-zinc-200">{formatDate(booking.scheduled_at)}</strong>
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="w-3.5 h-3.5 text-amber-500 shrink-0" />
            <span className="truncate">
              <strong className="text-slate-800 dark:text-zinc-200">{formatTime(booking.scheduled_at)}</strong>
            </span>
          </div>
          <div className="flex items-start gap-2 sm:col-span-2">
            <MapPin className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
            <span className="truncate">
              <strong className="text-slate-800 dark:text-zinc-200">{booking.address}</strong>
            </span>
          </div>
          {booking.notes && (
            <div className="flex items-start gap-2 sm:col-span-2 bg-slate-50 dark:bg-zinc-800/50 p-2.5 rounded-xl mt-1">
              <FileText className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
              <p className="text-xs text-slate-600 dark:text-zinc-400 break-words line-clamp-2">
                {booking.notes}
              </p>
            </div>
          )}
        </div>

        {booking.changeRequests?.map(request => (
          <div key={request.id} className="mt-4 rounded-xl border border-amber-500/25 bg-amber-500/5 p-3.5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-sm font-bold text-slate-900 dark:text-white">Additional charge requested</p>
              <Badge variant={request.status === 'pending' ? 'warning' : request.status === 'approved' ? 'success' : 'default'}>
                {request.status === 'pending' ? 'Pending approval' : request.status[0].toUpperCase() + request.status.slice(1)}
              </Badge>
            </div>
            <p className="mt-2 text-xs text-slate-600 dark:text-zinc-400">Job {jobReference} • {new Date(request.created_at).toLocaleString(i18n.language === 'hi' ? 'hi-IN' : 'en-IN')}</p>
            <p className="mt-2 text-sm text-slate-700 dark:text-zinc-300">Reason: {request.reason}</p>
            <p className="mt-1 text-sm font-bold text-slate-900 dark:text-white">Additional amount: ₹{request.amount.toFixed(2)}</p>
            {request.status === 'pending' && (
              <div className="mt-3 flex flex-wrap gap-2">
                <Button
                  variant="primary"
                  size="sm"
                  loading={decidingRequestId === request.id}
                  onClick={() => void handleChangeRequestDecision(request, 'approved')}
                >
                  Approve
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  disabled={Boolean(decidingRequestId)}
                  onClick={() => void handleChangeRequestDecision(request, 'rejected')}
                >
                  Reject
                </Button>
              </div>
            )}
          </div>
        ))}
        {changeRequestError && (
          <p className="mt-2 text-xs font-semibold text-rose-600 dark:text-rose-400">{changeRequestError}</p>
        )}

        {booking.paymentSummary?.has_initial_quote && (
          <div className="mt-4 rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-3.5">
            <p className="text-sm font-bold text-slate-900 dark:text-white">{t('bookings.paymentSummary', 'Payment Summary')}</p>
            <div className="mt-2 space-y-1 text-sm text-slate-600 dark:text-zinc-400">
              <div className="flex items-center justify-between gap-3">
                <span>{t('bookings.initialServiceCharge', 'Initial service charge')}</span>
                <span className="font-semibold text-slate-900 dark:text-zinc-200">₹{booking.paymentSummary.initial_quote_amount.toFixed(2)}</span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span>{t('bookings.approvedAdditionalCharges', 'Approved additional charges')}</span>
                <span className="font-semibold text-slate-900 dark:text-zinc-200">₹{booking.paymentSummary.approved_additional_amount.toFixed(2)}</span>
              </div>
              <div className="flex items-center justify-between gap-3 border-t border-emerald-500/20 pt-2 font-bold text-slate-900 dark:text-white">
                <span>{booking.paymentSummary.is_final || booking.paymentSummary.is_frozen
                  ? t('bookings.finalPayableAmount', 'Final payable amount')
                  : t('bookings.currentPayableAmount', 'Current payable amount')}</span>
                <span>₹{booking.paymentSummary.final_payable_amount.toFixed(2)}</span>
              </div>
            </div>
            {booking.paymentSummary.pending_additional_count > 0 && (
              <p className="mt-2 text-xs text-amber-700 dark:text-amber-300">{t('bookings.pendingAdditionalCharges', 'Additional charges are awaiting approval.')}</p>
            )}
            {booking.status === 'payment_pending' && booking.paymentSummary.pending_additional_count === 0 && (
              <p className="mt-2 text-xs text-amber-700 dark:text-amber-300">{t('bookings.paymentPendingMsg', 'Service is finished. Payment is pending.')}</p>
            )}
            {booking.paymentSummary.is_frozen && (
              <p className="mt-1 text-xs font-semibold text-slate-600 dark:text-zinc-300">
                {t('bookings.paymentStatus', 'Payment status')}: {t(`bookings.paymentStatuses.${booking.paymentSummary.payment_status ?? 'unpaid'}`, 'Unpaid')}
              </p>
            )}
            {!booking.paymentSummary.is_final && booking.paymentSummary.pending_additional_count === 0 && booking.status !== 'completed' && booking.status !== 'payment_pending' && (
              <p className="mt-2 text-xs text-slate-500 dark:text-zinc-400">{t('bookings.finalAmountAfterCompletion', 'The final amount will be shown after the service is completed.')}</p>
            )}
            {/* State A: Service Finished, Payment Required */}
            {booking.status === 'payment_pending' && booking.paymentSummary.is_frozen && booking.paymentSummary.payment_status !== 'paid' && booking.paymentSummary.payment_status !== 'pending' && (
              <div className="mt-4 rounded-xl border border-amber-500/30 bg-amber-500/10 p-3.5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                    <p className="text-sm font-bold text-slate-900 dark:text-white">{t('bookings.serviceCompleted', 'Service Completed')}</p>
                  </div>
                  <Badge variant="warning" size="sm">
                    {t('bookings.paymentRequired', 'Payment Required')}
                  </Badge>
                </div>
                <div className="mt-2 flex items-baseline justify-between">
                  <span className="text-xs text-slate-600 dark:text-zinc-400">{t('bookings.amountToPay', 'Amount to Pay')}:</span>
                  <span className="text-base font-bold text-slate-900 dark:text-white">₹{booking.paymentSummary.final_payable_amount.toFixed(2)}</span>
                </div>
                <p className="mt-1 text-xs text-slate-600 dark:text-zinc-400">{t('bookings.payWorkerInCash', 'Pay the worker the amount shown above in cash.')}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Button
                    variant="primary"
                    size="sm"
                    className="font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 flex items-center justify-center gap-1.5"
                    onClick={() => handleOpenPaymentModal(booking)}
                  >
                    <Banknote className="w-4 h-4" />
                    {t('bookings.payWithCash', 'Pay with Cash')}
                  </Button>
                </div>
              </div>
            )}

            {/* State B: Cash Confirmation Submitted, Waiting for Worker */}
            {booking.status === 'payment_pending' && booking.paymentSummary.payment_status === 'pending' && (
              <div className="mt-4 rounded-xl border border-amber-500/30 bg-amber-500/10 p-3.5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-4 h-4 text-amber-500 animate-spin" />
                    <p className="text-sm font-bold text-amber-800 dark:text-amber-300">{t('bookings.cashPaymentSubmitted', 'Cash Payment Submitted')}</p>
                  </div>
                  <Badge variant="warning" size="sm">
                    {t('bookings.waitingForWorkerConfirmation', 'Waiting for worker confirmation')}
                  </Badge>
                </div>
                <p className="mt-2 text-xs text-slate-700 dark:text-zinc-300">
                  {t('bookings.waitingForWorkerConfirmationDesc', 'Waiting for worker confirmation. Your receipt will appear once the payment is confirmed.')}
                </p>
                <div className="mt-2 text-xs font-semibold text-slate-600 dark:text-zinc-400 flex items-center justify-between pt-2 border-t border-amber-500/20">
                  <span>{t('bookings.amountToPay', 'Amount to Pay')}</span>
                  <span className="text-slate-900 dark:text-white font-bold">₹{booking.paymentSummary.final_payable_amount.toFixed(2)} · {t('bookings.paymentMethodCash', 'Cash')}</span>
                </div>
              </div>
            )}

            {/* State C: Paid & Authoritative Receipt Exists */}
            {booking.status === 'completed' && booking.paymentSummary.payment_status === 'paid' && booking.paymentSummary.receipt_number && (
              <div className="mt-4 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3.5 text-sm">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                    <span className="font-bold text-emerald-800 dark:text-emerald-300">{t('bookings.paymentSuccessful', 'Payment Successful')}</span>
                  </div>
                  <span className="font-mono text-xs font-bold px-2 py-0.5 rounded-lg bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30">
                    {booking.paymentSummary.receipt_number}
                  </span>
                </div>
                <div className="mt-2 flex items-baseline justify-between">
                  <span className="text-xs text-slate-600 dark:text-zinc-400">{t('bookings.totalPaid', 'Total Paid')}:</span>
                  <span className="text-base font-bold text-emerald-700 dark:text-emerald-300">₹{booking.paymentSummary.final_payable_amount.toFixed(2)} · {t('bookings.paymentMethodCash', 'Cash')}</span>
                </div>
                <p className="mt-1 text-xs text-slate-500 dark:text-zinc-400">
                  {t('bookings.paidAt', 'Paid at')}: {booking.paymentSummary.receipt_paid_at || booking.paymentSummary.paid_at ? new Date(booking.paymentSummary.receipt_paid_at || booking.paymentSummary.paid_at || '').toLocaleString(i18n.language === 'hi' ? 'hi-IN' : 'en-IN', { dateStyle: 'medium', timeStyle: 'short' }) : '—'}
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-3 text-xs font-bold flex items-center gap-1.5 text-emerald-700 dark:text-emerald-300 border-emerald-500/40 hover:bg-emerald-500/20"
                  onClick={() => handleOpenReceiptModal(booking)}
                >
                  <FileText className="w-3.5 h-3.5" />
                  {t('bookings.viewReceipt', 'View Receipt')}
                </Button>
              </div>
            )}
            {paymentError && paymentActionBookingId === '' && booking.status === 'payment_pending' && (
              <p className="mt-2 text-xs font-semibold text-rose-600 dark:text-rose-400">{paymentError}</p>
            )}
          </div>
        )}

        {/* Actions Row */}
        <div className="mt-4 pt-3 border-t border-slate-100 dark:border-zinc-800/80 flex flex-wrap items-center justify-between gap-2.5">
          <div className="flex flex-wrap items-center gap-2">
            {(booking.status === 'accepted' || booking.status === 'in_progress' || booking.status === 'completed') && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleOpenContactModal(booking)}
                  className="text-xs font-semibold flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/10"
                >
                  <Phone className="w-3.5 h-3.5" />
                  {t('bookings.callWorker', 'Call Artisan')}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleOpenContactModal(booking)}
                  className="text-xs font-semibold flex items-center gap-1.5 text-amber-600 dark:text-amber-400 border-amber-500/30 hover:bg-amber-500/10"
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  {t('bookings.chatWorker', 'WhatsApp')}
                </Button>
              </>
            )}

            {booking.status === 'completed' && !booking.hasReview && (
              <Button
                variant="primary"
                size="sm"
                onClick={() => {
                  setSelectedBooking(booking)
                  setShowReviewModal(true)
                }}
                className="text-xs font-bold flex items-center gap-1 bg-amber-500 hover:bg-amber-400 text-slate-950"
              >
                <Star className="w-3.5 h-3.5" />
                {t('bookings.rateWorker', 'Rate Artisan')}
              </Button>
            )}

            {booking.status === 'payment_pending' && booking.paymentSummary?.payment_status !== 'pending' && booking.paymentSummary?.payment_status !== 'paid' && (
              <Button
                variant="primary"
                size="sm"
                onClick={() => handleOpenPaymentModal(booking)}
                className="text-xs font-bold flex items-center gap-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950"
              >
                <Banknote className="w-3.5 h-3.5" />
                {t('bookings.payWithCash', 'Pay with Cash')}
              </Button>
            )}

            {booking.status === 'completed' && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleOpenDetailsModal(booking)}
                className="text-xs font-semibold flex items-center gap-1.5 text-slate-700 dark:text-zinc-300 border-slate-200 dark:border-zinc-700 hover:bg-slate-100 dark:hover:bg-zinc-800"
              >
                <Info className="w-3.5 h-3.5 text-amber-500" />
                {t('bookings.viewDetails', 'View Details')}
              </Button>
            )}

            {booking.status === 'completed' && booking.paymentSummary?.receipt_number && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleOpenReceiptModal(booking)}
                className="text-xs font-semibold flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/10"
              >
                <FileText className="w-3.5 h-3.5" />
                {t('bookings.viewReceipt', 'View Receipt')}
              </Button>
            )}

            {booking.status === 'completed' && booking.hasReview && (
              <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400 px-2 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                <CheckCircle2 className="w-3.5 h-3.5" />
                {booking.review ? `★ ${booking.review.rating}/5 ${t('bookings.reviewed', 'Reviewed')}` : t('bookings.reviewSubmitted', 'Review Submitted')}
              </span>
            )}

            {isPast && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleOpenBookAgainModal(booking)}
                className="text-xs font-medium flex items-center gap-1 text-slate-700 dark:text-zinc-300 border-slate-200 dark:border-zinc-700 hover:bg-slate-100 dark:hover:bg-zinc-800"
              >
                <RefreshCw className="w-3 h-3 text-amber-500" />
                {t('bookings.bookAgain', 'Book Again')}
              </Button>
            )}
          </div>

          {canCancel && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleOpenCancelModal(booking)}
              className="text-xs font-medium text-rose-600 dark:text-rose-400 border-rose-500/30 hover:bg-rose-500/10"
            >
              <XCircle className="w-3.5 h-3.5 mr-1" />
              {t('bookings.cancelBooking', 'Cancel Booking')}
            </Button>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-zinc-950 text-slate-900 dark:text-zinc-100 transition-colors pb-20">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        
        {/* Navigation & Header */}
        <div className="flex items-center justify-between gap-3 mb-6">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/')}
              className="p-2 rounded-xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-slate-700 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors"
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
            className="flex items-center gap-1.5 text-xs font-semibold"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">{t('common.refresh', 'Refresh')}</span>
          </Button>
        </div>

        {/* Quick Stats Summary */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          <div className="p-3.5 rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 shadow-sm text-center">
            <div className="text-lg sm:text-xl font-bold text-amber-600 dark:text-amber-400">
              {upcomingBookings.length}
            </div>
            <div className="text-[11px] font-semibold text-slate-500 dark:text-zinc-400 mt-0.5">
              {t('bookings.activeCount', 'Active')}
            </div>
          </div>
          <div className="p-3.5 rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 shadow-sm text-center">
            <div className="text-lg sm:text-xl font-bold text-emerald-600 dark:text-emerald-400">
              {allBookings.filter(b => b.status === 'completed').length}
            </div>
            <div className="text-[11px] font-semibold text-slate-500 dark:text-zinc-400 mt-0.5">
              {t('bookings.completedCount', 'Completed')}
            </div>
          </div>
          <div className="p-3.5 rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 shadow-sm text-center">
            <div className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">
              {allBookings.length}
            </div>
            <div className="text-[11px] font-semibold text-slate-500 dark:text-zinc-400 mt-0.5">
              {t('bookings.totalBookings', 'Total')}
            </div>
          </div>
        </div>

        {/* AI Support Banner */}
        <div className="mb-6 p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-amber-500/30 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-lg shrink-0">
              🤖
            </div>
            <div>
              <h3 className="text-xs font-bold text-slate-900 dark:text-white">
                {i18n.language === 'hi' ? 'जुगनू AI सहायता (24x7)' : 'Jugnu AI Helpdesk (24x7)'}
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-zinc-400">
                {i18n.language === 'hi'
                  ? 'बुकिंग में देरी, सवाल या कारीगर से संपर्क में तुरंत मदद पाएं'
                  : 'Get quick assistance with booking status, artisan contact, or scheduling'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto shrink-0">
            <button
              onClick={() => openAssistant('customer_care')}
              className="flex-1 sm:flex-initial px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-sm"
            >
              <Shield className="w-3.5 h-3.5" />
              <span>{i18n.language === 'hi' ? 'जुगनू समाधान' : 'Jugnu Care'}</span>
            </button>
          </div>
        </div>

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

        {quoteRequests.length > 0 && (
          <section id="quote-requests" className="mb-6 space-y-3 scroll-mt-24">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-amber-500" />
              <h2 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">Quote Requests</h2>
            </div>
            {quoteRequests.map(request => {
              const service = request.service_request
              const worker = quoteWorkers.get(request.worker_id)
              const quote = request.status === 'quoted'
                ? quotes.find(item => item.quote_request_id === request.id && item.status === 'submitted')
                : undefined
              const canCancel = request.status === 'pending' || request.status === 'quoted'
              return (
                <Card key={request.id} className="p-4 border-amber-500/25 bg-amber-500/5">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="font-bold text-slate-900 dark:text-white">{worker?.name || 'Selected provider'}</p>
                      <p className="text-xs text-slate-600 dark:text-zinc-400 mt-1">{service ? resolveServiceAndCategory(service.category_id).serviceName : 'Service request'}</p>
                      {worker && <p className="text-xs text-slate-600 dark:text-zinc-400 mt-1">{worker.rating > 0 ? `★ ${worker.rating.toFixed(1)}` : 'No ratings yet'} · {worker.reviews} reviews · {worker.experience} years experience</p>}
                    </div>
                    <Badge variant={request.status === 'quoted' ? 'success' : request.status === 'pending' ? 'warning' : 'default'}>
                      {request.status === 'pending' ? 'Waiting for provider' : request.status === 'quoted' ? 'Quote received' : request.status[0].toUpperCase() + request.status.slice(1)}
                    </Badge>
                  </div>
                  {service && <p className="mt-2 text-xs text-slate-600 dark:text-zinc-400">{formatDate(service.scheduled_for)} at {formatTime(service.scheduled_for)} · {service.pincode}</p>}
                  {quote && (
                    <div className="mt-3 rounded-xl bg-white/70 dark:bg-zinc-900/50 border border-emerald-500/25 p-3">
                      <p className="text-sm font-bold text-slate-900 dark:text-white">Provider quote: ₹{Number(quote.amount).toFixed(2)}</p>
                      {quote.details && <p className="mt-1 text-sm text-slate-600 dark:text-zinc-400">{quote.details}</p>}
                      <p className="mt-1 text-xs text-slate-500 dark:text-zinc-500">Received {new Date(quote.submitted_at).toLocaleString(i18n.language === 'hi' ? 'hi-IN' : 'en-IN')}</p>
                      <Button variant="primary" size="sm" className="mt-3" loading={quoteActionId === quote.id} onClick={() => void handleAcceptQuote(quote)}>
                        Accept Quote
                      </Button>
                    </div>
                  )}
                  {canCancel && (
                      <div className="mt-3 flex flex-wrap gap-2">
                        <Button variant="outline" size="sm" disabled={Boolean(quoteActionId)} loading={quoteActionId === request.id} onClick={() => void handleCancelQuoteRequest(request)}>
                          Cancel Request
                        </Button>
                      </div>
                  )}
                  {(request.status === 'cancelled' || request.status === 'expired' || request.status === 'rejected') && service && (
                    <Link to={`/search?category=${encodeURIComponent(service.category_id)}`} className="inline-block mt-3">
                      <Button variant="secondary" size="sm">Choose Another Provider</Button>
                    </Link>
                  )}
                </Card>
              )
            })}
          </section>
        )}

        {/* Filter Navigation Tabs */}
        <div className="flex items-center gap-2 p-1 rounded-2xl bg-slate-200/80 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 mb-6">
          <button
            onClick={() => setActiveTab('all')}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'all'
                ? 'bg-white dark:bg-zinc-800 text-slate-900 dark:text-white shadow-sm'
                : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            {t('bookings.allBookings', 'All')} ({allBookings.length})
          </button>
          <button
            onClick={() => setActiveTab('upcoming')}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'upcoming'
                ? 'bg-white dark:bg-zinc-800 text-amber-600 dark:text-amber-400 shadow-sm'
                : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            {t('bookings.activeAndUpcoming', 'Upcoming & Active')} ({upcomingBookings.length})
          </button>
          <button
            onClick={() => setActiveTab('past')}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'past'
                ? 'bg-white dark:bg-zinc-800 text-slate-900 dark:text-white shadow-sm'
                : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            {t('bookings.past', 'Past')} ({pastBookings.length})
          </button>
        </div>

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
                      {t('bookings.noActiveDesc', 'Ready to get things fixed? Discover our verified local artisans and book your service in seconds.')}
                    </p>
                    <Link to="/categories">
                      <Button variant="primary" size="sm" className="text-xs font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 px-4 py-2">
                        <Sparkles className="w-3.5 h-3.5 mr-1.5" />
                        {t('bookings.findService', 'Find a Service')}
                      </Button>
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {upcomingBookings.map(b => renderBookingCard(b, false))}
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
                      {t('bookings.noPastDesc', 'Your completed and past service appointments will be listed here.')}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {pastBookings.map(b => renderBookingCard(b, true))}
                  </div>
                )}
              </section>
            )}
          </div>
        )}
      </div>

      {/* Cancellation Confirmation Modal */}
      <Modal
        isOpen={showCancelModal}
        onClose={() => {
          if (!isCancelling) {
            setShowCancelModal(false)
            setCancellingBooking(null)
          }
        }}
        title={t('bookings.cancelConfirmTitle', 'Cancel this booking?')}
        description={t('bookings.cancelConfirmDesc', 'Are you sure you want to cancel this booking? This action cannot be undone.')}
        size="md"
      >
        <div className="space-y-4">
          {cancelError && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-500 text-xs">
              {cancelError}
            </div>
          )}

          {cancellingBooking && (
            <div className="p-3.5 bg-slate-50 dark:bg-zinc-800/60 border border-slate-200 dark:border-zinc-700/60 rounded-xl text-xs">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-900 dark:text-white">
                  {resolveServiceAndCategory(cancellingBooking.category_id).serviceName}
                </span>
                <span className="font-medium text-slate-600 dark:text-zinc-400">
                  {cancellingBooking.worker?.name || t('bookings.artisan', 'Artisan')}
                </span>
              </div>
              <p className="text-slate-500 dark:text-zinc-400 mt-1">
                {formatDate(cancellingBooking.scheduled_at)} at {formatTime(cancellingBooking.scheduled_at)}
              </p>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-2">
              {t('bookings.cancelReasonPlaceholder', 'Reason for cancellation')}
            </label>
            <div className="flex flex-wrap gap-1.5 mb-2.5">
              {[
                { label: t('bookings.reasonChangePlans', 'Change of plans'), value: 'Change of plans' },
                { label: t('bookings.reasonFoundAnother', 'Found another service'), value: 'Found another service' },
                { label: t('bookings.reasonWrongDateTime', 'Wrong date/time selected'), value: 'Wrong date/time selected' },
                { label: t('bookings.reasonEmergency', 'Emergency'), value: 'Emergency' },
              ].map(quickReason => (
                <button
                  key={quickReason.value}
                  type="button"
                  onClick={() => setCancellationReason(quickReason.value)}
                  className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${
                    cancellationReason === quickReason.value
                      ? 'bg-amber-500/20 border-amber-500/50 text-amber-700 dark:text-amber-300 font-medium'
                      : 'bg-slate-100 dark:bg-zinc-800 border-slate-200 dark:border-zinc-700 text-slate-600 dark:text-zinc-400 hover:border-slate-300 dark:hover:border-zinc-600'
                  }`}
                >
                  {quickReason.label}
                </button>
              ))}
            </div>
            <textarea
              value={cancellationReason}
              onChange={e => setCancellationReason(e.target.value)}
              placeholder={t('bookings.cancelReasonPlaceholder', 'Enter cancellation details...')}
              rows={3}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-xl text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-amber-500"
            />
          </div>

          <div className="flex gap-2.5 justify-end pt-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                setShowCancelModal(false)
                setCancellingBooking(null)
              }}
              disabled={isCancelling}
              className="text-xs"
            >
              {t('bookings.keepBooking', 'Keep Booking')}
            </Button>
            <Button
              variant="danger"
              size="sm"
              onClick={handleCancelBooking}
              loading={isCancelling}
              className="text-xs font-bold"
            >
              {t('bookings.confirmCancel', 'Confirm Cancellation')}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Rate/Review Modal */}
      <Modal
        isOpen={showReviewModal}
        onClose={() => {
          if (!isSubmittingReview) {
            setShowReviewModal(false)
            setSelectedBooking(null)
            setReviewRating(5)
            setReviewComment('')
            setReviewError('')
          }
        }}
        title={t('review.title', 'Rate Service')}
        size="md"
      >
        <div className="space-y-4">
          <p className="text-xs text-slate-600 dark:text-zinc-400">
            {selectedBooking?.worker?.name || t('bookings.artisan', 'Artisan')} • {selectedBooking ? resolveServiceAndCategory(selectedBooking.category_id).serviceName : ''}
          </p>

          {reviewError && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-500 text-xs">
              {reviewError}
            </div>
          )}

          <div className="flex flex-col items-center justify-center py-2">
            <RatingStars
              rating={reviewRating}
              interactive
              onChange={setReviewRating}
              size="lg"
              showValue
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-1.5">
              {t('review.placeholder', 'Your feedback')}
            </label>
            <textarea
              value={reviewComment}
              onChange={e => setReviewComment(e.target.value)}
              placeholder={t('review.placeholder', 'Share your experience with this artisan...')}
              rows={3}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-xl text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-amber-500"
            />
          </div>

          <div className="flex gap-2.5 pt-2">
            <Button
              variant="secondary"
              size="sm"
              disabled={isSubmittingReview}
              onClick={() => {
                setShowReviewModal(false)
                setSelectedBooking(null)
                setReviewRating(5)
                setReviewComment('')
                setReviewError('')
              }}
              className="flex-1 text-xs"
            >
              {t('common.cancel', 'Cancel')}
            </Button>
            <Button
              variant="primary"
              size="sm"
              disabled={isSubmittingReview}
              onClick={handleReviewSubmit}
              loading={isSubmittingReview}
              className="flex-1 text-xs font-bold bg-amber-500 hover:bg-amber-400 text-slate-950"
            >
              {isSubmittingReview ? t('common.submitting', 'Submitting...') : t('review.submit', 'Submit Review')}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Customer Payment Modal */}
      <Modal
        isOpen={Boolean(paymentModalBooking)}
        onClose={() => {
          if (!isSubmittingPayment) {
            setPaymentModalBooking(null)
            setPaymentModalError('')
          }
        }}
        title={t('bookings.serviceCompleted', 'Service Completed')}
        description={paymentModalBooking ? `Job ${formatJobReference(paymentModalBooking.id)}` : undefined}
        size="md"
      >
        {paymentModalBooking && (() => {
          const { serviceName } = resolveServiceAndCategory(paymentModalBooking.category_id)
          const summary = paymentModalBooking.paymentSummary
          const quoteAmount = summary?.initial_quote_amount ?? 0
          const additionalAmount = summary?.approved_additional_amount ?? 0
          const finalAmount = summary?.final_payable_amount ?? (quoteAmount + additionalAmount)

          return (
            <div className="space-y-4">
              {paymentModalError && (
                <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-500 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{paymentModalError}</span>
                </div>
              )}

              {/* Service & Worker Summary */}
              <div className="p-3.5 bg-slate-50 dark:bg-zinc-800/60 border border-slate-200 dark:border-zinc-700/60 rounded-2xl flex items-center gap-3">
                <Avatar
                  name={paymentModalBooking.worker?.name || t('bookings.artisan', 'Artisan')}
                  size="md"
                  src={paymentModalBooking.worker?.avatar || undefined}
                />
                <div className="min-w-0 flex-1">
                  <p className="font-bold text-sm text-slate-900 dark:text-white truncate">
                    {serviceName}
                  </p>
                  <p className="text-xs text-slate-600 dark:text-zinc-400 truncate">
                    {paymentModalBooking.worker?.name || t('bookings.artisan', 'Artisan')}
                  </p>
                </div>
                <Badge variant="warning" size="sm">
                  {t('bookings.paymentRequired', 'Payment Required')}
                </Badge>
              </div>

              {/* Payment Summary Breakdown */}
              <div className="rounded-2xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4 shadow-xs">
                <p className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-500 mb-3">
                  {t('bookings.paymentSummary', 'Payment Summary')}
                </p>
                <div className="space-y-2 text-xs">
                  <div className="flex items-center justify-between text-slate-600 dark:text-zinc-400">
                    <span>{t('bookings.workerQuote', 'Worker Quote')}</span>
                    <span className="font-semibold text-slate-900 dark:text-zinc-200">₹{quoteAmount.toFixed(2)}</span>
                  </div>
                  {additionalAmount > 0 && (
                    <div className="flex items-center justify-between text-slate-600 dark:text-zinc-400">
                      <span>{t('bookings.approvedAdditionalCharges', 'Approved Additional Charges')}</span>
                      <span className="font-semibold text-slate-900 dark:text-zinc-200">+₹{additionalAmount.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex items-center justify-between border-t border-slate-100 dark:border-zinc-800 pt-2.5 text-sm font-bold text-slate-900 dark:text-white">
                    <span>{t('bookings.finalPayableAmount', 'Total Amount')}</span>
                    <span className="text-base text-amber-600 dark:text-amber-400">₹{finalAmount.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {/* Payment Method Selection - Preselected Cash */}
              <div className="rounded-2xl border border-amber-500/30 bg-amber-500/5 p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 rounded-full bg-amber-500 flex items-center justify-center text-slate-950 text-xs font-black">
                      ✓
                    </div>
                    <span className="font-bold text-sm text-slate-900 dark:text-white">
                      {t('bookings.paymentMethodCash', 'Cash')}
                    </span>
                  </div>
                  <Badge variant="primary" size="sm">
                    {t('common.required', 'Default')}
                  </Badge>
                </div>
                <p className="mt-2 text-xs text-slate-600 dark:text-zinc-400">
                  {t('bookings.payWorkerInCash', 'Pay the worker the amount shown above in cash.')}
                </p>
                <p className="mt-1 text-[11px] text-slate-400 dark:text-zinc-500 italic">
                  {t('bookings.onlinePaymentComingSoon', 'Online payment (UPI / Cards) coming soon')}
                </p>
              </div>

              {/* Footer Actions */}
              <div className="flex gap-2.5 pt-2">
                <Button
                  variant="secondary"
                  size="sm"
                  disabled={isSubmittingPayment}
                  onClick={() => {
                    setPaymentModalBooking(null)
                    setPaymentModalError('')
                  }}
                  className="flex-1 text-xs"
                >
                  {t('common.close', 'Close')}
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  disabled={isSubmittingPayment}
                  loading={isSubmittingPayment}
                  onClick={() => void handleConfirmCustomerCashPayment(paymentModalBooking)}
                  className="flex-1 text-xs font-bold bg-amber-500 hover:bg-amber-400 text-slate-950"
                >
                  <Banknote className="w-3.5 h-3.5 mr-1" />
                  {t('bookings.ivePaidCash', "I've Paid Cash")}
                </Button>
              </div>
            </div>
          )
        })()}
      </Modal>

      {/* Official Receipt Modal */}
      <Modal
        isOpen={Boolean(receiptModalBooking)}
        onClose={() => setReceiptModalBooking(null)}
        title={t('bookings.paymentReceipt', 'Payment Receipt')}
        size="md"
      >
        {receiptModalBooking && (() => {
          const { serviceName } = resolveServiceAndCategory(receiptModalBooking.category_id)
          const summary = receiptModalBooking.paymentSummary
          const jobReference = formatJobReference(receiptModalBooking.id)
          const receiptNumber = summary?.receipt_number || '—'
          const paidDate = summary?.receipt_paid_at || summary?.paid_at
            ? new Date(summary.receipt_paid_at || summary.paid_at || '').toLocaleString(i18n.language === 'hi' ? 'hi-IN' : 'en-IN', {
                dateStyle: 'medium',
                timeStyle: 'short',
              })
            : formatDate(receiptModalBooking.scheduled_at)
          const quoteAmount = summary?.initial_quote_amount ?? 0
          const additionalAmount = summary?.approved_additional_amount ?? 0
          const finalAmount = summary?.final_payable_amount ?? (quoteAmount + additionalAmount)

          return (
            <div className="space-y-4">
              <style>{`
                @media print {
                  body * {
                    visibility: hidden !important;
                  }
                  #printable-receipt, #printable-receipt * {
                    visibility: visible !important;
                  }
                  #printable-receipt {
                    position: fixed !important;
                    left: 0 !important;
                    top: 0 !important;
                    width: 100% !important;
                    margin: 0 !important;
                    padding: 24px !important;
                    background: white !important;
                    color: black !important;
                    border: 1px solid #e2e8f0 !important;
                    box-shadow: none !important;
                    z-index: 99999 !important;
                  }
                  .no-print {
                    display: none !important;
                  }
                }
              `}</style>

              {/* Printable Receipt Paper Container */}
              <div
                id="printable-receipt"
                className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-5 shadow-sm space-y-4 text-slate-900 dark:text-white"
              >
                {/* Header Branding */}
                <div className="text-center pb-4 border-b border-slate-200 dark:border-zinc-800">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-600 dark:text-amber-400 text-xs font-bold mb-2">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>JUGNU</span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-zinc-400 font-medium">
                    Ghar Ke Har Kaam Ka Jugnu
                  </p>
                  <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-white mt-1">
                    {t('bookings.officialReceipt', 'Official Cash Payment Receipt')}
                  </h3>
                </div>

                {/* Receipt Metadata Grid */}
                <div className="grid grid-cols-2 gap-2 text-xs py-2 border-b border-slate-100 dark:border-zinc-800">
                  <div>
                    <span className="text-slate-400 dark:text-zinc-500 block">{t('bookings.receiptNumber', 'Receipt')}</span>
                    <span className="font-mono font-bold text-slate-900 dark:text-white">{receiptNumber}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-slate-400 dark:text-zinc-500 block">{t('bookings.jobId', 'Job')}</span>
                    <span className="font-mono font-bold text-slate-900 dark:text-white">{jobReference}</span>
                  </div>
                  <div className="mt-1">
                    <span className="text-slate-400 dark:text-zinc-500 block">{t('bookings.paidAt', 'Paid at')}</span>
                    <span className="font-semibold text-slate-700 dark:text-zinc-300">{paidDate}</span>
                  </div>
                  <div className="text-right mt-1">
                    <span className="text-slate-400 dark:text-zinc-500 block">{t('bookings.paymentMethod', 'Payment Method')}</span>
                    <span className="inline-flex items-center gap-1 font-semibold text-emerald-600 dark:text-emerald-400">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      {t('bookings.paymentMethodCash', 'Cash')}
                    </span>
                  </div>
                </div>

                {/* Service & Worker Details */}
                <div className="space-y-1.5 text-xs py-2 border-b border-slate-100 dark:border-zinc-800">
                  <div className="flex justify-between">
                    <span className="text-slate-500 dark:text-zinc-400">{t('bookings.serviceCategory', 'Service')}:</span>
                    <span className="font-semibold text-slate-900 dark:text-white">{serviceName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 dark:text-zinc-400">{t('bookings.worker', 'Worker')}:</span>
                    <span className="font-semibold text-slate-900 dark:text-white">{receiptModalBooking.worker?.name || 'Verified Artisan'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 dark:text-zinc-400">{t('common.address', 'Address')}:</span>
                    <span className="font-medium text-slate-700 dark:text-zinc-300 text-right max-w-[200px] truncate">{receiptModalBooking.address}</span>
                  </div>
                </div>

                {/* Amount Breakdown */}
                <div className="space-y-1.5 text-xs py-2">
                  <div className="flex justify-between text-slate-600 dark:text-zinc-400">
                    <span>{t('bookings.workerQuote', 'Worker Quote')}</span>
                    <span>₹{quoteAmount.toFixed(2)}</span>
                  </div>
                  {additionalAmount > 0 && (
                    <div className="flex justify-between text-slate-600 dark:text-zinc-400">
                      <span>{t('bookings.approvedAdditionalCharges', 'Approved Additional Charges')}</span>
                      <span>+₹{additionalAmount.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between items-center pt-2 border-t border-slate-200 dark:border-zinc-800 font-bold">
                    <span className="text-slate-900 dark:text-white text-sm">{t('bookings.totalPaid', 'Total Paid')}</span>
                    <span className="text-emerald-600 dark:text-emerald-400 text-base">₹{finalAmount.toFixed(2)}</span>
                  </div>
                </div>

                {/* Verified Footer Notice */}
                <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-[11px] text-emerald-800 dark:text-emerald-300 flex items-center gap-2">
                  <Shield className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <span>{t('bookings.receiptFooterNote', 'This receipt confirms direct cash payment received by the artisan for service in Muzaffarnagar. Verified by Jugnu.')}</span>
                </div>
              </div>

              {/* Action Buttons (Excluded from Print) */}
              <div className="flex gap-2.5 pt-2 no-print">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.print()}
                  className="flex-1 text-xs font-semibold flex items-center justify-center gap-1.5"
                >
                  <Printer className="w-3.5 h-3.5" />
                  {t('bookings.printReceipt', 'Print / Save Receipt')}
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => setReceiptModalBooking(null)}
                  className="flex-1 text-xs font-bold bg-amber-500 hover:bg-amber-400 text-slate-950"
                >
                  {t('common.close', 'Close')}
                </Button>
              </div>
            </div>
          )
        })()}
      </Modal>

      {/* Completed Job Details Modal */}
      <Modal
        isOpen={Boolean(detailsModalBooking)}
        onClose={() => setDetailsModalBooking(null)}
        title={t('bookings.completedJobDetails', 'Completed Service Details')}
        size="md"
      >
        {detailsModalBooking && (() => {
          const { serviceName, categoryName } = resolveServiceAndCategory(detailsModalBooking.category_id)
          const summary = detailsModalBooking.paymentSummary
          const jobReference = formatJobReference(detailsModalBooking.id)
          const quoteAmount = summary?.initial_quote_amount ?? 0
          const additionalAmount = summary?.approved_additional_amount ?? 0
          const finalAmount = summary?.final_payable_amount ?? (quoteAmount + additionalAmount)
          const paidDate = summary?.receipt_paid_at || summary?.paid_at
            ? new Date(summary.receipt_paid_at || summary.paid_at || '').toLocaleString(i18n.language === 'hi' ? 'hi-IN' : 'en-IN', {
                dateStyle: 'medium',
                timeStyle: 'short',
              })
            : formatDate(detailsModalBooking.scheduled_at)
          const review = detailsModalBooking.review

          return (
            <div className="space-y-4 text-xs">
              {/* Job Identity & Status */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-zinc-800/60 border border-slate-200 dark:border-zinc-700/60">
                <div>
                  <span className="text-[11px] text-slate-500 dark:text-zinc-400 block">{t('bookings.jobId', 'Job ID')}</span>
                  <span className="font-mono font-bold text-sm text-slate-900 dark:text-white">{jobReference}</span>
                  <p className="text-[11px] text-slate-600 dark:text-zinc-400 mt-0.5">{serviceName} {categoryName && `• ${categoryName}`}</p>
                </div>
                <div className="text-right">
                  <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    {t('booking.status.completed', 'Completed')}
                  </span>
                </div>
              </div>

              {/* Worker Information & Recognition Badge */}
              <div className="p-3.5 rounded-xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800">
                <span className="text-[11px] font-semibold text-slate-500 dark:text-zinc-400 block mb-2">{t('bookings.worker', 'Artisan')}</span>
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <Avatar
                      name={detailsModalBooking.worker?.name || t('bookings.artisan', 'Artisan')}
                      size="md"
                      src={detailsModalBooking.worker?.avatar || undefined}
                    />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-slate-900 dark:text-white">
                          {detailsModalBooking.worker?.name || t('bookings.artisan', 'Artisan')}
                        </span>
                        <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/25">
                          <UserCheck className="w-3 h-3 text-amber-600 dark:text-amber-400" />
                          {t('bookings.previouslyHired', 'Previously Hired')}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-zinc-400 mt-0.5">
                        {t('bookings.verifiedArtisan', 'Verified Jugnu Artisan')}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleOpenContactModal(detailsModalBooking)}
                      className="text-xs p-1.5 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/10"
                      title={t('bookings.callWorker', 'Call')}
                    >
                      <Phone className="w-3.5 h-3.5" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleOpenContactModal(detailsModalBooking)}
                      className="text-xs p-1.5 text-amber-600 dark:text-amber-400 border-amber-500/30 hover:bg-amber-500/10"
                      title={t('bookings.chatWorker', 'WhatsApp')}
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              </div>

              {/* Service Schedule & Location */}
              <div className="p-3.5 rounded-xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 space-y-2">
                <span className="text-[11px] font-semibold text-slate-500 dark:text-zinc-400 block">{t('bookings.serviceLocation', 'Schedule & Location')}</span>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                    <span>{formatDate(detailsModalBooking.scheduled_at)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                    <span>{formatTime(detailsModalBooking.scheduled_at)}</span>
                  </div>
                </div>
                <div className="flex items-start gap-2 pt-1">
                  <MapPin className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                  <span className="text-slate-700 dark:text-zinc-300 font-medium">{detailsModalBooking.address}</span>
                </div>
                {detailsModalBooking.notes && (
                  <div className="flex items-start gap-2 pt-1 border-t border-slate-100 dark:border-zinc-800 text-[11px] text-slate-600 dark:text-zinc-400">
                    <FileText className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-semibold text-slate-700 dark:text-zinc-300">{t('bookings.serviceNotes', 'Customer Request Notes')}: </span>
                      {detailsModalBooking.notes}
                    </div>
                  </div>
                )}
              </div>

              {/* Authoritative Financial Breakdown */}
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-zinc-800/50 border border-slate-200 dark:border-zinc-700/60 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-semibold text-slate-700 dark:text-zinc-300 flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                    {t('bookings.paymentSummary', 'Payment Summary')}
                  </span>
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-500/10 px-2 py-0.5 rounded-md">
                    {t('bookings.paymentMethodCash', 'Cash')}
                  </span>
                </div>

                <div className="space-y-1.5 pt-1 text-slate-600 dark:text-zinc-400">
                  <div className="flex justify-between">
                    <span>{t('bookings.initialQuote', 'Initial Worker Quote')}</span>
                    <span>₹{quoteAmount.toFixed(2)}</span>
                  </div>
                  {additionalAmount > 0 && (
                    <div className="flex justify-between">
                      <span>{t('bookings.approvedAdditionalCharges', 'Approved Additional Charges')}</span>
                      <span>+₹{additionalAmount.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between items-center pt-1.5 border-t border-slate-200 dark:border-zinc-700 font-bold">
                    <span className="text-slate-900 dark:text-white text-xs">{t('bookings.totalPaid', 'Final Total Paid')}</span>
                    <span className="text-emerald-600 dark:text-emerald-400 text-sm">₹{finalAmount.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-[11px] text-slate-500 dark:text-zinc-400 pt-0.5">
                    <span>{t('bookings.paidAt', 'Paid at')}</span>
                    <span>{paidDate}</span>
                  </div>
                </div>

                {summary?.receipt_number && (
                  <div className="pt-2 border-t border-slate-200 dark:border-zinc-700 flex justify-end">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const target = detailsModalBooking
                        setDetailsModalBooking(null)
                        handleOpenReceiptModal(target)
                      }}
                      className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/10 flex items-center gap-1.5"
                    >
                      <FileText className="w-3.5 h-3.5" />
                      {t('bookings.viewReceipt', 'View Receipt')} ({summary.receipt_number})
                    </Button>
                  </div>
                )}
              </div>

              {/* Review History / Rating */}
              <div className="p-3.5 rounded-xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800">
                <span className="text-[11px] font-semibold text-slate-500 dark:text-zinc-400 block mb-1.5">
                  {t('bookings.yourReview', 'Your Rating & Feedback')}
                </span>
                {detailsModalBooking.hasReview && review ? (
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <div className="flex items-center text-amber-500">
                        {Array.from({ length: 5 }).map((_, idx) => (
                          <Star
                            key={idx}
                            className={`w-3.5 h-3.5 ${idx < review.rating ? 'fill-amber-400 text-amber-400' : 'text-slate-300 dark:text-zinc-700'}`}
                          />
                        ))}
                      </div>
                      <span className="font-bold text-xs text-slate-900 dark:text-white">{review.rating} / 5</span>
                      {review.created_at && (
                        <span className="text-[11px] text-slate-400 dark:text-zinc-500">
                          • {new Date(review.created_at).toLocaleDateString(i18n.language === 'hi' ? 'hi-IN' : 'en-IN')}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-700 dark:text-zinc-300 mt-1 italic">
                      "{review.comment || t('bookings.noComment', 'Rated without comment')}"
                    </p>
                  </div>
                ) : (
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-[11px] text-slate-500 dark:text-zinc-400">
                      {t('bookings.notReviewedYet', 'Not reviewed yet')}
                    </p>
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => {
                        const target = detailsModalBooking
                        setDetailsModalBooking(null)
                        setSelectedBooking(target)
                        setShowReviewModal(true)
                      }}
                      className="text-xs font-bold flex items-center gap-1 bg-amber-500 hover:bg-amber-400 text-slate-950"
                    >
                      <Star className="w-3.5 h-3.5" />
                      {t('bookings.rateWorker', 'Rate Artisan')}
                    </Button>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2.5 pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setDetailsModalBooking(null)}
                  className="flex-1 text-xs"
                >
                  {t('common.close', 'Close')}
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => {
                    const target = detailsModalBooking
                    setDetailsModalBooking(null)
                    handleOpenBookAgainModal(target)
                  }}
                  className="flex-1 text-xs font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 flex items-center justify-center gap-1.5"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  {t('bookings.bookAgain', 'Book Again')}
                </Button>
              </div>
            </div>
          )
        })()}
      </Modal>

      {/* Book Again Selection Modal */}
      <Modal
        isOpen={Boolean(bookAgainModalBooking)}
        onClose={() => setBookAgainModalBooking(null)}
        title={t('bookings.bookAgainTitle', 'Book This Service Again')}
        size="md"
      >
        {bookAgainModalBooking && (() => {
          const { serviceName, categoryName } = resolveServiceAndCategory(bookAgainModalBooking.category_id)
          const jobReference = formatJobReference(bookAgainModalBooking.id)
          const workerName = bookAgainModalBooking.worker?.name || t('bookings.artisan', 'Artisan')

          return (
            <div className="space-y-4 text-xs">
              {/* Previous Service Context Card */}
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-zinc-800/60 border border-slate-200 dark:border-zinc-700/60 space-y-1.5">
                <div className="flex justify-between items-center">
                  <span className="text-[11px] text-slate-500 dark:text-zinc-400">{t('bookings.serviceCategory', 'Service')}</span>
                  <span className="font-bold text-slate-900 dark:text-white">{serviceName} {categoryName && `(${categoryName})`}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[11px] text-slate-500 dark:text-zinc-400">{t('bookings.previousArtisan', 'Previous Artisan')}</span>
                  <span className="font-semibold text-slate-800 dark:text-zinc-200">{workerName}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[11px] text-slate-500 dark:text-zinc-400">{t('bookings.jobId', 'Previous Job ID')}</span>
                  <span className="font-mono text-slate-600 dark:text-zinc-400">{jobReference}</span>
                </div>
              </div>

              <p className="text-slate-600 dark:text-zinc-400 leading-relaxed">
                {t(
                  'bookings.bookAgainPrompt',
                  'How would you like to book this service? You can request a quote from the same artisan or browse other verified artisans in Muzaffarnagar.'
                )}
              </p>

              {/* Selection Options */}
              <div className="space-y-3 pt-1">
                {/* Option A: Re-hire Previous Artisan */}
                <button
                  type="button"
                  onClick={() => handleRehireWorker(bookAgainModalBooking)}
                  className="w-full text-left p-3.5 rounded-xl border border-amber-500/40 bg-amber-500/10 hover:bg-amber-500/15 dark:bg-amber-500/5 dark:hover:bg-amber-500/10 transition-colors flex items-start gap-3 group cursor-pointer"
                >
                  <div className="w-8 h-8 rounded-lg bg-amber-500 text-slate-950 flex items-center justify-center shrink-0 mt-0.5">
                    <UserCheck className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-sm text-slate-900 dark:text-white group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
                        {t('bookings.rehireWorker', 'Re-hire {{name}}', { name: workerName })}
                      </span>
                      <ArrowRight className="w-4 h-4 text-amber-500 group-hover:translate-x-0.5 transition-transform" />
                    </div>
                    <p className="text-[11px] text-slate-600 dark:text-zinc-400 mt-1">
                      {t('bookings.rehireWorkerDesc', 'Book directly with your previous artisan. Address and service are prefilled.')}
                    </p>
                  </div>
                </button>

                {/* Option B: Browse All Artisans */}
                <button
                  type="button"
                  onClick={() => handleBrowseAllWorkers(bookAgainModalBooking)}
                  className="w-full text-left p-3.5 rounded-xl border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 hover:bg-slate-50 dark:hover:bg-zinc-800 transition-colors flex items-start gap-3 group cursor-pointer"
                >
                  <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 flex items-center justify-center shrink-0 mt-0.5">
                    <Search className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-sm text-slate-900 dark:text-white group-hover:text-slate-700 dark:group-hover:text-zinc-200 transition-colors">
                        {t('bookings.browseAllArtisans', 'Browse All Artisans')}
                      </span>
                      <ArrowRight className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
                    </div>
                    <p className="text-[11px] text-slate-600 dark:text-zinc-400 mt-1">
                      {t('bookings.browseAllArtisansDesc', 'Explore and compare all available verified artisans for this service category.')}
                    </p>
                  </div>
                </button>
              </div>

              {/* Close Button */}
              <div className="pt-2 flex justify-end">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setBookAgainModalBooking(null)}
                  className="text-xs"
                >
                  {t('common.cancel', 'Cancel')}
                </Button>
              </div>
            </div>
          )
        })()}
      </Modal>

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

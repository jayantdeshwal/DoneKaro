import { useCallback, useEffect, useState, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useSearchParams } from 'react-router-dom'
import type { JobId } from '@kaamgar/shared'
import { useAuth } from '@/context/AuthContext'
import { getSupabaseClient } from '@/lib/supabase'
import {
  BookingChangeRequest,
  BookingPaymentSummary,
  fetchBookingChangeRequests,
  fetchBookingPaymentSummaries,
} from '@/services/changeRequests'
import {
  BookingQuoteRequest,
  fetchWorkerQuoteData,
  ServiceRequest,
} from '@/services/quotes'
import { fetchWorkerReviews, ReviewItem } from '@/services/reviews'
import type { TabFilter, WorkerBookingRow, WorkerProfileRow } from '../types'

export function useWorkerDashboardData() {
  const { t } = useTranslation()
  const { user } = useAuth()
  const [searchParams] = useSearchParams()

  const [profile, setProfile] = useState<WorkerProfileRow | null>(null)
  const [categoriesList, setCategoriesList] = useState<string[]>([])
  const [bookings, setBookings] = useState<WorkerBookingRow[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [updatingBookingId, setUpdatingBookingId] = useState('')

  const [quoteRequests, setQuoteRequests] = useState<BookingQuoteRequest[]>([])
  const [quoteServices, setQuoteServices] = useState<Map<string, ServiceRequest>>(new Map())

  // Tab filter logic
  const tabParam = searchParams.get('tab')
  const [activeTab, setActiveTab] = useState<TabFilter>(
    tabParam === 'leads' || tabParam === 'pending'
      ? 'pending'
      : tabParam === 'active'
      ? 'active'
      : tabParam === 'completed'
      ? 'completed'
      : 'all'
  )

  useEffect(() => {
    const tab = searchParams.get('tab')
    if (tab === 'leads' || tab === 'pending') {
      setActiveTab('pending')
    } else if (tab === 'active') {
      setActiveTab('active')
    } else if (tab === 'completed') {
      setActiveTab('completed')
    } else if (tab === 'all') {
      setActiveTab('all')
    }
  }, [searchParams])

  const loadDashboardData = useCallback(async () => {
    setIsLoading(true)
    setError('')
    try {
      const supabase = getSupabaseClient()
      let workerId = user?.id
      if (!workerId) {
        const { data: authData } = await supabase.auth.getUser()
        workerId = authData?.user?.id
      }
      if (!workerId) {
        throw new Error(t('workerDashboard.signInRequired', 'Please sign in to access your worker workspace'))
      }

      // Fetch worker profile, categories, bookings, and directory service areas
      const [wpRes, wcRes, bookingsRes, areasRes] = await Promise.all([
        (supabase.from('worker_profiles') as any)
          .select('bio, experience_years, approval_status, is_available, rejection_reason, rating, review_count')
          .eq('id', workerId)
          .maybeSingle(),
        (supabase.from('worker_categories') as any)
          .select('category_id')
          .eq('worker_id', workerId),
        (supabase.from('bookings') as any)
          .select('id, category_id, status, scheduled_at, address, notes, created_at, customer_id')
          .eq('worker_id', workerId)
          .order('created_at', { ascending: false }),
        (supabase.from('approved_worker_directory') as any)
          .select('areas')
          .eq('id', workerId)
          .maybeSingle(),
      ])

      if (wpRes.error) throw wpRes.error
      setProfile(
        wpRes.data
          ? ({
              ...wpRes.data,
              service_areas: (areasRes.data?.areas ?? []).filter(Boolean),
            } as WorkerProfileRow)
          : null
      )

      const userCats = (wcRes.data ?? []).map((c: any) => c.category_id).filter(Boolean)
      setCategoriesList(userCats)

      if (bookingsRes.error) throw bookingsRes.error
      const rawBookings = (bookingsRes.data ?? []) as any[]
      const changeRequests = await fetchBookingChangeRequests(rawBookings.map(b => b.id as JobId))

      let paymentSummaries: BookingPaymentSummary[] = []
      try {
        paymentSummaries = await fetchBookingPaymentSummaries(rawBookings.map(b => b.id as JobId))
      } catch (summaryError) {
        console.warn('Booking payment summary unavailable:', summaryError)
      }

      const summaryByBooking = new Map(paymentSummaries.map(s => [s.booking_id, s]))
      const requestsByBooking = new Map<string, BookingChangeRequest[]>()
      changeRequests.forEach(request => {
        const existing = requestsByBooking.get(request.booking_id) ?? []
        existing.push(request)
        requestsByBooking.set(request.booking_id, existing)
      })

      // Fetch customer details
      const customerIds = [...new Set(rawBookings.map(b => b.customer_id))].filter(Boolean)
      let customerById = new Map<string, { name: string; phone?: string | null; avatar?: string | null }>()

      if (customerIds.length > 0) {
        const { data: profiles, error: profError } = await (supabase.from('profiles') as any)
          .select('id, full_name, phone, avatar_url')
          .in('id', customerIds)

        if (!profError && profiles) {
          customerById = new Map(
            (profiles as any[]).map(p => [
              p.id,
              {
                name: p.full_name || t('bookings.customer', 'Customer'),
                phone: p.phone,
                avatar: p.avatar_url,
              },
            ])
          )
        }
      }

      const [quoteData, workerReviews] = await Promise.all([
        fetchWorkerQuoteData(workerId),
        fetchWorkerReviews(workerId).catch(err => {
          console.warn('Worker reviews load warning:', err)
          return [] as ReviewItem[]
        }),
      ])

      const reviewsByBooking = new Map<string, ReviewItem>(
        workerReviews.map(r => [r.booking_id, r])
      )

      const completeBookings: WorkerBookingRow[] = rawBookings.map(b => ({
        ...b,
        customer: customerById.get(b.customer_id) || { name: t('bookings.customer', 'Customer') },
        changeRequests: requestsByBooking.get(b.id) ?? [],
        paymentSummary: summaryByBooking.get(b.id),
        review: reviewsByBooking.get(b.id),
      }))

      setBookings(completeBookings)
      setQuoteRequests(quoteData.requests)
      setQuoteServices(new Map(quoteData.services.map(service => [service.id, service])))
    } catch (err) {
      console.warn('Dashboard load error:', err)
      const message =
        err && typeof err === 'object' && 'message' in err
          ? String((err as { message?: unknown }).message)
          : ''
      setError(message || t('workerDashboard.loadError', 'Unable to load your worker workspace'))
    } finally {
      setIsLoading(false)
    }
  }, [t, user?.id])

  useEffect(() => {
    void loadDashboardData()
  }, [loadDashboardData])

  const handleUpdateStatus = async (bookingId: string, status: WorkerBookingRow['status']) => {
    setUpdatingBookingId(bookingId)
    setError('')
    try {
      const supabase = getSupabaseClient()
      const { error: rpcError } = await (supabase as any).rpc('update_booking_status', {
        target_booking_id: bookingId,
        target_status: status,
      })

      if (rpcError) throw new Error(rpcError.message)

      setBookings(current =>
        current.map(booking => (booking.id === bookingId ? { ...booking, status } : booking))
      )
    } catch (updateError) {
      setError(
        updateError instanceof Error
          ? updateError.message
          : t('workerDashboard.updateBookingError', 'Unable to update booking')
      )
    } finally {
      setUpdatingBookingId('')
    }
  }

  // Counts and business metrics
  const pendingCount = useMemo(() => {
    const pendingBookings = bookings.filter(b => b.status === 'pending').length
    const pendingQuotes = quoteRequests.filter(q => q.status === 'pending').length
    return pendingBookings + pendingQuotes
  }, [bookings, quoteRequests])
  const activeCount = useMemo(
    () =>
      bookings.filter(
        b => b.status === 'accepted' || b.status === 'in_progress' || b.status === 'payment_pending'
      ).length,
    [bookings]
  )
  const completedBookings = useMemo(() => bookings.filter(b => b.status === 'completed'), [bookings])
  const completedCount = completedBookings.length

  const completedPaidBookings = useMemo(
    () => completedBookings.filter(b => b.paymentSummary?.payment_status === 'paid'),
    [completedBookings]
  )
  const completedJobsCount = completedBookings.length
  const totalPaymentsReceived = useMemo(
    () =>
      completedPaidBookings.reduce((sum, b) => sum + (b.paymentSummary?.final_payable_amount ?? 0), 0),
    [completedPaidBookings]
  )

  const thisMonthPayments = useMemo(() => {
    const now = new Date()
    const currentYear = now.getFullYear()
    const currentMonth = now.getMonth()
    return completedPaidBookings.reduce((sum, b) => {
      const paidDateStr = b.paymentSummary?.receipt_paid_at || b.paymentSummary?.paid_at
      if (!paidDateStr) return sum
      const paidDate = new Date(paidDateStr)
      if (paidDate.getFullYear() === currentYear && paidDate.getMonth() === currentMonth) {
        return sum + (b.paymentSummary?.final_payable_amount ?? 0)
      }
      return sum
    }, 0)
  }, [completedPaidBookings])

  const averageJobPayment = useMemo(() => {
    return completedPaidBookings.length > 0 ? totalPaymentsReceived / completedPaidBookings.length : 0
  }, [completedPaidBookings, totalPaymentsReceived])

  const completedCountsByCustomer = useMemo(() => {
    const counts = new Map<string, number>()
    completedBookings.forEach(b => {
      if (!b.customer_id) return
      counts.set(b.customer_id, (counts.get(b.customer_id) ?? 0) + 1)
    })
    return counts
  }, [completedBookings])

  const filteredBookings = useMemo(() => {
    return bookings.filter(b => {
      if (activeTab === 'pending') return b.status === 'pending'
      if (activeTab === 'active') {
        return (
          b.status === 'accepted' || b.status === 'in_progress' || b.status === 'payment_pending'
        )
      }
      if (activeTab === 'completed') return b.status === 'completed'
      return true
    })
  }, [bookings, activeTab])

  return {
    profile,
    setProfile,
    categoriesList,
    bookings,
    setBookings,
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
  }
}

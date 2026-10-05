import { useCallback, useEffect, useState } from 'react'
import { getSupabaseClient } from '@/lib/supabase'
import { fetchCustomerReviewedBookingIds } from '@/services/reviews'
import {
  type BookingChangeRequest,
  type BookingPaymentSummary,
  fetchBookingChangeRequests,
  fetchBookingPaymentSummaries,
} from '@/services/changeRequests'
import {
  type BookingQuote,
  type BookingQuoteRequest,
  fetchCustomerQuoteData,
} from '@/services/quotes'
import { sanitizeErrorMessage } from '@/utils/errors'
import type { BookingRow, BookingTab, CustomerBookingReview, WorkerDirectoryRow } from '../types'

interface UseCustomerBookingsProps {
  userId?: string | null
}

export function useCustomerBookings({ userId }: UseCustomerBookingsProps) {
  const [allBookings, setAllBookings] = useState<BookingRow[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [activeTab, setActiveTab] = useState<BookingTab>('all')

  const [quoteRequests, setQuoteRequests] = useState<BookingQuoteRequest[]>([])
  const [quotes, setQuotes] = useState<BookingQuote[]>([])
  const [quoteWorkers, setQuoteWorkers] = useState<
    Map<string, { name: string; avatar: string | null; rating: number; reviews: number; experience: number }>
  >(new Map())

  const loadBookings = useCallback(async () => {
    setIsLoading(true)
    setLoadError('')
    try {
      const supabase = getSupabaseClient()
      let customerId = userId
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

      const bookingIds = bookings.map(b => b.id)
      const [reviewedIds, changeRequests, paymentSummaries, customerReviews] = await Promise.all([
        fetchCustomerReviewedBookingIds(customerId),
        fetchBookingChangeRequests(bookingIds),
        fetchBookingPaymentSummaries(bookingIds),
        bookingIds.length > 0
          ? supabase
              .from('reviews')
              .select('id, booking_id, rating, comment, created_at')
              .in('booking_id', bookingIds)
              .then((res: any) => (res.data ?? []) as any[])
          : Promise.resolve([]),
      ])

      const requestsByBooking = new Map<string, BookingChangeRequest[]>()
      changeRequests.forEach(request => {
        const current = requestsByBooking.get(request.booking_id) ?? []
        current.push(request)
        requestsByBooking.set(request.booking_id, current)
      })

      const summaryByBooking = new Map<string, BookingPaymentSummary>()
      paymentSummaries.forEach(summary => {
        summaryByBooking.set(summary.booking_id, summary)
      })

      const reviewsByBooking = new Map<string, CustomerBookingReview>()
      customerReviews.forEach((review: any) => {
        if (review.booking_id) {
          reviewsByBooking.set(review.booking_id, {
            id: review.id,
            rating: review.rating,
            comment: review.comment,
            created_at: review.created_at,
          })
        }
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
        setQuoteWorkers(
          new Map(
            (quoteWorkerRows ?? []).map((worker: any) => [
              worker.id,
              {
                name: worker.name || 'Provider',
                avatar: worker.avatar || null,
                rating: Number(worker.rating ?? 0),
                reviews: Number(worker.reviews ?? 0),
                experience: Number(worker.experience ?? 0),
              },
            ])
          )
        )
      } else {
        setQuoteWorkers(new Map())
      }
    } catch (error) {
      setLoadError(sanitizeErrorMessage(error, 'Unable to load bookings'))
    } finally {
      setIsLoading(false)
    }
  }, [userId])

  useEffect(() => {
    void loadBookings()
  }, [loadBookings])

  const upcomingBookings = allBookings.filter(b =>
    ['pending', 'accepted', 'in_progress', 'payment_pending'].includes(b.status)
  )
  const pastBookings = allBookings.filter(b =>
    ['completed', 'rejected', 'cancelled', 'disputed'].includes(b.status)
  )

  return {
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
  }
}

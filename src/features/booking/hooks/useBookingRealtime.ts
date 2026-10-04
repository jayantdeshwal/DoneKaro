import { useEffect } from 'react'
import { getSupabaseClient } from '@/lib/supabase'

interface UseBookingRealtimeProps {
  customerId?: string | null
  onUpdate: () => void | Promise<void>
}

export function useBookingRealtime({ customerId, onUpdate }: UseBookingRealtimeProps) {
  useEffect(() => {
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
          void onUpdate()
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
          void onUpdate()
        }
      )
      .subscribe()

    return () => {
      void supabase.removeChannel(channel)
    }
  }, [customerId, onUpdate])
}

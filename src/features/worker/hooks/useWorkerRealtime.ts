import { useEffect } from 'react'
import { useAuth } from '@/context/AuthContext'
import { getSupabaseClient } from '@/lib/supabase'

interface UseWorkerRealtimeProps {
  onDataChange: () => void | Promise<void>
}

export function useWorkerRealtime({ onDataChange }: UseWorkerRealtimeProps) {
  const { user } = useAuth()

  useEffect(() => {
    const workerId = user?.id
    if (!workerId) return

    const supabase = getSupabaseClient()
    const channel = supabase
      .channel(`worker-dashboard-realtime-${workerId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'bookings',
          filter: `worker_id=eq.${workerId}`,
        },
        () => {
          void onDataChange()
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'worker_profiles',
          filter: `id=eq.${workerId}`,
        },
        () => {
          void onDataChange()
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'booking_payments',
          filter: `worker_id=eq.${workerId}`,
        },
        () => {
          void onDataChange()
        }
      )
      .subscribe()

    return () => {
      void supabase.removeChannel(channel)
    }
  }, [user?.id, onDataChange])
}

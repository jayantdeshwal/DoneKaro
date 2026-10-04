import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useAuth } from '@/context/AuthContext'
import { getSupabaseClient } from '@/lib/supabase'
import type { WorkerProfileRow } from '../types'

interface UseWorkerAvailabilityProps {
  profile: WorkerProfileRow | null
  setProfile: React.Dispatch<React.SetStateAction<WorkerProfileRow | null>>
  onError: (err: string) => void
}

export function useWorkerAvailability({
  profile,
  setProfile,
  onError,
}: UseWorkerAvailabilityProps) {
  const { t } = useTranslation()
  const { user } = useAuth()
  const [isUpdatingAvailability, setIsUpdatingAvailability] = useState(false)
  const [availabilitySuccessMsg, setAvailabilitySuccessMsg] = useState('')

  const handleToggleAvailability = async () => {
    if (!profile) return
    const newStatus = !profile.is_available
    setIsUpdatingAvailability(true)
    setAvailabilitySuccessMsg('')

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

      const { error: rpcError } = await (supabase as any).rpc('update_worker_availability', {
        target_available: newStatus,
      })

      if (rpcError) {
        // Critical audit-verified fallback: direct table update if RPC unavailable
        const { error: directError } = await (supabase.from('worker_profiles') as any)
          .update({ is_available: newStatus, updated_at: new Date().toISOString() })
          .eq('id', workerId)

        if (directError) throw directError
      }

      setProfile(prev => (prev ? { ...prev, is_available: newStatus } : null))
      setAvailabilitySuccessMsg(
        newStatus
          ? t('workerDashboard.onlineSuccess', 'You are now Online and ready to accept bookings!')
          : t('workerDashboard.offlineSuccess', 'You are now Off-Duty.')
      )
      setTimeout(() => setAvailabilitySuccessMsg(''), 4000)
    } catch (toggleError) {
      onError(
        toggleError instanceof Error
          ? toggleError.message
          : t('workerDashboard.availabilityError', 'Unable to update availability status')
      )
    } finally {
      setIsUpdatingAvailability(false)
    }
  }

  return {
    isUpdatingAvailability,
    availabilitySuccessMsg,
    setAvailabilitySuccessMsg,
    handleToggleAvailability,
  }
}

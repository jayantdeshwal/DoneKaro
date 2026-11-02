import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getSupabaseClient } from '@/lib/supabase'
import { sanitizeErrorMessage } from '@/utils/errors'
import { AdminReverifyModal } from './modals/AdminReverifyModal'

interface AdminSessionStatus {
  active: boolean
  expires_at: string | null
  hard_expires_at: string | null
}

interface AdminSessionGuardProps {
  phone: string
}

export function AdminSessionGuard({ phone }: AdminSessionGuardProps) {
  const navigate = useNavigate()
  const [isCheckingSession, setIsCheckingSession] = useState(true)
  const [requiresReverification, setRequiresReverification] = useState(false)
  const [sessionError, setSessionError] = useState('')
  const checkingRef = useRef(false)
  const rerunCheckRef = useRef(false)
  const signingOutRef = useRef(false)
  const hardTimeoutRef = useRef<number | null>(null)

  const checkSession = useCallback(async () => {
    if (signingOutRef.current) return
    if (checkingRef.current) {
      rerunCheckRef.current = true
      return
    }
    checkingRef.current = true

    try {
      const supabase = getSupabaseClient()
      const { data, error } = await supabase.rpc('get_admin_session_status')
      if (error) throw error

      const status = (Array.isArray(data) ? data[0] : data) as AdminSessionStatus | null
      const hardExpiresAt = status?.hard_expires_at ? Date.parse(status.hard_expires_at) : NaN
      if (!Number.isFinite(hardExpiresAt)) {
        throw new Error('The administrator session expiry could not be validated. Please retry.')
      }

      if (hardTimeoutRef.current !== null) {
        window.clearTimeout(hardTimeoutRef.current)
      }
      hardTimeoutRef.current = window.setTimeout(
        () => void checkSession(),
        Math.max(0, hardExpiresAt - Date.now())
      )

      if (hardExpiresAt <= Date.now()) {
        signingOutRef.current = true
        const { error: revokeError } = await supabase.rpc('revoke_admin_2fa')
        if (revokeError) {
          console.error('[AdminSessionGuard] Failed to revoke expired admin authorization:', revokeError)
        }

        const { error: signOutError } = await supabase.auth.signOut({ scope: 'local' })
        if (signOutError) throw signOutError
        navigate('/login', { replace: true })
        return
      }

      setRequiresReverification(status?.active !== true)
      setSessionError('')
    } catch (error) {
      console.error('[AdminSessionGuard] Failed to validate administrator session:', error)
      setSessionError(sanitizeErrorMessage(error, 'Unable to validate the administrator session.'))
    } finally {
      checkingRef.current = false
      setIsCheckingSession(false)
      if (rerunCheckRef.current && !signingOutRef.current) {
        rerunCheckRef.current = false
        void checkSession()
      }
    }
  }, [navigate])

  useEffect(() => {
    setIsCheckingSession(true)
    void checkSession()
    const intervalId = window.setInterval(() => {
      void checkSession()
    }, 15_000)
    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible') void checkSession()
    }
    document.addEventListener('visibilitychange', onVisibilityChange)

    return () => {
      window.clearInterval(intervalId)
      if (hardTimeoutRef.current !== null) {
        window.clearTimeout(hardTimeoutRef.current)
      }
      document.removeEventListener('visibilitychange', onVisibilityChange)
    }
  }, [checkSession])

  return (
    <AdminReverifyModal
      isOpen={isCheckingSession || requiresReverification || Boolean(sessionError)}
      phone={phone}
      isCheckingSession={isCheckingSession}
      sessionError={sessionError}
      onRetrySessionCheck={checkSession}
      onVerified={checkSession}
    />
  )
}

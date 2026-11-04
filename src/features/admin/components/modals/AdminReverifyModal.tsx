import { useState } from 'react'
import { AlertCircle, ShieldCheck } from 'lucide-react'
import { Button, Modal } from '@kaamgar/ui'
import { getSupabaseClient } from '@/lib/supabase'
import { openOtpWidget } from '@/services/otp'
import { sanitizeErrorMessage } from '@/utils/errors'

interface AdminReverifyModalProps {
  isOpen: boolean
  phone: string
  isCheckingSession: boolean
  sessionError: string
  onRetrySessionCheck: () => void
  onVerified: () => Promise<void>
}

async function getFunctionErrorMessage(error: unknown): Promise<string> {
  if (!error || typeof error !== 'object') return ''

  const context = (error as { context?: unknown }).context
  if (context instanceof Response) {
    try {
      const body = await context.clone().json() as { error?: unknown; message?: unknown }
      if (typeof body.error === 'string') return body.error
      if (typeof body.message === 'string') return body.message
    } catch {
      try {
        const text = await context.clone().text()
        if (text) {
          try {
            const body = JSON.parse(text) as { error?: unknown; message?: unknown }
            if (typeof body.error === 'string') return body.error
            if (typeof body.message === 'string') return body.message
          } catch {
            return text
          }
        }
      } catch {
        // Fall back to the Supabase Functions error message.
      }
    }
  }

  return (error as { message?: string }).message || ''
}

export function AdminReverifyModal({
  isOpen,
  phone,
  isCheckingSession,
  sessionError,
  onRetrySessionCheck,
  onVerified,
}: AdminReverifyModalProps) {
  const [isVerifying, setIsVerifying] = useState(false)
  const [verificationError, setVerificationError] = useState('')

  const startVerification = async () => {
    setVerificationError('')
    setIsVerifying(true)

    try {
      await openOtpWidget({
        identifier: phone,
        onSuccess: async accessToken => {
          try {
            const { data, error } = await getSupabaseClient().functions.invoke('verify-admin-2fa', {
              body: { accessToken },
            })
            if (error) {
              const message = await getFunctionErrorMessage(error)
              throw new Error(message || error.message)
            }
            if (!data?.success) {
              throw new Error(data?.error || 'Session verification could not be completed.')
            }
            await onVerified()
          } catch (error) {
            setVerificationError(sanitizeErrorMessage(error, 'Session verification failed. Please try again.'))
          } finally {
            setIsVerifying(false)
          }
        },
        onFailure: error => {
          setVerificationError(sanitizeErrorMessage(error, 'OTP verification failed. Please try again.'))
          setIsVerifying(false)
        },
      })
    } catch (error) {
      setVerificationError(sanitizeErrorMessage(error, 'Could not open OTP verification. Please try again.'))
      setIsVerifying(false)
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => {}}
      title="Verify Your Admin Session"
      description="Your administrator session needs a fresh identity check. You will stay on this page after verification."
      size="md"
    >
      <div className="space-y-4 pt-2">
        <div className="flex items-start gap-3 rounded-xl border border-brand-500/30 bg-brand-500/10 p-4">
          <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-brand-500" />
          <p className="text-sm text-semantic-text-secondary">
            Verify the OTP sent to the mobile number registered to your administrator account. Your current page and
            Supabase sign-in session will be preserved.
          </p>
        </div>

        {(sessionError || verificationError) && (
          <div role="alert" className="flex items-start gap-2 rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-600">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{sessionError || verificationError}</span>
          </div>
        )}

        {isCheckingSession ? (
          <p className="text-sm text-semantic-text-secondary">Checking administrator session…</p>
        ) : sessionError ? (
          <Button variant="primary" onClick={onRetrySessionCheck}>
            Retry session check
          </Button>
        ) : (
          <div className="flex justify-end">
            <Button variant="primary" onClick={startVerification} loading={isVerifying}>
              Verify with SMS OTP
            </Button>
          </div>
        )}
      </div>
    </Modal>
  )
}

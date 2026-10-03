/**
 * MSG91 OTP Widget Integration Service
 * Manages script loading, prerequisite utility readiness, polling for initialization,
 * and triggering the SendOTP / Verify widget.
 *
 * PHONE CONTRACT: This module expects the `identifier` option to be a canonical
 * 10-digit Indian mobile number (e.g. "9876543210"), produced by normalizeIndianPhone()
 * from src/utils/phone.ts. It prepends "91" exactly once to produce the MSG91 identifier (12 digits).
 *
 * HARDENING & DEPENDENCY PREREQUISITES:
 * - Preloads & guarantees window.intlTelInputUtils from intl-tel-input v17.0.17 before widget invocation.
 * - Prevents empty or prefix-only ("+91", "91", "") identifiers from ever reaching MSG91.
 * - Cleans up duplicate or stale <msg91-otp-provider> DOM elements before each launch.
 * - Normalizes and localizes provider errors to prevent misleading messages.
 */
import { normalizeIndianPhone } from '@/utils/phone'
import { sanitizeErrorMessage } from '@/utils/errors'

declare global {
  interface Window {
    initSendOTP?: (config: Record<string, unknown>) => void
    msg91OtpConfig?: Record<string, unknown>
    libLoaded?: boolean
    intlTelInputUtils?: unknown
    intlTelInputGlobals?: {
      startedLoadingUtilsScript?: boolean
      loadUtils?: (path: string) => Promise<unknown>
      documentReady?: () => boolean
    }
  }
}

const MSG91_WIDGET_ID = import.meta.env.VITE_MSG91_WIDGET_ID || ''
const MSG91_TOKEN_AUTH = import.meta.env.VITE_MSG91_TOKEN_AUTH || ''

const PRIMARY_CDN = 'https://verify.msg91.com/otp-provider.js'
const BACKUP_CDN = 'https://verify.phone91.com/otp-provider.js'
const INTL_UTILS_URL = 'https://cdnjs.cloudflare.com/ajax/libs/intl-tel-input/17.0.17/js/utils.js'

let scriptLoadingPromise: Promise<boolean> | null = null
let utilsLoadingPromise: Promise<boolean> | null = null

/**
 * Ensures window.intlTelInputUtils is fully loaded and defined.
 * MSG91 widget internal intl-tel-input instance strictly requires window.intlTelInputUtils
 * to extract and format numbers in sendOtp(). Without it, getNumber() returns an empty string,
 * causing MSG91 to reject the request with "Invalid mobile".
 */
export async function ensureIntlTelInputUtils(timeoutMs = 4000): Promise<boolean> {
  if (typeof window === 'undefined') return false
  if (typeof window.intlTelInputUtils !== 'undefined') return true

  if (utilsLoadingPromise) return utilsLoadingPromise

  utilsLoadingPromise = (async () => {
    try {
      let scriptTag = document.querySelector<HTMLScriptElement>(`script[src="${INTL_UTILS_URL}"]`)
      if (!scriptTag) {
        scriptTag = document.createElement('script')
        scriptTag.src = INTL_UTILS_URL
        scriptTag.async = true
        document.head.appendChild(scriptTag)
      }

      const startTime = Date.now()
      return await new Promise<boolean>((resolve) => {
        const interval = setInterval(() => {
          if (typeof window.intlTelInputUtils !== 'undefined') {
            clearInterval(interval)
            resolve(true)
          } else if (Date.now() - startTime >= timeoutMs) {
            clearInterval(interval)
            console.warn('[MSG91] intlTelInputUtils script load timed out after', timeoutMs, 'ms')
            resolve(false)
          }
        }, 50)
      })
    } catch (err) {
      console.error('[MSG91] Error loading intlTelInputUtils:', err)
      return false
    } finally {
      utilsLoadingPromise = null
    }
  })()

  return utilsLoadingPromise
}

/**
 * Actively polls window.initSendOTP every 50ms up to timeoutMs.
 * Ensures we don't fail just because the bundle takes a few ticks to parse.
 */
function waitForInitSendOTP(timeoutMs = 4000): Promise<boolean> {
  if (typeof window === 'undefined') return Promise.resolve(false)
  if (typeof window.initSendOTP === 'function') return Promise.resolve(true)

  const startTime = Date.now()
  return new Promise<boolean>((resolve) => {
    const interval = setInterval(() => {
      if (typeof window.initSendOTP === 'function') {
        clearInterval(interval)
        resolve(true)
      } else if (Date.now() - startTime >= timeoutMs) {
        clearInterval(interval)
        resolve(false)
      }
    }, 50)
  })
}

/**
 * Loads the MSG91 OTP Provider script and ensures window.initSendOTP is ready.
 */
export async function loadMsg91Script(): Promise<boolean> {
  if (typeof window === 'undefined') return false

  // Concurrently ensure intlTelInputUtils and MSG91 provider SDK
  const [utilsReady, providerReady] = await Promise.all([
    ensureIntlTelInputUtils(4000),
    (async () => {
      if (typeof window.initSendOTP === 'function') return true

      const preloadedReady = await waitForInitSendOTP(800)
      if (preloadedReady) return true

      if (scriptLoadingPromise) return scriptLoadingPromise

      scriptLoadingPromise = (async () => {
        try {
          let scriptTag = document.querySelector<HTMLScriptElement>(
            `script[src="${PRIMARY_CDN}"], script[src="${BACKUP_CDN}"]`
          )

          if (!scriptTag) {
            scriptTag = document.createElement('script')
            scriptTag.src = PRIMARY_CDN
            scriptTag.async = true
            scriptTag.onerror = () => {
              console.warn('[MSG91] Primary CDN failed, attempting secondary CDN...')
              if (scriptTag) {
                scriptTag.src = BACKUP_CDN
              }
            }
            document.head.appendChild(scriptTag)
          }

          const ready = await waitForInitSendOTP(4000)
          if (ready) {
            console.log('[MSG91] OTP Provider SDK successfully loaded and initialized.')
            return true
          }

          console.warn(
            '[MSG91] Script did not expose initSendOTP within timeout. Possible adblocker or network restriction.'
          )
          return false
        } catch (err) {
          console.error('[MSG91] Unexpected error loading script:', err)
          return false
        } finally {
          scriptLoadingPromise = null
        }
      })()

      return scriptLoadingPromise
    })(),
  ])

  if (!utilsReady) {
    console.warn('[MSG91] intlTelInputUtils was not ready during loadMsg91Script. Proceeding with caution.')
  }

  return providerReady
}

/**
 * Removes any stale or orphaned <msg91-otp-provider> DOM elements.
 * Prevents multiple widget instances, duplicate listeners, or stale shadow-root queries.
 */
export function cleanupOtpWidget(): void {
  if (typeof document === 'undefined') return
  try {
    const existingWidgets = document.querySelectorAll('msg91-otp-provider')
    existingWidgets.forEach((widget) => {
      widget.remove()
    })
  } catch (err) {
    console.warn('[MSG91] Cleanup warning:', err)
  }
}

export interface OtpFailureDetail {
  cancelled?: boolean
  message: string
  raw?: unknown
}

/**
 * Normalizes widget failure events into user-friendly details.
 */
export function normalizeWidgetError(error: unknown): OtpFailureDetail {
  if (!error) {
    return { message: 'OTP verification failed or was cancelled.' }
  }

  if (typeof error === 'object' && error !== null) {
    const obj = error as Record<string, unknown>
    // User cancelled or closed the modal
    if (obj.closeByUser === true || obj.closeByUser === 1 || String(obj.message).toLowerCase().includes('close')) {
      return {
        cancelled: true,
        message: 'OTP verification was cancelled.',
        raw: error,
      }
    }

    const rawMsg = String(obj.message || obj.error || obj.data || '').trim()
    const lower = rawMsg.toLowerCase()

    if (lower.includes('invalid mobile') || lower.includes('invalid identifier')) {
      return {
        message: "We couldn't process your mobile number. Please try again.",
        raw: error,
      }
    }

    if (rawMsg) {
      return {
        message: sanitizeErrorMessage(rawMsg, 'OTP verification failed. Please try again.'),
        raw: error,
      }
    }
  }

  if (typeof error === 'string') {
    const lower = error.toLowerCase()
    if (lower.includes('invalid mobile') || lower.includes('invalid identifier')) {
      return {
        message: "We couldn't process your mobile number. Please try again.",
        raw: error,
      }
    }
    return {
      message: sanitizeErrorMessage(error, 'OTP verification failed. Please try again.'),
      raw: error,
    }
  }

  return {
    message: 'OTP verification failed. Please check your network and retry.',
    raw: error,
  }
}

export interface OtpWidgetOptions {
  identifier?: string // 10-digit mobile number or standard input
  onSuccess: (accessToken: string) => void
  onFailure: (error: string | OtpFailureDetail | unknown) => void
}

/**
 * Triggers the MSG91 OTP Widget modal.
 */
export async function openOtpWidget(options: OtpWidgetOptions): Promise<boolean> {
  // 1. Strict validation of effective phone identifier before touching provider
  if (!options.identifier || !options.identifier.trim()) {
    console.error('[MSG91] openOtpWidget called without identifier.')
    options.onFailure('Mobile number is required for OTP verification.')
    return false
  }

  const normalized = normalizeIndianPhone(options.identifier)
  if (!normalized.ok) {
    console.error('[MSG91] openOtpWidget received invalid identifier:', normalized.error)
    options.onFailure(normalized.error)
    return false
  }

  // Prepend India country code 91 exactly once — canonical MSG91 format is 12 digits (e.g. '919876543210')
  const cleanPhone = `91${normalized.digits}`

  // Guard against invalid/empty identifiers: never send "", "+91", "91", null, undefined
  if (!cleanPhone || cleanPhone === '91' || cleanPhone === '+91' || cleanPhone.length !== 12) {
    console.error('[MSG91] Safety guard blocked invalid phone identifier:', cleanPhone)
    options.onFailure('Please enter a valid 10-digit Indian mobile number.')
    return false
  }

  // 2. Clean up any stale widget DOM elements to prevent duplicate instances or stale queries
  cleanupOtpWidget()

  // 3. Ensure prerequisites: both intlTelInputUtils and MSG91 SDK
  const isLoaded = await loadMsg91Script()
  await ensureIntlTelInputUtils(3000)

  if (isLoaded && typeof window.initSendOTP === 'function') {
    try {
      const configuration = {
        widgetId: MSG91_WIDGET_ID,
        tokenAuth: MSG91_TOKEN_AUTH,
        identifier: cleanPhone,
        exposeMethods: false,
        success: (data: unknown) => {
          // Normalize possible callback shapes to extract the access token
          let token = ''
          if (typeof data === 'string' && data.trim().length > 0) {
            token = data.trim()
          } else if (data && typeof data === 'object') {
            const obj = data as Record<string, unknown>
            if (typeof obj.message === 'string' && obj.message.trim().length > 0) {
              token = obj.message.trim()
            } else if (typeof obj['access-token'] === 'string' && obj['access-token'].trim().length > 0) {
              token = obj['access-token'].trim()
            } else if (typeof obj.token === 'string' && obj.token.trim().length > 0) {
              token = obj.token.trim()
            } else if (typeof obj.data === 'string' && obj.data.trim().length > 0) {
              token = obj.data.trim()
            }
          }

          if (!token) {
            console.error('[MSG91 OTP Success] Missing access token in widget callback payload:', data)
            options.onFailure('Verification succeeded but verification token was missing. Please retry.')
            return
          }

          console.log('[MSG91 OTP Success] Verified with access token (length):', token.length)
          options.onSuccess(token)
        },
        failure: (error: unknown) => {
          console.warn('[MSG91 OTP Failure]', error)
          const failureDetail = normalizeWidgetError(error)
          options.onFailure(failureDetail)
        },
      }

      console.log('[MSG91] Initializing OTP widget for India mobile: +91 ******' + cleanPhone.slice(-4))
      window.initSendOTP(configuration)
      return true
    } catch (err) {
      console.error('[MSG91] Error invoking initSendOTP:', err)
      options.onFailure(normalizeWidgetError(err))
      return false
    }
  }

  console.warn('[MSG91] SDK unavailable (verify.msg91.com may be blocked by adblock/shields or offline).')
  options.onFailure('Could not open OTP verification widget. Please ensure ad-blockers are disabled.')
  return false
}

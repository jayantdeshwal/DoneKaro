// DoneKaro — Phone Push & OS Notification Management Utility
// Handles Notification Permission, Android TWA Delegation, and Web Push lifecycle
// Fully compliant with W3C Push API, VAPID, and Supabase RLS policies

import { getSupabaseClient } from '@/lib/supabase'

export type NotificationPermissionState = 'granted' | 'denied' | 'default' | 'unsupported'

export interface PushSupportInfo {
  isSupported: boolean
  permission: NotificationPermissionState
  hasServiceWorker: boolean
  hasPushManager: boolean
}

export interface SubscriptionResult {
  success: boolean
  endpoint?: string
  error?: string
}

/**
 * Converts a base64url-encoded string (VAPID public key) to a Uint8Array
 * required by PushManager.subscribe({ applicationServerKey }).
 */
export function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = window.atob(base64)
  const outputArray = new Uint8Array(rawData.length)
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i)
  }
  return outputArray
}

/**
 * Checks current browser and OS notification support and permission state.
 */
export function getNotificationSupportInfo(): PushSupportInfo {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') {
    return {
      isSupported: false,
      permission: 'unsupported',
      hasServiceWorker: false,
      hasPushManager: false,
    }
  }

  const hasNotification = 'Notification' in window
  const hasServiceWorker = 'serviceWorker' in navigator
  const hasPushManager = 'PushManager' in window

  if (!hasNotification) {
    return {
      isSupported: false,
      permission: 'unsupported',
      hasServiceWorker,
      hasPushManager,
    }
  }

  const permission = Notification.permission as NotificationPermissionState
  return {
    isSupported: true,
    permission,
    hasServiceWorker,
    hasPushManager,
  }
}

/**
 * Requests operating system notification permission.
 * In a Trusted Web Activity (TWA) on Android 13+, this triggers Android's native
 * POST_NOTIFICATIONS runtime permission dialog via DelegationService.
 */
export async function requestNotificationPermission(): Promise<NotificationPermissionState> {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return 'unsupported'
  }

  try {
    const permission = await Notification.requestPermission()

    // If permission was granted and service worker is available, ensure SW is active
    if (permission === 'granted' && 'serviceWorker' in navigator) {
      try {
        await navigator.serviceWorker.ready
      } catch (swErr) {
        console.warn('Service worker check after notification permission:', swErr)
      }
    }

    return permission as NotificationPermissionState
  } catch (err) {
    console.warn('Notification permission request failed:', err)
    return Notification.permission as NotificationPermissionState
  }
}

/**
 * Subscribes the current device/browser to Web Push via PushManager and persists
 * the subscription record in Supabase.
 */
export async function subscribeToPush(
  customVapidKey?: string,
  locale: string = 'en'
): Promise<SubscriptionResult> {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator) || !('PushManager' in window)) {
    return { success: false, error: 'Push notifications not supported on this device/browser.' }
  }

  const vapidKey =
    customVapidKey ||
    (typeof import.meta !== 'undefined' && import.meta.env
      ? import.meta.env.VITE_VAPID_PUBLIC_KEY
      : undefined)

  if (!vapidKey) {
    console.warn(
      'Web Push Note: VITE_VAPID_PUBLIC_KEY is not yet configured. Permission granted for in-app/local alerts.'
    )
    return { success: false, error: 'VAPID public key not configured on client environment.' }
  }

  try {
    const registration = await navigator.serviceWorker.ready
    if (!registration) {
      return { success: false, error: 'Service worker registration not ready.' }
    }

    // Check for existing subscription or create new
    let subscription = await registration.pushManager.getSubscription()

    if (!subscription) {
      const applicationServerKey = urlBase64ToUint8Array(vapidKey)
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: applicationServerKey as unknown as BufferSource,
      })
    }

    const subJson = subscription.toJSON()
    const p256dh = subJson.keys?.p256dh
    const auth = subJson.keys?.auth

    if (!p256dh || !auth) {
      return { success: false, error: 'Subscription missing encryption keys.' }
    }

    // Persist to Supabase via RPC or table upsert
    const supabase = getSupabaseClient()
    const { data: userData } = await supabase.auth.getUser()

    if (!userData?.user) {
      return { success: true, endpoint: subscription.endpoint } // Permission ready, user not signed in yet
    }

    const { error: rpcError } = await (supabase as any).rpc('save_push_subscription', {
      p_endpoint: subscription.endpoint,
      p_p256dh: p256dh,
      p_auth: auth,
      p_locale: locale,
      p_user_agent: navigator.userAgent || null,
    })

    if (rpcError) {
      // Graceful fallback to direct table upsert if migration has not been applied yet
      const { error: upsertError } = await (supabase.from('push_subscriptions') as any).upsert(
        {
          user_id: userData.user.id,
          endpoint: subscription.endpoint,
          p256dh,
          auth,
          locale,
          user_agent: navigator.userAgent || null,
          is_active: true,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'endpoint' }
      )

      if (upsertError) {
        console.warn('Push subscription persistence fallback warning:', upsertError.message)
      }
    }

    return { success: true, endpoint: subscription.endpoint }
  } catch (err: any) {
    console.warn('Failed to subscribe to Web Push:', err?.message || err)
    return { success: false, error: err?.message || 'Subscription failed.' }
  }
}

/**
 * Unsubscribes from Web Push in the browser and marks or deletes the subscription in Supabase.
 */
export async function unsubscribeFromPush(): Promise<boolean> {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator) || !('PushManager' in window)) {
    return false
  }

  try {
    const registration = await navigator.serviceWorker.ready
    const subscription = await registration.pushManager.getSubscription()

    if (subscription) {
      const endpoint = subscription.endpoint
      await subscription.unsubscribe()

      // Notify backend to remove subscription
      const supabase = getSupabaseClient()
      const { error: rpcError } = await (supabase as any).rpc('remove_push_subscription', {
        p_endpoint: endpoint,
      })

      if (rpcError) {
        // Fallback to direct table deletion
        await (supabase.from('push_subscriptions') as any)
          .delete()
          .eq('endpoint', endpoint)
      }

      return true
    }
    return false
  } catch (err) {
    console.warn('Error during unsubscribe from push:', err)
    return false
  }
}

/**
 * Returns current subscription state from PushManager.
 */
export async function checkIsSubscribed(): Promise<boolean> {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator) || !('PushManager' in window)) {
    return false
  }
  try {
    const registration = await navigator.serviceWorker.ready
    const subscription = await registration.pushManager.getSubscription()
    return Boolean(subscription)
  } catch {
    return false
  }
}

/**
 * Returns user-friendly explanation and recovery instructions based on permission state.
 */
export function getNotificationStatusGuidance(
  permission: NotificationPermissionState,
  language: string
): { title: string; message: string; actionText?: string } {
  const isHi = language === 'hi'

  switch (permission) {
    case 'granted':
      return {
        title: isHi ? 'सूचनाएं चालू हैं' : 'Notifications Active',
        message: isHi
          ? 'आपको नई बुकिंग, कोटेशन और स्थिति अपडेट सीधे फोन पर मिलेंगे।'
          : 'You will receive real-time booking alerts, quotes, and status updates on your phone.',
      }
    case 'denied':
      return {
        title: isHi ? 'सूचनाएं बंद हैं (Disabled)' : 'Notifications Blocked',
        message: isHi
          ? 'आपके फोन की सेटिंग्स में सूचनाएं बंद हैं। लाइव अपडेट पाने के लिए Android Settings > Apps > DoneKaro > Notifications में जाकर अनुमति दें।'
          : 'Notifications are disabled in your Android settings. To receive live booking updates, enable notifications in Android Settings > Apps > DoneKaro > Notifications.',
      }
    case 'default':
    default:
      return {
        title: isHi ? 'फोन नोटिफिकेशन चालू करें' : 'Enable Phone Notifications',
        message: isHi
          ? 'कारीगरों के कोटेशन और बुकिंग की लाइव जानकारी तुरंत पाने के लिए नोटिफिकेशन चालू करें।'
          : 'Enable notifications to receive instant updates when artisans send quotes or accept your bookings.',
        actionText: isHi ? 'चालू करें (Enable)' : 'Enable Notifications',
      }
  }
}

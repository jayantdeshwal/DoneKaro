import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate, Link } from 'react-router-dom'
import { useNotifications } from '@/context/NotificationContext'
import { useAuth } from '@/context/AuthContext'
import { useLanguage } from '@/context/LanguageContext'
import { Card, Badge, Button } from '@kaamgar/ui'
import { localizeNotification, getLocalizedActionLabel } from '@/utils/notificationLocalizer'
import {
  Bell,
  CheckCircle,
  XCircle,
  AlertCircle,
  Calendar,
  Star,
  Play,
  RefreshCw,
  X,
  Check,
  UserCheck,
  FileText,
  ArrowLeft,
} from 'lucide-react'
import { DbNotification } from '@/services/notifications'
import {
  getNotificationSupportInfo,
  requestNotificationPermission,
  getNotificationStatusGuidance,
  subscribeToPush,
  unsubscribeFromPush,
  checkIsSubscribed,
  NotificationPermissionState,
} from '@/utils/pushNotification'

const typeConfig: Record<string, { icon: any; color: string; bg: string }> = {
  booking_created: {
    icon: Calendar,
    color: 'text-blue-400',
    bg: 'bg-blue-950/60 border border-blue-800/40',
  },
  booking_accepted: {
    icon: CheckCircle,
    color: 'text-emerald-400',
    bg: 'bg-emerald-950/60 border border-emerald-800/40',
  },
  booking_in_progress: {
    icon: Play,
    color: 'text-indigo-400',
    bg: 'bg-indigo-950/60 border border-indigo-800/40',
  },
  booking_rejected: {
    icon: XCircle,
    color: 'text-red-500',
    bg: 'bg-gray-900 border border-red-800 shadow-md',
  },
  booking_cancelled: {
    icon: AlertCircle,
    color: 'text-amber-400',
    bg: 'bg-amber-950/60 border border-amber-800/40',
  },
  booking_completed: {
    icon: Star,
    color: 'text-purple-400',
    bg: 'bg-purple-950/60 border border-purple-800/40',
  },
  payment_received: {
    icon: CheckCircle,
    color: 'text-emerald-400',
    bg: 'bg-emerald-950/60 border border-emerald-800/40',
  },
  review_received: {
    icon: Star,
    color: 'text-amber-400',
    bg: 'bg-amber-950/60 border border-amber-800/40',
  },
  profile_approved: {
    icon: CheckCircle,
    color: 'text-emerald-400',
    bg: 'bg-emerald-950/60 border border-emerald-800/40',
  },
  profile_rejected: {
    icon: AlertCircle,
    color: 'text-red-500',
    bg: 'bg-gray-900 border border-red-800 shadow-md',
  },
  worker_registration_submitted: {
    icon: UserCheck,
    color: 'text-brand-400',
    bg: 'bg-brand-950/60 border border-brand-800/40',
  },
  worker_document_uploaded: {
    icon: FileText,
    color: 'text-indigo-400',
    bg: 'bg-indigo-950/60 border border-indigo-800/40',
  },
  system: {
    icon: Bell,
    color: 'text-semantic-text-secondary',
    bg: 'bg-surface-200 border border-semantic-border-light',
  },
}

function formatNotificationTime(isoString: string): string {
  const date = new Date(isoString)
  const diffMs = Date.now() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMins / 60)
  const diffDays = Math.floor(diffHours / 24)

  if (diffMins < 1) return 'Just now'
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays === 1) return 'Yesterday'
  return date.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })
}

export default function Notifications() {
  const { t } = useTranslation()
  const { language } = useLanguage()
  const navigate = useNavigate()
  const { isWorker, isAdmin } = useAuth()
  const {
    dbNotifications,
    unreadCount,
    isLoadingNotifications,
    markAsRead,
    markAllAsRead,
    deleteDbNotification,
    refreshNotifications,
  } = useNotifications()

  const [isRefreshing, setIsRefreshing] = useState(false)
  const [refreshSuccess, setRefreshSuccess] = useState(false)
  const [permissionState, setPermissionState] = useState<NotificationPermissionState>(() => {
    return getNotificationSupportInfo().permission
  })
  const [isRequestingPermission, setIsRequestingPermission] = useState(false)

  const handleEnableNotifications = async () => {
    setIsRequestingPermission(true)
    try {
      const res = await requestNotificationPermission()
      setPermissionState(res)
      if (res === 'granted') {
        await subscribeToPush(undefined, language)
      }
    } finally {
      setIsRequestingPermission(false)
    }
  }

  const permissionGuidance = getNotificationStatusGuidance(permissionState, language)

  const handleRefresh = async () => {
    setIsRefreshing(true)
    setRefreshSuccess(false)
    try {
      await refreshNotifications()
      setRefreshSuccess(true)
      setTimeout(() => setRefreshSuccess(false), 2000)
    } catch (err) {
      console.error('Refresh error:', err)
    } finally {
      setIsRefreshing(false)
    }
  }

  const getTypeConfig = (type: string) => typeConfig[type] || typeConfig.system

  const getNotificationAction = (item: DbNotification) => {
    if (
      item.notification_type === 'worker_registration_submitted' ||
      item.notification_type === 'worker_document_uploaded'
    ) {
      return {
        label: t('admin.dashboard', 'Admin Portal'),
        url: '/admin?tab=notifications',
      }
    }
    const quoteNotificationTypes = [
      'quote_request_created',
      'quote_request_cancelled',
      'quote_request_rejected',
      'quote_request_expired',
      'quote_submitted',
      'quote_accepted',
    ]
    if (quoteNotificationTypes.includes(item.notification_type)) {
      return isWorker
        ? { label: t('notifications.viewQuoteRequests', 'View Quote Requests'), url: '/worker/dashboard#quote-requests' }
        : { label: t('notifications.viewQuotes', 'View Quote Requests'), url: '/bookings#quote-requests' }
    }
    if (item.notification_type === 'booking_created' && isWorker) {
      return {
        label: t('notifications.viewDashboard', 'Worker Dashboard'),
        url: `/worker/dashboard#booking-${encodeURIComponent(item.booking_id!)}`,
      }
    }
    if (item.booking_id) {
      return {
        label: isWorker ? t('notifications.viewDashboard', 'Worker Dashboard') : t('notifications.viewBooking', 'My Bookings'),
        url: isWorker
          ? `/worker/dashboard#booking-${encodeURIComponent(item.booking_id!)}`
          : `/bookings#booking-${encodeURIComponent(item.booking_id!)}`,
      }
    }
    if (item.notification_type === 'profile_approved' || item.notification_type === 'profile_rejected') {
      return {
        label: t('notifications.viewDashboard', 'Worker Dashboard'),
        url: '/worker/dashboard',
      }
    }
    return null
  }

  const handleActionClick = (notification: DbNotification, url: string) => {
    if (!notification.read_at) {
      void markAsRead(notification.id)
    }
    navigate(url)
  }

  return (
    <div className="min-h-screen bg-semantic-bg-primary text-semantic-text-primary">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-4">
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-surface-200 hover:bg-surface-300 text-xs font-semibold text-semantic-text-secondary hover:text-white border border-semantic-border-light transition-all active:scale-95 cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5 text-brand-400" />
            <span>{t('categoryPage.backToHome', 'Back to Home')}</span>
          </Link>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold text-semantic-text-primary flex items-center gap-2.5">
              <Bell className="w-6 h-6 text-brand-400" />
              <span>{isAdmin ? t('notifications.title', 'Notifications') : t('notifications.alertsTitle', 'Your Alerts')}</span>
              {unreadCount > 0 && <Badge variant="danger">{unreadCount}</Badge>}
            </h1>
            <p className="text-semantic-text-secondary mt-1">
              {isAdmin
                ? t(
                    'notifications.adminSubtitle',
                    'Stay updated with worker registrations and verification alerts'
                  )
                : t(
                    'notifications.subtitle',
                    'Stay updated with your bookings and account activity'
                  )}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={isRefreshing || isLoadingNotifications}
              className="flex items-center gap-1.5"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing || isLoadingNotifications ? 'animate-spin' : ''}`} />
              <span>{isRefreshing ? t('common.loading', 'Refreshing...') : refreshSuccess ? t('common.done', 'Updated') : t('common.refresh', 'Refresh')}</span>
            </Button>

            {unreadCount > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => void markAllAsRead()}
                className="flex items-center gap-1.5"
              >
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span>{t('notifications.markAllRead', 'Mark all read')}</span>
              </Button>
            )}
          </div>
        </div>

        {/* Phone / Push Notification Permission Banner */}
        {permissionState !== 'granted' && permissionState !== 'unsupported' && (
          <div
            className={`mb-6 p-4 rounded-2xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3.5 transition-all ${
              permissionState === 'denied'
                ? 'bg-gray-900 border-red-800 text-red-300 shadow-md'
                : 'bg-brand-500/10 border-brand-500/30 text-slate-900 dark:text-zinc-100'
            }`}
          >
            <div className="flex items-start gap-3">
              <div
                className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                  permissionState === 'denied'
                    ? 'bg-red-700 text-white font-bold'
                    : 'bg-brand-500 text-slate-950 font-bold'
                }`}
              >
                <Bell className="w-5 h-5" />
              </div>
              <div>
                <h4 className={`text-sm ${permissionState === 'denied' ? 'font-semibold text-red-500' : 'font-bold'}`}>{permissionGuidance.title}</h4>
                <p className={`mt-0.5 text-xs leading-relaxed max-w-xl ${permissionState === 'denied' ? 'text-red-300' : 'text-slate-600 dark:text-zinc-400'}`}>
                  {permissionGuidance.message}
                </p>
              </div>
            </div>

            {permissionState === 'default' && permissionGuidance.actionText && (
              <Button
                variant="primary"
                size="sm"
                onClick={handleEnableNotifications}
                disabled={isRequestingPermission}
                className="shrink-0 text-xs font-bold px-3.5 py-1.5"
              >
                {isRequestingPermission ? t('common.loading', 'Requesting...') : permissionGuidance.actionText}
              </Button>
            )}
          </div>
        )}

        {isLoadingNotifications && dbNotifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-semantic-text-secondary">
            <RefreshCw className="w-8 h-8 animate-spin text-brand-400 mb-3" />
            <p>{t('common.loading', 'Loading notifications...')}</p>
          </div>
        ) : dbNotifications.length === 0 ? (
          <div className="text-center py-16 bg-surface-100 border border-semantic-border-light rounded-2xl p-8">
            <div className="w-16 h-16 mx-auto mb-4 bg-surface-200 rounded-full flex items-center justify-center text-semantic-text-tertiary">
              <Bell className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-semibold text-semantic-text-primary mb-1">
              {t('notifications.empty', 'No notifications')}
            </h3>
            <p className="text-semantic-text-secondary text-sm max-w-sm mx-auto">
              {t('notifications.noNotificationsDesc', "You'll see real-time alerts here when booking requests, status changes, or account approvals occur.")}
            </p>
          </div>
        ) : (
          <div className="space-y-3.5">
            {dbNotifications.map(notification => {
              const isUnread = !notification.read_at
              const isErrorNotification =
                notification.notification_type === 'booking_rejected' ||
                notification.notification_type === 'profile_rejected'
              const config = getTypeConfig(notification.notification_type)
              const Icon = config.icon
              const action = getNotificationAction(notification)
              const localized = localizeNotification(notification, t, language)
              const actionLabel = action ? getLocalizedActionLabel(action.label, language) : ''

              return (
                <div
                  key={notification.id}
                  onClick={() => {
                    if (action) {
                      handleActionClick(notification, action.url)
                    } else if (isUnread) {
                      void markAsRead(notification.id)
                    }
                  }}
                  className={`p-4 sm:p-5 rounded-2xl border transition-all duration-200 cursor-pointer ${
                    isErrorNotification
                      ? 'bg-gray-900 border-red-800 shadow-md'
                      : isUnread
                        ? 'bg-amber-500/[0.04] dark:bg-amber-500/[0.08] border-amber-500/40 shadow-xs hover:border-amber-500/70'
                        : 'bg-white dark:bg-zinc-900 border-slate-200/90 dark:border-zinc-800 hover:border-slate-300 dark:hover:border-zinc-700 shadow-xs'
                  }`}
                >
                  <div className="flex items-start gap-3.5 sm:gap-4">
                    {/* Category Icon Badge */}
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 mt-0.5 shadow-xs ${config.bg}`}>
                      <Icon className={`w-5 h-5 ${config.color}`} />
                    </div>

                    <div className="flex-1 min-w-0">
                      {/* Top Meta Bar: Category, Unread Badge & Time */}
                      <div className="flex items-center justify-between gap-2 mb-1.5 flex-wrap">
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 border border-slate-200/80 dark:border-zinc-700">
                            {localized.category}
                          </span>
                          {isUnread && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.2 rounded-full bg-amber-500 text-slate-950">
                              <span className="w-1.5 h-1.5 rounded-full bg-slate-950" />
                              {language === 'hi' ? 'नया' : 'NEW'}
                            </span>
                          )}
                        </div>
                        <span className="text-xs font-medium text-slate-500 dark:text-zinc-400">
                          {localized.timeAgo}
                        </span>
                      </div>

                      {/* Notification Title */}
                      <h3
                        className={`text-base mb-1 ${
                          isErrorNotification
                            ? 'font-semibold text-red-500'
                            : `font-bold tracking-tight ${isUnread ? 'text-slate-900 dark:text-white' : 'text-slate-700 dark:text-zinc-300'}`
                        }`}
                      >
                        {localized.title}
                      </h3>

                      {/* Notification Description */}
                      <p className={`text-sm leading-relaxed font-normal ${isErrorNotification ? 'text-red-300' : 'text-slate-600 dark:text-zinc-300'}`}>
                        {localized.body}
                      </p>

                      {/* Action Bar */}
                      {action && (
                        <div className="mt-3.5 flex items-center gap-2.5 flex-wrap">
                          <Button
                            variant="primary"
                            size="sm"
                            onClick={e => {
                              e.stopPropagation()
                              handleActionClick(notification, action.url)
                            }}
                            className="text-xs font-bold py-1.5 px-3.5 bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-xs cursor-pointer"
                          >
                            {actionLabel}
                          </Button>
                          {isUnread && (
                            <button
                              type="button"
                              onClick={e => {
                                e.stopPropagation()
                                void markAsRead(notification.id)
                              }}
                              className="text-xs font-semibold text-slate-500 dark:text-zinc-400 hover:text-amber-600 dark:hover:text-amber-400 px-2 py-1 rounded-lg transition-colors cursor-pointer"
                            >
                              {t('notifications.markRead', 'Mark as read')}
                            </button>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Dismiss Button */}
                    <button
                      type="button"
                      onClick={e => {
                        e.stopPropagation()
                        void deleteDbNotification(notification.id)
                      }}
                      className="shrink-0 p-1.5 text-slate-400 hover:text-rose-500 dark:hover:text-rose-400 rounded-lg hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
                      title={t('notifications.dismiss', 'Dismiss')}
                      aria-label={t('notifications.dismiss', 'Dismiss')}
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

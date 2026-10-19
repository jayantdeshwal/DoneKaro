import { useTranslation } from 'react-i18next'
import { useNotifications } from '../../context/NotificationContext'
import { localizeNotification } from '@/utils/notificationLocalizer'
import { X } from 'lucide-react'

export function NotificationToast() {
  const { t, i18n } = useTranslation()
  const { notifications, removeNotification } = useNotifications()

  if (notifications.length === 0) return null

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2" role="region" aria-label={t('notifications.title', 'Notifications')}>
      {notifications.map((notification) => {
        const localized = localizeNotification(
          { title: notification.title, body: notification.message || '' },
          t,
          i18n.language
        )
        const displayTitle = localized.title || notification.title
        const displayMessage = localized.body || notification.message

        return (
          <div
            key={notification.id}
            className={`
            flex items-start gap-3 w-80 rounded-2xl shadow-2xl border p-4 animate-slide-in
            ${notification.type === 'error' ? 'bg-gray-900 border-red-800 shadow-md text-red-300' : 'bg-white dark:bg-zinc-900 border-slate-200 dark:border-zinc-800 text-slate-900 dark:text-zinc-100'}
            ${notification.type === 'success' ? 'border-l-4 border-emerald-500' : ''}
            ${notification.type === 'error' ? 'border-l-4 border-red-500' : ''}
              ${notification.type === 'warning' ? 'border-l-4 border-amber-500' : ''}
              ${notification.type === 'info' ? 'border-l-4 border-blue-500' : ''}
            `}
            role="alert"
          >
            <div className="flex-1 min-w-0">
              <p className={`text-sm font-semibold ${notification.type === 'error' ? 'text-red-500' : 'font-bold text-slate-900 dark:text-white'}`}>{displayTitle}</p>
              {displayMessage && (
                <p className={`mt-1 text-xs ${notification.type === 'error' ? 'text-red-300' : 'text-slate-600 dark:text-zinc-400'}`}>{displayMessage}</p>
              )}
            </div>
            <button
              onClick={() => removeNotification(notification.id)}
              className="flex-shrink-0 text-slate-400 hover:text-slate-700 dark:text-zinc-500 dark:hover:text-zinc-200 p-1 transition-colors cursor-pointer"
              aria-label={t('common.dismiss', 'Dismiss')}
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )
      })}
    </div>
  )
}

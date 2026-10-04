import { useNotifications } from '../../context/NotificationContext'
import { X } from 'lucide-react'

export function NotificationToast() {
  const { notifications, removeNotification } = useNotifications()

  if (notifications.length === 0) return null

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2" role="region" aria-label="Notifications">
      {notifications.map((notification) => (
        <div
          key={notification.id}
          className={`
            flex items-start gap-3 w-80 bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-zinc-800 p-4 animate-slide-in text-slate-900 dark:text-zinc-100
            ${notification.type === 'success' ? 'border-l-4 border-emerald-500' : ''}
            ${notification.type === 'error' ? 'border-l-4 border-rose-500' : ''}
            ${notification.type === 'warning' ? 'border-l-4 border-amber-500' : ''}
            ${notification.type === 'info' ? 'border-l-4 border-blue-500' : ''}
          `}
          role="alert"
        >
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-slate-900 dark:text-white">{notification.title}</p>
            {notification.message && (
              <p className="mt-1 text-xs text-slate-600 dark:text-zinc-400">{notification.message}</p>
            )}
          </div>
          <button
            onClick={() => removeNotification(notification.id)}
            className="flex-shrink-0 text-slate-400 hover:text-slate-700 dark:text-zinc-500 dark:hover:text-zinc-200 p-1 transition-colors cursor-pointer"
            aria-label="Dismiss"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ))}
    </div>
  )
}

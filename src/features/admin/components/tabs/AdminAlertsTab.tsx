import { useTranslation } from 'react-i18next'
import { motion } from 'framer-motion'
import { Card, Badge, Button } from '@kaamgar/ui'
import {
  Bell,
  RefreshCw,
  CheckCheck,
  UserCheck,
  FileText,
  AlertCircle,
  Eye,
  Check,
} from 'lucide-react'
import type { AdminNotificationItem } from '../../types'

interface AdminAlertsTabProps {
  filteredNotifications: AdminNotificationItem[]
  isLoadingNotifications: boolean
  notificationFilter: 'all' | 'registrations' | 'documents' | 'unread'
  setNotificationFilter: (filter: 'all' | 'registrations' | 'documents' | 'unread') => void
  notifCounts: { all: number; registrations: number; documents: number; unread: number }
  unreadNotifsCount: number
  loadNotificationsData: () => Promise<void>
  markNotificationRead: (id: string) => Promise<void>
  markAllNotificationsRead: () => Promise<void>
  handleInspectWorkerFromNotification: (notif: AdminNotificationItem) => void
}

export function AdminAlertsTab({
  filteredNotifications,
  isLoadingNotifications,
  notificationFilter,
  setNotificationFilter,
  notifCounts,
  unreadNotifsCount,
  loadNotificationsData,
  markNotificationRead,
  markAllNotificationsRead,
  handleInspectWorkerFromNotification,
}: AdminAlertsTabProps) {
  const { t } = useTranslation()

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Dedicated Mobile Alerts Header */}
      <div className="md:hidden p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200/90 dark:border-zinc-800 shadow-sm flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-rose-500/15 border border-rose-500/30 flex items-center justify-center text-rose-500">
              <Bell className="w-4 h-4" />
            </div>
            <h2 className="text-base font-black text-slate-900 dark:text-white">
              {t('admin.alerts', 'Platform Alerts')}
            </h2>
            {unreadNotifsCount > 0 && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-rose-500 text-white">
                {unreadNotifsCount} Unread
              </span>
            )}
          </div>
          <p className="text-[11px] text-slate-500 dark:text-zinc-400 mt-1">
            Live notifications, worker registrations, and dispatch events
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={loadNotificationsData}
          disabled={isLoadingNotifications}
          className="p-2 rounded-xl border border-slate-200 dark:border-zinc-700"
        >
          <RefreshCw className={`w-4 h-4 ${isLoadingNotifications ? 'animate-spin text-amber-500' : ''}`} />
        </Button>
      </div>

      {/* Header / Actions Card */}
      <Card className="p-6 bg-white dark:bg-zinc-900 border border-slate-200/90 dark:border-zinc-800 rounded-3xl shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                {t('admin.notifications', 'Admin Notifications & Dispatch Alerts')}
              </h2>
              {unreadNotifsCount > 0 && (
                <Badge variant="danger" size="sm">
                  {unreadNotifsCount} {t('admin.filterUnread', 'Unread')}
                </Badge>
              )}
            </div>
            <p className="text-sm text-semantic-text-secondary mt-1">
              Real-time operational alerts for worker registrations, document verifications, and platform events.
            </p>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-center">
            <Button
              variant="outline"
              size="sm"
              onClick={loadNotificationsData}
              disabled={isLoadingNotifications}
              className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-xl"
            >
              <RefreshCw
                className={`w-3.5 h-3.5 ${isLoadingNotifications ? 'animate-spin text-brand-400' : ''}`}
              />
              Refresh
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={markAllNotificationsRead}
              disabled={unreadNotifsCount === 0 || isLoadingNotifications}
              className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-xl"
            >
              <CheckCheck className="w-3.5 h-3.5 text-emerald-400" />
              {t('admin.markAllRead', 'Mark all read')}
            </Button>
          </div>
        </div>

        {/* Spring-Animated Filter Pills (Registrations, Documents, Unread) */}
        <div className="flex flex-wrap gap-2 mt-6 pt-4 border-t border-semantic-border-light">
          {[
            {
              key: 'all',
              label: t('admin.allNotifications', 'All Notifications'),
              count: notifCounts.all,
              icon: Bell,
            },
            {
              key: 'registrations',
              label: t('admin.filterRegistrations', 'Worker Registrations'),
              count: notifCounts.registrations,
              icon: UserCheck,
            },
            {
              key: 'documents',
              label: t('admin.filterDocuments', 'ID Documents'),
              count: notifCounts.documents,
              icon: FileText,
            },
            {
              key: 'unread',
              label: t('admin.filterUnread', 'Unread'),
              count: notifCounts.unread,
              icon: AlertCircle,
            },
          ].map(f => {
            const isSelected = notificationFilter === f.key
            return (
              <button
                key={f.key}
                onClick={() => setNotificationFilter(f.key as any)}
                className={`relative inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all ${
                  isSelected
                    ? 'text-surface-950 font-bold'
                    : 'bg-surface-200/80 text-semantic-text-secondary hover:text-semantic-text-primary hover:bg-surface-300'
                }`}
              >
                {isSelected && (
                  <motion.div
                    layoutId="adminNotifFilterPillHighlight"
                    className="absolute inset-0 bg-brand-500 rounded-full shadow-sm"
                    transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                  />
                )}
                <span className="relative z-10 flex items-center gap-1.5">
                  <f.icon className="w-3.5 h-3.5" />
                  <span>{f.label}</span>
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                      isSelected
                        ? 'bg-surface-950/20 text-surface-950'
                        : 'bg-surface-300 text-semantic-text-tertiary'
                    }`}
                  >
                    {f.count}
                  </span>
                </span>
              </button>
            )
          })}
        </div>
      </Card>

      {/* Notifications List Card */}
      <Card className="p-4 sm:p-6 bg-white dark:bg-zinc-900 border border-slate-200/90 dark:border-zinc-800 rounded-3xl shadow-sm">
        {isLoadingNotifications ? (
          <div className="py-12 text-center text-slate-500 dark:text-zinc-400">
            <RefreshCw className="w-8 h-8 mx-auto animate-spin text-amber-500 mb-3" />
            <p className="text-sm">Loading admin notifications...</p>
          </div>
        ) : filteredNotifications.length === 0 ? (
          <div className="py-12 text-center">
            <div className="w-16 h-16 mx-auto mb-4 bg-slate-100 dark:bg-zinc-800 rounded-2xl flex items-center justify-center text-slate-400 dark:text-zinc-500">
              <Bell className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
              {t('admin.noNotifications', 'No notifications found')}
            </h3>
            <p className="text-sm text-slate-500 dark:text-zinc-400 max-w-sm mx-auto mt-1">
              {t('admin.noNotificationsDesc', 'System alerts, worker registration requests, and ID document uploads will appear here.')}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredNotifications.map(notif => {
              const isUnread = !notif.read_at
              const isWorkerEvent =
                notif.notification_type === 'worker_registration_submitted' ||
                notif.notification_type === 'worker_document_uploaded'

              return (
                <motion.div
                  key={notif.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`p-4 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-start justify-between gap-4 ${
                    isUnread
                      ? 'bg-amber-500/5 dark:bg-amber-500/10 border-amber-500/40 shadow-xs'
                      : 'bg-slate-50 dark:bg-zinc-800/50 border-slate-200/90 dark:border-zinc-700/60 hover:bg-slate-100 dark:hover:bg-zinc-800'
                  }`}
                >
                  <div className="flex items-start gap-3.5 min-w-0">
                    {/* Type Icon */}
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5 ${
                        notif.notification_type === 'worker_registration_submitted'
                          ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                          : notif.notification_type === 'worker_document_uploaded'
                          ? 'bg-blue-500/15 text-blue-400 border border-blue-500/30'
                          : 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                      }`}
                    >
                      {notif.notification_type === 'worker_registration_submitted' && (
                        <UserCheck className="w-5 h-5" />
                      )}
                      {notif.notification_type === 'worker_document_uploaded' && (
                        <FileText className="w-5 h-5" />
                      )}
                      {!isWorkerEvent && (
                        <Bell className="w-5 h-5" />
                      )}
                    </div>

                    {/* Text content */}
                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="font-semibold text-sm text-semantic-text-primary">
                          {notif.title}
                        </h4>
                        {isUnread && (
                          <Badge
                            variant="warning"
                            className="text-[10px] px-1.5 py-0.2 uppercase font-bold tracking-wider"
                          >
                            NEW
                          </Badge>
                        )}
                        <span className="text-xs text-semantic-text-tertiary">
                          {new Date(notif.created_at).toLocaleString('en-IN', {
                            dateStyle: 'medium',
                            timeStyle: 'short',
                          })}
                        </span>
                      </div>
                      <p className="text-sm text-semantic-text-secondary leading-relaxed">
                        {notif.body}
                      </p>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 self-end sm:self-center flex-shrink-0 pt-2 sm:pt-0">
                    {isWorkerEvent && (
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => handleInspectWorkerFromNotification(notif)}
                        className="text-xs flex items-center gap-1.5 shadow-sm font-semibold px-3 py-1.5 rounded-xl bg-brand-500 text-surface-950 hover:bg-brand-600"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        {t('admin.reviewWorker', 'Review Worker')}
                      </Button>
                    )}

                    {isUnread && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => markNotificationRead(notif.id)}
                        title="Mark as read"
                        className="text-xs text-semantic-text-tertiary hover:text-semantic-text-primary p-2 rounded-xl"
                      >
                        <Check className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </motion.div>
              )
            })}
          </div>
        )}
      </Card>
    </div>
  )
}

import {
  Home, Search, List, Bell, Briefcase, Shield, Grid,
  User, ClipboardList, Zap, Calendar, UserCheck, Bot, LogIn
} from 'lucide-react'
import type { TFunction } from 'i18next'

export interface NavItem {
  path: string
  label: string
  icon: any
  badge?: number
}

export interface BottomTabItem {
  id: string
  label: string
  path?: string
  icon: any
  badge?: number
  action?: () => void
}

export function getNavItems(
  t: TFunction,
  isAuthenticated: boolean,
  isWorker: boolean,
  isAdmin: boolean,
  unreadCount: number
): NavItem[] {
  if (!isAuthenticated) {
    return [{ path: '/search', label: t('nav.search'), icon: Search }]
  }
  if (isAdmin) {
    return [
      { path: '/admin', label: t('nav.adminDashboard'), icon: Shield },
      { path: '/notifications', label: t('nav.notifications'), icon: Bell, badge: unreadCount },
    ]
  }
  if (isWorker) {
    return [
      { path: '/worker/dashboard', label: t('nav.workerDashboard'), icon: Briefcase },
      { path: '/notifications', label: t('nav.notifications'), icon: Bell, badge: unreadCount },
    ]
  }
  return [
    { path: '/search', label: t('nav.search'), icon: Search },
    { path: '/bookings', label: t('nav.bookings'), icon: List },
    { path: '/notifications', label: t('nav.notifications'), icon: Bell, badge: unreadCount },
  ]
}

export function getBottomTabs(
  t: TFunction,
  isAuthenticated: boolean,
  isWorker: boolean,
  isAdmin: boolean,
  unreadCount: number,
  openAiHelp?: () => void
): BottomTabItem[] {
  if (!isAuthenticated) {
    return [
      { id: 'home', label: t('nav.home', 'Home'), path: '/', icon: Home },
      { id: 'categories', label: t('nav.category', 'Category'), path: '/categories', icon: Grid },
      { id: 'alerts', label: t('nav.alerts', 'Alerts'), path: '/login', icon: Bell },
      { id: 'ai', label: 'AI Help', icon: Bot, action: openAiHelp },
      { id: 'account', label: t('nav.login', 'Account'), path: '/login', icon: LogIn },
    ]
  }
  if (isAdmin) {
    return [
      { id: 'dashboard', label: t('admin.dashboard', 'Dashboard'), path: '/admin', icon: Shield },
      { id: 'approvals', label: t('admin.approvals', 'Approvals'), path: '/admin?tab=workers', icon: UserCheck },
      { id: 'alerts', label: t('admin.alerts', 'Alerts'), path: '/admin?tab=notifications', icon: Bell, badge: unreadCount },
      { id: 'bookings', label: t('admin.allBookings', 'All Bookings'), path: '/admin?tab=bookings', icon: Calendar },
      { id: 'account', label: t('nav.account', 'Account'), path: '/profile', icon: User },
    ]
  }
  if (isWorker) {
    return [
      { id: 'home', label: t('nav.home', 'Home'), path: '/', icon: Home },
      { id: 'dashboard', label: t('nav.workerDashboard', 'Dashboard'), path: '/worker/dashboard', icon: Briefcase },
      { id: 'leads', label: t('worker.newLeads', 'Leads'), path: '/worker/dashboard?tab=leads', icon: Zap },
      { id: 'alerts', label: t('nav.alerts', 'Alerts'), path: '/notifications', icon: Bell, badge: unreadCount },
      { id: 'account', label: t('nav.account', 'Account'), path: '/profile', icon: User },
    ]
  }
  return [
    { id: 'home', label: t('nav.home', 'Home'), path: '/', icon: Home },
    { id: 'categories', label: t('nav.category', 'Category'), path: '/categories', icon: Grid },
    { id: 'alerts', label: t('nav.alerts', 'Alerts'), path: '/notifications', icon: Bell, badge: unreadCount },
    { id: 'bookings', label: t('nav.bookings', 'Bookings'), path: '/bookings', icon: ClipboardList, badge: unreadCount },
    { id: 'account', label: t('nav.account', 'Account'), path: '/profile', icon: User },
  ]
}

import { Outlet, useLocation } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import NetworkStatus from './NetworkStatus'
import PWAInstallPrompt from './PWAInstallPrompt'
import { AiAssistantModal } from '@/features/ai-support'
import { CareSupportModal } from '@/features/support'
import {
  AppHeader,
  MobileDrawer,
  BottomNavigation,
  AppFooter,
  GuestActionBar,
  NotificationToast,
} from './layout/index'

export default function Layout() {
  const { isAuthenticated, isLoading } = useAuth()
  const location = useLocation()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  // Close mobile drawer when route changes
  useEffect(() => {
    setMobileMenuOpen(false)
  }, [location.pathname])

  const isGuestMode =
    typeof window !== 'undefined' &&
    sessionStorage.getItem('donekaro_guest_mode') === 'true'

  const isAuthPage =
    location.pathname === '/login' ||
    location.pathname === '/auth' ||
    location.pathname.startsWith('/register') ||
    location.pathname === '/signup'

  if (isLoading) {
    return (
      <div className="min-h-screen bg-semantic-bg-primary flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-500" />
      </div>
    )
  }

  if (isAuthPage || (!isAuthenticated && !isGuestMode)) {
    return (
      <div className="min-h-screen bg-white dark:bg-zinc-950 text-slate-900 dark:text-zinc-100 flex flex-col transition-colors">
        <NetworkStatus />
        <main className="min-h-screen flex-1">
          <Outlet />
        </main>
        <NotificationToast />
        <PWAInstallPrompt />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white dark:bg-zinc-950 text-slate-900 dark:text-zinc-100 flex flex-col transition-colors">
      <NetworkStatus />
      <AppHeader onOpenMobileMenu={() => setMobileMenuOpen(true)} />
      <main className="min-h-[calc(100vh-64px)] pb-[max(5rem,calc(4.5rem+env(safe-area-inset-bottom)))] md:pb-0">
        <Outlet />
      </main>
      <AppFooter />
      <GuestActionBar />
      <BottomNavigation />
      <MobileDrawer isOpen={mobileMenuOpen} onClose={() => setMobileMenuOpen(false)} />
      <NotificationToast />
      <PWAInstallPrompt />
      <AiAssistantModal />
      <CareSupportModal />
    </div>
  )
}

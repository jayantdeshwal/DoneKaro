import { lazy, Suspense } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { LanguageProvider } from './context/LanguageContext'
import { ThemeProvider } from './context/ThemeContext'
import { AuthProvider } from './context/AuthContext'
import { NotificationProvider } from './context/NotificationContext'
import { AiAssistantProvider } from './context/AiAssistantContext'
import { SupportProvider } from '@/features/support'
import Layout from './components/Layout'
import { useAuth } from './context/AuthContext'

// Lazy-loaded route components
const Home = lazy(() => import('./pages/Home'))
const Search = lazy(() => import('./pages/Search'))
const WorkerProfile = lazy(() => import('./pages/WorkerProfile'))
const Booking = lazy(() => import('./pages/Booking'))
const Bookings = lazy(() => import('./pages/Bookings'))
const Login = lazy(() => import('./pages/Login'))
const Register = lazy(() => import('./pages/Register'))
const WorkerRegistration = lazy(() => import('./pages/WorkerRegistration'))
const Profile = lazy(() => import('./pages/Profile'))
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'))
const Notifications = lazy(() => import('./pages/Notifications'))
const WorkerDashboard = lazy(() => import('./pages/WorkerDashboard'))
const WorkerReviews = lazy(() => import('./pages/WorkerReviews'))
const CategoryPage = lazy(() => import('./pages/CategoryPage'))
const AdminSupportPage = lazy(() =>
  import('./features/admin-support').then((m) => ({ default: m.AdminSupportPage }))
)

function PageLoader() {
  return (
    <div className="min-h-[50vh] flex items-center justify-center">
      <div className="w-8 h-8 rounded-full border-2 border-brand-500 border-t-transparent animate-spin" />
    </div>
  )
}

const lazyElement = (element: React.ReactNode) => (
  <Suspense fallback={<PageLoader />}>{element}</Suspense>
)

function AdminRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading, isAdmin } = useAuth()
  if (isLoading) {
    return <PageLoader />
  }
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }
  if (!isAdmin) {
    return <Navigate to="/" replace />
  }
  return <>{children}</>
}

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth()
  if (isLoading) {
    return <PageLoader />
  }
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }
  return <>{children}</>
}

function WorkerRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading, isWorker } = useAuth()
  if (isLoading) return <PageLoader />
  if (!isAuthenticated) return <Navigate to="/login?role=worker" replace />
  if (!isWorker) return <Navigate to="/profile" replace />
  return <>{children}</>
}

function GuestOrAuthRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth()
  const isGuestMode = typeof window !== 'undefined' && sessionStorage.getItem('kaamgar_guest_mode') === 'true'

  if (isLoading) {
    return <PageLoader />
  }

  if (isAuthenticated || isGuestMode) {
    return <>{children}</>
  }

  return <Navigate to="/login" replace />
}

function RootRoute() {
  const { isAuthenticated, isLoading } = useAuth()
  const isGuestMode = typeof window !== 'undefined' && sessionStorage.getItem('kaamgar_guest_mode') === 'true'

  if (isLoading) {
    return <PageLoader />
  }

  if (isAuthenticated || isGuestMode) {
    return <Home />
  }

  return <Navigate to="/login" replace />
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={lazyElement(<RootRoute />)} />
        <Route path="home" element={lazyElement(<GuestOrAuthRoute><Home /></GuestOrAuthRoute>)} />
        <Route path="search" element={lazyElement(<GuestOrAuthRoute><Search /></GuestOrAuthRoute>)} />
        <Route path="worker/:id" element={lazyElement(<GuestOrAuthRoute><WorkerProfile /></GuestOrAuthRoute>)} />
        <Route path="booking/:workerId" element={lazyElement(<ProtectedRoute><Booking /></ProtectedRoute>)} />
        <Route path="bookings" element={lazyElement(<ProtectedRoute><Bookings /></ProtectedRoute>)} />
        <Route path="my-bookings" element={<Navigate to="/bookings" replace />} />
        <Route path="auth" element={lazyElement(<Login />)} />
        <Route path="login" element={lazyElement(<Login />)} />
        <Route path="register" element={lazyElement(<Register />)} />
        <Route path="signup" element={<Navigate to="/register" replace />} />
        <Route path="register/worker" element={lazyElement(<WorkerRegistration />)} />
        <Route path="profile" element={lazyElement(<ProtectedRoute><Profile /></ProtectedRoute>)} />
        <Route path="categories" element={lazyElement(<GuestOrAuthRoute><CategoryPage /></GuestOrAuthRoute>)} />
        <Route path="category" element={<Navigate to="/categories" replace />} />
        <Route path="notifications" element={lazyElement(<ProtectedRoute><Notifications /></ProtectedRoute>)} />
        <Route path="alerts" element={lazyElement(<ProtectedRoute><Notifications /></ProtectedRoute>)} />
        <Route path="worker/dashboard" element={lazyElement(<ProtectedRoute><WorkerDashboard /></ProtectedRoute>)} />
        <Route path="worker/reviews" element={lazyElement(<WorkerRoute><WorkerReviews /></WorkerRoute>)} />
        <Route path="admin" element={lazyElement(<AdminRoute><AdminDashboard /></AdminRoute>)} />
        <Route path="admin/support" element={lazyElement(<AdminRoute><AdminSupportPage /></AdminRoute>)} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

function App() {
  return (
    <ThemeProvider>
      <LanguageProvider>
        <AuthProvider>
          <NotificationProvider>
            <AiAssistantProvider>
              <SupportProvider>
                <AppRoutes />
              </SupportProvider>
            </AiAssistantProvider>
          </NotificationProvider>
        </AuthProvider>
      </LanguageProvider>
    </ThemeProvider>
  )
}

export default App

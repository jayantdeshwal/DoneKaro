import { useState, useEffect, useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import { getSupabaseClient } from '@/lib/supabase'
import {
  fetchAdminWorkers,
  fetchAdminCustomers,
  fetchAdminNotifications,
  deleteProfilePermanently,
  fetchAdminTeam,
  createSubAdmin,
  demoteSubAdmin,
} from '@/services/admin'
import { getIdProofSignedUrl, getCustomerAddressProofSignedUrl } from '@/services/storage'
import { removePhoneFromRegisteredCache } from '@/services/authCheck'
import {
  markAllNotificationsRead as markAllNotificationsReadRpc,
  markNotificationRead as markNotificationReadRpc,
} from '@/services/notifications'
import type {
  AdminWorkerRow,
  AdminCustomerRow,
  AdminNotificationItem,
  AdminTeamMember,
  AdminBooking,
  AdminStats,
  AdminTabType,
  BookingStatus,
  ProfileToDelete,
  ReviewWorkerRpc,
} from '../types'
import { BOOKING_STATUS_OPTIONS } from '../constants'

export function useAdminData(isAdmin: boolean) {
  const [searchParams, setSearchParams] = useSearchParams()

  const tabParam = searchParams.get('tab') as AdminTabType | null

  const [activeTab, setActiveTab] = useState<AdminTabType>(
    tabParam && ['dashboard', 'overview', 'workers', 'customers', 'bookings', 'notifications', 'admins', 'management'].includes(tabParam)
      ? (tabParam === 'overview' ? 'dashboard' : tabParam)
      : 'dashboard'
  )

  // Notifications state
  const [adminNotifications, setAdminNotifications] = useState<AdminNotificationItem[]>([])
  const [isLoadingNotifications, setIsLoadingNotifications] = useState(true)
  const [notificationsError, setNotificationsError] = useState('')
  const [notificationFilter, setNotificationFilter] = useState<'all' | 'registrations' | 'documents' | 'unread'>('all')

  // Approval / Rejection action modal
  const [showActionModal, setShowActionModal] = useState(false)
  const [selectedWorkerForAction, setSelectedWorkerForAction] = useState<AdminWorkerRow | null>(null)
  const [actionType, setActionType] = useState<'approve' | 'reject'>('approve')
  const [rejectionReason, setRejectionReason] = useState('')
  const [isSubmittingReview, setIsSubmittingReview] = useState(false)

  // Inspection modals
  const [inspectWorker, setInspectWorker] = useState<AdminWorkerRow | null>(null)
  const [inspectCustomer, setInspectCustomer] = useState<AdminCustomerRow | null>(null)

  // Permanent Delete state
  const [profileToDelete, setProfileToDelete] = useState<ProfileToDelete | null>(null)
  const [isDeletingProfile, setIsDeletingProfile] = useState(false)
  const [deleteProfileError, setDeleteProfileError] = useState('')
  const [deleteSuccessMessage, setDeleteSuccessMessage] = useState('')

  // Data states
  const [allWorkers, setAllWorkers] = useState<AdminWorkerRow[]>([])
  const [isLoadingWorkers, setIsLoadingWorkers] = useState(true)
  const [workerError, setWorkerError] = useState('')

  const [customers, setCustomers] = useState<AdminCustomerRow[]>([])
  const [isLoadingCustomers, setIsLoadingCustomers] = useState(true)
  const [customerError, setCustomerError] = useState('')

  const [bookings, setBookings] = useState<AdminBooking[]>([])
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null)
  const [isLoadingBookings, setIsLoadingBookings] = useState(true)
  const [bookingError, setBookingError] = useState('')

  const [stats, setStats] = useState<AdminStats | null>(null)
  const [isLoadingStats, setIsLoadingStats] = useState(true)
  const [statsError, setStatsError] = useState('')

  // Administrator Team Management state
  const [adminTeam, setAdminTeam] = useState<AdminTeamMember[]>([])
  const [isLoadingAdminTeam, setIsLoadingAdminTeam] = useState(false)
  const [adminTeamError, setAdminTeamError] = useState('')
  const [showAddAdminModal, setShowAddAdminModal] = useState(false)
  const [newAdminFullName, setNewAdminFullName] = useState('')
  const [newAdminEmail, setNewAdminEmail] = useState('')
  const [newAdminPhone, setNewAdminPhone] = useState('')
  const [isSubmittingNewAdmin, setIsSubmittingNewAdmin] = useState(false)
  const [addAdminError, setAddAdminError] = useState('')
  const [addAdminSuccess, setAddAdminSuccess] = useState('')
  const [isDemotingAdmin, setIsDemotingAdmin] = useState(false)

  // Filter & Search states
  const [workerSearch, setWorkerSearch] = useState('')
  const [workerStatusFilter, setWorkerStatusFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all')
  const [customerSearch, setCustomerSearch] = useState('')
  const [bookingSearch, setBookingSearch] = useState('')
  const [bookingStatusFilter, setBookingStatusFilter] = useState<'all' | BookingStatus>('all')

  // Analytics Chart Interactivity
  const [hoveredTrendIdx, setHoveredTrendIdx] = useState<number | null>(null)

  // Document inspection state
  const [loadingSignedDoc, setLoadingSignedDoc] = useState(false)
  const [signedDocError, setSignedDocError] = useState('')

  // Sync tab and filter params from URL
  useEffect(() => {
    const raw = searchParams.get('tab') as AdminTabType | null
    const tab = raw === 'overview' ? 'dashboard' : raw
    const statusParam = searchParams.get('status')
    if (statusParam === 'pending' || statusParam === 'approved' || statusParam === 'rejected' || statusParam === 'all') {
      setWorkerStatusFilter(statusParam)
    } else if (tab === 'workers' && !statusParam) {
      setWorkerStatusFilter('all')
    }
    if (
      tab &&
      ['dashboard', 'workers', 'customers', 'bookings', 'notifications', 'admins', 'management'].includes(tab)
    ) {
      setActiveTab(tab)
    } else if (!tab || tab === 'dashboard') {
      setActiveTab('dashboard')
    }
  }, [searchParams])

  const handleViewIdDocument = async (path: string) => {
    setLoadingSignedDoc(true)
    setSignedDocError('')
    try {
      const signedUrl = await getIdProofSignedUrl(path, 3600)
      if (!signedUrl) {
        throw new Error('Unable to generate secure signed link for this document.')
      }
      window.open(signedUrl, '_blank', 'noopener,noreferrer')
    } catch (err) {
      setSignedDocError(err instanceof Error ? err.message : 'Failed to open document')
    } finally {
      setLoadingSignedDoc(false)
    }
  }

  // Customer document inspection state
  const [loadingSignedCustomerDoc, setLoadingSignedCustomerDoc] = useState(false)
  const [signedCustomerDocError, setSignedCustomerDocError] = useState('')

  const handleViewCustomerDocument = async (path: string) => {
    setLoadingSignedCustomerDoc(true)
    setSignedCustomerDocError('')
    try {
      const signedUrl = await getCustomerAddressProofSignedUrl(path, 3600)
      if (!signedUrl) {
        throw new Error('Unable to generate secure signed link for this customer document.')
      }
      window.open(signedUrl, '_blank', 'noopener,noreferrer')
    } catch (err) {
      setSignedCustomerDocError(err instanceof Error ? err.message : 'Failed to open customer document')
    } finally {
      setLoadingSignedCustomerDoc(false)
    }
  }

  const loadWorkersData = async () => {
    setIsLoadingWorkers(true)
    setWorkerError('')
    try {
      const data = await fetchAdminWorkers()
      setAllWorkers(data)
    } catch (err) {
      setWorkerError(err instanceof Error ? err.message : 'Unable to load workers')
      setAllWorkers([])
    } finally {
      setIsLoadingWorkers(false)
    }
  }

  const loadCustomersData = async () => {
    setIsLoadingCustomers(true)
    setCustomerError('')
    try {
      const data = await fetchAdminCustomers()
      setCustomers(data)
    } catch (err) {
      setCustomerError(err instanceof Error ? err.message : 'Unable to load customers')
      setCustomers([])
    } finally {
      setIsLoadingCustomers(false)
    }
  }

  const loadBookings = async () => {
    setIsLoadingBookings(true)
    setBookingError('')

    try {
      const supabase = getSupabaseClient()
      const { data, error } = await supabase
        .from('bookings')
        .select('id, customer_id, worker_id, category_id, status, scheduled_at, created_at')
        .order('created_at', { ascending: false })

      if (error) throw error

      const rows = (data ?? []) as Omit<AdminBooking, 'customerName' | 'workerName'>[]
      const paymentRows = rows.length
        ? await supabase
            .from('booking_payments')
            .select('booking_id, amount, currency, status, payment_method, paid_at')
            .in('booking_id', rows.map(row => row.id))
        : { data: [], error: null }
      const receiptRows = rows.length
        ? await supabase
            .from('booking_receipts')
            .select('booking_id, receipt_number')
            .in('booking_id', rows.map(row => row.id))
        : { data: [], error: null }
      const profileIds = [...new Set(rows.flatMap(row => [row.customer_id, row.worker_id]))]
      const profileRows = profileIds.length
        ? await supabase.from('profiles').select('id, full_name').in('id', profileIds)
        : { data: [], error: null }

      const payments = new Map((paymentRows.data ?? []).map((payment: any) => [payment.booking_id, payment]))
      const receipts = new Map((receiptRows.data ?? []).map((receipt: any) => [receipt.booking_id, receipt]))
      const names = new Map((profileRows.data ?? []).map((profile: any) => [profile.id, profile.full_name || 'Name unavailable']))
      setBookings(
        rows.map(row => ({
          ...row,
          payment_amount: payments.get(row.id)?.amount == null ? null : Number(payments.get(row.id).amount),
          payment_currency: payments.get(row.id)?.currency ?? null,
          payment_status: payments.get(row.id)?.status ?? null,
          payment_method: payments.get(row.id)?.payment_method ?? null,
          paid_at: payments.get(row.id)?.paid_at ?? null,
          receipt_number: receipts.get(row.id)?.receipt_number ?? null,
          payment_details_unavailable: Boolean(paymentRows.error),
          receipt_details_unavailable: Boolean(receiptRows.error),
          profile_details_unavailable: Boolean(profileRows.error),
          customerName: profileRows.error ? 'Name unavailable' : names.get(row.customer_id) || 'Name unavailable',
          workerName: profileRows.error ? 'Name unavailable' : names.get(row.worker_id) || 'Name unavailable',
        }))
      )
    } catch (loadError) {
      setBookingError(loadError instanceof Error ? loadError.message : 'Unable to load bookings')
      setBookings([])
    } finally {
      setIsLoadingBookings(false)
    }
  }

  const loadStats = async () => {
    setIsLoadingStats(true)
    setStatsError('')

    try {
      const supabase = getSupabaseClient()
      const [workersResult, customersResult, bookingsResult, pendingResult, ...statusResults] = await Promise.all([
        supabase.from('worker_profiles').select('id', { count: 'exact', head: true }),
        supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('role', 'customer'),
        supabase.from('bookings').select('id', { count: 'exact', head: true }),
        supabase.from('worker_profiles').select('id', { count: 'exact', head: true }).eq('approval_status', 'pending'),
        ...BOOKING_STATUS_OPTIONS.map(status => supabase.from('bookings').select('id', { count: 'exact', head: true }).eq('status', status.key)),
      ])

      const allResults = [workersResult, customersResult, bookingsResult, pendingResult, ...statusResults]
      const firstError = allResults.find(result => result.error)?.error
      const bookingStatusCounts = Object.fromEntries(
        BOOKING_STATUS_OPTIONS.map((status, index) => [
          status.key,
          statusResults[index]?.error ? null : statusResults[index]?.count ?? 0,
        ])
      ) as Record<BookingStatus, number | null>

      setStats({
        workers: workersResult.error ? null : workersResult.count ?? 0,
        customers: customersResult.error ? null : customersResult.count ?? 0,
        bookings: bookingsResult.error ? null : bookingsResult.count ?? 0,
        pendingApprovals: pendingResult.error ? null : pendingResult.count ?? 0,
        bookingStatusCounts,
      })
      if (firstError) setStatsError(firstError.message)
    } catch (loadError) {
      setStatsError(loadError instanceof Error ? loadError.message : 'Unable to load dashboard totals')
      setStats(null)
    } finally {
      setIsLoadingStats(false)
    }
  }

  const loadNotificationsData = async () => {
    setIsLoadingNotifications(true)
    setNotificationsError('')
    try {
      const data = await fetchAdminNotifications()
      setAdminNotifications(data)
    } catch (err) {
      setNotificationsError(err instanceof Error ? err.message : 'Unable to load notifications')
      setAdminNotifications([])
    } finally {
      setIsLoadingNotifications(false)
    }
  }

  const markNotificationRead = async (id: string) => {
    try {
      await markNotificationReadRpc(id)

      setAdminNotifications(prev =>
        prev.map(n => (n.id === id ? { ...n, read_at: new Date().toISOString() } : n))
      )
    } catch (err) {
      console.warn('Error marking notification read:', err)
    }
  }

  const markAllNotificationsRead = async () => {
    try {
      const unreadIds = adminNotifications.filter(n => !n.read_at).map(n => n.id)
      if (unreadIds.length === 0) return

      await markAllNotificationsReadRpc()

      setAdminNotifications(prev =>
        prev.map(n => ({ ...n, read_at: n.read_at || new Date().toISOString() }))
      )
    } catch (err) {
      console.warn('Error marking all notifications read:', err)
    }
  }

  const handleInspectWorkerFromNotification = (notif: AdminNotificationItem) => {
    const foundWorker = allWorkers.find(w => {
      if (!w.name) return false
      return (
        notif.body.toLowerCase().includes(w.name.toLowerCase()) ||
        notif.title.toLowerCase().includes(w.name.toLowerCase())
      )
    })

    if (foundWorker) {
      setInspectWorker(foundWorker)
    } else {
      setWorkerStatusFilter('pending')
      setActiveTab('workers')
      setSearchParams({ tab: 'workers' })
    }
  }

  const handleExecutePermanentDelete = async () => {
    if (!profileToDelete) return
    setIsDeletingProfile(true)
    setDeleteProfileError('')
    try {
      await deleteProfilePermanently(profileToDelete.id)
      if (profileToDelete.phone) {
        removePhoneFromRegisteredCache(profileToDelete.phone)
      }
      const roleLabel = profileToDelete.role === 'worker' ? 'Worker' : 'Customer'
      setDeleteSuccessMessage(`Successfully deleted ${roleLabel} "${profileToDelete.name}" permanently.`)
      setTimeout(() => setDeleteSuccessMessage(''), 5000)

      if (inspectWorker?.id === profileToDelete.id) setInspectWorker(null)
      if (inspectCustomer?.id === profileToDelete.id) setInspectCustomer(null)
      setProfileToDelete(null)

      if (profileToDelete.role === 'worker') {
        await loadWorkersData()
      } else {
        await loadCustomersData()
      }
      loadStats()
      loadNotificationsData()
    } catch (err) {
      setDeleteProfileError(err instanceof Error ? err.message : 'Failed to permanently delete profile.')
    } finally {
      setIsDeletingProfile(false)
    }
  }

  const loadAdminTeamData = async () => {
    setIsLoadingAdminTeam(true)
    setAdminTeamError('')
    try {
      const data = await fetchAdminTeam()
      setAdminTeam(data)
    } catch (err) {
      setAdminTeamError(err instanceof Error ? err.message : 'Unable to load administrator team')
      setAdminTeam([])
    } finally {
      setIsLoadingAdminTeam(false)
    }
  }

  const handleCreateAdmin = async (e: React.FormEvent) => {
    e.preventDefault()
    setAddAdminError('')
    setAddAdminSuccess('')

    const trimmedName = newAdminFullName.trim()
    const trimmedEmail = newAdminEmail.trim()
    const trimmedPhone = newAdminPhone.replace(/\D/g, '')

    if (!trimmedName) {
      setAddAdminError('Please provide the administrator full name.')
      return
    }
    if (!trimmedEmail || !/^\S+@\S+\.\S+$/.test(trimmedEmail)) {
      setAddAdminError('Please provide a valid administrator email address.')
      return
    }
    if (trimmedPhone.length !== 10) {
      setAddAdminError('A valid 10-digit mobile number is mandatory for OTP sign-in. Administrators authenticate passwordlessly via MSG91 OTP.')
      return
    }

    setIsSubmittingNewAdmin(true)
    try {
      await createSubAdmin({
        email: trimmedEmail,
        fullName: trimmedName,
        phone: trimmedPhone,
      })
      setAddAdminSuccess(`Administrator "${trimmedName}" provisioned successfully!`)
      setNewAdminFullName('')
      setNewAdminEmail('')
      setNewAdminPhone('')
      await loadAdminTeamData()
      setTimeout(() => {
        setShowAddAdminModal(false)
        setAddAdminSuccess('')
      }, 2000)
    } catch (err) {
      setAddAdminError(err instanceof Error ? err.message : 'Failed to provision administrator')
    } finally {
      setIsSubmittingNewAdmin(false)
    }
  }

  const handleDemoteAdmin = async (adminMember: AdminTeamMember) => {
    if (!window.confirm(`Are you sure you want to demote Sub Administrator "${adminMember.full_name}" to a regular customer?`)) {
      return
    }
    setIsDemotingAdmin(true)
    try {
      await demoteSubAdmin(adminMember.id)
      await loadAdminTeamData()
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to demote administrator.')
    } finally {
      setIsDemotingAdmin(false)
    }
  }

  const refreshAll = async () => {
    await Promise.all([
      loadWorkersData(),
      loadCustomersData(),
      loadBookings(),
      loadStats(),
      loadNotificationsData(),
      loadAdminTeamData(),
    ])
  }

  // Realtime subscriptions
  useEffect(() => {
    if (!isAdmin) return

    void refreshAll()

    const supabase = getSupabaseClient()
    const channel = supabase
      .channel('admin-dashboard-realtime-sync')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'worker_profiles' },
        () => {
          void loadWorkersData()
          void loadStats()
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'profiles' },
        () => {
          void loadCustomersData()
          void loadStats()
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'bookings' },
        () => {
          void loadBookings()
          void loadStats()
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'notifications' },
        () => {
          void loadNotificationsData()
        }
      )
      .subscribe()

    return () => {
      void supabase.removeChannel(channel)
    }
  }, [isAdmin])

  // Live sync of worker profile picture & document if updated in background
  useEffect(() => {
    if (!inspectWorker?.id) return
    const fetchFreshMedia = async () => {
      try {
        const supabase = getSupabaseClient()
        const [pRes, wpRes] = await Promise.all([
          (supabase.from('profiles') as any).select('avatar_url').eq('id', inspectWorker.id).maybeSingle(),
          (supabase.from('worker_profiles') as any).select('id_proof_url').eq('id', inspectWorker.id).maybeSingle(),
        ])
        const freshAvatar = pRes?.data?.avatar_url
        const freshIdProof = wpRes?.data?.id_proof_url
        if (freshAvatar !== inspectWorker.avatar_url || freshIdProof !== inspectWorker.id_proof_url) {
          setInspectWorker(prev => (prev ? {
            ...prev,
            avatar_url: freshAvatar !== undefined ? freshAvatar : prev.avatar_url,
            id_proof_url: freshIdProof !== undefined ? freshIdProof : prev.id_proof_url,
          } : null))
        }
      } catch (err) {
        console.warn('Silent live sync background check failed:', err)
      }
    }
    fetchFreshMedia()
  }, [inspectWorker?.id])

  const handleOpenActionModal = (worker: AdminWorkerRow, type: 'approve' | 'reject') => {
    setSelectedWorkerForAction(worker)
    setActionType(type)
    setRejectionReason('')
    setShowActionModal(true)
  }

  const confirmAction = async () => {
    if (!selectedWorkerForAction) return

    setIsSubmittingReview(true)
    setWorkerError('')

    try {
      const supabase = getSupabaseClient() as unknown as ReviewWorkerRpc
      const { error } = await supabase.rpc('review_worker', {
        target_worker_id: selectedWorkerForAction.id,
        decision: actionType === 'approve' ? 'approved' : 'rejected',
        decision_reason: actionType === 'reject' ? rejectionReason.trim() || 'Registration requires additional review.' : undefined,
      })

      if (error) throw new Error(error.message)

      setShowActionModal(false)
      setSelectedWorkerForAction(null)
      if (inspectWorker?.id === selectedWorkerForAction.id) {
        setInspectWorker(null)
      }
      await refreshAll()
    } catch (reviewError) {
      setWorkerError(reviewError instanceof Error ? reviewError.message : 'Unable to review worker')
    } finally {
      setIsSubmittingReview(false)
    }
  }

  // Computed lists
  const unreadNotifsCount = useMemo(
    () => adminNotifications.filter(n => !n.read_at).length,
    [adminNotifications]
  )

  const notifCounts = useMemo(() => {
    return {
      all: adminNotifications.length,
      registrations: adminNotifications.filter(
        n =>
          n.notification_type === 'worker_registration_submitted' ||
          n.notification_type.toLowerCase().includes('registration') ||
          n.title.toLowerCase().includes('registration')
      ).length,
      documents: adminNotifications.filter(
        n =>
          n.notification_type === 'worker_document_uploaded' ||
          n.notification_type.toLowerCase().includes('document') ||
          n.title.toLowerCase().includes('document') ||
          n.title.toLowerCase().includes('id proof')
      ).length,
      unread: unreadNotifsCount,
    }
  }, [adminNotifications, unreadNotifsCount])

  const filteredNotifications = useMemo(() => {
    return adminNotifications.filter(n => {
      if (notificationFilter === 'unread') return !n.read_at
      if (notificationFilter === 'registrations') {
        return (
          n.notification_type === 'worker_registration_submitted' ||
          n.notification_type.toLowerCase().includes('registration') ||
          n.title.toLowerCase().includes('registration')
        )
      }
      if (notificationFilter === 'documents') {
        return (
          n.notification_type === 'worker_document_uploaded' ||
          n.notification_type.toLowerCase().includes('document') ||
          n.title.toLowerCase().includes('document') ||
          n.title.toLowerCase().includes('id proof')
        )
      }
      return true
    })
  }, [adminNotifications, notificationFilter])

  const pendingWorkers = useMemo(
    () => allWorkers.filter(w => w.approval_status === 'pending'),
    [allWorkers]
  )

  const filteredWorkers = useMemo(() => {
    return allWorkers.filter(w => {
      const matchesStatus =
        workerStatusFilter === 'all' || w.approval_status === workerStatusFilter
      const q = workerSearch.toLowerCase().trim()
      const matchesSearch =
        !q ||
        w.name.toLowerCase().includes(q) ||
        w.phone.toLowerCase().includes(q) ||
        w.categories.some(c => c.toLowerCase().includes(q))
      return matchesStatus && matchesSearch
    })
  }, [allWorkers, workerStatusFilter, workerSearch])

  const filteredCustomers = useMemo(() => {
    const q = customerSearch.toLowerCase().trim()
    if (!q) return customers
    return customers.filter(
      c => c.name.toLowerCase().includes(q) || c.phone.toLowerCase().includes(q)
    )
  }, [customers, customerSearch])

  const filteredBookings = useMemo(() => {
    return bookings.filter(b => {
      const matchesStatus =
        bookingStatusFilter === 'all' || b.status === bookingStatusFilter
      const q = bookingSearch.toLowerCase().trim()
      const matchesSearch =
        !q ||
        b.id.toLowerCase().includes(q) ||
        b.customerName.toLowerCase().includes(q) ||
        b.workerName.toLowerCase().includes(q) ||
        b.category_id.toLowerCase().includes(q) ||
        b.status.toLowerCase().includes(q)
      return matchesStatus && matchesSearch
    })
  }, [bookings, bookingStatusFilter, bookingSearch])

  // Analytics: 14-Day Demand Curve data
  const bookingTrendsData = useMemo(() => {
    const days: { dateStr: string; label: string; count: number }[] = []
    const now = new Date()

    for (let i = 13; i >= 0; i--) {
      const d = new Date()
      d.setDate(now.getDate() - i)
      const yyyy = d.getFullYear()
      const mm = String(d.getMonth() + 1).padStart(2, '0')
      const dd = String(d.getDate()).padStart(2, '0')
      const dateKey = `${yyyy}-${mm}-${dd}`
      const label = d.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })

      const count = bookings.filter(b => b.created_at && b.created_at.startsWith(dateKey)).length
      days.push({ dateStr: dateKey, label, count })
    }

    const realCountsSum = days.reduce((acc, curr) => acc + curr.count, 0)
    const maxCount = Math.max(...days.map(d => d.count), 1)
    return {
      days,
      maxCount,
      totalCount: realCountsSum,
      isSimulated: false,
    }
  }, [bookings])

  // Analytics: Category Distribution
  const categoryDistribution = useMemo(() => {
    const map = new Map<string, number>()
    allWorkers.forEach(w => {
      w.categories.forEach(c => {
        const clean = c.trim()
        if (clean) map.set(clean, (map.get(clean) || 0) + 1)
      })
    })
    bookings.forEach(b => {
      if (b.category_id) {
        const clean = b.category_id.trim()
        if (clean) map.set(clean, (map.get(clean) || 0) + 1)
      }
    })

    const sorted = Array.from(map.entries())
      .map(([category, count]) => ({ category, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5)

    const colors = ['#F59E0B', '#10B981', '#6366F1', '#38BDF8', '#EC4899']

    if (sorted.length === 0) {
      return []
    }

    const total = sorted.reduce((acc, curr) => acc + curr.count, 0) || 1
    return sorted.map((item, idx) => ({
      ...item,
      color: colors[idx % colors.length],
      pct: Math.round((item.count / total) * 100),
    }))
  }, [allWorkers, bookings])

  // Analytics: Locality Pincode Coverage
  const localityDistribution = useMemo(() => {
    const map = new Map<string, number>()
    allWorkers.forEach(w => {
      w.areas.forEach(a => {
        const clean = a.trim()
        if (clean) map.set(clean, (map.get(clean) || 0) + 1)
      })
    })

    const sorted = Array.from(map.entries())
      .map(([locality, count]) => ({ locality, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5)

    if (sorted.length === 0) {
      return []
    }

    const maxVal = Math.max(...sorted.map(s => s.count), 1)
    return sorted.map(s => ({
      locality: s.locality.length === 6 ? `${s.locality} (MZN)` : s.locality,
      count: s.count,
      percentage: Math.round((s.count / maxVal) * 100),
    }))
  }, [allWorkers])

  return {
    activeTab,
    setActiveTab,
    searchParams,
    setSearchParams,

    // Data lists & loading states
    allWorkers,
    isLoadingWorkers,
    workerError,
    setWorkerError,
    loadWorkersData,

    customers,
    isLoadingCustomers,
    customerError,
    setCustomerError,
    loadCustomersData,

    bookings,
    isLoadingBookings,
    bookingError,
    setBookingError,
    loadBookings,
    selectedJobId,
    setSelectedJobId,

    stats,
    isLoadingStats,
    statsError,
    setStatsError,
    loadStats,

    adminNotifications,
    isLoadingNotifications,
    notificationsError,
    loadNotificationsData,
    markNotificationRead,
    markAllNotificationsRead,
    handleInspectWorkerFromNotification,

    adminTeam,
    isLoadingAdminTeam,
    adminTeamError,
    loadAdminTeamData,
    showAddAdminModal,
    setShowAddAdminModal,
    newAdminFullName,
    setNewAdminFullName,
    newAdminEmail,
    setNewAdminEmail,
    newAdminPhone,
    setNewAdminPhone,
    isSubmittingNewAdmin,
    addAdminError,
    setAddAdminError,
    addAdminSuccess,
    setAddAdminSuccess,
    handleCreateAdmin,
    isDemotingAdmin,
    handleDemoteAdmin,

    // Filtering & Searching
    workerSearch,
    setWorkerSearch,
    workerStatusFilter,
    setWorkerStatusFilter,
    filteredWorkers,
    pendingWorkers,

    customerSearch,
    setCustomerSearch,
    filteredCustomers,

    bookingSearch,
    setBookingSearch,
    bookingStatusFilter,
    setBookingStatusFilter,
    filteredBookings,

    notificationFilter,
    setNotificationFilter,
    filteredNotifications,
    notifCounts,
    unreadNotifsCount,

    // Analytics
    bookingTrendsData,
    hoveredTrendIdx,
    setHoveredTrendIdx,
    categoryDistribution,
    localityDistribution,

    // Actions & Modals
    inspectWorker,
    setInspectWorker,
    inspectCustomer,
    setInspectCustomer,
    showActionModal,
    setShowActionModal,
    selectedWorkerForAction,
    setSelectedWorkerForAction,
    actionType,
    rejectionReason,
    setRejectionReason,
    isSubmittingReview,
    handleOpenActionModal,
    confirmAction,

    profileToDelete,
    setProfileToDelete,
    isDeletingProfile,
    deleteProfileError,
    setDeleteProfileError,
    deleteSuccessMessage,
    setDeleteSuccessMessage,
    handleExecutePermanentDelete,

    loadingSignedDoc,
    signedDocError,
    handleViewIdDocument,

    loadingSignedCustomerDoc,
    signedCustomerDocError,
    handleViewCustomerDocument,

    refreshAll,
  }
}

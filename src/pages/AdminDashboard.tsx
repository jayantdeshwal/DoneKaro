import { useAuth } from '../context/AuthContext'
import { Card } from '@kaamgar/ui'
import { Shield } from 'lucide-react'
import { AdminSupportPage } from '@/features/admin-support'
import {
  useAdminData,
  AdminHeaderBanner,
  AdminStatsCards,
  AdminTabBar,
  AdminOverviewTab,
  AdminWorkersTab,
  AdminCustomersTab,
  AdminBookingsTab,
  AdminAlertsTab,
  AdminTeamTab,
  WorkerDossierModal,
  CustomerDossierModal,
  ReviewWorkerModal,
  PermanentDeleteModal,
  AddAdminModal,
  AdminJobDetailsModal,
} from '@/features/admin'

export default function AdminDashboard() {
  const { user, isAdmin, isSuperAdmin } = useAuth()
  const admin = useAdminData(isAdmin)

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-semantic-bg-primary">
        <Card className="w-full max-w-md p-8 text-center bg-surface-100 border border-semantic-border-light">
          <Shield className="w-16 h-16 mx-auto text-semantic-text-tertiary mb-4" />
          <h2 className="text-xl font-semibold text-semantic-text-primary mb-2">Access Denied</h2>
          <p className="text-semantic-text-secondary">You need admin privileges to view this page</p>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-semantic-bg-primary text-semantic-text-primary pb-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        {/* Top Executive Header Banner */}
        <AdminHeaderBanner
          user={user}
          isSuperAdmin={isSuperAdmin}
          activeTab={admin.activeTab}
          setActiveTab={admin.setActiveTab}
          setSearchParams={admin.setSearchParams}
          refreshAll={admin.refreshAll}
          isLoading={admin.isLoadingWorkers || admin.isLoadingBookings || admin.isLoadingNotifications}
          workerError={admin.workerError}
          setWorkerError={admin.setWorkerError}
          customerError={admin.customerError}
          setCustomerError={admin.setCustomerError}
          bookingError={admin.bookingError}
          setBookingError={admin.setBookingError}
          statsError={admin.statsError}
          setStatsError={admin.setStatsError}
          deleteSuccessMessage={admin.deleteSuccessMessage}
          setDeleteSuccessMessage={admin.setDeleteSuccessMessage}
        />

        {/* Top 4 Actionable Stat Cards */}
        <AdminStatsCards
          stats={admin.stats}
          isLoadingStats={admin.isLoadingStats}
          pendingWorkers={admin.pendingWorkers}
          activeTab={admin.activeTab}
          setActiveTab={admin.setActiveTab}
          setWorkerStatusFilter={admin.setWorkerStatusFilter}
          setSearchParams={admin.setSearchParams}
        />

        {/* Tab Navigation Strip */}
        <AdminTabBar
          activeTab={admin.activeTab}
          setActiveTab={admin.setActiveTab}
          setWorkerStatusFilter={admin.setWorkerStatusFilter}
          setSearchParams={admin.setSearchParams}
          pendingWorkers={admin.pendingWorkers}
          unreadNotifsCount={admin.unreadNotifsCount}
          adminTeam={admin.adminTeam}
        />

        {/* Tab 1: Dashboard Overview */}
        {(admin.activeTab === 'dashboard' || admin.activeTab === 'overview') && (
          <AdminOverviewTab
            bookingTrendsData={admin.bookingTrendsData}
            hoveredTrendIdx={admin.hoveredTrendIdx}
            setHoveredTrendIdx={admin.setHoveredTrendIdx}
            categoryDistribution={admin.categoryDistribution}
            localityDistribution={admin.localityDistribution}
            pendingWorkers={admin.pendingWorkers}
            isLoadingWorkers={admin.isLoadingWorkers}
            setInspectWorker={admin.setInspectWorker}
            handleOpenActionModal={admin.handleOpenActionModal}
            bookings={admin.bookings}
            isLoadingBookings={admin.isLoadingBookings}
            setActiveTab={admin.setActiveTab}
            setWorkerStatusFilter={admin.setWorkerStatusFilter}
            setSearchParams={admin.setSearchParams}
          />
        )}

        {/* Tab 2: Workers */}
        {admin.activeTab === 'workers' && (
          <AdminWorkersTab
            allWorkers={admin.allWorkers}
            filteredWorkers={admin.filteredWorkers}
            pendingWorkers={admin.pendingWorkers}
            isLoadingWorkers={admin.isLoadingWorkers}
            workerStatusFilter={admin.workerStatusFilter}
            setWorkerStatusFilter={admin.setWorkerStatusFilter}
            workerSearch={admin.workerSearch}
            setWorkerSearch={admin.setWorkerSearch}
            loadWorkersData={admin.loadWorkersData}
            setInspectWorker={admin.setInspectWorker}
            handleOpenActionModal={admin.handleOpenActionModal}
            setProfileToDelete={admin.setProfileToDelete}
          />
        )}

        {/* Tab 3: Customers */}
        {admin.activeTab === 'customers' && (
          <AdminCustomersTab
            customers={admin.customers}
            filteredCustomers={admin.filteredCustomers}
            isLoadingCustomers={admin.isLoadingCustomers}
            customerSearch={admin.customerSearch}
            setCustomerSearch={admin.setCustomerSearch}
            loadCustomersData={admin.loadCustomersData}
            setInspectCustomer={admin.setInspectCustomer}
            setProfileToDelete={admin.setProfileToDelete}
          />
        )}

        {/* Tab 4: Bookings */}
        {admin.activeTab === 'bookings' && (
          <AdminBookingsTab
            bookings={admin.bookings}
            filteredBookings={admin.filteredBookings}
            isLoadingBookings={admin.isLoadingBookings}
            bookingStatusFilter={admin.bookingStatusFilter}
            setBookingStatusFilter={admin.setBookingStatusFilter}
            bookingSearch={admin.bookingSearch}
            setBookingSearch={admin.setBookingSearch}
            stats={admin.stats}
            loadBookings={admin.loadBookings}
            setSelectedJobId={admin.setSelectedJobId}
          />
        )}

        {/* Tab 5: Alerts */}
        {admin.activeTab === 'notifications' && (
          <AdminAlertsTab
            filteredNotifications={admin.filteredNotifications}
            isLoadingNotifications={admin.isLoadingNotifications}
            notificationFilter={admin.notificationFilter}
            setNotificationFilter={admin.setNotificationFilter}
            notifCounts={admin.notifCounts}
            unreadNotifsCount={admin.unreadNotifsCount}
            loadNotificationsData={admin.loadNotificationsData}
            markNotificationRead={admin.markNotificationRead}
            markAllNotificationsRead={admin.markAllNotificationsRead}
            handleInspectWorkerFromNotification={admin.handleInspectWorkerFromNotification}
          />
        )}

        {/* Tab 6: Administrators */}
        {admin.activeTab === 'admins' && (
          <AdminTeamTab
            adminTeam={admin.adminTeam}
            isLoadingAdminTeam={admin.isLoadingAdminTeam}
            adminTeamError={admin.adminTeamError}
            loadAdminTeamData={admin.loadAdminTeamData}
            isSuperAdmin={isSuperAdmin}
            currentUser={user}
            setShowAddAdminModal={admin.setShowAddAdminModal}
            setAddAdminError={admin.setAddAdminError}
            setAddAdminSuccess={admin.setAddAdminSuccess}
            handleDemoteAdmin={admin.handleDemoteAdmin}
            isDemotingAdmin={admin.isDemotingAdmin}
          />
        )}

        {/* Tab 7: Management (Complaints & Suggestions Oversight) */}
        {admin.activeTab === 'management' && (
          <div className="pt-2">
            <AdminSupportPage embedded />
          </div>
        )}
      </div>

      {/* Worker Dossier Inspection Modal */}
      <WorkerDossierModal
        inspectWorker={admin.inspectWorker}
        onClose={() => admin.setInspectWorker(null)}
        handleViewIdDocument={admin.handleViewIdDocument}
        loadingSignedDoc={admin.loadingSignedDoc}
        signedDocError={admin.signedDocError}
        setProfileToDelete={admin.setProfileToDelete}
        handleOpenActionModal={admin.handleOpenActionModal}
      />

      {/* Customer Dossier Inspection Modal */}
      <CustomerDossierModal
        inspectCustomer={admin.inspectCustomer}
        onClose={() => admin.setInspectCustomer(null)}
        bookings={admin.bookings}
        setProfileToDelete={admin.setProfileToDelete}
        handleViewCustomerDocument={admin.handleViewCustomerDocument}
        loadingSignedDoc={admin.loadingSignedCustomerDoc}
        signedDocError={admin.signedCustomerDocError}
      />

      {/* Approve / Reject Action Confirmation Modal */}
      <ReviewWorkerModal
        showActionModal={admin.showActionModal}
        onClose={() => {
          admin.setShowActionModal(false)
          admin.setSelectedWorkerForAction(null)
        }}
        selectedWorkerForAction={admin.selectedWorkerForAction}
        actionType={admin.actionType}
        rejectionReason={admin.rejectionReason}
        setRejectionReason={admin.setRejectionReason}
        confirmAction={admin.confirmAction}
        isSubmittingReview={admin.isSubmittingReview}
      />

      {/* Permanent Delete Confirmation Modal */}
      <PermanentDeleteModal
        profileToDelete={admin.profileToDelete}
        onClose={() => {
          admin.setProfileToDelete(null)
          admin.setDeleteProfileError('')
        }}
        isDeletingProfile={admin.isDeletingProfile}
        deleteProfileError={admin.deleteProfileError}
        handleExecutePermanentDelete={admin.handleExecutePermanentDelete}
      />

      {/* Add Administrator Modal */}
      <AddAdminModal
        showAddAdminModal={admin.showAddAdminModal}
        onClose={() => {
          admin.setShowAddAdminModal(false)
          admin.setAddAdminError('')
          admin.setAddAdminSuccess('')
        }}
        handleCreateAdmin={admin.handleCreateAdmin}
        newAdminFullName={admin.newAdminFullName}
        setNewAdminFullName={admin.setNewAdminFullName}
        newAdminEmail={admin.newAdminEmail}
        setNewAdminEmail={admin.setNewAdminEmail}
        newAdminPhone={admin.newAdminPhone}
        setNewAdminPhone={admin.setNewAdminPhone}
        isSubmittingNewAdmin={admin.isSubmittingNewAdmin}
        addAdminError={admin.addAdminError}
        addAdminSuccess={admin.addAdminSuccess}
      />

      {/* Read-Only Admin Job 360 Details */}
      {admin.selectedJobId && (
        <AdminJobDetailsModal
          bookingId={admin.selectedJobId}
          onClose={() => admin.setSelectedJobId(null)}
        />
      )}
    </div>
  )
}

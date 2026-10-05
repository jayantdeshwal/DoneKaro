import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { useLanguage } from '@/context/LanguageContext'
import { useAiAssistant } from '@/features/ai-support'
import { useSupport } from '@/features/support'
import { useWorkerAvailability, WorkerProfileRow } from '@/features/worker'
import {
  useProfileData,
  ProfileHeader,
  ProfileQuickActions,
  ProfileMenuList,
  EditProfileModal,
  ServiceLocalitiesModal,
  EmailUpdateModal,
  LogoutConfirmModal,
} from '@/features/profile'

export default function Profile() {
  const navigate = useNavigate()
  const { user, updateUser, updateEmail, logout, isWorker, isAdmin, isLoading: authLoading } = useAuth()
  const { language, setLanguage, toggleLanguage } = useLanguage()
  const { openAssistant } = useAiAssistant()
  const { openSupport } = useSupport()

  // Modal open states
  const [editMode, setEditMode] = useState(false)
  const [showLogoutModal, setShowLogoutModal] = useState(false)
  const [showAddressModal, setShowAddressModal] = useState(false)
  const [showEmailModal, setShowEmailModal] = useState(false)

  // Profile data hook
  const {
    formData,
    setFormData,
    workerDetails,
    setWorkerDetails,
    isLoadingProfile,
    isSaving,
    saveSuccessMsg,
    setSaveSuccessMsg,
    saveErrorMsg,
    setSaveErrorMsg,
    avatarInputRef,
    isUploadingAvatar,
    avatarUploadError,
    idProofInputRef,
    isUploadingIdProof,
    handleAvatarFileSelect,
    handleIdProofFileSelect,
    handleSaveProfile,
  } = useProfileData({
    user,
    isWorker,
    language,
    setLanguage,
    updateUser,
  })

  // Synchronize worker profile row with existing worker availability hook
  const [workerProfileRow, setWorkerProfileRow] = useState<WorkerProfileRow | null>(null)

  useEffect(() => {
    if (workerDetails) {
      setWorkerProfileRow({
        bio: workerDetails.bio,
        experience_years: workerDetails.experience_years,
        approval_status: workerDetails.approval_status,
        is_available: workerDetails.is_available,
        rejection_reason: workerDetails.rejection_reason,
        rating: workerDetails.rating,
        review_count: workerDetails.review_count,
        service_areas: workerDetails.areas,
      })
    } else {
      setWorkerProfileRow(null)
    }
  }, [workerDetails])

  const { handleToggleAvailability } = useWorkerAvailability({
    profile: workerProfileRow,
    setProfile: (updater) => {
      setWorkerProfileRow((prev) => {
        const next = typeof updater === 'function' ? updater(prev) : updater
        if (next && workerDetails) {
          setWorkerDetails((wd) => wd ? { ...wd, is_available: next.is_available } : null)
          setFormData((fd) => ({ ...fd, is_available: next.is_available }))
          setSaveSuccessMsg(
            next.is_available
              ? (language === 'hi' ? 'अब आप काम के लिए उपलब्ध हैं' : 'You are now marked as Available for jobs')
              : (language === 'hi' ? 'अब आप ऑफ़लाइन हैं' : 'You are now marked as Offline')
          )
          setTimeout(() => setSaveSuccessMsg(''), 3500)
        }
        return next
      })
    },
    onError: (err) => {
      setSaveErrorMsg(err)
      setTimeout(() => setSaveErrorMsg(''), 4000)
    },
  })

  if (authLoading || isLoadingProfile) {
    return (
      <div className="min-h-screen bg-semantic-bg-primary flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-500" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-semantic-bg-primary pb-24 text-semantic-text-primary">
      <div className="max-w-xl mx-auto px-4 sm:px-6 pt-5">
        {/* Top Header & Identity Card */}
        <ProfileHeader
          name={formData.name}
          phone={formData.phone}
          isWorker={isWorker}
          isAdmin={isAdmin}
          saveSuccessMsg={saveSuccessMsg}
          saveErrorMsg={saveErrorMsg}
          onBack={() => navigate(-1)}
          onEditClick={() => setEditMode(true)}
        />

        {/* Role-Specific Quick Action Cards */}
        <ProfileQuickActions
          isAdmin={isAdmin}
          isWorker={isWorker}
          isAvailable={workerDetails?.is_available}
          language={language}
          onNavigate={navigate}
          onToggleAvailability={handleToggleAvailability}
          onOpenSupport={openSupport}
          onOpenAssistant={openAssistant}
        />

        {/* Divider line */}
        <div className="border-t border-semantic-border-light/60 my-4" />

        {/* Menu Navigation Rows & Refer Banner */}
        <ProfileMenuList
          isAdmin={isAdmin}
          isWorker={isWorker}
          workerDetails={workerDetails}
          email={formData.email || user?.email}
          language={language}
          onNavigate={navigate}
          onToggleLanguage={toggleLanguage}
          onOpenAddressModal={() => setShowAddressModal(true)}
          onOpenEmailModal={() => setShowEmailModal(true)}
          onOpenLogoutModal={() => setShowLogoutModal(true)}
          onOpenSupport={openSupport}
          onOpenAssistant={openAssistant}
        />
      </div>

      {/* Edit Profile Modal */}
      <EditProfileModal
        isOpen={editMode}
        onClose={() => setEditMode(false)}
        formData={formData}
        setFormData={setFormData}
        isWorker={isWorker}
        isSaving={isSaving}
        isUploadingAvatar={isUploadingAvatar}
        avatarUploadError={avatarUploadError}
        isUploadingIdProof={isUploadingIdProof}
        avatarInputRef={avatarInputRef}
        idProofInputRef={idProofInputRef}
        onAvatarSelect={handleAvatarFileSelect}
        onIdProofSelect={handleIdProofFileSelect}
        onSave={() => handleSaveProfile(() => setEditMode(false))}
      />

      {/* Service Localities Modal */}
      <ServiceLocalitiesModal
        isOpen={showAddressModal}
        onClose={() => setShowAddressModal(false)}
      />

      {/* Email Update Modal */}
      <EmailUpdateModal
        isOpen={showEmailModal}
        initialEmail={formData.email || user?.email || ''}
        onClose={() => setShowEmailModal(false)}
        onUpdateEmail={async (newEmail) => {
          await updateEmail(newEmail)
          setFormData(prev => ({ ...prev, email: newEmail }))
          setSaveSuccessMsg('Email updated successfully!')
          setTimeout(() => setSaveSuccessMsg(''), 4000)
        }}
      />

      {/* Logout Confirmation Modal */}
      <LogoutConfirmModal
        isOpen={showLogoutModal}
        onClose={() => setShowLogoutModal(false)}
        onConfirm={async () => {
          setShowLogoutModal(false)
          await logout()
          navigate('/login')
        }}
      />
    </div>
  )
}

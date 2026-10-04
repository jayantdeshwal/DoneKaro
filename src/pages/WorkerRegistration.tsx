import { useTranslation } from 'react-i18next'
import { useNavigate, Link } from 'react-router-dom'
import { ArrowLeft, CheckCircle, AlertCircle } from 'lucide-react'
import { Button, Card } from '@kaamgar/ui'
import { useAuth } from '@/context/AuthContext'
import { REGISTRATION_STEPS } from '@/features/worker/constants'
import { useWorkerRegistration } from '@/features/worker/hooks/useWorkerRegistration'
import { RegistrationStepBar } from '@/features/worker/components/registration/RegistrationStepBar'
import { PersonalInfoStep } from '@/features/worker/components/registration/PersonalInfoStep'
import { WorkDetailsStep } from '@/features/worker/components/registration/WorkDetailsStep'
import { DocumentsStep } from '@/features/worker/components/registration/DocumentsStep'

export default function WorkerRegistration() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { user } = useAuth()

  const {
    currentStep,
    formData,
    setFormData,
    phoneVerified,
    setPhoneVerified,
    verifyingOtp,
    alreadyRegisteredNotice,
    setAlreadyRegisteredNotice,
    avatarPreview,
    setAvatarPreview,
    idProofPreview,
    setIdProofPreview,
    errors,
    loading,
    uploadProgress,
    submitted,
    termsAccepted,
    setTermsAccepted,
    selectedServices,
    selectedParentCategory,
    serviceLimitMessage,
    setServiceLimitMessage,
    categorySwitchedNotice,
    setCategorySwitchedNotice,
    toggleServiceSelection,
    handleSelectParentCategory,
    handleAvatarChange,
    handleIdProofChange,
    handleVerifyWorkerPhone,
    handleNext,
    handleBack,
    handleSubmit,
    signInWithGoogle,
  } = useWorkerRegistration()

  const currentStepKey = REGISTRATION_STEPS[currentStep].key

  // Registration complete success state
  if (submitted) {
    return (
      <div className="min-h-screen bg-semantic-bg-primary flex items-center justify-center p-4">
        <Card className="max-w-md w-full text-center p-8 bg-surface-100 border border-semantic-border-light shadow-xl">
          <div className="w-16 h-16 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center mx-auto mb-4 border border-emerald-500/30">
            <CheckCircle className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-semantic-text-primary mb-2">
            {t('auth.workerRegistration.appSubmitted', 'Application Submitted!')}
          </h2>
          <p className="text-sm text-semantic-text-secondary mb-6">
            {t(
              'auth.workerRegistration.appSubmittedDesc',
              'Thank you for registering. Our team will review your ID document and activate your profile within 24 hours. You can already explore your worker dashboard.'
            )}
          </p>
          <div className="space-y-3">
            <Button
              variant="primary"
              className="w-full"
              onClick={() => navigate('/worker/dashboard')}
            >
              {t('auth.workerRegistration.goToDashboard', 'Go to Worker Dashboard')}
            </Button>
            <Link
              to="/"
              className="block text-xs text-semantic-text-tertiary hover:text-semantic-text-primary mt-2"
            >
              {t('common.backToHome', 'Back to Home')}
            </Link>
          </div>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-semantic-bg-primary text-semantic-text-primary py-8 px-4 sm:px-6">
      <div className="max-w-xl mx-auto">
        {/* Top Header */}
        <div className="mb-6 flex items-center justify-between">
          <button
            type="button"
            onClick={() => (currentStep > 0 ? handleBack() : navigate('/login'))}
            className="w-10 h-10 rounded-full bg-surface-100 hover:bg-surface-200 border border-semantic-border-light flex items-center justify-center text-semantic-text-primary transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <span className="text-xs text-semantic-text-tertiary">
            {t('auth.workerRegistration.stepCounter', 'Step {{current}} of {{total}}', {
              current: currentStep + 1,
              total: REGISTRATION_STEPS.length,
            })}
          </span>
        </div>

        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-semantic-text-primary">
            {t('auth.workerRegistration.title', 'Become a Jugnu Service Partner')}
          </h1>
          <p className="text-xs text-semantic-text-secondary mt-1">
            {t(
              'auth.workerRegistration.subtitle',
              'Join 500+ local professionals in Muzaffarnagar and receive direct job requests'
            )}
          </p>
        </div>

        {/* Alternative Google Sign-in Option */}
        {!user && currentStep === 0 && (
          <div className="mb-6 p-4 rounded-2xl bg-surface-150/70 border border-semantic-border-light text-center">
            <p className="text-xs text-semantic-text-secondary mb-3">
              {t(
                'auth.workerRegistration.googlePrefillNotice',
                'Already have a Google account? Sign in with Google to prefill your name and email instantly.'
              )}
            </p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => signInWithGoogle('worker')}
              className="w-full text-xs font-semibold"
            >
              {t('auth.workerRegistration.signInWithGoogle', 'Sign in with Google (Fast Track)')}
            </Button>
          </div>
        )}

        <Card className="p-6 bg-surface-100 border border-semantic-border-light shadow-md">
          {/* Progress / Step indicator */}
          <RegistrationStepBar currentStep={currentStep} />

          {errors.form && (
            <div className="mb-6 p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errors.form}</span>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            {/* STEP 1: PERSONAL INFO */}
            {currentStepKey === 'personal' && (
              <PersonalInfoStep
                formData={formData}
                setFormData={setFormData}
                errors={errors}
                phoneVerified={phoneVerified}
                setPhoneVerified={setPhoneVerified}
                verifyingOtp={verifyingOtp}
                alreadyRegisteredNotice={alreadyRegisteredNotice}
                setAlreadyRegisteredNotice={setAlreadyRegisteredNotice}
                onVerifyPhone={handleVerifyWorkerPhone}
              />
            )}

            {/* STEP 2: WORK DETAILS */}
            {currentStepKey === 'work' && (
              <WorkDetailsStep
                formData={formData}
                setFormData={setFormData}
                errors={errors}
                selectedParentCategory={selectedParentCategory}
                selectedServices={selectedServices}
                serviceLimitMessage={serviceLimitMessage}
                setServiceLimitMessage={setServiceLimitMessage}
                categorySwitchedNotice={categorySwitchedNotice}
                setCategorySwitchedNotice={setCategorySwitchedNotice}
                onSelectParentCategory={handleSelectParentCategory}
                onToggleServiceSelection={toggleServiceSelection}
              />
            )}

            {/* STEP 3: DOCUMENTS */}
            {currentStepKey === 'documents' && (
              <DocumentsStep
                formData={formData}
                setFormData={setFormData}
                errors={errors}
                idProofPreview={idProofPreview}
                setIdProofPreview={setIdProofPreview}
                avatarPreview={avatarPreview}
                setAvatarPreview={setAvatarPreview}
                termsAccepted={termsAccepted}
                setTermsAccepted={setTermsAccepted}
                onIdProofChange={handleIdProofChange}
                onAvatarChange={handleAvatarChange}
              />
            )}

            {/* Navigation buttons */}
            <div className="mt-8 flex gap-3">
              {currentStep > 0 && (
                <Button
                  type="button"
                  variant="secondary"
                  onClick={handleBack}
                  className="flex-1"
                  disabled={loading}
                >
                  {t('common.back', 'Back')}
                </Button>
              )}
              {currentStep < REGISTRATION_STEPS.length - 1 ? (
                <Button
                  type="button"
                  variant="primary"
                  onClick={handleNext}
                  className="flex-1"
                  disabled={currentStep === 0 && !phoneVerified}
                >
                  {t('common.next', 'Next')}
                </Button>
              ) : (
                <Button
                  type="submit"
                  variant="primary"
                  className="flex-1"
                  loading={loading}
                >
                  {loading
                    ? uploadProgress || 'Submitting...'
                    : t('auth.workerRegistration.submit', 'Submit for Approval')}
                </Button>
              )}
            </div>
          </form>
        </Card>
      </div>
    </div>
  )
}

import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import {
  JUGNU_CATEGORIES,
  UserRole,
} from '@kaamgar/shared'
import { useAuth } from '@/context/AuthContext'
import { getSupabaseClient } from '@/lib/supabase'
import { uploadAvatar, uploadIdProof, validateFile } from '@/services/storage'
import { notifyAdminsOfWorkerRegistration } from '@/services/admin'
import { openOtpWidget } from '@/services/otp'
import { sanitizeErrorMessage } from '@/utils/errors'
import { normalizeIndianPhone, tryNormalizeIndianPhone, sanitizePhoneInput } from '@/utils/phone'
import { REGISTRATION_STEPS } from '../constants'
import type { RegistrationFormData } from '../types'

export function useWorkerRegistration() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { user, verifyAndLoginWithOtp, signInWithGoogle } = useAuth()
  const [currentStep, setCurrentStep] = useState(0)

  // Initialize form state
  const [formData, setFormData] = useState<RegistrationFormData>({
    name: user?.name || '',
    phone: user?.phone ? (tryNormalizeIndianPhone(user.phone) ?? '') : '',
    email: user?.email || '',
    category: '',
    experience: '',
    bio: '',
    avatar: null as File | null | undefined,
    idProof: null as File | null | undefined,
    areas: [] as string[],
  })

  // Track phone verification status
  const [phoneVerified, setPhoneVerified] = useState(
    !!(user?.phone && user.phone.trim().length >= 10)
  )
  const [alreadyRegisteredNotice, setAlreadyRegisteredNotice] = useState<{
    phone: string
    role: UserRole
    message?: string
  } | null>(null)

  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
  const [idProofPreview, setIdProofPreview] = useState<string | null>(null)
  const [idProofIsPdf, setIdProofIsPdf] = useState(false)

  const [errors, setErrors] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [termsAccepted, setTermsAccepted] = useState(false)

  // Category & multi-service selection state (Strict max 2 services within 1 parent category)
  const initialParentCategory = formData.category
    ? JUGNU_CATEGORIES.find(c => c.services.some(s => s.id === formData.category))?.id || null
    : null

  const [selectedServices, setSelectedServices] = useState<string[]>(
    formData.category ? [formData.category] : []
  )
  const [selectedParentCategory, setSelectedParentCategory] = useState<string | null>(
    initialParentCategory
  )
  const [serviceLimitMessage, setServiceLimitMessage] = useState<string | null>(null)
  const [categorySwitchedNotice, setCategorySwitchedNotice] = useState<string | null>(null)

  const toggleServiceSelection = (serviceId: string) => {
    setCategorySwitchedNotice(null)
    setSelectedServices(prev => {
      const exists = prev.includes(serviceId)
      if (exists) {
        // Removing a selected service
        const next = prev.filter(id => id !== serviceId)
        setServiceLimitMessage(null)
        setFormData(f => ({ ...f, category: next[0] || '' }))
        return next
      }

      // Check strict limit of 2 services
      if (prev.length >= 2) {
        setServiceLimitMessage(
          t(
            'auth.workerRegistration.maxTwoServicesError',
            'You can select a maximum of 2 services within this category. Please remove one service first to select another.'
          )
        )
        return prev
      }

      setServiceLimitMessage(null)
      const next = [...prev, serviceId]
      setFormData(f => ({ ...f, category: next[0] || '' }))
      return next
    })
  }

  const handleSelectParentCategory = (categoryId: string) => {
    if (selectedParentCategory === categoryId) return
    const wasAlreadySelected = selectedServices.length > 0
    setSelectedParentCategory(categoryId)
    setSelectedServices([])
    setFormData(f => ({ ...f, category: '' }))
    setServiceLimitMessage(null)
    if (wasAlreadySelected) {
      setCategorySwitchedNotice(
        t(
          'auth.workerRegistration.categorySwitchedReset',
          'Trade category changed. Please choose up to 2 services for your new category.'
        )
      )
    }
  }

  const handleAvatarChange = (file?: File) => {
    if (!file) return
    const result = validateFile(file, {
      maxSizeMb: 5,
      allowedTypes: ['image/jpeg', 'image/png', 'image/webp'],
    })
    if (!result.valid) {
      setErrors(prev => ({ ...prev, avatar: result.error || 'Invalid file' }))
      return
    }
    setErrors(prev => {
      const next = { ...prev }
      delete next.avatar
      return next
    })
    setFormData(prev => ({ ...prev, avatar: file }))
    setAvatarPreview(URL.createObjectURL(file))
  }

  const handleIdProofChange = (file?: File) => {
    if (!file) return
    const result = validateFile(file, {
      maxSizeMb: 10,
      allowedTypes: ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'],
    })
    if (!result.valid) {
      setErrors(prev => ({ ...prev, idProof: result.error || 'Invalid file' }))
      return
    }
    setErrors(prev => {
      const next = { ...prev }
      delete next.idProof
      return next
    })
    setFormData(prev => ({ ...prev, idProof: file }))
    setIdProofIsPdf(file.type === 'application/pdf')
    if (file.type !== 'application/pdf') {
      setIdProofPreview(URL.createObjectURL(file))
    } else {
      setIdProofPreview(null)
    }
  }

  const validateStep = (stepIndex: number, requirePhoneVerification = true): boolean => {
    const errs: Record<string, string> = {}

    if (stepIndex === 0) {
      if (!formData.name.trim()) {
        errs.name = t('auth.workerRegistration.nameRequired', 'Full Name is required')
      }
      const raw = formData.phone.trim()
      const normalized = tryNormalizeIndianPhone(raw)
      if (!raw || !normalized || raw.length < 10) {
        errs.phone = t('auth.errors.invalidPhone', 'Please enter a valid 10-digit Indian mobile number')
      } else if (requirePhoneVerification && !phoneVerified) {
        errs.phone = t(
          'auth.workerRegistration.phoneVerifyRequired',
          'Please verify your mobile number with OTP before continuing'
        )
      }
    }

    if (stepIndex === 1) {
      if (!selectedParentCategory) {
        errs.category = t(
          'auth.workerRegistration.categoryRequired',
          'Please select a trade category'
        )
      } else if (selectedServices.length === 0) {
        errs.category = t(
          'auth.workerRegistration.serviceRequired',
          'Please select at least 1 service (maximum 2)'
        )
      }
      const exp = parseInt(formData.experience)
      if (isNaN(exp) || exp < 0 || exp > 50) {
        errs.experience = t(
          'auth.workerRegistration.validExperience',
          'Please enter a valid number of years (0–50)'
        )
      }
      if (formData.areas.length === 0) {
        errs.areas = t(
          'auth.workerRegistration.selectArea',
          'Please select at least one service area in Muzaffarnagar'
        )
      }
    }

    if (stepIndex === 2) {
      if (!formData.idProof) {
        errs.idProof = t(
          'auth.workerRegistration.idProofRequired',
          'Government ID proof is required for verification'
        )
      }
      if (!termsAccepted) {
        errs.terms = t(
          'auth.workerRegistration.termsRequired',
          'You must agree to the Terms & Conditions'
        )
      }
    }

    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handleNext = () => {
    if (validateStep(currentStep, currentStep !== 0)) {
      setCurrentStep(prev => Math.min(prev + 1, REGISTRATION_STEPS.length - 1))
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  const handleBack = () => {
    setCurrentStep(prev => Math.max(prev - 1, 0))
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validateStep(2)) return
    if (!validateStep(1)) {
      setCurrentStep(1)
      return
    }
    if (!validateStep(0, false)) {
      setCurrentStep(0)
      return
    }

    const formSnapshot: RegistrationFormData = {
      ...formData,
      areas: [...formData.areas],
    }
    const servicesSnapshot = [...selectedServices]
    const normalizeResult = normalizeIndianPhone(formSnapshot.phone)
    if (!normalizeResult.ok) {
      setErrors(prev => ({ ...prev, phone: normalizeResult.error }))
      setCurrentStep(0)
      return
    }
    const cleanPhone = normalizeResult.digits
    const idProof = formSnapshot.idProof
    if (!idProof) {
      setErrors(prev => ({
        ...prev,
        idProof: t(
          'auth.workerRegistration.idProofRequired',
          'Government ID proof is required for verification'
        ),
      }))
      setCurrentStep(2)
      return
    }

    setLoading(true)
    setUploadProgress('')
    setErrors({})

    try {
      const finishRegistration = async (authUserId: string) => {
        const supabase = getSupabaseClient()
        setUploadProgress(t('auth.workerRegistration.uploadingId', 'Uploading Government ID proof securely...'))
        const idProofPath = await uploadIdProof(idProof, authUserId)

        let avatarUrl: string | null = null
        if (formSnapshot.avatar) {
          setUploadProgress(t('auth.workerRegistration.uploadingAvatar', 'Uploading profile photo...'))
          avatarUrl = await uploadAvatar(formSnapshot.avatar, authUserId)
        }

        setUploadProgress(t('auth.workerRegistration.savingProfile', 'Submitting your registration...'))
        const primaryCategory = servicesSnapshot[0] || formSnapshot.category
        const allSelectedCategories =
          servicesSnapshot.length > 0 ? servicesSnapshot : [primaryCategory]

        const { error: rpcError } = await (supabase as any).rpc('register_worker', {
          worker_name: formSnapshot.name.trim(),
          worker_phone: cleanPhone,
          worker_bio: formSnapshot.bio.trim() || null,
          worker_experience: parseInt(formSnapshot.experience) || 0,
          worker_category_id: primaryCategory,
          worker_area_pincodes: formSnapshot.areas,
          worker_avatar_url: avatarUrl,
          worker_id_proof_url: idProofPath,
          worker_category_ids: allSelectedCategories,
        })

        if (rpcError) {
          throw new Error(rpcError.message || 'Worker registration failed on database RPC')
        }

        try {
          await notifyAdminsOfWorkerRegistration({
            workerId: authUserId,
            workerName: formSnapshot.name.trim(),
            category: allSelectedCategories.join(', '),
          })
        } catch (notifyErr) {
          console.warn('Admin notification failed (non-blocking):', notifyErr)
        }

        setFormData({
          name: '',
          phone: '',
          email: '',
          category: '',
          experience: '',
          bio: '',
          avatar: null,
          idProof: null,
          areas: [],
        })
        setSelectedServices([])
        setSelectedParentCategory(null)
        setAvatarPreview(null)
        setIdProofPreview(null)
        setPhoneVerified(false)
        setTermsAccepted(false)
        setSubmitted(true)
      }

      if (phoneVerified) {
        const {
          data: { user: authUser },
          error: authError,
        } = await getSupabaseClient().auth.getUser()
        if (authError) throw authError
        if (!authUser) {
          throw new Error(
            t(
              'auth.workerRegistration.loginRequiredToSubmit',
              'You must be signed in to submit. Please verify your phone number.'
            )
          )
        }
        await finishRegistration(authUser.id)
        setLoading(false)
        setUploadProgress('')
      } else {
        const launched = await openOtpWidget({
          identifier: cleanPhone,
          onSuccess: async (accessToken: string) => {
            try {
              const authResult = await verifyAndLoginWithOtp(
                cleanPhone,
                accessToken,
                formSnapshot.name.trim(),
                formSnapshot.email.trim() || undefined
              )
              if (authResult.role === 'worker') {
                navigate('/worker/dashboard')
                return
              }
              setPhoneVerified(true)
              await finishRegistration(authResult.user.id)
            } catch (err) {
              console.error('Registration failed:', err)
              setErrors(prev => ({
                ...prev,
                form: sanitizeErrorMessage(
                  err,
                  t('auth.workerRegistration.submissionFailed', 'Registration submission failed. Please try again.')
                ),
              }))
            } finally {
              setLoading(false)
              setUploadProgress('')
            }
          },
          onFailure: err => {
            setLoading(false)
            setUploadProgress('')
            if (err && typeof err === 'object' && 'cancelled' in err && err.cancelled) return
            setErrors(prev => ({
              ...prev,
              phone:
                typeof err === 'string'
                  ? err
                  : err instanceof Error
                    ? err.message
                    : err && typeof err === 'object' && 'message' in err && typeof err.message === 'string'
                      ? err.message
                      : 'OTP verification failed. Please try again.',
            }))
          },
        })
        if (!launched) {
          setLoading(false)
          setErrors(prev => ({
            ...prev,
            phone: 'Unable to initialize SMS verification. Please check your network or try again.',
          }))
        }
      }
    } catch (err) {
      console.error('Registration failed:', err)
      setErrors(prev => ({
        ...prev,
        form: sanitizeErrorMessage(
          err,
          t('auth.workerRegistration.submissionFailed', 'Registration submission failed. Please try again.')
        ),
      }))
      setLoading(false)
      setUploadProgress('')
    }
  }

  return {
    currentStep,
    setCurrentStep,
    formData,
    setFormData,
    phoneVerified,
    setPhoneVerified,
    alreadyRegisteredNotice,
    setAlreadyRegisteredNotice,
    avatarPreview,
    setAvatarPreview,
    idProofPreview,
    setIdProofPreview,
    idProofIsPdf,
    errors,
    setErrors,
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
    handleNext,
    handleBack,
    handleSubmit,
    signInWithGoogle,
  }
}

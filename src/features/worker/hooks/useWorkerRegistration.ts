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
import { checkPhoneRegistration } from '@/services/authCheck'
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
  const [verifyingOtp, setVerifyingOtp] = useState(false)
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

  const handleVerifyWorkerPhone = async () => {
    setErrors({})
    setAlreadyRegisteredNotice(null)
    const normalizeResult = normalizeIndianPhone(formData.phone)

    if (!formData.name.trim() || formData.name.trim().length < 2) {
      setErrors(prev => ({
        ...prev,
        name: 'Please enter your full name (minimum 2 characters)',
      }))
      return
    }
    if (!normalizeResult.ok) {
      setErrors(prev => ({ ...prev, phone: normalizeResult.error }))
      return
    }
    const cleanPhone = normalizeResult.digits

    setVerifyingOtp(true)
    try {
      const launched = await openOtpWidget({
        identifier: cleanPhone,
        onSuccess: async (accessToken: string) => {
          try {
            const authResult = await verifyAndLoginWithOtp(
              cleanPhone,
              accessToken,
              formData.name.trim(),
              formData.email.trim() || undefined
            )
            setPhoneVerified(true)
            setVerifyingOtp(false)
            setErrors({})
            if (authResult.role === 'worker') {
              navigate('/worker/dashboard')
              return
            }
            // Auto-advance to Step 2: Work Details
            setCurrentStep(1)
          } catch (e: any) {
            setVerifyingOtp(false)
            setErrors(prev => ({
              ...prev,
              phone: sanitizeErrorMessage(e, 'Verification failed. Please retry.'),
            }))
          }
        },
        onFailure: (errDetail: any) => {
          setVerifyingOtp(false)
          if (!errDetail?.cancelled) {
            setErrors(prev => ({
              ...prev,
              phone: errDetail?.message || 'OTP verification failed. Please try again.',
            }))
          }
        },
      })
      if (!launched) {
        setVerifyingOtp(false)
        setErrors(prev => ({
          ...prev,
          phone: 'Unable to initialize SMS verification. Please check your network or try again.',
        }))
      }
    } catch (err: any) {
      setVerifyingOtp(false)
      setErrors(prev => ({
        ...prev,
        phone: sanitizeErrorMessage(err, 'Failed to launch verification widget.'),
      }))
    }
  }

  const validateStep = (stepIndex: number): boolean => {
    const errs: Record<string, string> = {}

    if (stepIndex === 0) {
      if (!formData.name.trim()) {
        errs.name = t('auth.workerRegistration.nameRequired', 'Full Name is required')
      }
      const raw = formData.phone.trim()
      const normalized = tryNormalizeIndianPhone(raw)
      if (!raw || !normalized || raw.length < 10) {
        errs.phone = t('auth.errors.invalidPhone', 'Please enter a valid 10-digit Indian mobile number')
      } else if (!phoneVerified) {
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
    if (validateStep(currentStep)) {
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
    if (!validateStep(0)) {
      setCurrentStep(0)
      return
    }

    setLoading(true)
    setUploadProgress('')

    try {
      const supabase = getSupabaseClient()
      const {
        data: { user: authUser },
      } = await supabase.auth.getUser()

      if (!authUser) {
        throw new Error(
          t(
            'auth.workerRegistration.loginRequiredToSubmit',
            'You must be signed in to submit. Please verify your phone number in Step 1.'
          )
        )
      }

      let idProofPath = ''
      if (formData.idProof) {
        setUploadProgress(t('auth.workerRegistration.uploadingId', 'Uploading Government ID proof securely...'))
        idProofPath = await uploadIdProof(formData.idProof, authUser.id)
      }

      let avatarUrl: string | null = null
      if (formData.avatar) {
        setUploadProgress(t('auth.workerRegistration.uploadingAvatar', 'Uploading profile photo...'))
        avatarUrl = await uploadAvatar(formData.avatar, authUser.id)
      }

      setUploadProgress(t('auth.workerRegistration.savingProfile', 'Submitting your registration...'))

      const normalizedPhone = normalizeIndianPhone(formData.phone)
      const cleanPhone = normalizedPhone.ok
        ? normalizedPhone.digits
        : formData.phone.replace(/\D/g, '').slice(-10)
      const primaryCategory = selectedServices[0] || formData.category
      const allSelectedCategories =
        selectedServices.length > 0 ? selectedServices : [primaryCategory]

      const { error: rpcError } = await (supabase as any).rpc('register_worker', {
        target_name: formData.name.trim(),
        target_bio: formData.bio.trim() || null,
        target_experience_years: parseInt(formData.experience) || 0,
        target_service_areas: formData.areas,
        target_id_proof_url: idProofPath,
        target_avatar_url: avatarUrl,
        target_categories: allSelectedCategories,
      })

      if (rpcError) {
        console.warn('RPC register_worker failed, falling back to direct table update:', rpcError)

        await (supabase.from('profiles') as any).upsert({
          id: authUser.id,
          full_name: formData.name.trim(),
          phone: cleanPhone,
          role: 'worker',
          avatar_url: avatarUrl,
          updated_at: new Date().toISOString(),
        })

        const { error: wpError } = await (supabase.from('worker_profiles') as any).upsert({
          id: authUser.id,
          bio: formData.bio.trim() || null,
          experience_years: parseInt(formData.experience) || 0,
          id_proof_url: idProofPath,
          approval_status: 'pending',
          is_available: false,
          updated_at: new Date().toISOString(),
        })
        if (wpError) throw wpError

        await (supabase.from('worker_categories') as any).delete().eq('worker_id', authUser.id)
        const categoryInserts = allSelectedCategories.map(catId => ({
          worker_id: authUser.id,
          category_id: catId,
        }))
        const { error: wcError } = await (supabase.from('worker_categories') as any).insert(
          categoryInserts
        )
        if (wcError) throw wcError
      }

      try {
        await notifyAdminsOfWorkerRegistration({
          workerId: authUser.id,
          workerName: formData.name.trim(),
          category: allSelectedCategories.join(', '),
        })
      } catch (notifyErr) {
        console.warn('Admin notification failed (non-blocking):', notifyErr)
      }

      setSubmitted(true)
    } catch (err: any) {
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
  }

  return {
    currentStep,
    setCurrentStep,
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
    handleVerifyWorkerPhone,
    handleNext,
    handleBack,
    handleSubmit,
    signInWithGoogle,
  }
}

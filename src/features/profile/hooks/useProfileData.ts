import { useState, useEffect, useCallback, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { getSupabaseClient } from '@/lib/supabase'
import { uploadAvatar, uploadIdProof, validateFile } from '@/services/storage'
import { recordPhoneRegistered } from '@/services/authCheck'
import type { LiveWorkerDetails, ProfileFormData } from '../types'

interface UseProfileDataProps {
  user: any
  isWorker: boolean
  language: string
  setLanguage: (lang: 'en' | 'hi') => void
  updateUser: (updates: any) => void
}

export function useProfileData({
  user,
  isWorker,
  language,
  setLanguage,
  updateUser,
}: UseProfileDataProps) {
  const { t, i18n } = useTranslation()

  const [formData, setFormData] = useState<ProfileFormData>({
    name: user?.name || '',
    phone: user?.phone || '',
    email: user?.email || '',
    language: (user?.language || language || 'en') as 'en' | 'hi',
    avatar_url: user?.avatar_url || '',
    bio: '',
    experience_years: 0,
    category: '',
    areas: [] as string[],
    is_available: true,
    id_proof_url: '',
  })

  const [workerDetails, setWorkerDetails] = useState<LiveWorkerDetails | null>(null)
  const [completedBookingsCount, setCompletedBookingsCount] = useState(0)
  const [isLoadingProfile, setIsLoadingProfile] = useState(true)

  const [isSaving, setIsSaving] = useState(false)
  const [saveSuccessMsg, setSaveSuccessMsg] = useState('')
  const [saveErrorMsg, setSaveErrorMsg] = useState('')

  // Avatar upload
  const avatarInputRef = useRef<HTMLInputElement>(null)
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false)
  const [avatarUploadError, setAvatarUploadError] = useState('')

  // ID proof upload
  const idProofInputRef = useRef<HTMLInputElement>(null)
  const [isUploadingIdProof, setIsUploadingIdProof] = useState(false)
  const [idProofUploadError, setIdProofUploadError] = useState('')

  const loadProfileData = useCallback(async () => {
    if (!user?.id) {
      setIsLoadingProfile(false)
      return
    }

    setIsLoadingProfile(true)
    setSaveErrorMsg('')

    try {
      const supabase = getSupabaseClient()

      // 1. Fetch user profile row
      const { data: profileRow } = await (supabase.from('profiles') as any)
        .select('full_name, phone, email, language, avatar_url')
        .eq('id', user.id)
        .maybeSingle()

      // 2. If worker, fetch worker details
      let workerInfo: LiveWorkerDetails | null = null
      if (user.role === 'worker' || isWorker) {
        const [wpResult, wcResult, wsaResult, bookingsResult] = await Promise.all([
          (supabase.from('worker_profiles') as any)
            .select('bio, experience_years, approval_status, is_available, rating, review_count, rejection_reason, id_proof_url')
            .eq('id', user.id)
            .maybeSingle(),
          (supabase.from('worker_categories') as any)
            .select('category_id')
            .eq('worker_id', user.id),
          (supabase.from('worker_service_areas') as any)
            .select('service_areas(pincode)')
            .eq('worker_id', user.id),
          (supabase.from('bookings') as any)
            .select('id, status')
            .eq('worker_id', user.id),
        ])

        const wp = wpResult?.data
        const completedCount = (bookingsResult?.data ?? []).filter((b: any) => b.status === 'completed').length
        setCompletedBookingsCount(completedCount)
        const userCategories = (wcResult?.data ?? []).map((c: any) => c.category_id).filter(Boolean)
        const userAreas = (wsaResult?.data ?? [])
          .map((a: any) => a.service_areas?.pincode)
          .filter(Boolean)

        workerInfo = {
          bio: wp?.bio || '',
          experience_years: Number(wp?.experience_years ?? 0),
          approval_status: wp?.approval_status || 'pending',
          is_available: Boolean(wp?.is_available ?? true),
          rating: Number(wp?.rating ?? 0),
          review_count: Number(wp?.review_count ?? 0),
          rejection_reason: wp?.rejection_reason || null,
          categories: userCategories,
          areas: userAreas,
          completedJobsCount: completedCount,
          id_proof_url: wp?.id_proof_url || null,
        }
      } else {
        // Customer completed bookings
        const { data: custBookings } = await (supabase.from('bookings') as any)
          .select('id, status')
          .eq('customer_id', user.id)
        const completedCount = (custBookings ?? []).filter((b: any) => b.status === 'completed').length
        setCompletedBookingsCount(completedCount)
      }

      setWorkerDetails(workerInfo)
      setFormData({
        name: profileRow?.full_name || user.name || '',
        phone: profileRow?.phone || user.phone || '',
        email: profileRow?.email || user.email || '',
        language: (profileRow?.language || user.language || language || 'en') as 'en' | 'hi',
        avatar_url: profileRow?.avatar_url || user.avatar_url || '',
        bio: workerInfo?.bio || '',
        experience_years: workerInfo?.experience_years || 0,
        category: workerInfo?.categories?.[0] || '',
        areas: workerInfo?.areas || [],
        is_available: workerInfo?.is_available ?? true,
        id_proof_url: workerInfo?.id_proof_url || '',
      })
    } catch (err) {
      console.warn('Error loading profile data:', err)
    } finally {
      setIsLoadingProfile(false)
    }
  }, [user?.id, user?.name, user?.phone, user?.email, user?.language, user?.avatar_url, user?.role, isWorker, language])

  useEffect(() => {
    void loadProfileData()
  }, [loadProfileData])

  // Avatar upload
  const handleAvatarFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !user?.id) return

    setAvatarUploadError('')
    const validation = validateFile(file, { maxSizeMb: 5 })
    if (!validation.valid) {
      setAvatarUploadError(validation.error || 'Invalid photo format')
      return
    }

    setIsUploadingAvatar(true)
    try {
      const publicUrl = await uploadAvatar(file, user.id)
      setFormData(prev => ({ ...prev, avatar_url: publicUrl }))

      const supabase = getSupabaseClient()
      const { error } = await (supabase.from('profiles') as any)
        .update({ avatar_url: publicUrl, updated_at: new Date().toISOString() })
        .eq('id', user.id)

      if (error) throw error
      updateUser({ avatar_url: publicUrl })
      setSaveSuccessMsg(t('profile.avatarUpdated', 'Profile photo updated!'))
      setTimeout(() => setSaveSuccessMsg(''), 3500)
    } catch (err) {
      setAvatarUploadError(err instanceof Error ? err.message : 'Unable to upload photo')
    } finally {
      setIsUploadingAvatar(false)
    }
  }

  // ID proof upload
  const handleIdProofFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !user?.id) return

    setIdProofUploadError('')
    const validation = validateFile(file, {
      maxSizeMb: 10,
      allowedTypes: ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'],
    })
    if (!validation.valid) {
      setIdProofUploadError(validation.error || 'Invalid document file')
      return
    }

    setIsUploadingIdProof(true)
    try {
      const filePath = await uploadIdProof(file, user.id)
      setFormData(prev => ({ ...prev, id_proof_url: filePath }))

      const supabase = getSupabaseClient()
      const { error } = await (supabase.from('worker_profiles') as any)
        .update({ id_proof_url: filePath, updated_at: new Date().toISOString() })
        .eq('id', user.id)

      if (error) throw error
      setWorkerDetails(prev => (prev ? { ...prev, id_proof_url: filePath } : null))
      setSaveSuccessMsg(t('profile.idUploaded', 'ID proof document uploaded securely'))
      setTimeout(() => setSaveSuccessMsg(''), 4000)
    } catch (err) {
      setIdProofUploadError(err instanceof Error ? err.message : 'Unable to upload document')
    } finally {
      setIsUploadingIdProof(false)
    }
  }

  // Save profile changes
  const handleSaveProfile = async (onSuccess?: () => void) => {
    if (!user) return

    setIsSaving(true)
    setSaveErrorMsg('')
    setSaveSuccessMsg('')

    try {
      const trimmedName = formData.name.trim()

      if (!trimmedName || trimmedName.length < 2) {
        throw new Error(t('errors.nameMinLength', 'Name must be at least 2 characters long'))
      }

      const supabase = getSupabaseClient()
      const cleanPhone = (formData.phone || user.phone || '').replace(/\D/g, '').slice(-10)

      // 1. Resolve true UUID for Supabase update
      let targetUuid: string | null = null
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
      if (user.id && uuidRegex.test(user.id)) {
        targetUuid = user.id
      } else {
        const { data: sessionData } = await supabase.auth.getSession()
        if (sessionData.session?.user?.id && uuidRegex.test(sessionData.session.user.id)) {
          targetUuid = sessionData.session.user.id
        } else if (cleanPhone.length === 10) {
          try {
            const { data: found } = await (supabase.from('profiles') as any)
              .select('id')
              .or(`phone.eq.+91${cleanPhone},phone.eq.${cleanPhone}`)
              .maybeSingle()
            if (found?.id && uuidRegex.test(found.id)) {
              targetUuid = found.id
            }
          } catch {
            // Ignore lookup error
          }
        }
      }

      // 2. If target UUID is resolved, update Supabase profiles table
      if (targetUuid) {
        const updatePayload: any = {
          full_name: trimmedName,
          language: formData.language,
          updated_at: new Date().toISOString(),
        }
        if (formData.avatar_url) updatePayload.avatar_url = formData.avatar_url
        if (formData.email?.trim()) updatePayload.email = formData.email.trim()

        try {
          const { error: profileError } = await (supabase.from('profiles') as any)
            .update(updatePayload)
            .eq('id', targetUuid)

          if (profileError) {
            console.warn('Supabase profiles update notice:', profileError)
          }
        } catch (dbErr) {
          console.warn('Profiles table update notice:', dbErr)
        }

        // 3. Update Supabase Auth user metadata
        try {
          await supabase.auth.updateUser({
            data: { full_name: trimmedName },
          })
        } catch (authErr) {
          console.warn('Supabase auth metadata update notice:', authErr)
        }

        // 4. Update worker details if worker
        if (user.role === 'worker' || isWorker) {
          try {
            await (supabase.from('worker_profiles') as any)
              .update({
                bio: formData.bio?.trim() || '',
                experience_years: Number(formData.experience_years) || 0,
                is_available: formData.is_available,
                updated_at: new Date().toISOString(),
              })
              .eq('id', targetUuid)

            if (formData.category) {
              await (supabase.from('worker_categories') as any).delete().eq('worker_id', targetUuid)
              await (supabase.from('worker_categories') as any).insert({
                worker_id: targetUuid,
                category_id: formData.category,
              })
            }

            if (formData.areas.length > 0) {
              const { data: areaRows } = await (supabase.from('service_areas') as any)
                .select('id, pincode')
                .in('pincode', formData.areas)

              if (areaRows && areaRows.length > 0) {
                await (supabase.from('worker_service_areas') as any).delete().eq('worker_id', targetUuid)
                await (supabase.from('worker_service_areas') as any).insert(
                  areaRows.map((ar: any) => ({
                    worker_id: targetUuid,
                    service_area_id: ar.id,
                  }))
                )
              }
            }
          } catch (wErr) {
            console.warn('Worker profile update notice:', wErr)
          }
        }
      }

      // 5. Update local state in AuthContext & localStorage (Immediate & Guaranteed)
      updateUser({
        ...(targetUuid ? { id: targetUuid } : {}),
        name: trimmedName,
        email: formData.email?.trim() || user.email,
        language: formData.language,
        avatar_url: formData.avatar_url || user.avatar_url,
      })

      // 6. Update phone registration cache
      if (cleanPhone.length === 10) {
        recordPhoneRegistered(cleanPhone, user.role, trimmedName, formData.email?.trim() || user.email || undefined)
      }

      // 7. Update language if changed
      if (formData.language !== language) {
        setLanguage(formData.language)
        void i18n.changeLanguage(formData.language)
      }

      if (onSuccess) onSuccess()
      setSaveSuccessMsg(t('profile.saveSuccess', 'Profile updated successfully!'))
      setTimeout(() => setSaveSuccessMsg(''), 4000)
      void loadProfileData()
    } catch (err) {
      setSaveErrorMsg(err instanceof Error ? err.message : 'Failed to save changes')
    } finally {
      setIsSaving(false)
    }
  }

  return {
    formData,
    setFormData,
    workerDetails,
    setWorkerDetails,
    completedBookingsCount,
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
    idProofUploadError,
    handleAvatarFileSelect,
    handleIdProofFileSelect,
    handleSaveProfile,
    loadProfileData,
  }
}

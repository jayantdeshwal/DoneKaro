import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { FileText, IdCard, Image, Info, X } from 'lucide-react'
import type { RegistrationFormData } from '../../types'
import { TermsModal } from '@/components/legal/TermsModal'

interface DocumentsStepProps {
  formData: RegistrationFormData
  setFormData: React.Dispatch<React.SetStateAction<any>>
  errors: Record<string, string>
  idProofPreview: string | null
  setIdProofPreview: (preview: string | null) => void
  avatarPreview: string | null
  setAvatarPreview: (preview: string | null) => void
  termsAccepted: boolean
  setTermsAccepted: (accepted: boolean) => void
  onIdProofChange: (file?: File) => void
  onAvatarChange: (file?: File) => void
}

export const DocumentsStep: React.FC<DocumentsStepProps> = ({
  formData,
  setFormData,
  errors,
  idProofPreview,
  setIdProofPreview,
  avatarPreview,
  setAvatarPreview,
  termsAccepted,
  setTermsAccepted,
  onIdProofChange,
  onAvatarChange,
}) => {
  const { t } = useTranslation()
  const [isTermsModalOpen, setIsTermsModalOpen] = useState(false)

  return (
    <div className="space-y-6">
      <div className="p-4 bg-brand-500/10 border border-brand-500/20 rounded-xl flex items-start gap-3">
        <div className="w-8 h-8 bg-brand-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
          <Info className="w-5 h-5 text-brand-400" />
        </div>
        <div>
          <h4 className="font-semibold text-brand-400 text-sm">
            {t('auth.workerRegistration.govtIdTitle', 'Government ID Verification')}
          </h4>
          <p className="text-xs text-semantic-text-secondary mt-1">
            {t(
              'auth.workerRegistration.govtIdDesc',
              'Upload a clear photo or PDF of your Aadhaar card or Voter ID. Your document is stored in a strictly private storage bucket and accessible exclusively to administrators for verification.'
            )}
          </p>
        </div>
      </div>

      {/* ID Proof Upload */}
      <div>
        <label className="label text-semantic-text-secondary mb-1 block">
          {t('auth.workerRegistration.idProof', 'ID Proof')}{' '}
          {t('auth.workerRegistration.requiredBadge', '(Required)')}
        </label>
        <div className="border-2 border-dashed border-semantic-border-light hover:border-brand-500 bg-surface-200/40 rounded-xl p-6 text-center transition-colors">
          {formData.idProof ? (
            <div className="flex flex-col items-center">
              {idProofPreview ? (
                <img
                  src={idProofPreview}
                  alt="ID Preview"
                  className="max-h-40 rounded-lg object-contain border border-semantic-border-light mb-2"
                />
              ) : (
                <div className="w-14 h-14 bg-red-500/10 rounded-xl flex items-center justify-center mb-2">
                  <FileText className="w-8 h-8 text-red-400" />
                </div>
              )}
              <p className="text-sm font-medium text-semantic-text-primary">
                {formData.idProof.name}
              </p>
              <p className="text-xs text-semantic-text-tertiary mt-0.5">
                {(formData.idProof.size / (1024 * 1024)).toFixed(2)} MB
              </p>
              <button
                type="button"
                onClick={() => {
                  setFormData((prev: any) => ({ ...prev, idProof: null }))
                  setIdProofPreview(null)
                }}
                className="text-xs text-red-400 hover:text-red-300 mt-2 flex items-center gap-1"
              >
                <X className="w-3.5 h-3.5" />{' '}
                {t('auth.workerRegistration.removeDoc', 'Remove document')}
              </button>
            </div>
          ) : (
            <>
              <input
                type="file"
                accept="image/*,application/pdf"
                className="hidden"
                id="idproof-upload"
                onChange={e => onIdProofChange(e.target.files?.[0])}
              />
              <label
                htmlFor="idproof-upload"
                className="cursor-pointer flex flex-col items-center gap-2"
              >
                <IdCard className="w-10 h-10 text-semantic-text-tertiary" />
                <span className="text-semantic-text-secondary text-sm">
                  {t('auth.workerRegistration.clickUploadId', 'Click to upload Aadhaar or Voter ID')}
                </span>
                <span className="text-xs text-semantic-text-tertiary">
                  {t('auth.workerRegistration.idFormatHint', 'JPG, PNG, PDF up to 10MB')}
                </span>
              </label>
            </>
          )}
        </div>
        {errors.idProof && <p className="mt-1 text-xs text-red-400">{errors.idProof}</p>}
      </div>

      {/* Profile Photo (Optional) */}
      <div>
        <label className="label text-semantic-text-secondary mb-1 block">
          {t('auth.workerRegistration.photo', 'Profile Photo')} ({t('common.optional', 'Optional')})
        </label>
        <div className="border-2 border-dashed border-semantic-border-light hover:border-brand-500 bg-surface-200/40 rounded-xl p-6 text-center transition-colors">
          {formData.avatar ? (
            <div className="flex flex-col items-center">
              {avatarPreview && (
                <img
                  src={avatarPreview}
                  alt="Avatar Preview"
                  className="w-24 h-24 rounded-full object-cover border-2 border-brand-500 mb-2"
                />
              )}
              <p className="text-sm font-medium text-semantic-text-primary">
                {formData.avatar.name}
              </p>
              <button
                type="button"
                onClick={() => {
                  setFormData((prev: any) => ({ ...prev, avatar: null }))
                  setAvatarPreview(null)
                }}
                className="text-xs text-red-400 hover:text-red-300 mt-2 flex items-center gap-1"
              >
                <X className="w-3.5 h-3.5" />{' '}
                {t('auth.workerRegistration.removePhoto', 'Remove photo')}
              </button>
            </div>
          ) : (
            <>
              <input
                type="file"
                accept="image/*"
                className="hidden"
                id="avatar-upload"
                onChange={e => onAvatarChange(e.target.files?.[0])}
              />
              <label
                htmlFor="avatar-upload"
                className="cursor-pointer flex flex-col items-center gap-2"
              >
                <Image className="w-10 h-10 text-semantic-text-tertiary" />
                <span className="text-semantic-text-secondary text-sm">
                  {t('auth.workerRegistration.clickUploadPhoto', 'Click to upload profile photo')}
                </span>
                <span className="text-xs text-semantic-text-tertiary">
                  {t('auth.workerRegistration.photoFormatHint', 'JPG, PNG up to 5MB')}
                </span>
              </label>
            </>
          )}
        </div>
        {errors.avatar && <p className="mt-1 text-xs text-red-400">{errors.avatar}</p>}
      </div>

      <div className="p-4 bg-surface-200/60 border border-semantic-border-light rounded-xl">
        <h4 className="font-semibold text-semantic-text-primary mb-2 text-sm">
          {t('auth.workerRegistration.whatHappensNext', 'What happens next?')}
        </h4>
        <ul className="text-xs text-semantic-text-secondary space-y-1.5">
          <li>
            {t(
              'auth.workerRegistration.nextStep1',
              '• Our team reviews your ID document within 24 hours.'
            )}
          </li>
          <li>
            {t(
              'auth.workerRegistration.nextStep2',
              '• You will receive an automated notification once approved.'
            )}
          </li>
          <li>
            {t(
              'auth.workerRegistration.nextStep3',
              '• Your profile will appear in the Muzaffarnagar public worker directory.'
            )}
          </li>
          <li>
            {t(
              'auth.workerRegistration.nextStep4',
              '• 0% commission on bookings for the starting 3 months.'
            )}
          </li>
        </ul>
      </div>

      {/* Terms and conditions agreement */}
      <div className="mt-6">
        <label className="flex items-start gap-3 rounded-xl border border-semantic-border-light p-3.5 text-sm text-semantic-text-secondary cursor-pointer bg-surface-200/30">
          <input
            type="checkbox"
            checked={termsAccepted}
            onChange={e => {
              if (e.target.checked) {
                setIsTermsModalOpen(true)
              } else {
                setTermsAccepted(false)
              }
            }}
            className="mt-0.5 h-5 w-5 accent-emerald-500 cursor-pointer"
          />
          <div className="flex-1">
            <span>
              {t('auth.workerRegistration.termsAcceptancePrefix', 'I agree to the')}{' '}
              <button
                type="button"
                onClick={e => {
                  e.preventDefault()
                  e.stopPropagation()
                  setIsTermsModalOpen(true)
                }}
                className="font-semibold text-emerald-500 hover:underline inline cursor-pointer"
              >
                {t('auth.workerRegistration.termsAcceptanceLink', 'Terms & Conditions')}
              </button>
            </span>
            {!termsAccepted && (
              <p className="text-[11px] text-emerald-600 dark:text-emerald-400/90 mt-1">
                {t(
                  'registerPage.termsReviewPrompt',
                  'Click to read and accept the full Terms & Conditions'
                )}
              </p>
            )}
          </div>
        </label>
        {errors.terms && <p className="mt-1 text-xs text-red-400">{errors.terms}</p>}
      </div>

      <TermsModal
        isOpen={isTermsModalOpen}
        onClose={() => setIsTermsModalOpen(false)}
        onAccept={() => {
          setTermsAccepted(true)
        }}
      />
    </div>
  )
}

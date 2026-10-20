import React from 'react'
import { useTranslation } from 'react-i18next'
import { CheckCircle, Mail } from 'lucide-react'
import { Input } from '@kaamgar/ui'
import { sanitizePhoneInput } from '@/utils/phone'
import type { RegistrationFormData } from '../../types'

interface PersonalInfoStepProps {
  formData: RegistrationFormData
  setFormData: React.Dispatch<React.SetStateAction<any>>
  errors: Record<string, string>
  phoneVerified: boolean
  setPhoneVerified: (verified: boolean) => void
  alreadyRegisteredNotice: {
    phone: string
    role: string
    message?: string
  } | null
  setAlreadyRegisteredNotice: (notice: any) => void
}

export const PersonalInfoStep: React.FC<PersonalInfoStepProps> = ({
  formData,
  setFormData,
  errors,
  phoneVerified,
  setPhoneVerified,
  alreadyRegisteredNotice,
  setAlreadyRegisteredNotice,
}) => {
  const { t } = useTranslation()

  return (
    <div className="space-y-5">
      <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl">
        <p className="text-xs text-blue-900 leading-relaxed font-medium">
          {t(
            'auth.workerRegistration.step1Notice',
            'Enter your full name and mobile number. Your mobile number will be verified after you complete your registration details.'
          )}
        </p>
      </div>

      <Input
        label={t('auth.workerRegistration.fullName', 'Full Name')}
        value={formData.name}
        onChange={e => setFormData((prev: any) => ({ ...prev, name: e.target.value }))}
        placeholder={t('auth.workerRegistration.namePlaceholder', 'Enter your full name')}
        error={errors.name}
        required
        autoFocus
      />

      <div>
        <Input
          label={t('auth.phoneLabel', 'Mobile Number')}
          value={formData.phone}
          onChange={e => {
            setFormData((prev: any) => ({
              ...prev,
              phone: sanitizePhoneInput(e.target.value),
            }))
            setPhoneVerified(false)
            if (alreadyRegisteredNotice) setAlreadyRegisteredNotice(null)
          }}
          placeholder="9876543210"
          leftIcon={<span className="text-sm font-semibold text-semantic-text-secondary">+91</span>}
          error={errors.phone}
          required
        />
        <p className="mt-1 text-xs text-semantic-text-tertiary">
          {t('auth.workerRegistration.phoneHint', 'Enter your 10-digit Indian mobile number')}
        </p>
      </div>

      {/* Optional Email Address */}
      <div>
        <Input
          label={t('auth.workerRegistration.emailLabel', 'Email / Gmail Address (Optional)')}
          type="email"
          value={formData.email}
          onChange={e => setFormData((prev: any) => ({ ...prev, email: e.target.value }))}
          placeholder={t('auth.workerRegistration.emailPlaceholder', 'name@gmail.com')}
          leftIcon={<Mail className="w-5 h-5 text-semantic-text-tertiary" />}
        />
        <p className="mt-1 text-xs text-semantic-text-tertiary">
          {t(
            'auth.workerRegistration.emailHint',
            'Optional: For registration confirmation, receipts, and admin notices.'
          )}
        </p>
      </div>

      {phoneVerified ? (
        <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-xl flex items-center justify-between text-emerald-400">
          <div className="flex items-center gap-2.5">
            <CheckCircle className="w-5 h-5 text-emerald-400 flex-shrink-0" />
            <div>
              <p className="text-sm font-semibold">
                {t('auth.workerRegistration.phoneVerified', 'Mobile Number Verified')}
              </p>
              <p className="text-xs text-emerald-300/80">+91{formData.phone}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setPhoneVerified(false)}
            className="text-xs text-emerald-300/70 hover:text-emerald-200 underline"
          >
            {t('auth.workerRegistration.changeNumber', 'Change Number')}
          </button>
        </div>
      ) : (
        <p className="text-xs text-semantic-text-tertiary">
          {t(
            'auth.workerRegistration.phoneVerificationAtSubmit',
            'Your mobile number will be verified by OTP after you complete the required registration details.'
          )}
        </p>
      )}
    </div>
  )
}

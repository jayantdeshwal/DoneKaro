import { useTranslation } from 'react-i18next'
import { Button, Avatar, Input, Modal } from '@kaamgar/ui'
import { CATEGORIES, getCategoryName } from '@kaamgar/shared'
import {
  Camera,
  Phone,
  Mail,
  UploadCloud,
  Check,
  Trash2,
  Loader2,
} from 'lucide-react'
import type { ProfileFormData } from '../types'

interface EditProfileModalProps {
  isOpen: boolean
  onClose: () => void
  formData: ProfileFormData
  setFormData: React.Dispatch<React.SetStateAction<ProfileFormData>>
  isWorker: boolean
  isSaving: boolean
  isUploadingAvatar: boolean
  isRemovingAvatar: boolean
  avatarUploadError: string
  isUploadingIdProof: boolean
  avatarInputRef: React.RefObject<HTMLInputElement>
  idProofInputRef: React.RefObject<HTMLInputElement>
  onAvatarSelect: (e: React.ChangeEvent<HTMLInputElement>) => void
  onRemoveAvatar: () => void
  onIdProofSelect: (e: React.ChangeEvent<HTMLInputElement>) => void
  onSave: () => void
}

export function EditProfileModal({
  isOpen,
  onClose,
  formData,
  setFormData,
  isWorker,
  isSaving,
  isUploadingAvatar,
  isRemovingAvatar,
  avatarUploadError,
  isUploadingIdProof,
  avatarInputRef,
  idProofInputRef,
  onAvatarSelect,
  onRemoveAvatar,
  onIdProofSelect,
  onSave,
}: EditProfileModalProps) {
  const { t } = useTranslation()

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={t('profile.editProfile', 'Edit Profile Details')}
      description={t('profile.editProfileDesc', 'Update your personal details, contact information, and preferences.')}
    >
      <div className="space-y-4 pt-2 max-h-[75vh] overflow-y-auto px-1">
        {/* Avatar Photo Upload & Delete Actions */}
        <div className="flex flex-col sm:flex-row items-center gap-4 p-3.5 bg-slate-50 dark:bg-zinc-800 rounded-2xl border border-slate-200 dark:border-zinc-700">
          <div className="relative shrink-0">
            <Avatar
              name={formData.name}
              src={formData.avatar_url || undefined}
              size="lg"
              className="shadow-sm"
            />
            <input
              type="file"
              ref={avatarInputRef}
              accept="image/*,.jpg,.jpeg,.png,.webp"
              className="hidden"
              onChange={onAvatarSelect}
            />
          </div>

          <div className="flex-1 min-w-0 text-center sm:text-left">
            <p className="text-xs font-bold text-slate-900 dark:text-zinc-100">{t('profile.photo', 'Profile Photo')}</p>
            <p className="text-[11px] text-slate-500 dark:text-zinc-400">
              {t('profile.photoHint', 'WebP, PNG, or JPG (Auto-optimized)')}
            </p>

            <div className="mt-2.5 flex items-center justify-center sm:justify-start gap-2 flex-wrap">
              <button
                type="button"
                onClick={() => avatarInputRef.current?.click()}
                disabled={isUploadingAvatar || isRemovingAvatar}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-300 dark:border-zinc-600 bg-white dark:bg-zinc-700/80 hover:bg-slate-50 dark:hover:bg-zinc-700 text-xs font-semibold text-slate-800 dark:text-zinc-200 transition-colors shadow-xs active:scale-95 disabled:opacity-50 min-h-[36px] cursor-pointer"
              >
                {isUploadingAvatar ? (
                  <>
                    <UploadCloud className="w-3.5 h-3.5 animate-bounce text-amber-500" />
                    <span>{t('profile.uploading', 'Uploading...')}</span>
                  </>
                ) : (
                  <>
                    <Camera className="w-3.5 h-3.5 text-amber-500" />
                    <span>{formData.avatar_url ? t('profile.changePhoto', 'Change Photo') : t('profile.uploadPhoto', 'Upload Photo')}</span>
                  </>
                )}
              </button>

              {Boolean(formData.avatar_url) && (
                <button
                  type="button"
                  onClick={onRemoveAvatar}
                  disabled={isUploadingAvatar || isRemovingAvatar}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-rose-200 dark:border-rose-900/50 bg-rose-50 dark:bg-rose-950/30 hover:bg-rose-100 dark:hover:bg-rose-900/40 text-xs font-semibold text-rose-600 dark:text-rose-400 transition-colors shadow-xs active:scale-95 disabled:opacity-50 min-h-[36px] cursor-pointer"
                  title={t('profile.removePhoto', 'Remove Photo')}
                >
                  {isRemovingAvatar ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>{t('common.removing', 'Removing...')}</span>
                    </>
                  ) : (
                    <>
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>{t('profile.removePhoto', 'Remove Photo')}</span>
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>

        {avatarUploadError && (
          <p className="rounded-lg border border-red-800 bg-gray-900 px-2.5 py-1.5 text-xs text-red-300 shadow-md">{avatarUploadError}</p>
        )}

        {/* Full Name */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 uppercase mb-1">
            {t('profile.name', 'Full Name')}
          </label>
          <Input
            value={formData.name}
            onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
            placeholder={t('profile.namePlaceholder', 'Your full name')}
            required
          />
        </div>

        {/* Phone Number */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 uppercase mb-1">
            {t('profile.phone', 'Phone Number')}
          </label>
          <Input
            value={formData.phone}
            onChange={e => setFormData(prev => ({ ...prev, phone: e.target.value }))}
            placeholder="+919876543210"
            leftIcon={<Phone className="w-4 h-4 text-slate-400 dark:text-zinc-500" />}
          />
        </div>

        {/* Email / Gmail */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 uppercase mb-1">
            {t('profile.emailLabel', 'Email / Gmail Address')}
          </label>
          <Input
            type="email"
            value={formData.email}
            onChange={e => setFormData(prev => ({ ...prev, email: e.target.value }))}
            placeholder="name@gmail.com"
            leftIcon={<Mail className="w-4 h-4 text-slate-400 dark:text-zinc-500" />}
          />
        </div>

        {/* Language Preference */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 uppercase mb-1">
            {t('profile.languageLabel', 'Language Preference')}
          </label>
          <select
            value={formData.language}
            onChange={e => setFormData(prev => ({ ...prev, language: e.target.value as 'en' | 'hi' }))}
            className="w-full bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-xl p-2.5 text-sm text-slate-900 dark:text-zinc-100 focus:outline-none focus:border-amber-500"
          >
            <option value="en">{t('common.english', 'English')}</option>
            <option value="hi">{t('common.hindi', 'हिंदी (Hindi)')}</option>
          </select>
        </div>

        {/* Worker Specific Fields */}
        {isWorker && (
          <div className="pt-3 border-t border-slate-200 dark:border-zinc-800 space-y-3">
            <h4 className="font-bold text-xs text-amber-600 dark:text-brand-400 uppercase tracking-wider">
              {t('profile.workerTradeDetails', 'Worker Trade & Details')}
            </h4>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 uppercase mb-1">
                {t('profile.primaryTrade', 'Primary Trade')}
              </label>
              <select
                value={formData.category}
                onChange={e => setFormData(prev => ({ ...prev, category: e.target.value }))}
                className="w-full bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-xl p-2.5 text-sm text-slate-900 dark:text-zinc-100 focus:outline-none focus:border-amber-500 capitalize"
              >
                <option value="">{t('profile.selectPrimaryTrade', 'Select Primary Trade')}</option>
                {CATEGORIES.map(cat => (
                  <option key={cat.id} value={cat.id}>
                    {getCategoryName(cat, formData.language === 'hi' ? 'hi' : 'en')}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 uppercase mb-1">
                {t('profile.yearsExperience', 'Years of Experience')}
              </label>
              <Input
                type="number"
                min="0"
                max="50"
                value={formData.experience_years}
                onChange={e => setFormData(prev => ({ ...prev, experience_years: Number(e.target.value) }))}
                placeholder="5"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 uppercase mb-1">
                {t('profile.bioLabel', 'About your work (Bio)')}
              </label>
              <textarea
                value={formData.bio}
                onChange={e => setFormData(prev => ({ ...prev, bio: e.target.value }))}
                rows={3}
                className="w-full bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-xl p-2.5 text-sm text-slate-900 dark:text-zinc-100 focus:outline-none focus:border-amber-500"
                placeholder={t('profile.bioPlaceholder', 'Describe your skills, tools, and specialty...')}
              />
            </div>

            {/* ID Proof upload */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 uppercase mb-1">
                {t('profile.idProofLabel', 'ID Proof Document (Aadhaar / Voter ID)')}
              </label>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => idProofInputRef.current?.click()}
                  disabled={isUploadingIdProof}
                  className="text-xs"
                >
                  <UploadCloud className="w-3.5 h-3.5 mr-1 text-amber-600 dark:text-brand-400" />
                  {formData.id_proof_url ? t('profile.replaceDoc', 'Replace Document') : t('profile.uploadIdProof', 'Upload ID Proof')}
                </Button>
                <input
                  type="file"
                  ref={idProofInputRef}
                  accept="image/jpeg,image/png,image/webp,application/pdf,.jpg,.jpeg,.png,.webp,.pdf"
                  className="hidden"
                  onChange={onIdProofSelect}
                />
                {formData.id_proof_url && (
                  <span className="text-xs text-emerald-700 dark:text-emerald-400 flex items-center gap-1 font-semibold">
                    <Check className="w-3 h-3" /> {t('profile.attached', 'Attached')}
                  </span>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Modal Actions */}
        <div className="flex gap-3 pt-4 border-t border-semantic-border-light">
          <Button
            variant="secondary"
            onClick={onClose}
            className="flex-1 text-xs"
            disabled={isSaving}
          >
            {t('common.cancel', 'Cancel')}
          </Button>
          <Button
            variant="primary"
            onClick={onSave}
            loading={isSaving}
            className="flex-1 text-xs font-bold"
          >
            {isSaving ? t('common.saving', 'Saving...') : t('common.saveChanges', 'Save Changes')}
          </Button>
        </div>
      </div>
    </Modal>
  )
}

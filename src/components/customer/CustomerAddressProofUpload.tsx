import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { FileText, UploadCloud, X, CheckCircle2, AlertCircle, ShieldCheck } from 'lucide-react'
import { validateFile } from '@/services/storage'

interface CustomerAddressProofUploadProps {
  selectedFile: File | null
  onFileSelect: (file: File | null) => void
  error?: string
  disabled?: boolean
}

export const CustomerAddressProofUpload: React.FC<CustomerAddressProofUploadProps> = ({
  selectedFile,
  onFileSelect,
  error,
  disabled = false,
}) => {
  const { t } = useTranslation()
  const [filePreview, setFilePreview] = useState<string | null>(null)
  const [localError, setLocalError] = useState<string | null>(null)

  const handleFileChange = (file?: File) => {
    setLocalError(null)
    if (!file) {
      onFileSelect(null)
      setFilePreview(null)
      return
    }

    const validation = validateFile(file, {
      maxSizeMb: 10,
      allowedTypes: ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'],
    })

    if (!validation.valid) {
      setLocalError(validation.error || 'Invalid file format or size')
      return
    }

    onFileSelect(file)

    if (file.type.startsWith('image/')) {
      const reader = new FileReader()
      reader.onload = e => setFilePreview(e.target?.result as string)
      reader.readAsDataURL(file)
    } else {
      setFilePreview(null)
    }
  }

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation()
    onFileSelect(null)
    setFilePreview(null)
    setLocalError(null)
  }

  const displayError = error || localError

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-xs font-semibold text-slate-800 dark:text-zinc-200 flex items-center gap-1.5">
          <span>{t('registerPage.addressProofLabel', 'Address Proof (Mandatory) *')}</span>
        </label>
        <span className="text-[11px] text-slate-500 dark:text-zinc-400">
          {t('registerPage.addressProofFormats', 'JPG, PNG, WEBP, PDF up to 10MB')}
        </span>
      </div>

      <div className="border-2 border-dashed border-slate-300 dark:border-zinc-700 hover:border-amber-500 dark:hover:border-amber-400 bg-slate-50/50 dark:bg-zinc-800/40 rounded-xl p-4 text-center transition-colors">
        {selectedFile ? (
          <div className="flex flex-col items-center">
            {filePreview ? (
              <img
                src={filePreview}
                alt="Address Proof Preview"
                className="max-h-32 rounded-lg object-contain border border-slate-200 dark:border-zinc-700 mb-2 shadow-xs"
              />
            ) : (
              <div className="w-12 h-12 bg-amber-500/10 rounded-xl flex items-center justify-center mb-2">
                <FileText className="w-6 h-6 text-amber-600 dark:text-amber-400" />
              </div>
            )}
            <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-800 dark:text-zinc-200 max-w-full">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
              <span className="truncate">{selectedFile.name}</span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-zinc-400 mt-0.5">
              {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
            </p>
            {!disabled && (
              <button
                type="button"
                onClick={handleRemove}
                className="text-xs text-red-500 hover:text-red-400 mt-2 flex items-center gap-1 cursor-pointer font-medium"
              >
                <X className="w-3.5 h-3.5" />
                <span>{t('registerPage.removeFile', 'Remove document')}</span>
              </button>
            )}
          </div>
        ) : (
          <>
            <input
              type="file"
              id="customer-address-proof"
              accept="image/jpeg,image/png,image/webp,application/pdf"
              className="hidden"
              disabled={disabled}
              onChange={e => handleFileChange(e.target.files?.[0])}
            />
            <label
              htmlFor="customer-address-proof"
              className={`flex flex-col items-center gap-2 cursor-pointer ${
                disabled ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-600 dark:text-amber-400">
                <UploadCloud className="w-5 h-5" />
              </div>
              <span className="text-xs font-semibold text-slate-700 dark:text-zinc-300">
                {t('registerPage.uploadAddressProofPrompt', 'Click to upload Electricity Bill, Voter ID, Ration Card, or Masked Aadhaar')}
              </span>
              <span className="text-[11px] text-slate-500 dark:text-zinc-400">
                {t('registerPage.addressProofPrivacyHint', 'Stored in a private storage bucket for address verification only.')}
              </span>
            </label>
          </>
        )}
      </div>

      {displayError && (
        <div className="flex items-center gap-1.5 text-xs text-red-500 dark:text-red-400 mt-1">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
          <span>{displayError}</span>
        </div>
      )}

      <div className="flex items-start gap-1.5 text-[11px] text-slate-500 dark:text-zinc-400">
        <ShieldCheck className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
        <span>
          {t(
            'registerPage.addressProofNotice',
            'Your document is never shared with workers or third parties. It is accessible exclusively to administrators for customer safety verification.'
          )}
        </span>
      </div>
    </div>
  )
}

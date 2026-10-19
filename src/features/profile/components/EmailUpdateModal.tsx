import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Button, Input, Modal } from '@kaamgar/ui'
import { AlertCircle, Mail } from 'lucide-react'

interface EmailUpdateModalProps {
  isOpen: boolean
  initialEmail: string
  onClose: () => void
  onUpdateEmail: (email: string) => Promise<void>
}

export function EmailUpdateModal({
  isOpen,
  initialEmail,
  onClose,
  onUpdateEmail,
}: EmailUpdateModalProps) {
  const { t } = useTranslation()
  const [emailModalInput, setEmailModalInput] = useState(initialEmail || '')
  const [isSavingEmail, setIsSavingEmail] = useState(false)
  const [emailModalError, setEmailModalError] = useState('')

  const handleClose = () => {
    setEmailModalError('')
    setEmailModalInput('')
    onClose()
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setEmailModalError('')
    const trimmed = emailModalInput.trim()
    if (!trimmed || !trimmed.includes('@')) {
      setEmailModalError('Please enter a valid email address')
      return
    }

    setIsSavingEmail(true)
    try {
      await onUpdateEmail(trimmed)
      handleClose()
    } catch (err) {
      setEmailModalError(err instanceof Error ? err.message : 'Failed to save email')
    } finally {
      setIsSavingEmail(false)
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={t('profile.emailModalTitle', 'Email / Gmail Address')}
      description={t('profile.emailModalDesc', 'Link your email to receive official receipts and job notifications.')}
    >
      <form onSubmit={handleSubmit} className="space-y-4 pt-2">
        {emailModalError && (
          <div className="p-3 bg-gray-900 border border-red-800 rounded-lg text-xs flex items-center gap-2 shadow-md">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
            <span className="text-red-300">{emailModalError}</span>
          </div>
        )}
        <Input
          label={t('profile.emailLabel', 'Email Address')}
          type="email"
          value={emailModalInput}
          onChange={e => setEmailModalInput(e.target.value)}
          placeholder="yourname@gmail.com"
          leftIcon={<Mail className="w-4 h-4 text-semantic-text-tertiary" />}
          required
          autoFocus
        />
        <div className="flex gap-3 justify-end pt-3">
          <Button
            type="button"
            variant="secondary"
            onClick={handleClose}
          >
            {t('common.cancel', 'Cancel')}
          </Button>
          <Button type="submit" variant="primary" loading={isSavingEmail}>
            {t('profile.saveEmail', 'Save Email')}
          </Button>
        </div>
      </form>
    </Modal>
  )
}

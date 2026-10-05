import { useTranslation } from 'react-i18next'
import { Button, Modal } from '@kaamgar/ui'

interface LogoutConfirmModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => Promise<void>
}

export function LogoutConfirmModal({
  isOpen,
  onClose,
  onConfirm,
}: LogoutConfirmModalProps) {
  const { t } = useTranslation()

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={t('profile.logoutModalTitle', 'Logout Confirmation')}
      description={t('profile.logoutModalDesc', 'Are you sure you want to sign out of your account?')}
    >
      <div className="flex gap-3 justify-end pt-4">
        <Button variant="secondary" onClick={onClose}>
          {t('common.cancel', 'Cancel')}
        </Button>
        <Button
          variant="danger"
          onClick={onConfirm}
        >
          {t('profile.confirmLogout', 'Confirm Logout')}
        </Button>
      </div>
    </Modal>
  )
}

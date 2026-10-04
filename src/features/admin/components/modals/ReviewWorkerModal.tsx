import { Modal, Button } from '@kaamgar/ui'
import type { AdminWorkerRow } from '../../types'

interface ReviewWorkerModalProps {
  showActionModal: boolean
  onClose: () => void
  selectedWorkerForAction: AdminWorkerRow | null
  actionType: 'approve' | 'reject'
  rejectionReason: string
  setRejectionReason: (reason: string) => void
  confirmAction: () => Promise<void>
  isSubmittingReview: boolean
}

export function ReviewWorkerModal({
  showActionModal,
  onClose,
  selectedWorkerForAction,
  actionType,
  rejectionReason,
  setRejectionReason,
  confirmAction,
  isSubmittingReview,
}: ReviewWorkerModalProps) {
  return (
    <Modal
      isOpen={showActionModal}
      onClose={onClose}
      title={actionType === 'approve' ? 'Approve Worker Registration' : 'Reject Worker Registration'}
      description={
        actionType === 'approve'
          ? `Are you sure you want to approve ${selectedWorkerForAction?.name}? They will immediately appear in the public worker directory.`
          : `Please specify why ${selectedWorkerForAction?.name} is being rejected so they can correct their registration.`
      }
    >
      <div className="space-y-4 pt-2">
        {actionType === 'reject' && (
          <div>
            <label className="block text-sm font-medium text-semantic-text-secondary mb-1">
              Reason for Rejection
            </label>
            <textarea
              value={rejectionReason}
              onChange={e => setRejectionReason(e.target.value)}
              placeholder="e.g. Incomplete ID verification, invalid phone number, or mismatched service area."
              rows={3}
              className="w-full bg-surface-200 border border-semantic-border-medium rounded-lg p-3 text-sm text-semantic-text-primary focus:outline-none focus:border-brand-500"
            />
          </div>
        )}

        <div className="flex gap-3 justify-end pt-2">
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant={actionType === 'approve' ? 'primary' : 'danger'}
            onClick={confirmAction}
            loading={isSubmittingReview}
          >
            {actionType === 'approve' ? 'Confirm Approval' : 'Confirm Rejection'}
          </Button>
        </div>
      </div>
    </Modal>
  )
}

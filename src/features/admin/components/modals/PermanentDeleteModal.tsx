import { Modal, Badge, Button } from '@kaamgar/ui'
import { AlertCircle, Trash2 } from 'lucide-react'
import type { ProfileToDelete } from '../../types'

interface PermanentDeleteModalProps {
  profileToDelete: ProfileToDelete | null
  onClose: () => void
  isDeletingProfile: boolean
  deleteProfileError: string
  handleExecutePermanentDelete: () => Promise<void>
}

export function PermanentDeleteModal({
  profileToDelete,
  onClose,
  isDeletingProfile,
  deleteProfileError,
  handleExecutePermanentDelete,
}: PermanentDeleteModalProps) {
  return (
    <Modal
      isOpen={Boolean(profileToDelete)}
      onClose={() => {
        if (!isDeletingProfile) {
          onClose()
        }
      }}
      title={`Permanently Delete ${profileToDelete?.role === 'worker' ? 'Worker' : 'Customer'}?`}
      size="md"
    >
      {profileToDelete && (
        <div className="space-y-4 pt-2">
          {/* Warning Box */}
          <div className="p-3.5 bg-rose-500/10 border border-rose-500/30 rounded-xl flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
            <div className="text-xs text-rose-200">
              <strong className="block text-rose-400 font-semibold mb-0.5">
                Warning: Irreversible Deletion
              </strong>
              This action will permanently purge this account from the platform database. This action cannot be undone.
            </div>
          </div>

          {/* Target Account Summary */}
          <div className="p-3.5 bg-surface-200/60 border border-semantic-border-light rounded-xl space-y-2 text-xs">
            <div className="flex justify-between items-center">
              <span className="text-semantic-text-tertiary">Full Name:</span>
              <span className="font-semibold text-semantic-text-primary">{profileToDelete.name}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-semantic-text-tertiary">Phone Number:</span>
              <span className="font-semibold text-semantic-text-primary">{profileToDelete.phone}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-semantic-text-tertiary">Account Role:</span>
              <Badge variant={profileToDelete.role === 'worker' ? 'primary' : 'outline'} className="capitalize">
                {profileToDelete.role}
              </Badge>
            </div>
            {profileToDelete.statsHint && (
              <div className="flex justify-between items-center pt-1.5 border-t border-semantic-border-light/40">
                <span className="text-semantic-text-tertiary">History:</span>
                <span className="text-semantic-text-secondary">{profileToDelete.statsHint}</span>
              </div>
            )}
          </div>

          {/* Scope of removal */}
          <div className="text-xs text-semantic-text-secondary space-y-1">
            <p className="font-medium text-semantic-text-primary">The following will be completely purged:</p>
            <ul className="list-disc pl-4 space-y-0.5 text-semantic-text-tertiary">
              <li>Profile details & login authentication credentials</li>
              <li>All past and active booking requests and appointments</li>
              <li>All customer ratings, reviews, and feedback records</li>
              {profileToDelete.role === 'worker' && (
                <li>Service categories, assigned areas, and ID documents</li>
              )}
            </ul>
          </div>

          {deleteProfileError && (
            <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{deleteProfileError}</span>
            </div>
          )}

          <div className="flex justify-end gap-2.5 pt-3 border-t border-semantic-border-light">
            <Button
              variant="secondary"
              onClick={onClose}
              disabled={isDeletingProfile}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={handleExecutePermanentDelete}
              loading={isDeletingProfile}
              className="bg-rose-600 hover:bg-rose-700 text-white font-medium"
            >
              <Trash2 className="w-4 h-4 mr-1.5" />
              Yes, Permanently Delete
            </Button>
          </div>
        </div>
      )}
    </Modal>
  )
}

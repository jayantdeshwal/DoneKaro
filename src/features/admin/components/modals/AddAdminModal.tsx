import { Modal, Button } from '@kaamgar/ui'
import { Shield, AlertCircle, CheckCircle, UserPlus } from 'lucide-react'

interface AddAdminModalProps {
  showAddAdminModal: boolean
  onClose: () => void
  handleCreateAdmin: (e: React.FormEvent) => Promise<void>
  newAdminFullName: string
  setNewAdminFullName: (val: string) => void
  newAdminEmail: string
  setNewAdminEmail: (val: string) => void
  newAdminPhone: string
  setNewAdminPhone: (val: string) => void
  isSubmittingNewAdmin: boolean
  addAdminError: string
  addAdminSuccess: string
}

export function AddAdminModal({
  showAddAdminModal,
  onClose,
  handleCreateAdmin,
  newAdminFullName,
  setNewAdminFullName,
  newAdminEmail,
  setNewAdminEmail,
  newAdminPhone,
  setNewAdminPhone,
  isSubmittingNewAdmin,
  addAdminError,
  addAdminSuccess,
}: AddAdminModalProps) {
  return (
    <Modal
      isOpen={showAddAdminModal}
      onClose={() => {
        if (!isSubmittingNewAdmin) {
          onClose()
        }
      }}
      title="Provision New Administrator"
      description="Add a trusted team member as an administrator"
      size="md"
    >
      <form onSubmit={handleCreateAdmin} className="space-y-4 pt-2">
        {/* Security Alert */}
        <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl flex items-start gap-2.5">
          <Shield className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
          <div className="text-xs text-amber-200">
            <strong className="block text-amber-300 font-semibold mb-0.5">High-Privilege Account</strong>
            New administrators will have full platform permissions including worker approval and profile inspection. They will be required to verify OTP via the mobile number provided below.
          </div>
        </div>

        {addAdminError && (
          <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{addAdminError}</span>
          </div>
        )}

        {addAdminSuccess && (
          <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-lg text-emerald-300 text-xs flex items-center gap-2">
            <CheckCircle className="w-4 h-4 shrink-0" />
            <span>{addAdminSuccess}</span>
          </div>
        )}

        <div>
          <label className="block text-xs font-semibold text-semantic-text-secondary uppercase tracking-wider mb-1">
            Full Name *
          </label>
          <input
            type="text"
            required
            value={newAdminFullName}
            onChange={e => setNewAdminFullName(e.target.value)}
            placeholder="e.g. Ramesh Sharma"
            className="w-full px-3.5 py-2.5 bg-surface-200/80 border border-semantic-border-light rounded-xl text-semantic-text-primary text-sm focus:outline-none focus:border-brand-500 transition-colors"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-semantic-text-secondary uppercase tracking-wider mb-1">
            Official Email Address *
          </label>
          <input
            type="email"
            required
            value={newAdminEmail}
            onChange={e => setNewAdminEmail(e.target.value)}
            placeholder="admin@jugnu.in"
            className="w-full px-3.5 py-2.5 bg-surface-200/80 border border-semantic-border-light rounded-xl text-semantic-text-primary text-sm focus:outline-none focus:border-brand-500 transition-colors"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-semantic-text-secondary uppercase tracking-wider mb-1">
            Administrator Mobile Number (10 digits) *
          </label>
          <div className="relative">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-semantic-text-tertiary text-sm font-medium">
              +91
            </span>
            <input
              type="tel"
              required
              maxLength={10}
              value={newAdminPhone}
              onChange={e => setNewAdminPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
              placeholder="9876543210"
              className="w-full pl-12 pr-3.5 py-2.5 bg-surface-200/80 border border-semantic-border-light rounded-xl text-semantic-text-primary text-sm focus:outline-none focus:border-brand-500 transition-colors tracking-wider"
            />
          </div>
          <p className="mt-1 text-[11px] text-semantic-text-tertiary">
            Mandatory: Every administrator signs in passwordlessly via a 6-digit MSG91 OTP sent to this number. The number is protected and cannot be changed through the standard profile path.
          </p>
        </div>

        <div className="flex justify-end gap-2.5 pt-3 border-t border-semantic-border-light">
          <Button
            type="button"
            variant="secondary"
            onClick={onClose}
            disabled={isSubmittingNewAdmin}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            loading={isSubmittingNewAdmin}
            className="bg-brand-500 hover:bg-brand-600 text-surface-950 font-semibold"
          >
            <UserPlus className="w-4 h-4 mr-1.5" />
            Provision Administrator
          </Button>
        </div>
      </form>
    </Modal>
  )
}

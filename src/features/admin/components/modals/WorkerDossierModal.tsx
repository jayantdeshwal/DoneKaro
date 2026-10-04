import { Modal, Avatar, Badge, Button } from '@kaamgar/ui'
import {
  ExternalLink,
  Camera,
  MapPin,
  User,
  IdCard,
  Trash2,
} from 'lucide-react'
import type { AdminWorkerRow, ProfileToDelete } from '../../types'
import { displayMetric } from '../../constants'

interface WorkerDossierModalProps {
  inspectWorker: AdminWorkerRow | null
  onClose: () => void
  handleViewIdDocument: (path: string) => Promise<void>
  loadingSignedDoc: boolean
  signedDocError: string
  setProfileToDelete: (profile: ProfileToDelete | null) => void
  handleOpenActionModal: (worker: AdminWorkerRow, type: 'approve' | 'reject') => void
}

export function WorkerDossierModal({
  inspectWorker,
  onClose,
  handleViewIdDocument,
  loadingSignedDoc,
  signedDocError,
  setProfileToDelete,
  handleOpenActionModal,
}: WorkerDossierModalProps) {
  return (
    <Modal
      isOpen={Boolean(inspectWorker)}
      onClose={onClose}
      title="Worker Dossier"
      description="Detailed background & activity record"
      size="lg"
    >
      {inspectWorker && (
        <div className="space-y-6 pt-2">
          <div className="flex items-center gap-4 border-b border-semantic-border-light pb-4">
            <div className="relative group">
              <Avatar
                name={inspectWorker.name}
                src={inspectWorker.avatar_url || undefined}
                size="xl"
                className="w-20 h-20 rounded-2xl shadow-lg border-2 border-brand-500/40 ring-4 ring-brand-500/10 object-cover"
              />
              {inspectWorker.avatar_url && (
                <button
                  type="button"
                  onClick={() => window.open(inspectWorker.avatar_url!, '_blank')}
                  title="View full image in new tab"
                  className="absolute inset-0 bg-surface-950/60 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-semibold gap-1"
                >
                  <ExternalLink className="w-4 h-4" />
                </button>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="text-xl font-bold text-semantic-text-primary">{inspectWorker.name}</h3>
                {inspectWorker.avatar_url && (
                  <Badge variant="success" className="text-[10px] px-1.5 py-0.5 flex items-center gap-1">
                    <Camera className="w-3 h-3" />
                    Photo Uploaded
                  </Badge>
                )}
              </div>
              <p className="text-sm text-semantic-text-secondary mt-0.5">{inspectWorker.phone}</p>
              <div className="flex items-center gap-2 mt-2">
                <Badge
                  variant={
                    inspectWorker.approval_status === 'approved'
                      ? 'success'
                      : inspectWorker.approval_status === 'pending'
                      ? 'warning'
                      : 'danger'
                  }
                >
                  Status: {inspectWorker.approval_status}
                </Badge>
                <Badge variant={inspectWorker.is_available ? 'success' : 'outline'} dot>
                  {inspectWorker.is_available ? 'Available' : 'Offline'}
                </Badge>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
            <div className="p-3 bg-surface-200/60 rounded-xl border border-semantic-border-light">
              <p className="text-xs text-semantic-text-tertiary">Experience</p>
              <p className="text-lg font-bold text-semantic-text-primary mt-0.5">
                {inspectWorker.experience_years} yrs
              </p>
            </div>
            <div className="p-3 bg-surface-200/60 rounded-xl border border-semantic-border-light">
              <p className="text-xs text-semantic-text-tertiary">Rating</p>
              <p className="text-lg font-bold text-amber-400 mt-0.5">
                ★ {inspectWorker.rating > 0 ? inspectWorker.rating.toFixed(1) : 'New'}
              </p>
            </div>
            <div className="p-3 bg-surface-200/60 rounded-xl border border-semantic-border-light">
              <p className="text-xs text-semantic-text-tertiary">Completed Jobs</p>
              <p className="text-lg font-bold text-emerald-400 mt-0.5">
                {displayMetric(inspectWorker.completed_jobs)}
              </p>
            </div>
            <div className="p-3 bg-surface-200/60 rounded-xl border border-semantic-border-light">
              <p className="text-xs text-semantic-text-tertiary">Total Bookings</p>
              <p className="text-lg font-bold text-semantic-text-primary mt-0.5">
                {displayMetric(inspectWorker.total_bookings)}
              </p>
            </div>
          </div>

          <div>
            <p className="text-xs font-semibold text-semantic-text-secondary uppercase mb-1">
              Service Categories
            </p>
            <div className="flex flex-wrap gap-2">
              {inspectWorker.categories.length > 0 ? (
                inspectWorker.categories.map(cat => (
                  <Badge key={cat} variant="primary" className="capitalize">
                    {cat}
                  </Badge>
                ))
              ) : (
                <span className="text-sm text-semantic-text-tertiary">None assigned</span>
              )}
            </div>
          </div>

          <div>
            <p className="text-xs font-semibold text-semantic-text-secondary uppercase mb-1">
              Service Area Pincodes
            </p>
            <div className="flex flex-wrap gap-2">
              {inspectWorker.areas.length > 0 ? (
                inspectWorker.areas.map(area => (
                  <Badge key={area} variant="outline">
                    <MapPin className="w-3 h-3 mr-1" />
                    {area}
                  </Badge>
                ))
              ) : (
                <span className="text-sm text-semantic-text-tertiary">None specified</span>
              )}
            </div>
          </div>

          {/* Worker Photo & Identification Documents Section */}
          <div>
            <p className="text-xs font-semibold text-semantic-text-secondary uppercase mb-2">
              Worker Photo & Identification Documents
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* 1. Worker Profile Photo Card */}
              <div className="p-3.5 bg-surface-200/60 rounded-xl border border-semantic-border-light flex flex-col justify-between gap-3">
                <div className="flex items-center gap-3">
                  {inspectWorker.avatar_url ? (
                    <div
                      className="relative group cursor-pointer flex-shrink-0"
                      onClick={() => window.open(inspectWorker.avatar_url!, '_blank')}
                      title="Click to view full photo"
                    >
                      <img
                        src={inspectWorker.avatar_url}
                        alt={inspectWorker.name}
                        className="w-16 h-16 rounded-xl object-cover border border-semantic-border-medium shadow-sm hover:opacity-90 transition-opacity"
                      />
                      <div className="absolute inset-0 bg-surface-950/40 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                        <ExternalLink className="w-4 h-4" />
                      </div>
                    </div>
                  ) : (
                    <div className="w-16 h-16 rounded-xl bg-surface-300 border border-semantic-border-medium flex items-center justify-center text-semantic-text-tertiary flex-shrink-0">
                      <User className="w-8 h-8 opacity-40" />
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <p className="text-xs font-bold text-semantic-text-primary">Worker Profile Photo</p>
                      {inspectWorker.avatar_url ? (
                        <Badge variant="success" className="text-[10px] px-1 py-0.5">Active</Badge>
                      ) : (
                        <Badge variant="outline" className="text-[10px] px-1 py-0.5 text-amber-400">Missing</Badge>
                      )}
                    </div>
                    <p className="text-[11px] text-semantic-text-tertiary mt-0.5">
                      {inspectWorker.avatar_url
                        ? 'Public profile avatar from Supabase Storage'
                        : 'No profile photograph uploaded yet.'}
                    </p>
                  </div>
                </div>

                {inspectWorker.avatar_url && (
                  <div className="pt-2 border-t border-semantic-border-light/60 flex justify-end">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.open(inspectWorker.avatar_url!, '_blank')}
                      className="text-xs flex items-center gap-1.5 text-brand-400 border-brand-500/30 hover:bg-brand-500/10"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      View Full Photo
                    </Button>
                  </div>
                )}
              </div>

              {/* 2. Government ID Verification Document Card */}
              <div className="p-3.5 bg-surface-200/60 rounded-xl border border-semantic-border-light flex flex-col justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-16 h-16 rounded-xl bg-brand-500/10 border border-brand-500/20 flex items-center justify-center text-brand-400 flex-shrink-0">
                    <IdCard className="w-8 h-8" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <p className="text-xs font-bold text-semantic-text-primary">Government ID Proof</p>
                      {inspectWorker.id_proof_url ? (
                        <Badge variant="success" className="text-[10px] px-1 py-0.5">Attached</Badge>
                      ) : (
                        <Badge variant="outline" className="text-[10px] px-1 py-0.5 text-amber-400">Missing</Badge>
                      )}
                    </div>
                    <p className="text-[11px] text-semantic-text-tertiary mt-0.5 truncate">
                      {inspectWorker.id_proof_url ? inspectWorker.id_proof_url.split('/').pop() : 'No ID document attached.'}
                    </p>
                  </div>
                </div>

                {inspectWorker.id_proof_url && (
                  <div className="pt-2 border-t border-semantic-border-light/60 flex justify-end">
                    <Button
                      variant="outline"
                      size="sm"
                      loading={loadingSignedDoc}
                      onClick={() => handleViewIdDocument(inspectWorker.id_proof_url!)}
                      className="flex items-center gap-1.5 text-xs text-brand-400 border-brand-500/30 hover:bg-brand-500/10"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      View ID Document
                    </Button>
                  </div>
                )}
              </div>
            </div>
            {signedDocError && (
              <p className="mt-1 text-xs text-red-400">{signedDocError}</p>
            )}
          </div>

          {inspectWorker.bio && (
            <div>
              <p className="text-xs font-semibold text-semantic-text-secondary uppercase mb-1">
                Worker Bio
              </p>
              <p className="text-sm text-semantic-text-secondary p-3 bg-surface-200/60 rounded-lg border border-semantic-border-light whitespace-pre-line">
                {inspectWorker.bio}
              </p>
            </div>
          )}

          {inspectWorker.rejection_reason && (
            <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
              <p className="font-semibold text-xs uppercase mb-1">Rejection Note</p>
              <p>{inspectWorker.rejection_reason}</p>
            </div>
          )}

          <div className="flex justify-between items-center pt-4 border-t border-semantic-border-light">
            <div className="flex items-center gap-2">
              <Button variant="secondary" onClick={onClose}>
                Close
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  const w = inspectWorker
                  setProfileToDelete({
                    id: w.id,
                    name: w.name,
                    phone: w.phone,
                    role: 'worker',
                    statsHint: `${displayMetric(w.completed_jobs)} completed jobs, ${displayMetric(w.total_bookings)} total bookings`,
                  })
                }}
                className="text-xs text-rose-400 hover:text-rose-300 hover:bg-rose-500/10"
              >
                <Trash2 className="w-3.5 h-3.5 mr-1" />
                Delete Worker
              </Button>
            </div>
            <div className="flex gap-2">
              {inspectWorker.approval_status !== 'approved' && (
                <Button
                  variant="primary"
                  onClick={() => {
                    const w = inspectWorker
                    onClose()
                    handleOpenActionModal(w, 'approve')
                  }}
                >
                  Approve Worker
                </Button>
              )}
              {inspectWorker.approval_status !== 'rejected' && (
                <Button
                  variant="danger"
                  onClick={() => {
                    const w = inspectWorker
                    onClose()
                    handleOpenActionModal(w, 'reject')
                  }}
                >
                  Reject Worker
                </Button>
              )}
            </div>
          </div>
        </div>
      )}
    </Modal>
  )
}

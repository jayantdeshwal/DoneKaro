import { useTranslation } from 'react-i18next'
import { Modal, Avatar, Badge, Button } from '@kaamgar/ui'
import { Trash2 } from 'lucide-react'
import type { AdminCustomerRow, AdminBooking, ProfileToDelete } from '../../types'
import { BOOKING_STATUS_OPTIONS, bookingStatusVariant, displayMetric } from '../../constants'

interface CustomerDossierModalProps {
  inspectCustomer: AdminCustomerRow | null
  onClose: () => void
  bookings: AdminBooking[]
  setProfileToDelete: (profile: ProfileToDelete | null) => void
}

export function CustomerDossierModal({
  inspectCustomer,
  onClose,
  bookings,
  setProfileToDelete,
}: CustomerDossierModalProps) {
  const { t } = useTranslation()

  return (
    <Modal
      isOpen={Boolean(inspectCustomer)}
      onClose={onClose}
      title="Customer Record"
      description="Booking history & details"
      size="lg"
    >
      {inspectCustomer && (
        <div className="space-y-6 pt-2">
          <div className="flex items-center gap-4 border-b border-semantic-border-light pb-4">
            <Avatar name={inspectCustomer.name} src={inspectCustomer.avatar_url || undefined} size="lg" />
            <div>
              <h3 className="text-lg font-bold text-semantic-text-primary">{inspectCustomer.name}</h3>
              <p className="text-sm text-semantic-text-secondary">{inspectCustomer.phone}</p>
              <p className="text-xs text-semantic-text-tertiary mt-1">
                Registered:{' '}
                {new Date(inspectCustomer.created_at).toLocaleDateString('en-IN', {
                  dateStyle: 'long',
                })}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4 text-center">
            <div className="p-3 bg-surface-200/60 rounded-xl border border-semantic-border-light">
              <p className="text-xs text-semantic-text-tertiary">Total Bookings</p>
              <p className="text-xl font-bold text-semantic-text-primary mt-0.5">
                {displayMetric(inspectCustomer.total_bookings)}
              </p>
            </div>
            <div className="p-3 bg-surface-200/60 rounded-xl border border-semantic-border-light">
              <p className="text-xs text-semantic-text-tertiary">Completed</p>
              <p className="text-xl font-bold text-emerald-400 mt-0.5">
                {displayMetric(inspectCustomer.completed_bookings)}
              </p>
            </div>
            <div className="p-3 bg-surface-200/60 rounded-xl border border-semantic-border-light">
              <p className="text-xs text-semantic-text-tertiary">Active / In Progress</p>
              <p className="text-xl font-bold text-brand-400 mt-0.5">
                {displayMetric(inspectCustomer.active_bookings)}
              </p>
            </div>
          </div>

          <div>
            <p className="text-xs font-semibold text-semantic-text-secondary uppercase mb-2">
              Booking History with DoneKaro
            </p>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {bookings.filter(b => b.customer_id === inspectCustomer.id).length === 0 ? (
                <p className="text-sm text-semantic-text-tertiary italic p-3 bg-surface-200/40 rounded-lg">
                  No bookings recorded for this customer yet.
                </p>
              ) : (
                bookings
                  .filter(b => b.customer_id === inspectCustomer.id)
                  .map(b => (
                    <div
                      key={b.id}
                      className="flex items-center justify-between p-3 bg-surface-200/60 rounded-lg border border-semantic-border-light text-sm"
                    >
                      <div>
                        <p className="font-medium text-semantic-text-primary">
                          {b.category_id} with {b.workerName}
                        </p>
                        <p className="text-xs text-semantic-text-tertiary">
                          {b.scheduled_at
                            ? new Date(b.scheduled_at).toLocaleDateString('en-IN')
                            : 'No date'}
                        </p>
                      </div>
                      <Badge variant={bookingStatusVariant(b.status)}>
                        {t(
                          BOOKING_STATUS_OPTIONS.find(status => status.key === b.status)?.labelKey ?? '',
                          BOOKING_STATUS_OPTIONS.find(status => status.key === b.status)?.fallback ?? b.status,
                        )}
                      </Badge>
                    </div>
                  ))
              )}
            </div>
          </div>

          <div className="flex justify-between items-center pt-2 border-t border-semantic-border-light">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                const c = inspectCustomer
                setProfileToDelete({
                  id: c.id,
                  name: c.name,
                  phone: c.phone,
                  role: 'customer',
                  statsHint: `${displayMetric(c.total_bookings)} bookings (${displayMetric(c.completed_bookings)} completed)`,
                })
              }}
              className="text-xs text-rose-400 hover:text-rose-300 hover:bg-rose-500/10"
            >
              <Trash2 className="w-3.5 h-3.5 mr-1" />
              Delete Customer
            </Button>
            <Button variant="secondary" onClick={onClose}>
              Close
            </Button>
          </div>
        </div>
      )}
    </Modal>
  )
}

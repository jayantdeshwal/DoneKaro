import { Modal } from '@kaamgar/ui'
import { MUZAFFARNAGAR_PINCODES } from '@kaamgar/shared'
import { MapPin } from 'lucide-react'

interface ServiceLocalitiesModalProps {
  isOpen: boolean
  onClose: () => void
}

export function ServiceLocalitiesModal({
  isOpen,
  onClose,
}: ServiceLocalitiesModalProps) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Muzaffarnagar Service Localities"
      description="Jugnu operates across verified service localities in Muzaffarnagar."
    >
      <div className="space-y-2.5 pt-2">
        {MUZAFFARNAGAR_PINCODES.map(pincode => (
          <div
            key={pincode}
            className="p-3.5 rounded-2xl bg-slate-50 dark:bg-zinc-800/70 border border-slate-200 dark:border-zinc-700 flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                <MapPin className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-900 dark:text-white">
                  {pincode === '251001' ? 'City / New Mandi' : 'Cantt / Civil Lines'}
                </p>
                <p className="text-[11px] text-slate-500 dark:text-zinc-400">
                  Pincode: {pincode} • Active Coverage
                </p>
              </div>
            </div>
            <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/15 px-2 py-0.5 rounded-full border border-emerald-500/30">
              Active
            </span>
          </div>
        ))}
      </div>
    </Modal>
  )
}

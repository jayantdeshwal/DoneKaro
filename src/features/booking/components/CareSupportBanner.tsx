import { useTranslation } from 'react-i18next'
import { Shield, ShieldAlert } from 'lucide-react'
import { useSupport } from '@/features/support'

interface CareSupportBannerProps {
  upcomingBookingId?: string
}

export function CareSupportBanner({ upcomingBookingId }: CareSupportBannerProps) {
  const { i18n } = useTranslation()
  const { openSupport } = useSupport()

  return (
    <div className="mb-6 p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-amber-500/30 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-lg shrink-0">
          🛡️
        </div>
        <div>
          <h3 className="text-xs font-bold text-slate-900 dark:text-white">
            {i18n.language === 'hi' ? 'DoneKaro केयर एवं सहायता' : 'DoneKaro Care & Support'}
          </h3>
          <p className="text-[11px] text-slate-500 dark:text-zinc-400">
            {i18n.language === 'hi'
              ? 'बुकिंग में देरी, सवाल या कामगार से संपर्क में तुरंत मदद पाएं'
              : 'Get quick assistance with booking status, worker contact, or scheduling'}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2 w-full sm:w-auto shrink-0">
        <button
          onClick={() => openSupport({ bookingId: upcomingBookingId })}
          className="flex-1 sm:flex-initial px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-sm cursor-pointer"
        >
          <Shield className="w-3.5 h-3.5" />
          <span>{i18n.language === 'hi' ? 'सहायता' : 'Need Help?'}</span>
        </button>
        <button
          onClick={() => openSupport({ bookingId: upcomingBookingId, defaultTab: 'complaint' })}
          className="flex-1 sm:flex-initial px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-sm cursor-pointer"
        >
          <ShieldAlert className="w-3.5 h-3.5" />
          <span>{i18n.language === 'hi' ? 'केयर एवं सहायता' : 'Care & Support'}</span>
        </button>
      </div>
    </div>
  )
}

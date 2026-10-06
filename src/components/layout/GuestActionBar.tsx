import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../../context/AuthContext'
import { useSupport } from '@/features/support'
import { Button } from '@kaamgar/ui'
import { Sparkles, ShieldAlert } from 'lucide-react'

export function GuestActionBar() {
  const { t, i18n } = useTranslation()
  const { isAuthenticated } = useAuth()
  const { openSupport } = useSupport()
  const navigate = useNavigate()
  const isGuestMode = typeof window !== 'undefined' && sessionStorage.getItem('donekaro_guest_mode') === 'true'

  if (isAuthenticated || !isGuestMode) return null

  const handleBackToLogin = () => {
    sessionStorage.removeItem('donekaro_guest_mode')
    window.dispatchEvent(new Event('storage'))
    navigate('/login')
  }

  return (
    <div className="hidden md:block sticky bottom-0 z-40 bg-white/95 dark:bg-zinc-950/95 backdrop-blur-md border-t border-amber-500/30 px-4 py-2.5 shadow-2xl">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-xs text-amber-700 dark:text-amber-300 font-medium truncate">
          <Sparkles className="w-4 h-4 text-amber-500 shrink-0" />
          <span className="truncate">{t('guestBar.exploringAsGuest', 'Exploring in Guest Mode')}</span>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => openSupport()}
            className="flex items-center gap-1.5 text-xs text-rose-600 dark:text-rose-400 hover:text-rose-700 dark:hover:text-rose-300 px-2.5 py-1 rounded-lg border border-rose-200 dark:border-rose-900/60 hover:bg-rose-50 dark:hover:bg-rose-950/40 cursor-pointer transition-colors"
          >
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>{i18n.language === 'hi' ? 'केयर एवं सहायता' : 'Care & Support'}</span>
          </button>
          <button
            type="button"
            onClick={handleBackToLogin}
            className="text-xs text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white px-2.5 py-1 rounded-lg border border-slate-200 dark:border-zinc-700 hover:bg-slate-100 dark:hover:bg-zinc-800 cursor-pointer transition-colors"
          >
            {t('common.exit', 'Exit Guest')}
          </button>
          <Button
            variant="primary"
            size="sm"
            onClick={() => navigate('/login')}
            className="text-xs font-bold shadow-md shadow-amber-500/20"
          >
            {t('nav.loginSignup', 'Sign In / Register')}
          </Button>
        </div>
      </div>
    </div>
  )
}

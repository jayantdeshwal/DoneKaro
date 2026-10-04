import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useLanguage } from '../../context/LanguageContext'
import { useAuth } from '../../context/AuthContext'
import { CATEGORIES, getCategoryName } from '@kaamgar/shared'
import { ShieldCheck, ArrowRight, MapPin, Mail, Heart } from 'lucide-react'
import JugnuLogo from '../common/JugnuLogo'

export function AppFooter() {
  const { t } = useTranslation()
  const { language } = useLanguage()
  const { isAuthenticated } = useAuth()

  return (
    <footer className={`bg-slate-50 dark:bg-zinc-950 text-slate-600 dark:text-zinc-400 border-t border-slate-200 dark:border-zinc-800 pt-14 ${!isAuthenticated ? 'pb-24 sm:pb-28' : 'pb-10'}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 lg:gap-8 pb-12 border-b border-slate-200 dark:border-zinc-800">
          {/* Column 1: Brand & Identity (spans 2 cols on lg) */}
          <div className="lg:col-span-2 space-y-4">
            <Link to="/" className="inline-flex items-center gap-3 group">
              <JugnuLogo className="w-10 h-10 group-hover:scale-105 transition-transform" />
              <div>
                <span className="font-extrabold text-xl tracking-tight text-slate-900 dark:text-white block">
                  {t('app.name')}
                </span>
                <span className="text-xs text-amber-600 dark:text-amber-400 font-semibold">
                  {t('app.tagline')}
                </span>
              </div>
            </Link>
            <p className="text-sm text-slate-600 dark:text-zinc-400 max-w-sm leading-relaxed">
              {t('footer.tagline')}
            </p>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-xs text-slate-600 dark:text-zinc-400 shadow-xs">
              <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
              <span>{t('footer.pilotNotice')}</span>
            </div>
          </div>

          {/* Column 2: Quick Links / Explore */}
          <div>
            <h4 className="font-bold text-slate-900 dark:text-white text-xs tracking-wider uppercase mb-4">
              {t('footer.explore')}
            </h4>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link to="/search" className="hover:text-amber-600 dark:hover:text-amber-400 transition-colors flex items-center gap-1.5 group">
                  <ArrowRight className="w-3.5 h-3.5 text-slate-400 dark:text-zinc-500 group-hover:text-amber-500 transition-colors" />
                  <span>{t('nav.search')}</span>
                </Link>
              </li>
              <li>
                <Link to="/bookings" className="hover:text-amber-600 dark:hover:text-amber-400 transition-colors flex items-center gap-1.5 group">
                  <ArrowRight className="w-3.5 h-3.5 text-slate-400 dark:text-zinc-500 group-hover:text-amber-500 transition-colors" />
                  <span>{t('nav.bookings')}</span>
                </Link>
              </li>
              <li>
                <Link to="/register/worker" className="hover:text-amber-600 dark:hover:text-amber-400 transition-colors flex items-center gap-1.5 group">
                  <ArrowRight className="w-3.5 h-3.5 text-slate-400 dark:text-zinc-500 group-hover:text-amber-500 transition-colors" />
                  <span>{t('nav.becomeWorker')}</span>
                </Link>
              </li>
              <li>
                <Link to="/auth" className="hover:text-amber-600 dark:hover:text-amber-400 transition-colors flex items-center gap-1.5 group">
                  <ArrowRight className="w-3.5 h-3.5 text-slate-400 dark:text-zinc-500 group-hover:text-amber-500 transition-colors" />
                  <span>{t('nav.loginSignup', 'Login / Sign Up')}</span>
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 3: Popular Trades (Direct search filter links) */}
          <div>
            <h4 className="font-bold text-slate-900 dark:text-white text-xs tracking-wider uppercase mb-4">
              {t('nav.categories')}
            </h4>
            <ul className="space-y-2.5 text-sm">
              {CATEGORIES.map(cat => (
                <li key={cat.id}>
                  <Link
                    to={`/search?category=${cat.id}`}
                    className="hover:text-amber-600 dark:hover:text-amber-400 transition-colors flex items-center gap-1.5"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500/70" />
                    <span>{getCategoryName(cat, language === 'hi' ? 'hi' : 'en')}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 4: Localities & Support */}
          <div>
            <h4 className="font-bold text-slate-900 dark:text-white text-xs tracking-wider uppercase mb-4">
              {t('footer.localities')}
            </h4>
            <ul className="space-y-2 text-xs mb-5">
              <li>
                <Link
                  to="/search?area=251001"
                  className="hover:text-amber-600 dark:hover:text-amber-400 transition-colors flex items-center gap-1.5"
                >
                  <MapPin className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                  <span>251001 - City / New Mandi</span>
                </Link>
              </li>
              <li>
                <Link
                  to="/search?area=251002"
                  className="hover:text-amber-600 dark:hover:text-amber-400 transition-colors flex items-center gap-1.5"
                >
                  <MapPin className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                  <span>251002 - Cantt / Civil Lines</span>
                </Link>
              </li>
            </ul>

            {/* Help & Support direct links */}
            <div className="pt-3 border-t border-slate-200 dark:border-zinc-800 space-y-1.5">
              <a
                href="mailto:support@jugnu.in"
                className="flex items-center gap-2 text-xs text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white transition-colors"
              >
                <Mail className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">{t('footer.supportEmail')}</span>
              </a>
              <p className="text-[11px] text-slate-500 dark:text-zinc-500">
                {t('footer.supportHelplineHours')}
              </p>
            </div>
          </div>
        </div>

        {/* Bottom Bar: Copyright, Made with love, Disclaimers */}
        <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500 dark:text-zinc-500">
          <p>{t('footer.copyright')}</p>
          <div className="flex items-center gap-1 text-slate-600 dark:text-zinc-400">
            <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500/20" />
            <span>{t('footer.madeWith')}</span>
          </div>
        </div>
      </div>
    </footer>
  )
}

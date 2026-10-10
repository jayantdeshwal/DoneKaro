import { useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
  ArrowLeft,
  Shield,
  FileText,
  Printer,
  Globe,
  CheckCircle2,
  Calendar,
  Lock,
  Scale,
  Users,
  CreditCard,
  AlertTriangle,
} from 'lucide-react'
import { useLanguage } from '@/context/LanguageContext'
import { getTermsContent } from '@/data/termsContent'

// Section icon resolver
const sectionIcons: Record<number, React.ElementType> = {
  1: Users,
  2: CreditCard,
  3: Calendar,
  4: AlertTriangle,
  5: Scale,
  6: Lock,
  7: Shield,
}

export default function Terms() {
  const { t } = useTranslation()
  const { language, toggleLanguage } = useLanguage()
  const navigate = useNavigate()
  const terms = getTermsContent(language)

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [language])

  const handlePrint = () => {
    if (typeof window !== 'undefined') {
      window.print()
    }
  }

  const handleBack = () => {
    if (window.history.length > 2) {
      navigate(-1)
    } else {
      navigate('/')
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-surface-950 text-slate-900 dark:text-semantic-text-primary py-8 sm:py-12 transition-colors">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Navigation & Controls Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-6 sm:mb-8 print:hidden">
          <button
            type="button"
            onClick={handleBack}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold text-slate-700 dark:text-zinc-200 bg-white dark:bg-surface-900 border border-slate-200 dark:border-semantic-border-light hover:bg-slate-100 dark:hover:bg-surface-800 transition-colors shadow-sm cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>{language === 'hi' ? 'वापस जाएं' : 'Back'}</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={toggleLanguage}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs sm:text-sm font-semibold text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-brand-500/10 border border-amber-200 dark:border-brand-500/30 hover:bg-amber-100 dark:hover:bg-brand-500/20 transition-colors shadow-sm cursor-pointer"
              title={language === 'en' ? 'Switch to Hindi' : 'Switch to English'}
            >
              <Globe className="w-4 h-4" />
              <span>{language === 'en' ? 'हिंदी में पढ़ें' : 'Read in English'}</span>
            </button>

            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs sm:text-sm font-medium text-slate-600 dark:text-zinc-300 bg-white dark:bg-surface-900 border border-slate-200 dark:border-semantic-border-light hover:bg-slate-100 dark:hover:bg-surface-800 transition-colors shadow-sm cursor-pointer"
              title="Print document"
            >
              <Printer className="w-4 h-4" />
              <span className="hidden sm:inline">{language === 'hi' ? 'प्रिंट करें' : 'Print'}</span>
            </button>
          </div>
        </div>

        {/* Document Header Card */}
        <header className="rounded-3xl bg-white dark:bg-surface-900 border border-slate-200 dark:border-semantic-border-light p-6 sm:p-10 shadow-sm dark:shadow-xl relative overflow-hidden mb-8">
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-amber-500 via-brand-500 to-emerald-500" />

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-100 dark:bg-brand-500/15 text-amber-800 dark:text-amber-400 text-xs font-bold tracking-wide uppercase mb-3">
                <FileText className="w-3.5 h-3.5" />
                <span>{language === 'hi' ? 'कानूनी अनुबंध • नियम एवं शर्तें' : 'Legal Agreement • Terms of Service'}</span>
              </div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight leading-tight">
                {terms.title}
              </h1>
              <p className="text-sm sm:text-base text-slate-600 dark:text-zinc-400 mt-2 max-w-2xl leading-relaxed">
                {terms.subtitle}
              </p>
            </div>

            <div className="sm:text-right shrink-0">
              <span className="text-xs uppercase tracking-wider text-slate-500 dark:text-zinc-400 block font-semibold">
                {language === 'hi' ? 'अंतिम संशोधन' : 'Last updated'}
              </span>
              <span className="text-sm sm:text-base font-bold text-amber-600 dark:text-amber-400 mt-0.5 inline-block">
                {terms.lastUpdated}
              </span>
            </div>
          </div>

          {/* Quick Jump Index Chips */}
          <div className="mt-6 pt-6 border-t border-slate-200 dark:border-zinc-800/80 print:hidden">
            <p className="text-xs font-semibold text-slate-500 dark:text-zinc-400 uppercase tracking-wider mb-2.5">
              {language === 'hi' ? 'सीधे अनुभाग पर जाएं:' : 'Jump to section:'}
            </p>
            <div className="flex flex-wrap gap-2">
              {terms.sections.map((section) => (
                <a
                  key={section.id}
                  href={`#section-${section.id}`}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-700 dark:text-zinc-300 bg-slate-100 dark:bg-surface-800 hover:bg-amber-100 dark:hover:bg-brand-500/20 hover:text-amber-900 dark:hover:text-amber-300 transition-colors"
                >
                  <span className="w-4 h-4 rounded-full bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold text-[10px]">
                    {section.id}
                  </span>
                  <span className="truncate max-w-[200px] sm:max-w-xs">{section.title.split('. ')[1] || section.title}</span>
                </a>
              ))}
            </div>
          </div>
        </header>

        {/* Terms Sections List */}
        <main className="space-y-6 sm:space-y-8">
          {terms.sections.map((section) => {
            const Icon = sectionIcons[section.id] || FileText
            return (
              <section
                key={section.id}
                id={`section-${section.id}`}
                className="scroll-mt-6 rounded-3xl bg-white dark:bg-surface-900 border border-slate-200 dark:border-semantic-border-light p-6 sm:p-8 shadow-sm dark:shadow-md transition-shadow hover:shadow-md"
              >
                <div className="flex items-start gap-3.5 mb-4 sm:mb-5">
                  <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-amber-50 dark:bg-brand-500/10 border border-amber-200/80 dark:border-brand-500/30 flex items-center justify-center text-amber-600 dark:text-amber-400 shrink-0">
                    <Icon className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white leading-snug tracking-tight">
                      {section.title}
                    </h2>
                  </div>
                </div>

                <div className="space-y-3.5 sm:space-y-4 text-sm sm:text-base text-slate-700 dark:text-zinc-300 leading-relaxed pl-0 sm:pl-13 font-normal">
                  {section.paragraphs.map((p, idx) => (
                    <p key={idx} className="text-justify sm:text-left">
                      {p}
                    </p>
                  ))}
                </div>
              </section>
            )
          })}
        </main>

        {/* Bottom Acknowledgment & Summary Card */}
        <footer className="mt-8 sm:mt-12 rounded-3xl bg-gradient-to-br from-amber-50 via-white to-emerald-50 dark:from-brand-500/10 dark:via-surface-900 dark:to-emerald-500/10 border border-amber-200/80 dark:border-brand-500/30 p-6 sm:p-8 text-center shadow-sm">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-amber-500 text-white shadow-lg shadow-amber-500/20 mb-3.5">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white mb-2">
            {language === 'hi'
              ? 'पारदर्शी व सुरक्षित सेवा के प्रति प्रतिबद्धता'
              : 'Committed to Transparent and Safe Local Services'}
          </h3>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-zinc-400 max-w-xl mx-auto leading-relaxed mb-6">
            {language === 'hi'
              ? 'DoneKaro मुजफ्फरनगर के निवासियों और स्थानीय कुशल कामगारों के बीच भरोसेमंद, 0% कमीशन संपर्क और स्पष्ट रिकॉर्डिंग के लिए समर्पित है।'
              : 'DoneKaro is dedicated to connecting Muzaffarnagar residents with background-verified local artisans with 0% commission and clear transaction records.'}
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3 print:hidden">
            <Link
              to="/search"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 transition-colors shadow-md shadow-amber-500/20"
            >
              <span>{t('nav.search', 'Find Workers')}</span>
            </Link>
            <Link
              to="/register/worker"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold bg-slate-200 dark:bg-surface-800 hover:bg-slate-300 dark:hover:bg-surface-700 text-slate-900 dark:text-white transition-colors"
            >
              <span>{t('nav.becomeWorker', 'Join as Worker')}</span>
            </Link>
          </div>
        </footer>
      </div>
    </div>
  )
}

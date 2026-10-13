import { useEffect } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
  ArrowLeft,
  Shield,
  FileText,
  Printer,
  Globe,
  CheckCircle2,
  Lock,
  UserX,
  PhoneCall,
  Server,
  Layers,
  ChevronRight,
} from 'lucide-react'
import { useLanguage } from '@/context/LanguageContext'
import { getPrivacyContent } from '@/data/privacyContent'

// Section icon resolver
const sectionIcons: Record<number, React.ElementType> = {
  1: Layers,
  2: FileText,
  3: CheckCircle2,
  4: Server,
  5: Lock,
  6: UserX,
  7: PhoneCall,
}

export default function PrivacyPolicy() {
  const { t } = useTranslation()
  const { language, toggleLanguage } = useLanguage()
  const navigate = useNavigate()
  const location = useLocation()
  const privacy = getPrivacyContent(language)

  useEffect(() => {
    if (location.hash) {
      const element = document.getElementById(location.hash.slice(1))
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' })
        return
      }
    }
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [language, location.hash])

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
            className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 dark:text-zinc-400 hover:text-amber-600 dark:hover:text-brand-400 transition-colors cursor-pointer"
            aria-label="Go Back"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>{language === 'hi' ? 'वापस जाएं' : 'Back'}</span>
          </button>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={toggleLanguage}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-xs font-semibold text-slate-700 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-all cursor-pointer shadow-xs"
              title="Toggle Language"
            >
              <Globe className="w-3.5 h-3.5 text-amber-600 dark:text-brand-400" />
              <span>{language === 'hi' ? 'English' : 'हिंदी'}</span>
            </button>

            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-xs font-semibold text-slate-700 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-all cursor-pointer shadow-xs"
              title="Print Policy"
            >
              <Printer className="w-3.5 h-3.5 text-slate-500" />
              <span>{language === 'hi' ? 'प्रिंट करें' : 'Print'}</span>
            </button>
          </div>
        </div>

        {/* Header Hero Banner */}
        <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-zinc-900/90 border border-slate-200/80 dark:border-zinc-800 shadow-sm mb-8 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 dark:bg-amber-500/20 text-amber-600 dark:text-brand-400 flex items-center justify-center shrink-0">
              <Shield className="w-6 h-6" />
            </div>
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-500/10 text-amber-700 dark:text-brand-300 mb-2 border border-amber-500/20">
                <span>{language === 'hi' ? 'आधिकारिक गोपनीयता नीति' : 'Official Privacy Policy'}</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight mb-2">
                {privacy.title}
              </h1>
              <p className="text-sm text-slate-600 dark:text-zinc-400 leading-relaxed max-w-2xl">
                {privacy.subtitle}
              </p>
              <p className="text-xs text-slate-400 dark:text-zinc-500 mt-3 font-medium">
                {language === 'hi' ? 'अंतिम अपडेट:' : 'Last updated:'} {privacy.lastUpdated}
              </p>
            </div>
          </div>
        </div>

        {/* Quick Jump Navigation */}
        <div className="mb-8 p-4 rounded-2xl bg-white dark:bg-zinc-900/60 border border-slate-200/80 dark:border-zinc-800 print:hidden">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-2 px-1">
            {language === 'hi' ? 'त्वरित विषय' : 'Quick Jump'}
          </span>
          <div className="flex flex-wrap gap-2">
            {privacy.sections.map(section => (
              <a
                key={section.id}
                href={`#${section.slug}`}
                className="text-xs px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-zinc-800/80 text-slate-700 dark:text-zinc-300 hover:bg-amber-500/15 hover:text-amber-700 dark:hover:text-brand-300 transition-colors font-medium"
              >
                {section.title.split('.')[1]?.trim() || section.title}
              </a>
            ))}
          </div>
        </div>

        {/* Policy Sections */}
        <div className="space-y-6">
          {privacy.sections.map(section => {
            const SectionIcon = sectionIcons[section.id] || Shield
            const isAccountDeletion = section.slug === 'account-deletion'

            return (
              <section
                key={section.id}
                id={section.slug}
                className={`p-6 sm:p-7 rounded-2xl bg-white dark:bg-zinc-900/80 border transition-all ${
                  isAccountDeletion
                    ? 'border-rose-300 dark:border-rose-900/50 shadow-md ring-1 ring-rose-500/20'
                    : 'border-slate-200/80 dark:border-zinc-800/80 shadow-xs'
                }`}
              >
                <div className="flex items-center gap-3 mb-4">
                  <div
                    className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                      isAccountDeletion
                        ? 'bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400'
                        : 'bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300'
                    }`}
                  >
                    <SectionIcon className="w-4 h-4" />
                  </div>
                  <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">
                    {section.title}
                  </h2>
                </div>

                <div className="space-y-3 text-sm text-slate-600 dark:text-zinc-300 leading-relaxed">
                  {section.paragraphs.map((p, pIdx) => (
                    <p key={pIdx}>{p}</p>
                  ))}

                  {section.listItems && section.listItems.length > 0 && (
                    <ul className="space-y-2.5 my-3 pl-2">
                      {section.listItems.map((item, iIdx) => (
                        <li key={iIdx} className="flex items-start gap-2.5 text-xs sm:text-sm">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-500 dark:bg-brand-400 mt-2 shrink-0" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  )}

                  {isAccountDeletion && (
                    <div className="mt-4 p-4 rounded-xl bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/40 text-xs sm:text-sm text-rose-900 dark:text-rose-200">
                      <p className="font-semibold mb-1">
                        {language === 'hi' ? 'सीधा ऑनलाइन अनुरोध लिंक:' : 'Direct Online Deletion Request Portal:'}
                      </p>
                      <p>
                        {language === 'hi'
                          ? 'खाता व डेटा हटाने के लिए DoneKaro सहायता केंद्र के माध्यम से या सीधे https://done-karo.vercel.app/delete-account पर जाकर अपने 10-अंकीय मोबाइल नंबर के साथ अनुरोध दर्ज करें। प्रशासनिक सत्यापन के बाद 48-72 घंटों में डेटा स्थायी रूप से मिटा दिया जाएगा।'
                          : 'To request account and personal data erasure, submit a request via the DoneKaro in-app Help Center or visit https://done-karo.vercel.app/delete-account with your registered 10-digit mobile number. Data is permanently purged within 48 to 72 hours following administrative verification.'}
                      </p>
                    </div>
                  )}
                </div>
              </section>
            )
          })}
        </div>

        {/* Footer Note */}
        <div className="mt-10 p-6 rounded-2xl bg-slate-100 dark:bg-zinc-900/50 border border-slate-200 dark:border-zinc-800 text-center">
          <p className="text-xs text-slate-500 dark:text-zinc-400">
            {language === 'hi'
              ? 'DoneKaro — मुजफ्फरनगर का भरोसेमंद स्थानीय सेवा प्लेटफ़ॉर्म | 0% कमीशन'
              : 'DoneKaro — Muzaffarnagar Verified Local Home Services Platform | 0% Commission'}
          </p>
          <div className="mt-3 flex items-center justify-center gap-4 text-xs font-semibold text-amber-600 dark:text-brand-400">
            <Link to="/terms" className="hover:underline">
              {language === 'hi' ? 'नियम एवं शर्तें' : 'Terms & Conditions'}
            </Link>
            <span>•</span>
            <Link to="/" className="hover:underline">
              {language === 'hi' ? 'होमपेज' : 'Home'}
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

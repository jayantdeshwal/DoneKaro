import React, { useRef, useState, useEffect, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import {
  X,
  FileText,
  CheckCircle2,
  ChevronDown,
  Globe,
  Printer,
  Shield,
  CreditCard,
  Calendar,
  AlertTriangle,
  Scale,
  Lock,
  Users,
} from 'lucide-react'
import { useLanguage } from '@/context/LanguageContext'
import { getTermsContent } from '@/data/termsContent'
import { Button } from '@kaamgar/ui'

interface TermsModalProps {
  isOpen: boolean
  onClose: () => void
  onAccept: () => void
}

const sectionIcons: Record<number, React.ElementType> = {
  1: Users,
  2: CreditCard,
  3: Calendar,
  4: AlertTriangle,
  5: Scale,
  6: Lock,
  7: Shield,
}

export const TermsModal: React.FC<TermsModalProps> = ({ isOpen, onClose, onAccept }) => {
  const { t } = useTranslation()
  const { language, toggleLanguage } = useLanguage()
  const terms = getTermsContent(language)

  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const [hasScrolledToBottom, setHasScrolledToBottom] = useState(false)

  // Scroll detection logic
  const checkScrollPosition = useCallback(() => {
    const el = scrollContainerRef.current
    if (!el) return

    // If total scrollable height fits within the container (or within 24px threshold)
    const isAtBottom = el.scrollHeight - el.scrollTop - el.clientHeight <= 24
    if (isAtBottom) {
      setHasScrolledToBottom(true)
    }
  }, [])

  // Reset scroll and check on open or language switch
  useEffect(() => {
    if (isOpen) {
      setHasScrolledToBottom(false)
      const timer = setTimeout(() => {
        if (scrollContainerRef.current) {
          scrollContainerRef.current.scrollTop = 0
          checkScrollPosition()
        }
      }, 100)
      return () => clearTimeout(timer)
    }
  }, [isOpen, language, checkScrollPosition])

  // Prevent background scrolling when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen])

  if (!isOpen) return null

  const handlePrint = () => {
    if (typeof window !== 'undefined') {
      window.print()
    }
  }

  const handleAcceptClick = () => {
    if (!hasScrolledToBottom) return
    onAccept()
    onClose()
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="terms-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200"
    >
      <div className="relative w-full max-w-3xl max-h-[92vh] flex flex-col bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden">
        {/* Top Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-zinc-800 flex items-center justify-between gap-3 bg-slate-50/80 dark:bg-zinc-900/90 shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-600 dark:text-amber-400 shrink-0">
              <FileText className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h2 id="terms-modal-title" className="text-base sm:text-lg font-bold text-slate-900 dark:text-white truncate">
                {terms.title}
              </h2>
              <p className="text-[11px] sm:text-xs text-slate-500 dark:text-zinc-400 truncate">
                {terms.lastUpdated}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {/* Language Toggle */}
            <button
              type="button"
              onClick={toggleLanguage}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/30 hover:bg-amber-100 transition-colors cursor-pointer"
              title={language === 'en' ? 'Switch to Hindi' : 'Switch to English'}
            >
              <Globe className="w-3.5 h-3.5" />
              <span>{language === 'en' ? 'हिन्दी' : 'English'}</span>
            </button>

            {/* Print Button */}
            <button
              type="button"
              onClick={handlePrint}
              className="hidden sm:inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-600 dark:text-zinc-300 bg-slate-100 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 hover:bg-slate-200 transition-colors cursor-pointer"
              title="Print"
            >
              <Printer className="w-3.5 h-3.5" />
            </button>

            {/* Close / Dismiss */}
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Terms Content */}
        <div
          ref={scrollContainerRef}
          onScroll={checkScrollPosition}
          className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 text-slate-800 dark:text-zinc-200 text-sm leading-relaxed"
        >
          <div className="p-3.5 bg-amber-500/10 border border-amber-500/25 rounded-xl text-xs text-amber-900 dark:text-amber-300 leading-relaxed">
            <strong>{language === 'hi' ? 'महत्वपूर्ण सूचना:' : 'Notice to Users:'}</strong>{' '}
            {language === 'hi'
              ? 'कृपया नियम एवं शर्तों को अंत तक ध्यानपूर्वक पढ़ें। नीचे पहुंचने के बाद "सहमत हूँ और आगे बढ़ें" बटन सक्षम हो जाएगा।'
              : 'Please read the Terms & Conditions carefully to the end. The "Agree & Continue" button will become available once you have reviewed the complete document.'}
          </div>

          {terms.sections.map((section) => {
            const Icon = sectionIcons[section.id] || FileText
            return (
              <section key={section.id} className="space-y-3 pb-2 border-b border-slate-100 dark:border-zinc-800/80 last:border-b-0">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                    <Icon className="w-4 h-4" />
                  </div>
                  <h3 className="font-bold text-slate-900 dark:text-white text-base">
                    {section.title}
                  </h3>
                </div>
                <div className="space-y-2.5 pl-0 sm:pl-9 text-xs sm:text-sm text-slate-700 dark:text-zinc-300">
                  {section.paragraphs.map((p, idx) => (
                    <p key={idx}>{p}</p>
                  ))}
                </div>
              </section>
            )
          })}
        </div>

        {/* Footer with Scroll Prompt and Action */}
        <div className="p-4 sm:p-5 border-t border-slate-200 dark:border-zinc-800 bg-slate-50/80 dark:bg-zinc-900/90 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <div className="text-xs text-slate-500 dark:text-zinc-400 flex items-center gap-1.5 text-center sm:text-left">
            {!hasScrolledToBottom ? (
              <>
                <ChevronDown className="w-4 h-4 text-amber-500 animate-bounce" />
                <span>
                  {language === 'hi'
                    ? 'कृपया पूरे नियम पढ़ने के लिए नीचे तक स्क्रॉल करें'
                    : 'Please scroll to the bottom to review all terms'}
                </span>
              </>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                <span className="text-emerald-600 dark:text-emerald-400 font-medium">
                  {language === 'hi'
                    ? 'आपने पूरा अनुबंध देख लिया है'
                    : 'You have viewed the complete terms'}
                </span>
              </>
            )}
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1 sm:flex-initial text-xs sm:text-sm py-2 sm:py-2.5"
            >
              {language === 'hi' ? 'रद्द करें' : 'Cancel'}
            </Button>
            <Button
              type="button"
              variant="primary"
              disabled={!hasScrolledToBottom}
              onClick={handleAcceptClick}
              className={`flex-1 sm:flex-initial text-xs sm:text-sm py-2 sm:py-2.5 font-bold shadow-md ${
                hasScrolledToBottom
                  ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-amber-500/25'
                  : 'opacity-50 cursor-not-allowed'
              }`}
            >
              <CheckCircle2 className="w-4 h-4 mr-1.5 inline" />
              <span>{language === 'hi' ? 'सहमत हूँ और आगे बढ़ें' : 'Agree & Continue'}</span>
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

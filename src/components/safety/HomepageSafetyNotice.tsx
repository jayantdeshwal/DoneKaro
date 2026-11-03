import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'
import { ShieldCheck, X, FileCheck2, Banknote, Download, Lock } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'

export function HomepageSafetyNotice() {
  const { i18n } = useTranslation()
  const { isAuthenticated, user } = useAuth()
  const shouldReduceMotion = useReducedMotion()

  const [isVisible, setIsVisible] = useState(false)
  const [isExpanded, setIsExpanded] = useState(false)
  const [sessionEventId, setSessionEventId] = useState<string | null>(null)

  const isHindi = i18n.language === 'hi'

  useEffect(() => {
    if (typeof window === 'undefined') return

    // 1. Must be genuinely authenticated
    if (!isAuthenticated || !user) {
      setIsVisible(false)
      setIsExpanded(false)
      return
    }

    // 2. Do not display for incomplete customer registrations
    if (user.role === 'customer' && user.registration_completed === false) {
      setIsVisible(false)
      setIsExpanded(false)
      return
    }

    // 3. Verify active auth session event
    const activeEvent = sessionStorage.getItem('donekaro_auth_session_event')
    if (!activeEvent) {
      setIsVisible(false)
      setIsExpanded(false)
      return
    }

    // 4. Verify dismissal status for this session event
    const dismissedEvent = sessionStorage.getItem('donekaro_safety_notice_dismissed')
    if (dismissedEvent === activeEvent) {
      setIsVisible(false)
      setIsExpanded(false)
      return
    }

    setIsExpanded(false)
    setSessionEventId(activeEvent)
    setIsVisible(true)
  }, [isAuthenticated, user])

  const handleDismiss = () => {
    if (typeof window !== 'undefined' && sessionEventId) {
      sessionStorage.setItem('donekaro_safety_notice_dismissed', sessionEventId)
    }
    setIsExpanded(false)
    setIsVisible(false)
  }

  const tips = [
    {
      id: 1,
      icon: ShieldCheck,
      iconColor: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20',
      titleEn: 'Book through DoneKaro',
      descEn: 'Complete your bookings through DoneKaro. Keep your booking details and records in the app.',
      titleHi: 'बुकिंग DoneKaro पर ही करें',
      descHi: 'बुकिंग का विवरण और उसका रिकॉर्ड ऐप में सुरक्षित रखें।',
    },
    {
      id: 2,
      icon: FileCheck2,
      iconColor: 'text-amber-500 bg-amber-500/10 border-amber-500/20',
      titleEn: 'Agree on the work and price first',
      descEn: 'Understand the quotation, agreed price, and any additional charges before accepting.',
      titleHi: 'काम और कीमत पहले तय करें',
      descHi: 'कोटेशन स्वीकार करने से पहले काम का विवरण, तय कीमत और अतिरिक्त शुल्क अच्छी तरह समझ लें।',
    },
    {
      id: 3,
      icon: Banknote,
      iconColor: 'text-blue-500 bg-blue-500/10 border-blue-500/20',
      titleEn: 'Keep payment records',
      descEn: 'Keep accurate payment records. Do not rely solely on verbal agreements or unrecorded payments.',
      titleHi: 'भुगतान का सही रिकॉर्ड रखें',
      descHi: 'केवल मौखिक समझौते या बिना रिकॉर्ड वाले भुगतान पर निर्भर न रहें।',
    },
    {
      id: 4,
      icon: Download,
      iconColor: 'text-indigo-500 bg-indigo-500/10 border-indigo-500/20',
      titleEn: 'Download and save your receipt',
      descEn: 'After the work is completed and the payment is properly recorded, obtain and save your receipt through the app.',
      titleHi: 'रसीद डाउनलोड करके सुरक्षित रखें',
      descHi: 'काम पूरा होने और भुगतान का रिकॉर्ड दर्ज होने के बाद अपनी रसीद ऐप से प्राप्त करें।',
    },
    {
      id: 5,
      icon: Lock,
      iconColor: 'text-rose-500 bg-rose-500/10 border-rose-500/20',
      titleEn: 'Protect your information',
      descEn: 'Never share your OTP, UPI PIN, or password. Report suspicious activity through Care & Support and preserve relevant booking records.',
      titleHi: 'अपनी जानकारी सुरक्षित रखें',
      descHi: 'OTP, UPI PIN या पासवर्ड साझा न करें। किसी संदिग्ध गतिविधि की सूचना सहायता केंद्र को दें और संबंधित बुकिंग रिकॉर्ड सुरक्षित रखें।',
    },
  ]

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={shouldReduceMotion ? false : { opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: -8 }}
          transition={{ duration: shouldReduceMotion ? 0.15 : 0.25, ease: 'easeInOut' }}
          className="w-full max-w-4xl mx-auto px-4 sm:px-6 pt-3 pb-2"
          role="region"
          aria-label={isHindi ? 'सुरक्षा दिशानिर्देश' : 'Safety Notice'}
        >
          <div className="overflow-hidden rounded-2xl border border-amber-300/80 bg-gradient-to-r from-amber-50/90 to-amber-100/40 shadow-sm shadow-amber-500/5 dark:border-amber-500/30 dark:from-zinc-900 dark:to-zinc-850">
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setIsExpanded(open => !open)}
                aria-expanded={isExpanded}
                aria-controls="homepage-safety-tips"
                className="flex min-h-12 flex-1 items-center gap-2 px-4 py-3 text-left text-sm font-bold text-slate-900 transition-colors hover:bg-amber-100/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-amber-500 dark:text-white dark:hover:bg-zinc-800"
              >
                <span aria-hidden="true">🛡️</span>
                <span>5 Tips for Safe Hiring (View)</span>
                <ShieldCheck className={`ml-auto h-4 w-4 shrink-0 text-amber-600 transition-transform dark:text-amber-400 ${isExpanded ? 'rotate-180' : ''}`} />
              </button>
              <button
                type="button"
                onClick={handleDismiss}
                className="mr-2 flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-slate-400 transition-colors hover:bg-white/80 hover:text-slate-800 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
                aria-label={isHindi ? 'सूचना बंद करें' : 'Close safety notice'}
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <AnimatePresence initial={false}>
              {isExpanded && (
                <motion.div
                  id="homepage-safety-tips"
                  initial={shouldReduceMotion ? false : { height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={shouldReduceMotion ? { opacity: 0 } : { height: 0, opacity: 0 }}
                  transition={{ duration: shouldReduceMotion ? 0.12 : 0.25, ease: 'easeInOut' }}
                  className="overflow-hidden"
                >
                  <div className="border-t border-amber-300/70 p-3 dark:border-amber-500/25 sm:p-4">
                    <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
                      {tips.map((tip, idx) => {
                        const IconComponent = tip.icon
                        return (
                          <div
                            key={tip.id}
                            className={`flex items-start gap-2.5 rounded-2xl border border-slate-200/80 bg-white/90 p-3 transition-colors hover:border-amber-400/50 dark:border-zinc-700/80 dark:bg-zinc-800/80 ${
                              idx === 4 ? 'sm:col-span-2 lg:col-span-1' : ''
                            }`}
                          >
                            <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-xl border ${tip.iconColor}`}>
                              <IconComponent className="h-3.5 w-3.5" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="text-xs font-bold leading-snug text-slate-900 dark:text-zinc-100">
                                {isHindi ? tip.titleHi : tip.titleEn}
                              </p>
                              <p className="mt-0.5 text-[11px] leading-relaxed text-slate-600 dark:text-zinc-400">
                                {isHindi ? tip.descHi : tip.descEn}
                              </p>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'
import {
  ShieldCheck,
  X,
  FileCheck2,
  Banknote,
  Download,
  Lock,
  Sparkles,
} from 'lucide-react'
import { useAuth } from '@/context/AuthContext'

export function HomepageSafetyNotice() {
  const { i18n } = useTranslation()
  const { isAuthenticated, user } = useAuth()
  const shouldReduceMotion = useReducedMotion()

  const [isVisible, setIsVisible] = useState(false)
  const [sessionEventId, setSessionEventId] = useState<string | null>(null)

  const isHindi = i18n.language === 'hi'

  useEffect(() => {
    if (typeof window === 'undefined') return

    // 1. Must be genuinely authenticated
    if (!isAuthenticated || !user) {
      setIsVisible(false)
      return
    }

    // 2. Do not display for incomplete customer registrations
    if (user.role === 'customer' && user.registration_completed === false) {
      setIsVisible(false)
      return
    }

    // 3. Verify active auth session event
    const activeEvent = sessionStorage.getItem('donekaro_auth_session_event')
    if (!activeEvent) {
      setIsVisible(false)
      return
    }

    // 4. Verify dismissal status for this session event
    const dismissedEvent = sessionStorage.getItem('donekaro_safety_notice_dismissed')
    if (dismissedEvent === activeEvent) {
      setIsVisible(false)
      return
    }

    setSessionEventId(activeEvent)
    setIsVisible(true)
  }, [isAuthenticated, user])

  const handleDismiss = () => {
    if (typeof window !== 'undefined' && sessionEventId) {
      sessionStorage.setItem('donekaro_safety_notice_dismissed', sessionEventId)
    }
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

  const animationProps = shouldReduceMotion
    ? {
        initial: { opacity: 1 },
        animate: { opacity: 1 },
        exit: { opacity: 0 },
        transition: { duration: 0.15 },
      }
    : {
        initial: { opacity: 0, y: -16, scale: 0.98 },
        animate: { opacity: 1, y: 0, scale: 1 },
        exit: { opacity: 0, y: -20, scale: 0.97, height: 0, marginBottom: 0 },
        transition: { duration: 0.3, ease: 'easeInOut' as const },
      }

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          {...animationProps}
          className="w-full max-w-4xl mx-auto px-4 sm:px-6 pt-3 pb-2 overflow-hidden"
          role="region"
          aria-label={isHindi ? 'सुरक्षा दिशानिर्देश' : 'Safety Notice'}
        >
          <div className="relative rounded-3xl bg-gradient-to-br from-amber-50/90 via-white to-amber-100/40 dark:from-zinc-900 dark:via-zinc-900/95 dark:to-zinc-850 border border-amber-300/80 dark:border-amber-500/30 p-4 sm:p-6 shadow-sm dark:shadow-xl shadow-amber-500/5">
            {/* Top Row: Safety Header & Dismiss X Button */}
            <div className="flex items-start justify-between gap-3 mb-3">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-amber-500 text-slate-950 flex items-center justify-center shrink-0 shadow-xs font-bold">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <h2 className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-white tracking-tight">
                      {isHindi ? 'सुरक्षित बुकिंग के लिए 5 ज़रूरी बातें' : '5 Tips for Safer Bookings'}
                    </h2>
                    <Sparkles className="w-4 h-4 text-amber-500 shrink-0 hidden sm:inline-block" />
                  </div>
                  <p className="text-xs sm:text-sm text-slate-600 dark:text-zinc-300 leading-snug mt-0.5">
                    {isHindi
                      ? 'DoneKaro का उपयोग करते समय इन आसान सावधानियों का ध्यान रखें।'
                      : 'Keep these simple precautions in mind when using DoneKaro.'}
                  </p>
                </div>
              </div>

              {/* Close Button */}
              <button
                type="button"
                onClick={handleDismiss}
                className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-800 dark:text-zinc-400 dark:hover:text-zinc-100 bg-white/80 dark:bg-zinc-800/80 hover:bg-slate-100 dark:hover:bg-zinc-700 border border-slate-200 dark:border-zinc-700 transition-colors shrink-0 cursor-pointer shadow-xs active:scale-95"
                aria-label={isHindi ? 'सूचना बंद करें' : 'Close safety notice'}
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* 5 Compact Rows */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 pt-1">
              {tips.map((tip, idx) => {
                const IconComponent = tip.icon
                return (
                  <div
                    key={tip.id}
                    className={`p-3 rounded-2xl bg-white/90 dark:bg-zinc-800/80 border border-slate-200/80 dark:border-zinc-700/80 flex items-start gap-2.5 transition-all hover:border-amber-400/50 ${
                      idx === 4 ? 'sm:col-span-2 lg:col-span-1' : ''
                    }`}
                  >
                    <div className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 border ${tip.iconColor}`}>
                      <IconComponent className="w-3.5 h-3.5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-bold text-slate-900 dark:text-zinc-100 leading-snug">
                        {isHindi ? tip.titleHi : tip.titleEn}
                      </p>
                      <p className="text-[11px] text-slate-600 dark:text-zinc-400 leading-relaxed mt-0.5">
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
  )
}

import React, { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useLanguage } from '@/context/LanguageContext'
import { useAiAssistant } from '../context/AiAssistantContext'
import { useAuth } from '@/context/AuthContext'
import { ASSISTANT_CONFIGS } from '@/services/ai/domainKnowledge'
import { ChatMessageContent } from './ChatMessageContent'
import { AssistantPersona, ChatAction } from '../types'
import {
  X,
  Send,
  Sparkles,
  Bot,
  ExternalLink,
  Copy,
  Check,
  Zap,
  RotateCcw,
  Briefcase,
  Search,
  MessageCircle,
  Calendar,
  Clock,
  MapPin,
  ArrowRight,
  FileText,
  AlertCircle,
} from 'lucide-react'
import { useSupport } from '@/features/support'

export default function AiAssistantModal() {
  const { t } = useTranslation()
  const { language } = useLanguage()
  const { isWorker, isAdmin, isAuthenticated } = useAuth()
  const navigate = useNavigate()
  const {
    isOpen,
    activePersona,
    messages,
    isTyping,
    closeAssistant,
    switchPersona,
    sendMessage,
    clearHistory,
  } = useAiAssistant()

  const { openSupport } = useSupport()
  const [input, setInput] = useState('')
  const [copiedActionId, setCopiedActionId] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const isHindi = language === 'hi'
  const currentConfig = ASSISTANT_CONFIGS[activePersona] || ASSISTANT_CONFIGS.customer_booking
  const currentMessages = messages[activePersona] || []

  // Enforce role-aware mode access: workers only see worker_sarathi, customers only see customer_booking
  useEffect(() => {
    if (!isOpen) return
    if (isAdmin) {
      closeAssistant()
      return
    }
    if (isWorker) {
      if (activePersona !== 'worker_sarathi') {
        switchPersona('worker_sarathi')
      }
    } else {
      if (activePersona !== 'customer_booking') {
        switchPersona('customer_booking')
      }
    }
  }, [isOpen, isWorker, isAdmin, activePersona, switchPersona, closeAssistant])

  // Smooth auto-scroll to latest message or typing indicator once layout updates
  useEffect(() => {
    if (!isOpen) return
    const rafId = requestAnimationFrame(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
    })
    return () => cancelAnimationFrame(rafId)
  }, [currentMessages, isTyping, isOpen])

  // Auto focus input when opened
  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => {
        inputRef.current?.focus()
      }, 200)
      return () => clearTimeout(timer)
    }
  }, [isOpen, activePersona])

  if (!isOpen || isAdmin || !isAuthenticated) return null

  const handleSend = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    if (!input.trim() || isTyping) return
    const text = input
    setInput('')
    await sendMessage(text)
  }

  const handleChipClick = async (chipQuery: string) => {
    if (isTyping || !chipQuery.trim()) return
    await sendMessage(chipQuery.trim())
  }

  const handleNewChat = () => {
    if (isTyping) return
    clearHistory(activePersona)
    setInput('')
    requestAnimationFrame(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
      inputRef.current?.focus()
    })
  }

  const handleActionClick = (action: ChatAction) => {
    if (action.type === 'navigate') {
      closeAssistant()
      navigate(action.payload)
    } else if (action.type === 'external_link') {
      window.open(action.payload, '_blank', 'noopener,noreferrer')
    } else if (action.type === 'copy_text') {
      navigator.clipboard.writeText(action.payload)
      setCopiedActionId(action.id)
      setTimeout(() => setCopiedActionId(null), 2500)
    } else if (action.type === 'quick_reply') {
      sendMessage(action.payload)
    } else if (action.type === 'create_support_request') {
      if (action.payload === 'history') {
        openSupport({ defaultTab: 'history' })
      } else {
        openSupport({ bookingId: action.payload || null, defaultTab: 'complaint' })
      }
    }
  }

  const getActionIcon = (action: ChatAction) => {
    if (action.icon === 'Zap') return <Zap className="w-3.5 h-3.5 text-amber-400 shrink-0" />
    if (action.icon === 'Search') return <Search className="w-3.5 h-3.5 text-blue-400 shrink-0" />
    if (action.icon === 'MessageCircle') return <MessageCircle className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
    if (action.icon === 'Calendar') return <Calendar className="w-3.5 h-3.5 text-purple-400 shrink-0" />
    if (action.icon === 'Briefcase') return <Briefcase className="w-3.5 h-3.5 text-amber-500 shrink-0" />
    if (action.icon === 'FileText') return <FileText className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
    if (action.icon === 'AlertCircle') return <AlertCircle className="w-3.5 h-3.5 text-rose-500 shrink-0" />
    if (action.icon === 'Copy') {
      return copiedActionId === action.id ? (
        <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
      ) : (
        <Copy className="w-3.5 h-3.5 text-amber-400 shrink-0" />
      )
    }
    return <ArrowRight className="w-3.5 h-3.5 text-semantic-text-tertiary shrink-0" />
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/75 backdrop-blur-sm animate-fade-in"
      onClick={e => {
        if (e.target === e.currentTarget) closeAssistant()
      }}
      role="dialog"
      aria-modal="true"
      aria-label="DoneKaro AI Support"
    >
      <div className="w-full sm:max-w-lg h-[92dvh] sm:h-[650px] max-h-[96dvh] bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-t-3xl sm:rounded-3xl shadow-2xl flex flex-col overflow-hidden text-slate-900 dark:text-zinc-100">
        {/* Top Handle for mobile drag visual */}
        <div className="w-12 h-1.5 bg-slate-300 dark:bg-zinc-700 rounded-full mx-auto mt-2.5 shrink-0 sm:hidden" />

        {/* Header Bar */}
        <div className="shrink-0 px-4 py-3 border-b border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-800/80 flex items-center justify-between gap-2">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-amber-500/20 to-emerald-500/20 border border-amber-500/30 flex items-center justify-center text-xl shadow-inner shrink-0">
              {currentConfig.avatar}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white tracking-tight truncate">
                  {isHindi ? currentConfig.nameHi : currentConfig.nameEn}
                </h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/30 shrink-0">
                  {isHindi ? currentConfig.badgeHi : currentConfig.badgeEn}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-zinc-400 truncate">
                {isHindi ? currentConfig.roleTitleHi : currentConfig.roleTitleEn}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={handleNewChat}
              disabled={isTyping}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-[11px] font-semibold text-slate-600 hover:text-slate-900 bg-white hover:bg-slate-100 dark:text-zinc-300 dark:hover:text-white dark:bg-zinc-800 dark:hover:bg-zinc-700 border border-slate-200 dark:border-zinc-700 transition-colors cursor-pointer disabled:opacity-50"
              title={isHindi ? 'नई चैट शुरू करें' : 'Start a new chat'}
              aria-label={isHindi ? 'नई चैट' : 'New Chat'}
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>{isHindi ? 'नई चैट' : 'New Chat'}</span>
            </button>
            <button
              type="button"
              onClick={closeAssistant}
              className="p-1.5 rounded-xl text-slate-400 hover:text-slate-900 hover:bg-slate-200 dark:text-zinc-400 dark:hover:text-white dark:hover:bg-zinc-700 transition-colors cursor-pointer"
              aria-label="Close Assistant"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Persona Indicator (Role-Aware) */}
        <div className="shrink-0 px-3 py-2 bg-slate-50/80 dark:bg-zinc-850/80 border-b border-slate-200 dark:border-zinc-800 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
          {!isWorker && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-amber-500 text-slate-950 shadow-xs">
              <span>🛠️</span>
              <span>{isHindi ? 'बुकिंग सहायता' : 'Booking Help'}</span>
            </div>
          )}

          {isWorker && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-amber-600 text-white shadow-xs">
              <Briefcase className="w-3.5 h-3.5" />
              <span>{isHindi ? 'काम व सेवा सलाह' : 'Work Advice'}</span>
            </div>
          )}
        </div>

        {/* Care & Support Discovery Strip */}
        <div className="shrink-0 px-3.5 py-1.5 bg-rose-50/60 dark:bg-rose-950/20 border-b border-rose-100 dark:border-rose-900/30 flex items-center justify-between text-[11px] text-rose-700 dark:text-rose-400">
          <span className="truncate">
            {isHindi ? 'आधिकारिक शिकायत या सुझाव दर्ज करना चाहते हैं?' : 'Need to file a formal complaint or suggestion?'}
          </span>
          <button
            type="button"
            onClick={() => openSupport()}
            className="font-bold underline hover:text-rose-900 dark:hover:text-rose-200 shrink-0 ml-2 cursor-pointer"
          >
            {isHindi ? 'केयर डेस्क' : 'Care & Support'}
          </button>
        </div>

        {/* Quick Suggestion Chips Carousel */}
        <div className="shrink-0 px-3 py-2 bg-slate-50/50 dark:bg-zinc-900/50 border-b border-slate-200 dark:border-zinc-800 overflow-x-auto no-scrollbar">
          <div className="flex items-center gap-2 w-max">
            {currentConfig.chips.map(chip => {
              const displayedLabel = isHindi ? chip.labelHi : chip.labelEn
              const localizedQuery = isHindi
                ? chip.queryHi || chip.labelHi
                : chip.queryEn || chip.labelEn

              return (
                <button
                  key={chip.id}
                  type="button"
                  onClick={() => handleChipClick(localizedQuery)}
                  disabled={isTyping}
                  className="px-3 py-1.5 rounded-xl text-[11px] font-medium bg-white dark:bg-zinc-800 hover:bg-amber-50 dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-200 hover:text-slate-950 dark:hover:text-white border border-slate-200 dark:border-zinc-700 hover:border-amber-300 dark:hover:border-amber-500/40 transition-colors whitespace-nowrap shadow-2xs cursor-pointer disabled:opacity-50"
                >
                  {displayedLabel}
                </button>
              )
            })}
          </div>
        </div>

        {/* Message Stream */}
        <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain p-4 space-y-4">
          {currentMessages.map(msg => {
            const isUser = msg.sender === 'user'
            const messageText = isHindi ? msg.textHi || msg.textEn : msg.textEn

            return (
              <div
                key={msg.id}
                className={`flex gap-2.5 ${isUser ? 'justify-end' : 'justify-start'}`}
              >
                {!isUser && (
                  <div className="w-7 h-7 rounded-xl bg-amber-50 dark:bg-zinc-800 border border-amber-200/80 dark:border-zinc-700 flex items-center justify-center text-sm shrink-0 mt-0.5 shadow-2xs">
                    {ASSISTANT_CONFIGS[msg.persona]?.avatar || '🤖'}
                  </div>
                )}

                <div
                  className={`max-w-[85%] rounded-2xl p-3.5 ${
                    isUser
                      ? 'bg-gradient-to-br from-amber-500 to-amber-400 text-slate-950 font-medium rounded-tr-sm shadow-sm'
                      : 'bg-white dark:bg-zinc-800 text-slate-800 dark:text-zinc-100 rounded-tl-sm border border-slate-200 dark:border-zinc-700 shadow-xs'
                  }`}
                >
                  {!isUser && (
                    <div className="text-[10px] font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400 mb-1.5">
                      {isHindi ? 'सारथी सहायक' : 'Sarathi Assistant'}
                    </div>
                  )}

                  {/* Message body with Unicode-safe markdown and sanitization */}
                  <ChatMessageContent text={messageText} variant={isUser ? 'user' : 'assistant'} />

                  {/* Actions / Deep-Links */}
                  {msg.actions && msg.actions.length > 0 && (
                    <div className="mt-3 pt-2.5 border-t border-slate-200 dark:border-zinc-700 flex flex-col gap-1.5">
                      {msg.actions.map(action => (
                        <button
                          key={action.id}
                          type="button"
                          onClick={() => handleActionClick(action)}
                          className="w-full flex items-center justify-between px-2.5 py-2 rounded-xl bg-slate-50 dark:bg-zinc-700/80 hover:bg-slate-100 dark:hover:bg-zinc-700 text-[11px] font-semibold text-slate-800 dark:text-zinc-100 border border-slate-200 dark:border-zinc-600 transition-all text-left shadow-2xs cursor-pointer"
                        >
                          <div className="flex items-center gap-2 truncate">
                            {getActionIcon(action)}
                            <span className="truncate">
                              {isHindi ? action.labelHi : action.labelEn}
                            </span>
                          </div>
                          <span className="text-[10px] text-slate-500 dark:text-zinc-400 shrink-0 ml-2">
                            {action.type === 'copy_text'
                              ? copiedActionId === action.id
                                ? 'Copied!'
                                : 'Copy'
                              : 'Open'}
                          </span>
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Subtle Timestamp */}
                  <div
                    className={`mt-2 text-[10px] tabular-nums text-right ${
                      isUser ? 'text-slate-900/65' : 'text-slate-400 dark:text-zinc-500'
                    }`}
                  >
                    {new Date(msg.timestamp).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </div>
                </div>
              </div>
            )
          })}

          {/* Animated 3-dot Typing Indicator */}
          {isTyping && (
            <div className="flex gap-2.5 items-end">
              <div className="w-7 h-7 rounded-xl bg-amber-50 dark:bg-zinc-800 border border-amber-200/80 dark:border-zinc-700 flex items-center justify-center text-sm shrink-0 shadow-2xs">
                {currentConfig.avatar}
              </div>
              <div className="bg-white dark:bg-zinc-800 rounded-2xl rounded-tl-sm px-3.5 py-2.5 border border-slate-200 dark:border-zinc-700 shadow-xs flex items-center gap-2">
                <div className="flex items-center gap-1" aria-hidden="true">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-bounce" />
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-bounce [animation-delay:0.15s]" />
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-bounce [animation-delay:0.3s]" />
                </div>
                <span className="text-[11px] font-medium text-slate-500 dark:text-zinc-400">
                  {isHindi ? 'सारथी लिख रहा है...' : 'Sarathi is typing...'}
                </span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} className="h-1" />
        </div>

        {/* Input Bar (safe-area + Android keyboard friendly) */}
        <form
          onSubmit={handleSend}
          className="shrink-0 px-3 pt-2.5 pb-[max(0.75rem,env(safe-area-inset-bottom))] bg-slate-50 dark:bg-zinc-900 border-t border-slate-200 dark:border-zinc-800 flex items-center gap-2"
        >
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            onFocus={() => {
              setTimeout(() => {
                messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
              }, 250)
            }}
            placeholder={
              isHindi
                ? 'हिंदी, Hinglish या English में पूछें...'
                : 'Ask in English, Hindi, or Hinglish...'
            }
            className="flex-1 min-h-[42px] bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-xl px-3.5 py-2 text-sm sm:text-xs text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-zinc-500 focus:outline-none focus:border-amber-500 transition-colors"
          />
          <button
            type="submit"
            disabled={!input.trim() || isTyping}
            className="min-w-[42px] min-h-[42px] rounded-xl bg-amber-500 text-slate-950 dark:bg-amber-400 dark:text-slate-950 hover:bg-amber-600 dark:hover:bg-amber-500 disabled:opacity-50 flex items-center justify-center transition-colors shadow-xs shrink-0 cursor-pointer"
            aria-label="Send Message"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  )
}

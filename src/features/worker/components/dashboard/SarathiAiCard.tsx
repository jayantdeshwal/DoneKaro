import React from 'react'
import { useTranslation } from 'react-i18next'
import { Sparkles } from 'lucide-react'

interface SarathiAiCardProps {
  isLeadsTab: boolean
  onOpenAssistant: () => void
}

export const SarathiAiCard: React.FC<SarathiAiCardProps> = ({
  isLeadsTab,
  onOpenAssistant,
}) => {
  const { i18n } = useTranslation()

  return (
    <div
      className={`mb-6 p-4 rounded-2xl bg-gradient-to-r from-amber-500/10 via-surface-100 to-surface-100 border border-amber-500/30 shadow-md flex-col sm:flex-row items-start sm:items-center justify-between gap-3 ${
        isLeadsTab ? 'hidden md:flex' : 'flex'
      }`}
    >
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-xl shadow-inner shrink-0">
          💼
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-xs font-bold text-slate-900 dark:text-white tracking-tight">
              {i18n.language === 'hi'
                ? 'DoneKaro सारथी AI (काम व सेवा सलाह)'
                : 'DoneKaro Sarathi AI (Work Advice)'}
            </h3>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-400 border border-amber-500/30">
              24x7 AI
            </span>
          </div>
          <p className="text-[11px] text-semantic-text-secondary">
            {i18n.language === 'hi'
              ? 'ग्राहक को व्हाट्सऐप मैसेज, अधिक काम पाने के तरीके और सेवा नियम जानें'
              : 'WhatsApp reply templates, earning tips & service policy guide'}
          </p>
        </div>
      </div>

      <button
        type="button"
        onClick={onOpenAssistant}
        className="w-full sm:w-auto px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm transition-all active:scale-95 shrink-0"
      >
        <Sparkles className="w-3.5 h-3.5" />
        <span>{i18n.language === 'hi' ? 'सारथी से पूछें' : 'Ask Sarathi AI'}</span>
      </button>
    </div>
  )
}

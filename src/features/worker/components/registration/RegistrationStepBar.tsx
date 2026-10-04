import React from 'react'
import { useTranslation } from 'react-i18next'
import { Check } from 'lucide-react'
import { REGISTRATION_STEPS } from '../../constants'

interface RegistrationStepBarProps {
  currentStep: number
}

export const RegistrationStepBar: React.FC<RegistrationStepBarProps> = ({ currentStep }) => {
  const { t } = useTranslation()

  return (
    <div className="flex items-center justify-between mb-8 relative">
      <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-surface-200 -translate-y-1/2 z-0" />
      <div
        className="absolute top-1/2 left-0 h-0.5 bg-brand-500 -translate-y-1/2 z-0 transition-all duration-300"
        style={{ width: `${(currentStep / (REGISTRATION_STEPS.length - 1)) * 100}%` }}
      />
      {REGISTRATION_STEPS.map((step, idx) => {
        const StepIcon = step.icon
        const isDone = idx < currentStep
        const isCurrent = idx === currentStep
        return (
          <div key={step.key} className="flex flex-col items-center relative z-10">
            <div
              className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
                isDone
                  ? 'bg-emerald-500 text-surface-950 font-extrabold'
                  : isCurrent
                  ? 'bg-brand-500 text-surface-950 font-bold ring-4 ring-brand-500/20'
                  : 'bg-surface-200 text-semantic-text-tertiary'
              }`}
            >
              {isDone ? <Check className="w-4 h-4 stroke-[3]" /> : <StepIcon className="w-4 h-4" />}
            </div>
            <span
              className={`text-[11px] mt-1.5 font-medium ${
                isCurrent
                  ? 'text-brand-400 font-bold'
                  : isDone
                  ? 'text-emerald-400'
                  : 'text-semantic-text-tertiary'
              }`}
            >
              {t(step.labelKey, step.fallback)}
            </span>
          </div>
        )
      })}
    </div>
  )
}

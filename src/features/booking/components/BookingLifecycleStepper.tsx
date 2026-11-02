import { useTranslation } from 'react-i18next'
import { CheckCircle2, Clock, Wrench } from 'lucide-react'

interface BookingLifecycleStepperProps {
  currentStep: 1 | 2 | 3
  actionRequired?: boolean
}

const steps = [
  { labelKey: 'bookings.lifecycle.requested', label: 'Requested' },
  { labelKey: 'bookings.lifecycle.quoteReceived', label: 'Quote Received' },
  { labelKey: 'bookings.lifecycle.scheduled', label: 'Scheduled' },
]

export function BookingLifecycleStepper({
  currentStep,
  actionRequired = false,
}: BookingLifecycleStepperProps) {
  const { t } = useTranslation()

  return (
    <div className="mb-4">
      <div
        className="flex items-start"
        aria-label={t('bookings.lifecycle.progress', 'Booking progress')}
      >
        {steps.map((step, index) => {
          const stepNumber = index + 1
          const isComplete = stepNumber < currentStep
          const isCurrent = stepNumber === currentStep
          const StepIcon = isComplete
            ? CheckCircle2
            : stepNumber === 3
              ? Wrench
              : Clock

          return (
            <div key={step.labelKey} className="flex flex-1 items-start last:flex-none">
              <div className="flex min-w-0 flex-col items-center gap-1.5">
                <span
                  className={`flex h-8 w-8 items-center justify-center rounded-full border-2 ${
                    isComplete
                      ? 'border-emerald-500 bg-emerald-500 text-white'
                      : isCurrent
                        ? 'border-amber-500 bg-amber-500 text-slate-950 shadow-md shadow-amber-500/30'
                        : 'border-slate-300 bg-slate-100 text-slate-400 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-500'
                  } ${isCurrent ? 'animate-pulse' : ''}`}
                >
                  <StepIcon className="h-4 w-4" aria-hidden="true" />
                </span>
                <span
                  className={`text-center text-[10px] font-semibold leading-tight sm:text-xs ${
                    isComplete
                      ? 'text-emerald-700 dark:text-emerald-400'
                      : isCurrent
                        ? 'text-amber-700 dark:text-amber-400'
                        : 'text-slate-400 dark:text-zinc-500'
                  }`}
                >
                  {t(step.labelKey, step.label)}
                </span>
              </div>
              {index < steps.length - 1 && (
                <span
                  className={`mt-4 mx-2 flex-1 border-t-2 ${
                    stepNumber < currentStep
                      ? 'border-emerald-500'
                      : 'border-slate-200 dark:border-zinc-700'
                  }`}
                  aria-hidden="true"
                />
              )}
            </div>
          )
        })}
      </div>
      {actionRequired && (
        <div className="mt-3 flex justify-center">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/40 bg-amber-500/15 px-3 py-1 text-xs font-extrabold text-amber-800 dark:text-amber-300">
            <Clock className="h-3.5 w-3.5 animate-pulse" aria-hidden="true" />
            {t('bookings.lifecycle.actionRequired', 'Action Required: Review Quote')}
          </span>
        </div>
      )}
    </div>
  )
}

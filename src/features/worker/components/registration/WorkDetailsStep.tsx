import React from 'react'
import { useTranslation } from 'react-i18next'
import {
  AlertCircle,
  ArrowRight,
  Check,
  Info,
  Wrench,
  X,
} from 'lucide-react'
import {
  JUGNU_CATEGORIES,
  MUZAFFARNAGAR_PINCODES,
  getServiceById,
} from '@kaamgar/shared'
import { Badge, Input } from '@kaamgar/ui'
import { categoryIconMap } from '../../constants'
import type { RegistrationFormData } from '../../types'

interface WorkDetailsStepProps {
  formData: RegistrationFormData
  setFormData: React.Dispatch<React.SetStateAction<any>>
  errors: Record<string, string>
  selectedParentCategory: string | null
  selectedServices: string[]
  serviceLimitMessage: string | null
  setServiceLimitMessage: (msg: string | null) => void
  categorySwitchedNotice: string | null
  setCategorySwitchedNotice: (notice: string | null) => void
  onSelectParentCategory: (categoryId: string) => void
  onToggleServiceSelection: (serviceId: string) => void
}

export const WorkDetailsStep: React.FC<WorkDetailsStepProps> = ({
  formData,
  setFormData,
  errors,
  selectedParentCategory,
  selectedServices,
  serviceLimitMessage,
  setServiceLimitMessage,
  categorySwitchedNotice,
  setCategorySwitchedNotice,
  onSelectParentCategory,
  onToggleServiceSelection,
}) => {
  const { t, i18n } = useTranslation()

  return (
    <div className="space-y-6">
      {/* UNIFIED CATEGORY & MULTI-SERVICE SELECTION */}
      <div>
        <div className="mb-3">
          <label className="label text-semantic-text-secondary block font-bold text-sm">
            {t('auth.workerRegistration.selectTradeCategory', 'Select Your Primary Trade Category')} *
          </label>
          <p className="text-xs text-semantic-text-tertiary mt-0.5">
            {t(
              'auth.workerRegistration.selectCategorySubtitle',
              'Choose 1 trade category below. You can then select 1 or 2 services within this category.'
            )}
          </p>
        </div>

        {/* 5 Parent Categories Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mb-4">
          {JUGNU_CATEGORIES.map(category => {
            const CatIcon = categoryIconMap[category.icon] || Wrench
            const isHindiLang = i18n.language === 'hi'
            const primaryName = isHindiLang ? category.name_hi : category.name_en
            const secondaryName = isHindiLang ? category.name_en : category.name_hi
            const isCategoryActive = selectedParentCategory === category.id
            const selectedCount = isCategoryActive ? selectedServices.length : 0

            return (
              <div
                key={category.id}
                onClick={() => onSelectParentCategory(category.id)}
                className={`p-3.5 rounded-2xl border transition-all flex items-center justify-between cursor-pointer select-none group ${
                  isCategoryActive
                    ? 'border-brand-500 bg-brand-500/15 ring-2 ring-brand-500/30 shadow-md'
                    : 'border-semantic-border-light bg-surface-200/50 hover:bg-surface-200 hover:border-brand-500/40 shadow-xs'
                }`}
                role="button"
                tabIndex={0}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className={`w-10 h-10 rounded-xl border flex items-center justify-center shrink-0 transition-all ${
                      isCategoryActive
                        ? 'bg-brand-500 text-surface-950 font-bold border-brand-500 shadow-sm'
                        : 'bg-brand-500/10 text-brand-400 border-brand-500/25 group-hover:scale-105'
                    }`}
                  >
                    <CatIcon className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <h4 className="text-sm font-bold text-semantic-text-primary truncate">
                        {primaryName}
                      </h4>
                      {isCategoryActive && (
                        <span className="text-[10px] font-extrabold px-1.5 py-0.2 rounded bg-brand-500/30 text-brand-300 border border-brand-500/40">
                          Selected
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-semantic-text-tertiary truncate mt-0.5">
                      {secondaryName}
                    </p>
                  </div>
                </div>

                {selectedCount > 0 ? (
                  <span className="text-[11px] font-extrabold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 shrink-0 ml-2">
                    {selectedCount} / 2
                  </span>
                ) : (
                  <ArrowRight
                    className={`w-4 h-4 shrink-0 ml-2 transition-transform ${
                      isCategoryActive
                        ? 'text-brand-400 translate-x-0.5'
                        : 'text-semantic-text-tertiary group-hover:text-brand-400'
                    }`}
                  />
                )}
              </div>
            )
          })}
        </div>

        {/* Category Switched Notice Banner */}
        {categorySwitchedNotice && (
          <div className="mb-4 p-3 bg-blue-500/15 border border-blue-500/30 rounded-xl flex items-start gap-2.5 text-blue-300 text-xs">
            <Info className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
            <div className="flex-1 font-medium">{categorySwitchedNotice}</div>
            <button
              type="button"
              onClick={() => setCategorySwitchedNotice(null)}
              className="text-blue-400 hover:text-white cursor-pointer"
              aria-label="Dismiss notice"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Services Selection Box */}
        {selectedParentCategory ? (
          (() => {
            const activeCategory = JUGNU_CATEGORIES.find(c => c.id === selectedParentCategory)!
            const isHindiLang = i18n.language === 'hi'
            const categoryPrimary = isHindiLang ? activeCategory.name_hi : activeCategory.name_en

            return (
              <div className="p-4 sm:p-5 rounded-2xl bg-surface-200/60 border border-brand-500/30 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-semantic-border-light">
                  <div>
                    <h4 className="text-sm font-bold text-semantic-text-primary flex items-center gap-2">
                      <span>Services in {categoryPrimary}:</span>
                      <span className="text-xs font-extrabold px-2 py-0.5 rounded-full bg-brand-500/20 text-brand-300 border border-brand-500/30">
                        {selectedServices.length} / 2 Selected
                      </span>
                    </h4>
                    <p className="text-xs text-semantic-text-tertiary mt-0.5">
                      {selectedServices.length === 0
                        ? 'Select 1 or 2 services you provide (Maximum 2)'
                        : selectedServices.length === 1
                        ? '✓ 1 service selected. You can select 1 more service from this list.'
                        : '✓ Maximum 2 services selected.'}
                    </p>
                  </div>

                  <span className="text-[11px] font-semibold text-amber-400/90 bg-amber-500/10 px-2.5 py-1 rounded-lg border border-amber-500/20 self-start sm:self-auto">
                    Max 2 services allowed
                  </span>
                </div>

                {/* 3rd Service Limit Warning */}
                {serviceLimitMessage && (
                  <div className="p-3 bg-amber-500/15 border border-amber-500/40 rounded-xl flex items-start gap-2.5 text-amber-300 text-xs">
                    <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                    <div className="flex-1 font-semibold">{serviceLimitMessage}</div>
                    <button
                      type="button"
                      onClick={() => setServiceLimitMessage(null)}
                      className="text-amber-400/80 hover:text-white cursor-pointer"
                      aria-label="Dismiss warning"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}

                {/* Selected Services Chips Bar */}
                {selectedServices.length > 0 && (
                  <div className="flex flex-wrap items-center gap-2 p-2.5 rounded-xl bg-surface-150/70 border border-semantic-border-light">
                    <span className="text-xs font-bold text-semantic-text-secondary mr-1">
                      Selected:
                    </span>
                    {selectedServices.map((svcId, idx) => {
                      const svc = getServiceById(svcId)
                      const name = svc ? (isHindiLang ? svc.name_hi : svc.name_en) : svcId
                      return (
                        <span
                          key={svcId}
                          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-emerald-500/20 text-emerald-300 text-xs font-bold border border-emerald-500/40 shadow-xs"
                        >
                          <span className="text-[10px] bg-emerald-500 text-surface-950 px-1.5 py-0.2 rounded font-black">
                            Service {idx + 1}
                          </span>
                          <span>{name}</span>
                          <button
                            type="button"
                            onClick={() => onToggleServiceSelection(svcId)}
                            className="hover:text-white cursor-pointer ml-1 text-emerald-400 transition-colors"
                            title={`Remove ${name}`}
                            aria-label={`Remove ${name}`}
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </span>
                      )
                    })}
                  </div>
                )}

                {/* Services Checklist */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {activeCategory.services.map(service => {
                    const isSelected = selectedServices.includes(service.id)
                    const selectedIndex = selectedServices.indexOf(service.id)
                    const ServiceIcon = categoryIconMap[service.icon] || Wrench
                    const servicePrimary = isHindiLang ? service.name_hi : service.name_en
                    const serviceSecondary = isHindiLang ? service.name_en : service.name_hi

                    return (
                      <div
                        key={service.id}
                        onClick={() => onToggleServiceSelection(service.id)}
                        className={`p-3.5 rounded-xl border flex items-center gap-3 cursor-pointer transition-all select-none ${
                          isSelected
                            ? 'border-emerald-500 bg-emerald-500/15 text-emerald-300 ring-2 ring-emerald-500/30 font-semibold shadow-sm'
                            : selectedServices.length >= 2
                            ? 'border-semantic-border-light bg-surface-150/40 opacity-60 hover:opacity-100 hover:border-amber-500/50 text-semantic-text-secondary'
                            : 'border-semantic-border-light bg-surface-150/80 hover:bg-surface-200 hover:border-brand-500/50 text-semantic-text-secondary'
                        }`}
                        role="checkbox"
                        aria-checked={isSelected}
                        tabIndex={0}
                      >
                        <div
                          className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center shrink-0 transition-colors ${
                            isSelected
                              ? 'bg-emerald-500 border-emerald-500 text-surface-950 font-bold'
                              : 'border-slate-500 dark:border-zinc-500 bg-transparent'
                          }`}
                        >
                          {isSelected ? <Check className="w-4 h-4 stroke-[3]" /> : null}
                        </div>

                        <div className="w-8 h-8 rounded-lg bg-surface-200/80 border border-semantic-border-light flex items-center justify-center text-semantic-text-secondary shrink-0">
                          <ServiceIcon className="w-4 h-4" />
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5">
                            <p className="text-sm font-bold text-semantic-text-primary truncate">
                              {servicePrimary}
                            </p>
                            {isSelected && (
                              <span className="text-[10px] font-black px-1.5 py-0.2 rounded bg-emerald-500/30 text-emerald-300 border border-emerald-500/40">
                                Service {selectedIndex + 1}
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-semantic-text-tertiary truncate">
                            {serviceSecondary}
                          </p>
                        </div>
                      </div>
                    )
                  })}
                </div>

                <div className="pt-2 flex items-start gap-2 text-[11px] text-semantic-text-tertiary leading-relaxed">
                  <Info className="w-3.5 h-3.5 text-brand-400 shrink-0 mt-0.5" />
                  <span>
                    <strong>Category Rule:</strong> You can select 1 or 2 services. All services
                    must belong to the selected trade category. To switch to another category, click
                    it above (previous selections will be reset).
                  </span>
                </div>
              </div>
            )
          })()
        ) : (
          <div className="p-6 rounded-2xl bg-surface-200/40 border border-dashed border-semantic-border-light text-center">
            <p className="text-xs font-semibold text-semantic-text-secondary">
              👆 Tap a trade category above to view and select up to 2 services.
            </p>
          </div>
        )}

        {errors.category && (
          <p className="mt-2 text-xs text-red-400 font-medium flex items-center gap-1">
            <AlertCircle className="w-3.5 h-3.5" />
            <span>{errors.category}</span>
          </p>
        )}
      </div>

      <Input
        label={t('auth.workerRegistration.experience', 'Years of Experience')}
        type="number"
        min="0"
        max="50"
        value={formData.experience}
        onChange={e => setFormData((prev: any) => ({ ...prev, experience: e.target.value }))}
        placeholder={t('auth.workerRegistration.experiencePlaceholder', 'e.g. 5')}
        error={errors.experience}
        required
      />

      <div>
        <label className="label text-semantic-text-secondary mb-1 block">
          {t('auth.workerRegistration.bio', 'Short Bio')}
        </label>
        <textarea
          value={formData.bio}
          onChange={e => setFormData((prev: any) => ({ ...prev, bio: e.target.value }))}
          placeholder={t(
            'auth.workerRegistration.bioPlaceholder',
            'Tell customers about your skills, specialties, and tools...'
          )}
          rows={3}
          className="w-full rounded-lg bg-surface-200 border border-semantic-border-light p-3 text-sm text-semantic-text-primary placeholder:text-semantic-text-tertiary focus:border-brand-500 focus:outline-none"
        />
        <p className="mt-1 text-xs text-semantic-text-tertiary">{t('common.optional', 'Optional')}</p>
      </div>

      <div>
        <label className="label text-semantic-text-secondary mb-2 block">
          {t('auth.workerRegistration.serviceAreas', 'Service Areas')}{' '}
          {t('auth.workerRegistration.selectAtLeastOne', '(Select at least one)')}
        </label>
        <div className="flex flex-wrap gap-2">
          {MUZAFFARNAGAR_PINCODES.map(pincode => (
            <Badge
              key={pincode}
              variant={formData.areas.includes(pincode) ? 'primary' : 'outline'}
              className="cursor-pointer py-1.5 px-3 text-xs"
              onClick={() => {
                setFormData((prev: any) => ({
                  ...prev,
                  areas: prev.areas.includes(pincode)
                    ? prev.areas.filter((a: string) => a !== pincode)
                    : [...prev.areas, pincode],
                }))
              }}
            >
              {pincode}
            </Badge>
          ))}
        </div>
        {errors.areas && <p className="mt-1 text-xs text-red-400">{errors.areas}</p>}
      </div>
    </div>
  )
}

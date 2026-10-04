import { getCategoryName, getServiceById, getCategoryById } from '@kaamgar/shared'

export function resolveServiceAndCategory(categoryId: string, lang: string) {
  const service = getServiceById(categoryId)
  const category = getCategoryById(categoryId)
  const normalizedLang = lang === 'hi' ? 'hi' : 'en'

  const serviceName = service ? getCategoryName(service, normalizedLang) : categoryId
  const categoryName = category ? getCategoryName(category, normalizedLang) : ''

  return { serviceName, categoryName }
}

export function formatBookingDate(dateStr: string, lang: string): string {
  if (!dateStr) return ''
  return new Date(dateStr).toLocaleDateString(lang === 'hi' ? 'hi-IN' : 'en-IN', {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

export function formatBookingTime(dateStr: string, lang: string): string {
  if (!dateStr) return ''
  return new Date(dateStr).toLocaleTimeString(lang === 'hi' ? 'hi-IN' : 'en-IN', {
    hour: '2-digit',
    minute: '2-digit',
  })
}

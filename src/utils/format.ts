/**
 * Shared Formatting Utilities for DoneKaro
 * Centralizes Indian currency, dates, and localized display formats.
 */

/**
 * Formats a numeric amount in INR (e.g., ₹1,499)
 */
export function formatCurrency(amount: number | null | undefined): string {
  if (amount == null || isNaN(amount)) return '₹0'
  return `₹${Number(amount).toLocaleString('en-IN')}`
}

/**
 * Formats an ISO date string or Date object into localized Indian standard date
 */
export function formatDate(
  date: string | Date | null | undefined,
  options?: Intl.DateTimeFormatOptions
): string {
  if (!date) return ''
  const parsed = typeof date === 'string' ? new Date(date) : date
  if (isNaN(parsed.getTime())) return ''
  
  const defaultOptions: Intl.DateTimeFormatOptions = {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    ...options,
  }
  return parsed.toLocaleDateString('en-IN', defaultOptions)
}

/**
 * Formats a date with time (e.g., "14 Oct 2026, 04:30 PM")
 */
export function formatDateTime(date: string | Date | null | undefined): string {
  if (!date) return ''
  const parsed = typeof date === 'string' ? new Date(date) : date
  if (isNaN(parsed.getTime())) return ''
  
  return parsed.toLocaleString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  })
}

import { ComponentType, lazy, LazyExoticComponent } from 'react'

/**
 * Checks whether an error is likely related to dynamic module / chunk loading.
 */
export function isChunkLoadError(error: unknown): boolean {
  if (!error) return false
  const message = error instanceof Error ? error.message : String(error)
  return (
    /Failed to fetch dynamically imported module/i.test(message) ||
    /Importing a module script failed/i.test(message) ||
    /error loading dynamically imported module/i.test(message) ||
    /Loading chunk [\d]+ failed/i.test(message) ||
    /dynamically imported module/i.test(message)
  )
}

/**
 * Wraps dynamic React component imports with an automatic single retry
 * to handle transient network blips and stale deployment chunk hashes.
 */
export function lazyWithRetry<T extends ComponentType<any>>(
  factory: () => Promise<{ default: T }>,
  retries = 1,
  delayMs = 1000
): LazyExoticComponent<T> {
  return lazy(async () => {
    try {
      return await factory()
    } catch (firstErr) {
      if (retries <= 0 || !isChunkLoadError(firstErr)) {
        throw firstErr
      }

      // Wait briefly before retrying in case of momentary connection glitch
      await new Promise((resolve) => setTimeout(resolve, delayMs))

      try {
        return await factory()
      } catch (secondErr) {
        if (import.meta.env.DEV) {
          console.warn('[lazyWithRetry] Dynamic import failed after retry:', secondErr)
        }
        throw secondErr
      }
    }
  })
}

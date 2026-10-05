import { ComponentType, lazy, LazyExoticComponent } from 'react'

const CHUNK_RELOAD_GUARD_KEY = 'donekaro_chunk_reload'

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
 * Wraps dynamic React component imports with production resilience:
 * - Detects stale or missing chunk import failures after deployments.
 * - Triggers at most one controlled full-page reload per browser session
 *   to fetch the latest HTML shell and current chunk hashes.
 * - Prevents infinite reload loops via a sessionStorage guard flag.
 * - Preserves existing non-chunk error handling and error boundary propagation.
 */
export function lazyWithRetry<T extends ComponentType<any>>(
  factory: () => Promise<{ default: T }>,
  _retries = 1,
  _delayMs = 1000
): LazyExoticComponent<T> {
  return lazy(async () => {
    try {
      const component = await factory()
      // Once a component loads successfully, clear the reload guard so future deployments
      // can safely trigger a controlled reload if new chunk changes occur.
      if (typeof window !== 'undefined') {
        try {
          sessionStorage.removeItem(CHUNK_RELOAD_GUARD_KEY)
        } catch {
          // Ignore sessionStorage access errors (e.g., privacy/quota restrictions)
        }
      }
      return component
    } catch (err) {
      if (!isChunkLoadError(err)) {
        throw err
      }

      // Check whether a controlled reload was already attempted in this session
      if (typeof window !== 'undefined') {
        let alreadyReloaded = false
        try {
          alreadyReloaded = !!sessionStorage.getItem(CHUNK_RELOAD_GUARD_KEY)
        } catch {
          alreadyReloaded = false
        }

        if (!alreadyReloaded) {
          try {
            sessionStorage.setItem(CHUNK_RELOAD_GUARD_KEY, String(Date.now()))
          } catch {
            // Ignore sessionStorage quota/security exceptions
          }

          // Trigger controlled full-page reload to fetch fresh index.html
          window.location.reload()

          // Return an unresolved promise to avoid rendering before reload executes
          return new Promise<{ default: T }>(() => {})
        }
      }

      // If reload has already been executed in this session, do not loop.
      // Re-throw to allow RouteErrorBoundary to display the user-facing fallback.
      if (import.meta.env.DEV) {
        console.warn('[lazyWithRetry] Dynamic chunk import failed after reload guard:', err)
      }
      throw err
    }
  })
}

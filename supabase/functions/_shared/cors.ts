// Supabase Edge Functions Shared CORS Helper
// Universally supports web browsers, Android WebView, Capacitor, PWA, and mobile testers.

declare const Deno: {
  env: {
    get(key: string): string | undefined
  }
}

/**
 * Returns standard CORS headers.
 * Echoes the requesting origin (if present) or falls back to '*' for missing/null origins.
 */
export function getCorsHeaders(
  req?: Request,
  additionalAllowedHeaders: string[] = []
): Record<string, string> {
  const origin = req?.headers?.get('Origin') || req?.headers?.get('origin')

  const allowedHeaders = [
    'authorization',
    'x-client-info',
    'apikey',
    'content-type',
    ...additionalAllowedHeaders,
  ]

  // Allow all origins gracefully:
  // Echo the requesting origin (e.g. capacitor://localhost, https://localhost, http://localhost, production domain)
  // or fallback to '*' if origin is missing or 'null'.
  const allowOrigin = origin && origin !== 'null' ? origin : '*'

  return {
    'Access-Control-Allow-Origin': allowOrigin,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': allowedHeaders.join(', '),
    'Access-Control-Max-Age': '86400',
    'Vary': 'Origin',
  }
}

/**
 * Handles CORS preflight (OPTIONS) requests.
 * Always returns HTTP 200 OK with proper CORS headers so browsers and WebViews never fail preflight.
 */
export function handleCors(
  req: Request,
  additionalAllowedHeaders: string[] = []
): Response | null {
  if (req.method === 'OPTIONS') {
    const headers = getCorsHeaders(req, additionalAllowedHeaders)
    return new Response('ok', {
      status: 200,
      headers,
    })
  }

  return null
}

/**
 * Kept for backwards compatibility if any legacy code checks it.
 */
export function isAllowedOrigin(_origin: string): boolean {
  return true
}

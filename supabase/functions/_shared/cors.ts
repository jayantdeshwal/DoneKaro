declare const Deno: {
  env: {
    get(key: string): string | undefined
  }
}

const allowedOrigins = (Deno.env.get('ALLOWED_ORIGINS') || '')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean)

function isLocalDevelopment(): boolean {
  if (Deno.env.get('ENVIRONMENT') === 'development') return true

  try {
    const hostname = new URL(Deno.env.get('SUPABASE_URL') || '').hostname
    return ['localhost', '127.0.0.1', '::1', '[::1]', 'kong'].includes(hostname)
  } catch {
    return false
  }
}

export function isAllowedOrigin(origin: string): boolean {
  return allowedOrigins.includes(origin) ||
    (isLocalDevelopment() && origin === 'http://localhost:3000')
}

export function getCorsHeaders(req: Request, additionalAllowedHeaders: string[] = []): Record<string, string> {
  const origin = req.headers.get('Origin')
  const allowedHeaders = [
    'authorization',
    'x-client-info',
    'apikey',
    'content-type',
    ...additionalAllowedHeaders,
  ]

  const headers: Record<string, string> = {
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': allowedHeaders.join(', '),
    'Vary': 'Origin',
  }

  if (origin && isAllowedOrigin(origin)) {
    headers['Access-Control-Allow-Origin'] = origin
  }

  return headers
}

export function handleCors(req: Request, additionalAllowedHeaders: string[] = []): Response | null {
  const origin = req.headers.get('Origin')
  const headers = getCorsHeaders(req, additionalAllowedHeaders)

  if (origin && !isAllowedOrigin(origin)) {
    return new Response('Origin not allowed', { status: 403, headers })
  }

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers })
  }

  return null
}
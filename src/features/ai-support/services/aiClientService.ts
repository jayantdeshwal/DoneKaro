/**
 * AI Client Service
 * Orchestrates AI requests, handles Edge Function interaction with JWT authorization,
 * fetches authorized live application context, and activates the grounded fallback
 * service if server AI is unavailable.
 */

import { getSupabaseClient } from '@/lib/supabase'
import {
  AssistantPersona,
  ChatMessage,
  GenerateResponseParams,
  ChatAction,
  AILiveContext,
} from '../types'
import { resolveLocalFallbackQuery } from './aiFallbackService'
import { fetchAuthorizedLiveContext } from './aiContextService'
import { sanitizeAndGroundAiResponse } from './aiGroundingService'
import { AI_SUPPORT_CONFIG } from '../config'

export async function processAiQuery({
  query,
  persona,
  conversationHistory = [],
  bookingHintId,
  liveContext: passedContext,
}: GenerateResponseParams): Promise<ChatMessage> {
  const trimmed = query.trim().slice(0, AI_SUPPORT_CONFIG.maxQueryLength)

  // 1. Fetch authorized live context (RLS-enforced, privacy-preserved)
  let liveContext: AILiveContext | null = null
  try {
    liveContext = passedContext !== undefined ? passedContext : await fetchAuthorizedLiveContext(bookingHintId)
  } catch (err) {
    console.warn('[AI Support] Error resolving live context:', err)
  }

  if (!trimmed) {
    return resolveLocalFallbackQuery(query, persona, liveContext)
  }

  // 2. Attempt server-side inference via Edge Function (requires authenticated session)
  try {
    const serverReply = await callServerAi({
      query: trimmed,
      persona,
      conversationHistory,
      bookingHintId,
      liveContext,
    })
    if (serverReply) {
      return serverReply
    }
  } catch (err) {
    console.warn('[AI Support] Edge inference notice, activating grounded local fallback engine:', err)
  }

  // 3. Grounded Local Intelligence Fallback
  return resolveLocalFallbackQuery(trimmed, persona, liveContext)
}

async function callServerAi({
  query,
  persona,
  conversationHistory = [],
  bookingHintId,
  liveContext,
}: {
  query: string
  persona: AssistantPersona
  conversationHistory?: ChatMessage[]
  bookingHintId?: string
  liveContext?: AILiveContext | null
}): Promise<ChatMessage | null> {
  const supabase = getSupabaseClient()

  // Verify caller session exists
  const { data: sessionData } = await supabase.auth.getSession()
  const session = sessionData?.session

  // If unauthenticated, gracefully defer to grounded fallback without failing loudly
  if (!session) {
    return null
  }

  // Format past history for context (last N messages)
  const recentHistory = conversationHistory
    .slice(-AI_SUPPORT_CONFIG.historyContextLimit)
    .map(m => ({
      sender: m.sender,
      textEn: m.textEn,
      textHi: m.textHi,
    }))

  const { data, error } = await supabase.functions.invoke('chat-ai', {
    body: {
      query,
      persona,
      conversationHistory: recentHistory,
      bookingHintId,
    },
    headers: {
      Authorization: `Bearer ${session.access_token}`,
    },
  })

  if (error || !data?.content) {
    return null
  }

  const rawContent = String(data.content).trim()
  if (!rawContent) return null

  // Post-sanitize against prohibited hallucinations
  const { text: textContent } = sanitizeAndGroundAiResponse(rawContent, liveContext ?? null)

  // Attach relevant action buttons based on persona, query content, and live context
  const actions = extractContextualActions(query, persona, liveContext)

  return {
    id: 'ai_' + Date.now(),
    sender: 'assistant',
    persona,
    timestamp: new Date(),
    textEn: textContent,
    textHi: textContent,
    sourceType: (data.sourceType as any) || (liveContext?.primaryBooking ? 'application_data' : 'jugnu_rule'),
    actions,
  }
}

function extractContextualActions(
  query: string,
  persona: AssistantPersona,
  liveContext?: AILiveContext | null
): ChatAction[] {
  const q = query.toLowerCase()
  const actions: ChatAction[] = []

  if (persona === 'customer_booking') {
    if (q.includes('electric') || q.includes('mcb') || q.includes('spark') || q.includes('fan') || q.includes('बिजली')) {
      actions.push({
        id: 'act_find_electrician',
        labelEn: 'Find Electricians in Muzaffarnagar',
        labelHi: 'इलेक्ट्रीशियन खोजें',
        type: 'navigate',
        payload: '/search?category=electrician',
        icon: 'Zap',
      })
    } else if (q.includes('plumb') || q.includes('leak') || q.includes('pipe') || q.includes('tank') || q.includes('नल')) {
      actions.push({
        id: 'act_find_plumber',
        labelEn: 'Find Plumbers in Muzaffarnagar',
        labelHi: 'प्लंबर खोजें',
        type: 'navigate',
        payload: '/search?category=plumber',
        icon: 'Droplet',
      })
    } else if (q.includes('ac') || q.includes('cool') || q.includes('fridge') || q.includes('एसी')) {
      actions.push({
        id: 'act_find_ac',
        labelEn: 'Book AC Repair Service',
        labelHi: 'AC मैकेनिक खोजें',
        type: 'navigate',
        payload: '/search?category=ac_repair',
        icon: 'Wind',
      })
    } else if (q.includes('salon') || q.includes('groom') || q.includes('hair') || q.includes('facial') || q.includes('सैलून')) {
      actions.push({
        id: 'act_find_salon',
        labelEn: 'Explore Salon Services',
        labelHi: 'सैलून सेवाएँ देखें',
        type: 'navigate',
        payload: '/search?category=parlour_service',
        icon: 'Scissors',
      })
    } else {
      actions.push({
        id: 'act_browse_all',
        labelEn: 'Browse All Categories',
        labelHi: 'सभी सेवाएँ देखें',
        type: 'navigate',
        payload: '/categories',
        icon: 'Search',
      })
    }
  } else if (persona === 'worker_sarathi') {
    actions.push({
      id: 'act_worker_dash',
      labelEn: 'Open Worker Dashboard',
      labelHi: 'कारीगर डैशबोर्ड खोलें',
      type: 'navigate',
      payload: '/worker/dashboard',
      icon: 'Briefcase',
    })
  }

  return actions
}

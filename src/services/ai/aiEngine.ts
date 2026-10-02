/**
 * AI Engine Service (Legacy Façade)
 * Phase 10A: Delegates to feature-oriented AI Support architecture
 * Canonical logic lives in src/features/ai-support
 */

import { AssistantPersona, ChatMessage, GenerateResponseParams as FeatureGenerateResponseParams } from './types'
import { processAiQuery as featureProcessAiQuery } from '@/features/ai-support'

export type GenerateResponseParams = FeatureGenerateResponseParams

/**
 * Process an AI query via the feature-oriented client service.
 * Supports Edge Function inference with session authorization, live context, and grounded local fallback.
 */
export async function processAiQuery(params: GenerateResponseParams): Promise<ChatMessage> {
  return featureProcessAiQuery(params)
}

/**
 * AI Support Feature Configuration
 * Phase 10A: Grounding, Security & Architecture Foundation
 */

export interface AiSupportConfig {
  /**
   * Controlled flag for direct phone calling capability.
   * Direct support calling is disabled across the app in Phase 10A.
   * Kept in configuration to allow controlled re-enable in future phases.
   */
  supportCallEnabled: boolean

  /**
   * Enable deterministic local domain fallback when server AI is unreachable.
   */
  fallbackEnabled: boolean

  /**
   * Allowed personas by user role.
   * Strictly separates customer and worker assistance.
   */
  allowedPersonasByRole: {
    customer: readonly ['customer_booking', 'customer_care']
    worker: readonly ['worker_sarathi']
    admin: readonly ['customer_booking', 'customer_care', 'worker_sarathi']
  }

  /**
   * Request constraints for client-side queries.
   */
  maxQueryLength: number
  historyContextLimit: number
}

export const AI_SUPPORT_CONFIG: AiSupportConfig = {
  supportCallEnabled: false,
  fallbackEnabled: true,
  allowedPersonasByRole: {
    customer: ['customer_booking', 'customer_care'] as const,
    worker: ['worker_sarathi'] as const,
    admin: ['customer_booking', 'customer_care', 'worker_sarathi'] as const,
  },
  maxQueryLength: 1000,
  historyContextLimit: 6,
}

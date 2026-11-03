import React from 'react'
import { useTranslation } from 'react-i18next'
import { FileText } from 'lucide-react'
import { CATEGORIES, getCategoryName } from '@kaamgar/shared'
import { Badge, Button } from '@/ui'
import {
  BookingQuoteRequest,
  respondToBookingQuoteRequest,
  ServiceRequest,
} from '@/services/quotes'

interface QuoteRequestsFeedProps {
  quoteRequests: BookingQuoteRequest[]
  quoteServices: Map<string, ServiceRequest>
  onOpenSendQuote: (request: BookingQuoteRequest) => void
  onRefreshData: () => Promise<void>
  onError: (err: string) => void
}

export const QuoteRequestsFeed: React.FC<QuoteRequestsFeedProps> = ({
  quoteRequests,
  quoteServices,
  onOpenSendQuote,
  onRefreshData,
  onError,
}) => {
  const { t, i18n } = useTranslation()

  if (quoteRequests.length === 0) return null

  const pendingRequests = quoteRequests.filter(r => r.status === 'pending')

  return (
    <section
      id="quote-requests"
      className="mb-6 rounded-2xl border border-amber-500/25 bg-amber-500/5 p-4 scroll-mt-24"
    >
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <FileText className="w-4 h-4 text-amber-500" />
          {t('workerDashboard.quoteRequests', 'Quote Requests')}
        </h3>
        <Badge variant="warning">
          {t('workerDashboard.pendingCount', '{{count}} pending', {
            count: pendingRequests.length,
          })}
        </Badge>
      </div>

      <div className="space-y-3">
        {pendingRequests.map(request => {
          const service = quoteServices.get(request.service_request_id)
          return (
            <div
              key={request.id}
              className="rounded-xl bg-white/70 dark:bg-zinc-900/50 border border-amber-500/20 p-3"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="font-semibold text-slate-900 dark:text-white">
                    {service
                      ? getCategoryName(
                          CATEGORIES.find(c => c.id === service.category_id) || CATEGORIES[0],
                          i18n.language === 'hi' ? 'hi' : 'en'
                        )
                      : t('workerDashboard.serviceRequest', 'Service request')}
                  </p>
                  {service && (
                    <p className="text-xs text-semantic-text-secondary mt-1">
                      {new Date(service.scheduled_for).toLocaleString(
                        i18n.language === 'hi' ? 'hi-IN' : 'en-IN'
                      )}{' '}
                      · {service.pincode}
                    </p>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="primary"
                    size="md"
                    onClick={() => onOpenSendQuote(request)}
                  >
                    {t('workerDashboard.sendQuote', 'Send Quote')}
                  </Button>
                  <Button
                    variant="ghost"
                    size="md"
                    onClick={() =>
                      void (async () => {
                        try {
                          await respondToBookingQuoteRequest({
                            requestId: request.id,
                            action: 'reject',
                          })
                          await onRefreshData()
                        } catch (err) {
                          onError(
                            err instanceof Error
                              ? err.message
                              : t('workerDashboard.rejectQuoteError', 'Unable to reject quote request')
                          )
                        }
                      })()
                    }
                  >
                    {t('workerDashboard.reject', 'Reject')}
                  </Button>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </section>
  )
}

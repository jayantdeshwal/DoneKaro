import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Button, Card, Badge } from '@kaamgar/ui'
import { FileText } from 'lucide-react'
import type { BookingQuote, BookingQuoteRequest } from '@/services/quotes'
import { formatBookingDate, formatBookingTime, resolveServiceAndCategory } from '../utils/bookingFormat'

interface QuoteRequestsSectionProps {
  quoteRequests: BookingQuoteRequest[]
  quotes: BookingQuote[]
  quoteWorkers: Map<string, { name: string; avatar: string | null; rating: number; reviews: number; experience: number }>
  quoteActionId: string | null
  onAcceptQuote: (quote: BookingQuote) => void | Promise<void>
  onCancelQuoteRequest: (request: BookingQuoteRequest) => void | Promise<void>
}

export function QuoteRequestsSection({
  quoteRequests,
  quotes,
  quoteWorkers,
  quoteActionId,
  onAcceptQuote,
  onCancelQuoteRequest,
}: QuoteRequestsSectionProps) {
  const { t, i18n } = useTranslation()

  if (quoteRequests.length === 0) return null

  return (
    <section id="quote-requests" className="mb-6 space-y-3 scroll-mt-24">
      <div className="flex items-center gap-2">
        <FileText className="w-4 h-4 text-amber-500" />
        <h2 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">Quote Requests</h2>
      </div>
      {quoteRequests.map(request => {
        const service = request.service_request
        const worker = quoteWorkers.get(request.worker_id)
        const quote = request.status === 'quoted'
          ? quotes.find(item => item.quote_request_id === request.id && item.status === 'submitted')
          : undefined
        const canCancel = request.status === 'pending' || request.status === 'quoted'

        return (
          <Card key={request.id} className="p-4 border-amber-500/25 bg-amber-500/5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="font-bold text-slate-900 dark:text-white">{worker?.name || 'Selected provider'}</p>
                <p className="text-xs text-slate-600 dark:text-zinc-400 mt-1">
                  {service ? resolveServiceAndCategory(service.category_id, i18n.language).serviceName : 'Service request'}
                </p>
                {worker && (
                  <p className="text-xs text-slate-600 dark:text-zinc-400 mt-1">
                    {worker.rating > 0 ? `★ ${worker.rating.toFixed(1)}` : 'No ratings yet'} · {worker.reviews} reviews · {worker.experience} years experience
                  </p>
                )}
              </div>
              <Badge variant={request.status === 'quoted' ? 'success' : request.status === 'pending' ? 'warning' : 'default'}>
                {request.status === 'pending'
                  ? 'Waiting for provider'
                  : request.status === 'quoted'
                  ? 'Quote received'
                  : request.status[0].toUpperCase() + request.status.slice(1)}
              </Badge>
            </div>
            {service && (
              <p className="mt-2 text-xs text-slate-600 dark:text-zinc-400">
                {formatBookingDate(service.scheduled_for, i18n.language)} at {formatBookingTime(service.scheduled_for, i18n.language)} · {service.pincode}
              </p>
            )}
            {quote && (
              <div className="mt-3 rounded-xl bg-white/70 dark:bg-zinc-900/50 border border-emerald-500/25 p-3">
                <p className="text-sm font-bold text-slate-900 dark:text-white">Provider quote: ₹{Number(quote.amount).toFixed(2)}</p>
                {quote.details && <p className="mt-1 text-sm text-slate-600 dark:text-zinc-400">{quote.details}</p>}
                <p className="mt-1 text-xs text-slate-500 dark:text-zinc-500">
                  Received {new Date(quote.submitted_at).toLocaleString(i18n.language === 'hi' ? 'hi-IN' : 'en-IN')}
                </p>
                <Button
                  variant="primary"
                  size="sm"
                  className="mt-3"
                  loading={quoteActionId === quote.id}
                  onClick={() => void onAcceptQuote(quote)}
                >
                  {t('quotes.acceptQuote', 'Accept Quote')}
                </Button>
              </div>
            )}
            {canCancel && (
              <div className="mt-3 flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={Boolean(quoteActionId)}
                  loading={quoteActionId === request.id}
                  onClick={() => void onCancelQuoteRequest(request)}
                >
                  {t('quotes.cancelRequest', 'Cancel Request')}
                </Button>
              </div>
            )}
            {(request.status === 'cancelled' || request.status === 'expired' || request.status === 'rejected') && service && (
              <Link to={`/search?category=${encodeURIComponent(service.category_id)}`} className="inline-block mt-3">
                <Button variant="secondary" size="sm">
                  {t('quotes.chooseAnotherProvider', 'Choose Another Provider')}
                </Button>
              </Link>
            )}
          </Card>
        )
      })}
    </section>
  )
}

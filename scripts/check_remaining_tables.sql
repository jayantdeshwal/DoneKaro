SELECT 'booking_payments' AS tbl, count(*) AS cnt FROM public.booking_payments
UNION ALL SELECT 'booking_quote_requests', count(*) FROM public.booking_quote_requests
UNION ALL SELECT 'notification_push_outbox', count(*) FROM public.notification_push_outbox
UNION ALL SELECT 'push_subscriptions', count(*) FROM public.push_subscriptions
UNION ALL SELECT 'service_request_attachments', count(*) FROM public.service_request_attachments
UNION ALL SELECT 'service_requests', count(*) FROM public.service_requests
UNION ALL SELECT 'suggestions', count(*) FROM public.suggestions;

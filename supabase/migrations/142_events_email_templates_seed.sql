BEGIN;

INSERT INTO public.email_templates (template_key, locale, subject, body_html)
VALUES
  (
    'events.registered',
    'es',
    'Inscripción recibida',
    '<p>Tu inscripción al evento fue recibida correctamente.</p>'
  ),
  (
    'events.registered',
    'en',
    'Registration received',
    '<p>Your event registration was received successfully.</p>'
  ),
  (
    'events.payment_approved',
    'es',
    'Pago aprobado',
    '<p>Tu pago del evento fue aprobado. ¡Nos vemos pronto!</p>'
  ),
  (
    'events.payment_approved',
    'en',
    'Payment approved',
    '<p>Your event payment was approved. See you soon!</p>'
  ),
  (
    'events.payment_rejected',
    'es',
    'Pago rechazado',
    '<p>No pudimos aprobar tu pago del evento. Revisa el comprobante e inténtalo nuevamente.</p>'
  ),
  (
    'events.payment_rejected',
    'en',
    'Payment rejected',
    '<p>We could not approve your event payment. Please review the receipt and try again.</p>'
  ),
  (
    'events.reminder',
    'es',
    'Recordatorio de evento',
    '<p>Te recordamos que tu evento está próximo a comenzar.</p>'
  ),
  (
    'events.reminder',
    'en',
    'Event reminder',
    '<p>This is a reminder that your event is starting soon.</p>'
  )
ON CONFLICT (template_key, locale) DO NOTHING;

COMMIT;

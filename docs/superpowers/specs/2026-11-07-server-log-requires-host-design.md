# Mercado Pago webhook log — host, tenant, and signature cause

**Intent:** `mpWebhook:invalid_signature` must stay in the logs. The line names the signature cause and the institute host and slug from the webhook request.

**Done when:**

- The verifier returns a stable code: `missing_secret`, `missing_signature`, `missing_data_id`, `malformed_signature`, `timestamp_out_of_window`, or `digest_mismatch`.
- The warn line includes that code, the request host (`x-forwarded-host`, then `host`, then the request URL), and the tenant slug from `resolveRequestTenant`.
- A `[ge:server]` line is still written when host and tenant slug are both empty.
- Vitest locks the codes and the webhook warn payload.

**Out of scope:** Changing the HMAC manifest, the 401 response, or other webhook purposes.

## Surfaces (Web vs PWA)

No screen. Mercado Pago calls the API route. No Web or PWA tree.

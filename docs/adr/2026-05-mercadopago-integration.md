# MercadoPago Checkout Pro (Argentina + Chile)

## Context

Golden English already integrates **Flow.cl** for Chile (CLP) monthly tuition checkout. Product needs **MercadoPago Checkout Pro** for **Argentina (ARS)** and **Chile (CLP)**, with admin-configurable encrypted credentials per `(provider, country_code)`. When multiple gateways are enabled for the same country, families choose at payment time.

## Decision

- **Checkout Pro redirect** — server creates a Preference, user pays on MercadoPago, returns via `back_urls`.
- **Credentials**: one row each for `mercadopago + AR` and `mercadopago + CL` in `payment_gateway_credentials`; `access_token` in `api_key_encrypted`, `webhook_secret` in `webhook_secret_encrypted`.
- **Webhook**: `POST /api/payments/mercadopago/webhook` validates `x-signature`, fetches payment via REST, finalizes idempotently.
- **Multi-gateway**: RPC `enabled_payment_gateways_for_country` + portal selector when more than one provider is enabled for the billing currency’s country.

## Options considered

| Option | Rejected because |
|--------|------------------|
| Checkout Bricks (embedded) | More client JS, harder to align with existing Flow redirect UX |
| Official Node SDK | REST + fetch matches Flow adapter style; fewer dependencies |
| Single MercadoPago credential for all countries | MP accounts are country-scoped (ARS vs CLP tokens) |

## Consequences

- New migration: provider CHECK, `webhook_secret_encrypted`, `payment_mp_finalize_records`, `payments.gateway_provider`, `payments.mp_preference_id`.
- Admin: two MercadoPago cards (AR / CL) in Finance settings.
- Portal: generalized online-pay panel (Flow + MercadoPago).
- Tests lock signature verification, finalize idempotency, and migration contract.
- Ops: configure webhook URL + secret in MercadoPago dashboard per country account.

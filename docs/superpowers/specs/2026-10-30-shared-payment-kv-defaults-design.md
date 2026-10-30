# Shared payment key and KV defaults

**Intent:** The Pulsar tenant form must not ask for the payment encryption key or the KV / Redis pair. Those three values are the same for every institute. A new site stores them empty. Runtime uses the platform env when the institute row is empty.

**Done when:**

- Create and edit hide the section `Cifrado de pagos y KV / Redis` (`paymentGatewaySecretEncryptionKey`, `kvRestApiUrl`, `kvRestApiToken`).
- A create save stores `null` for those three columns. The client cannot set them on create.
- An edit save keeps the values already stored. Hiding the inputs does not wipe them.
- When an active institute has an empty field, `loadPaymentGatewayEncryptionKeyRaw32` reads `PAYMENT_GATEWAY_SECRET_ENCRYPTION_KEY`, and KV reads `KV_REST_API_URL` / `KV_REST_API_TOKEN`.
- A non-empty value already stored on that institute still wins.
- With no active institute, multi-tenant mode still ignores those env vars.

**Out of scope:** Dropping the columns. Changing other tenant secrets. Rewriting `TENANTS_CONFIG_JSON` for existing local institutes. A visible “uses platform default” note.

## Surfaces (Web vs PWA)

Tier B — desktop-only (no PWA tree). The form is `PulsarAdminTenantForm` under Pulsar admin. No `src/components/pwa/` caller reads these fields.

## Behavior

`preferTenantValue` stays as it is. It must not start returning env secrets for every empty institute field.

A new helper applies only to these three shared secrets:

1. If the active institute has a trimmed value, use that value.
2. If the active institute exists and the field is empty, use the platform env.
3. If no institute is active, keep the current `preferTenantValue` rule.

Call sites: `loadPaymentGatewayEncryptionKeyRaw32` and `kvCredentials` in `importJobKv.ts`.

Create path in `validatePulsarTenantInput` (or the save action): force the three fields to `null` when `editingSlug` is absent.

Edit path: if the payload omits the three fields or sends them empty, copy the previous row. Do not replace a stored key with null.

## Tests

- Form: the three inputs are absent on create and on edit.
- Schema or save validation: create forces null even if the payload includes a key.
- Schema or save validation: edit with an empty payload keeps the previous key and KV pair.
- Shared-secret helper: empty institute field plus env returns the env value while multi-tenant mode is on.
- KV: an active institute with empty KV fields uses the shared env. No active institute still does not.

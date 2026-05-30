# ADR: Paid events with dynamic registration forms and Finance Hub integration

## Context

The product needs a full events flow with both free and paid events, capped capacity,
public and authenticated registration, and event-specific dynamic forms.

The current finance model uses `public.payments` for monthly and enrollment billing.
Reusing that table for events would force unrelated constraints and semantics into one
entity (`student_id`, period-oriented fields, and existing workflows tightly coupled
to school billing).

We also need:

- waitlist behavior when capacity is full,
- minors support with tutor data capture,
- per-event multilang form labels,
- payment through enabled gateways (Flow / MercadoPago) or bank transfer receipt upload
  with manual approval,
- admin event management under `/dashboard/admin/events`,
- public SEO-friendly events listing and detail pages,
- auditability and analytics parity with existing finance/admin flows.

## Decision

1. Introduce a dedicated events domain with new tables:
   - `events`
   - `event_form_fields`
   - `event_attendees`
   - `event_attendee_field_values`
   - `event_payments`
   - gateway finalize snapshots:
     - `event_payment_flow_finalize_records`
     - `event_payment_mp_finalize_records`
2. Keep `event_payments` separate from `public.payments`. Finance Hub will consume
   both sources via a read adapter and render event finance in a dedicated tab/panel.
3. Implement enrollment through a DB RPC (`enroll_event_attendee`) that enforces:
   - capacity checks under lock,
   - dedupe by `(event_id, dni_or_passport)`,
   - waitlist when full (without creating a payment row),
   - tutor-required constraints for minors,
   - optional section-scoped enrollment when enabled.
4. Support multilang field labels/help/options in JSONB per locale with fallback to
   event default locale.
5. Use the same payment approval semantics as monthly payments for receipt uploads
   (`pending -> approved/rejected`) and extend gateway webhook finalization for
   `purpose=event`.
6. Expose public routes:
   - `/[locale]/events`
   - `/[locale]/events/[slug]`
   - `/[locale]/events/[slug]/register`
   with metadata, sitemap inclusion, and JSON-LD `Event`.
7. Enforce admin-first mutation boundaries, structured server logs, and audit trails
   aligned with existing finance standards (`audit_events` and system-level audit where
   applicable).
8. Allow admin promotion of attendees to users with default role `student`, while
   permitting explicit role override.

## Options considered

- Extend `public.payments` for events:
  - Rejected due to domain mismatch and high coupling with academic monthly billing.
- New events without waitlist:
  - Rejected because product explicitly requires waitlist-only behavior when full.
- Keep form labels as single-locale text:
  - Rejected because each event needs localized labels.

## Consequences

Positive:

- Clear bounded context for events and event payments.
- No regression risk in monthly billing constraints.
- Better long-term maintainability for event-specific workflows.
- Public event discovery is SEO-ready.

Trade-offs:

- Finance Hub must merge two payment sources for analytics/panels.
- Additional migration and RLS surface area.
- More webhook branching (monthly vs event purpose).

Follow-ups:

- Refund automation is explicitly out of scope for this milestone.
- Discount/coupon support for events remains a future ADR if needed.

## Amendment (2026-05): tiered pricing + event translations

1. **Residency-based pricing** — `events.price_local` and `events.price_non_local` (with
   legacy `price` kept in sync for local tier). Public registration asks residency when
   tiers differ; `enroll_event_attendee` stores `event_attendees.is_local_resident` and
   charges the matching tier.
2. **Multilingual event copy** — table `event_translations` (`title`, `description`,
   `location` per `es`/`en`/`pt`) with fallback chain like blog articles. Admin detail
   exposes locale tabs, manual save, and Google Translate (same credentials as blog CMS).
3. **Migration** — `146_events_i18n_tiered_pricing.sql`.
4. **Rich description** — `description` stores sanitized HTML (blog allowlist). Admin uses
   `AcademicContentEditor` + bucket `event-media` for PDFs, audio, video, embeds. Public
   detail renders HTML; list/SEO use plain-text excerpt. Migration `147_events_media_storage.sql`.

## Contract: `enroll_event_attendee` (high-level)

Input:

- `event_id`
- base attendee identity fields
- optional `user_id`
- optional tutor payload
- dynamic form responses
- locale/context metadata

Core guarantees:

- validates event visibility/enrollment constraints,
- locks event row for deterministic capacity decisions,
- inserts attendee as:
  - `confirmed` (free, capacity available),
  - `pending_payment` (paid, capacity available),
  - `waitlist` (capacity full, no payment row),
- creates `event_payments` only when needed,
- writes normalized dynamic field values,
- returns stable machine-readable result codes.

## Test implications

- RPC integration tests for capacity, waitlist, dedupe, minors+tutor, and section scope.
- Webhook tests for event payment finalization.
- UI tests for public registration (including minors and file field).
- Admin tests for event table sorting/filtering and attendee promotion.

## Related rules

- `.cursor/rules/03-architecture.mdc`
- `.cursor/rules/04-security.mdc`
- `.cursor/rules/05-pwa-mobile-native.mdc`
- `.cursor/rules/06-seo-performance.mdc`
- `.cursor/rules/08-analytics-observability.mdc`
- `.cursor/rules/09-i18n-copy.mdc`
- `.cursor/rules/10-engineering-governance.mdc`
- `.cursor/rules/12-supabase-app-boundaries.mdc`
- `.cursor/rules/13-postgrest-pagination-bounded-queries.mdc`
- `.cursor/rules/15-entity-crud-completeness.mdc`
- `.cursor/rules/17-trust-boundary-handlers.mdc`
- `.cursor/rules/19-finance-staff-payment-audit.mdc`
- `.cursor/rules/21-migrations-production-no-data-destruction.mdc`
- `.cursor/rules/24-dashboard-list-filter-aggregates-rpc.mdc`
- `.cursor/rules/25-server-error-logging.mdc`
- `.cursor/rules/27-post-mutation-ui-refresh.mdc`

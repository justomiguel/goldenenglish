# Public event JSON-LD Implementation Plan

> **For agentic workers:** Required: spec `docs/superpowers/specs/2026-11-07-event-jsonld-google-fields-design.md`. Steps use checkbox (`- [ ]`) syntax.

**Goal:** The public event page emits Google Event JSON-LD with `location`, `endDate`, `organizer`, `offers`, and `performer`.

**Architecture:** A pure builder in `src/lib/events/buildPublicEventJsonLd.ts` owns the object. The server page resolves the brand and the public origin, then calls the builder. No migration.

**Tech stack:** TypeScript, Vitest, Next.js server page.

---

## File map

- Create `src/lib/events/buildPublicEventJsonLd.ts` — pure Event JSON-LD.
- Create `src/__tests__/lib/events/buildPublicEventJsonLd.test.ts` — behavior of that function.
- Modify `src/app/[locale]/events/[slug]/page.tsx` — replace the inline object with the builder.

## Task 1: Builder

**Files:** the two new files above.

- [ ] Write a failing test for a priced event with a room name: `Place.name` and `Place.address` are the room, `endDate` equals `startDate`, organizer is the brand, performer is a `PerformingGroup`, offer is one `Offer` with that price.
- [ ] Run `npx vitest run src/__tests__/lib/events/buildPublicEventJsonLd.test.ts` and confirm red.
- [ ] Add the builder until that test is green.
- [ ] Add tests for: empty location (brand name, brand address), free price `0`, tiered `AggregateOffer`, one package `AggregateOffer`, flow prices `AggregateOffer`, relative image made absolute, absolute image left as stored, missing origin keeps the path.
- [ ] Run the same file until green.

## Task 2: Page

**Files:** `src/app/[locale]/events/[slug]/page.tsx`

- [ ] Load `getBrandForRequest` and `getRequestPublicSiteUrl` next to the event.
- [ ] Pass location, prices, packages, flows, brand, origin, and the register path into `buildPublicEventJsonLd`.
- [ ] Keep the file under 250 lines.

## Out of scope

No changelog row. No dictionary keys. No new column.

# Public event JSON-LD: Google Event fields

**Intent:** Search Console on liorastudio.cl reports Event structured data with a critical miss (`location`) and four recommended misses (`endDate`, `organizer`, `offers`, `performer`). The public event page already has the facts. The JSON-LD script does not emit them.

**Done when:**

- `https://schema.org/Event` on `/{locale}/events/{slug}` includes `location`, `endDate`, `organizer`, `offers`, and `performer`.
- `location` is a `Place`. The venue name comes from the event location. The address text comes from the event location, then the host `contact.address`.
- `organizer` is the host brand (`Organization`: name, site URL, address when the brand has one).
- `offers` matches the public price: free is `0`, one price is one `Offer`, tiers or packages are an `AggregateOffer` with low and high price.
- `performer` is a `PerformingGroup` named with the host brand. The product has no guest-performer field.
- `endDate` equals `startDate`. The table stores one instant (`events.event_date`).
- `image` and offer `url` are absolute when the public origin is known.
- A pure builder under `src/lib/events/` owns the object. Vitest locks each branch.
- The events list stays an `ItemList` of links. It does not embed `Event` nodes.

**Out of scope:**

- A new `event_end_date` or performer column, and any admin field for them.
- Online vs in-person detection. Attendance mode stays `OfflineEventAttendanceMode`.
- Rich Results Test in a browser. That check is manual QA for the user after deploy.
- CentroListo pages. Institute events only.

## Context

`src/app/[locale]/events/[slug]/page.tsx` builds JSON-LD inline. Today it sends `name`, `description`, `startDate`, `eventAttendanceMode`, `eventStatus`, and sometimes `image`. The same page already renders `event.location` and the public price.

`public.events` has `event_date` and `location`. It has no end instant and no performer. Prices live on the event (`price`, `price_local`, `price_non_local`), on packages, and on registration flows. The host name and `contact.address` come from the brand layer (`getBrandForRequest`).

Google treats a missing `location` on an offline `Event` as critical. The other four fields are recommended. The list page (`src/app/[locale]/events/page.tsx`) emits `ItemList`, not `Event`, so Search Console is reading the detail script.

## Decision

Add `buildPublicEventJsonLd` in `src/lib/events/buildPublicEventJsonLd.ts`. The page passes the loaded event, the brand, the locale path, and absolute URLs. The function returns the JSON-LD object. No new column.

| Google field | Source |
| --- | --- |
| `location.@type` | `Place` |
| `location.name` | Trimmed event location, else brand name |
| `location.address` | Trimmed event location when set, else brand `contactAddress`. Omit `address` when both are empty. Still emit `Place` with `name`. |
| `endDate` | Same ISO string as `startDate` |
| `organizer` | `{ "@type": "Organization", name, url }` plus `address` when `contactAddress` is set |
| `offers` | See price rules below. `url` is the absolute register URL. `availability` is `https://schema.org/InStock`. `priceCurrency` is the event currency. |
| `performer` | `{ "@type": "PerformingGroup", name: brand.name }` |

Price rules, using the same order as `resolveEventPublicPriceDisplay`:

- Packages with at least one price: `AggregateOffer`, `lowPrice` / `highPrice`, `offerCount`.
- Tiered local and non-local prices: `AggregateOffer` over those two amounts.
- Flow prices when `priceByFlow` and at least one flow has a price: `AggregateOffer` over those amounts.
- One positive amount: one `Offer` with `price`.
- No positive amount: one `Offer` with `price` `0`.

Prices are decimal strings (`30` or `30.5`). Do not add a fake `.00` for CLP.

`image` stays omitted when there is no cover. A relative cover becomes absolute with the public origin. An already absolute cover stays as stored.

### Options considered

- **Leave recommended fields empty.** `location` would still fail rich results. The mail asks to fix the set. Rejected.
- **Add `event_end_date` and a performer column.** Staff would type a real end and a guest name. Existing rows would stay empty until someone edits each event, so Search Console would keep the warnings. Rejected for this change.
- **Invent a two-hour `endDate`.** That claims a duration the database does not store. Rejected. Same instant is the stored fact.

## Surfaces (Web vs PWA)

Public event detail is Tier A. The page is one server tree. `PublicEventDetailHero` and `PublicEventDetailPanel` already follow `surfaceVariant`. This change does not alter layout, copy, or props on those components.

- **Web (`web-desktop`):** same page. The script tag is in the document head/body as today.
- **PWA (`web-mobile` / `pwa-mobile`):** no separate event-detail tree. Registration (`EventRegisterSurfaceEntry`) is unchanged. JSON-LD is not visual.

The events list is the same shared page. Its `ItemList` script stays.

## Plan

1. Pure `buildPublicEventJsonLd` plus Vitest: location fallback, empty address, free offer, single offer, tiered offer, package offer, flow offer, endDate equals startDate, organizer, performer, absolute image.
2. Event detail page calls the builder. Keep the file under 250 lines.
3. No migration, no dictionary keys, no changelog row. Staff do not see a new control. The spec is the mini-design. No separate ADR: no auth change and no new table.

## Risks

- `endDate` equal to `startDate` can look like a zero-length event in some previews. It matches the stored instant and clears the recommended warning.
- `PerformingGroup` names the host, including language institutes that are not a stage act. Google’s performer type is Person or PerformingGroup. There is no stored guest.
- A `Place` with only a room name (`Sala 1`) and no street can still draw a non-critical address hint later. The critical miss is a missing `location` object.
- Offer prices ignore the minor ticket. The public card’s main price is the adult or package price. Minor price stays out of this script.

## Definition of done

- The builder tests pass in isolation.
- The detail page JSON-LD contains the five fields for a priced event with a location, and for a free event with an empty location (brand name and brand address).
- Manual QA (user): after deploy, open one Liora event URL in the Rich Results Test and confirm `location` is no longer a critical error.

## Manual QA (user)

- Open `https://liorastudio.cl/es/events/<slug>` for a published event.
- View source and confirm the `Event` script has `location`, `endDate`, `organizer`, `offers`, and `performer`.
- Run that URL in Google’s Rich Results Test.

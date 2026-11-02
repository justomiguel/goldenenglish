# CentroListo prices by country

**Intent:** The CentroListo marketing site shows Chile, Argentina, Uruguay, and Paraguay prices from one offer module. The visitor picks the country on `centrolisto.cl`. The choice lives in `?pais=` and in a cookie. Home, `/precios`, and each solution page use that country. Billing does not read this module.

**Done when:**

- A country control lists Chile, Argentina, Uruguay, and Paraguay on the desktop header and on the PWA header.
- `?pais=cl|ar|uy|py` wins. A missing or unknown value uses the cookie `centrolisto_market`. If both are empty, the country is Chile.
- Choosing a country writes the query and the cookie, and keeps the other query keys. Marketing links keep `pais` when it is set.
- Monthly amounts and the custom-landing amount match the tables below. Presencia with a template stays 0. Gestión has no one-time fee.
- Gestión copy states a cap of 50 active students. Ecosistema copy states that it includes Gestión without that cap, plus course routes and selling courses in the shop.
- The 50-student cap is copy only. The product does not block student number 51.
- English and Portuguese gain the same sentences. Marketing Spanish voice by country is in `2026-11-02-centrolisto-country-dictionary-design.md`.
- Amounts are static. The site does not call a central bank at runtime.

**Out of scope:** Charging, checkout, plan enforcement, live exchange rates, extra domains, geo-IP, and a second `es` locale.

## Surfaces (Web vs PWA)

The marketing pages already split chrome. `PulsarSiteChromeEntry` renders `PulsarSiteChrome` on desktop and `PulsarSiteChromePwa` on narrow and installed PWA. Price bodies stay shared (`PulsarOfferPrice`, `PulsarPricingView`, solution pages).

- **Web (`web-desktop`):** the country control sits in the desktop header. Prices on the page use the resolved country.
- **PWA (`web-mobile` / `pwa-mobile`):** the same control sits in `PulsarSiteChromePwa`. The target is at least 44px. The tab bar stays at four tabs.
- Shared offer helpers take a country argument. They do not branch on surface.

## Country resolution

1. Read `pais` from the page search params.
2. If it is `cl`, `ar`, `uy`, or `py`, use it and store that value in `centrolisto_market`.
3. Otherwise read `centrolisto_market`.
4. Otherwise use `cl`.

Cookie attributes: `Path=/`, `SameSite=Lax`, one year, not `HttpOnly` so the header can set it. `Secure` when the origin is HTTPS.

The first HTML must use the server-resolved country. Do not paint Chile and then swap after hydration.

## Published monthly amounts

Amounts are before VAT. The label stays the existing “+ IVA/mes” sentence. Presencia is 0 in every country.

| Country | Currency | Gestión | Ecosistema |
|---|---|---:|---:|
| Chile | CLP | 29990 | 69990 |
| Argentina | ARS | 46400 | 108400 |
| Uruguay | UYU | 1210 | 2830 |
| Paraguay | PYG | 180000 | 419000 |

Format with `Intl.NumberFormat` and the country locale: `es-CL`, `es-AR`, `es-UY`, `es-PY`. Zero fraction digits. The UI locale (`es`, `en`, `pt`) does not change the currency.

## Custom landing, one time

One amount. Presencia and Ecosistema both show it. Gestión does not. A template stays free. The old Gestión assisted fee (49990 CLP) and the old Ecosistema assisted fee as a separate product go away. Special integrations stay a quote.

| Country | Amount |
|---|---:|
| Chile | 149990 CLP |
| Argentina | 232300 ARS |
| Uruguay | 6070 UYU |
| Paraguay | 898000 PYG |

The label says it is a one-time fee to design and build the landing. It is not an institute signup fee.

## How the amounts were set

Chile list prices stay as published. The other countries are the Chile amount times the official dollar of the other country, divided by the Chilean observed dollar, then rounded.

Rates used:

- Banco Central de Chile, dólar observado published for 2026-11-02: 992.66 CLP per USD.
- BCRA Comunicación A 3500 for 2026-10-30: 1537.3487 ARS per USD.
- BCU interbank dollar for 2026-10-30: 40.188 UYU per USD.
- BCP referential dollar for 2026-10-30: 5944.76 PYG per USD.

Rounding: nearest 100 ARS, nearest 10 UYU, nearest 1000 PYG. Do not refetch these rates in the app.

## Offer copy

Gestión includes Presencia and administration: students, courses, enrollment, schedules, tuition, payments, and attendance. Add: up to 50 active students.

Ecosistema includes everything in Gestión without the 50-student cap, plus the family space. Add: you can create course routes, offer those courses, and sell them in the shop.

Remove the pending Argentina block and the pending 120/300 caps from the offer module. They are replaced by the published table above.

## Tests

- Resolve `pais`, then cookie, then Chile. Reject an unknown code.
- Format 29990 CLP, 46400 ARS, 1210 UYU, and 180000 PYG with the country currency.
- `/precios` for `ar` shows the Argentina monthly amounts and the Argentina landing fee. It does not show 49990 CLP.
- Gestión text includes the 50-student cap. Ecosistema text includes course routes and the shop. The cap is not enforced in enrollment code.
- Desktop chrome and PWA chrome both expose the four countries.

## Manual QA (user)

- Open the home with no `pais`. Chile prices show.
- Choose Paraguay. The URL gains `pais=py`. Reload. Paraguay prices stay.
- Open `/precios` and a solution page from that home. The country stays.
- Repeat on a narrow viewport. The control is tappable and the prices match.

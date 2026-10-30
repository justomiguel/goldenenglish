# CentroListo home — offer, proof, and the real screen

**Intent:** The CentroListo home closes one sale: a conversation about the full school. The first screen shows the product, the offer, and proof. The free public page stays a quiet note at the end.

**Done when:**

- The hero has one filled action, “Conversar sobre tu escuela”, a WhatsApp link, and “Cómo funciona” as text. “Crea tu cuenta” is gone from the hero.
- A line under the title names idiomas, danza y música, dojos, and primera infancia.
- The right side of the hero is a still WebP of a readable school desk, preloaded. The Sunday film stays in the chronicle and loads when that section is near the viewport.
- The title names enrollment, schedules, and tuition, and fits in about two lines. The quiet line sits above it.
- The filled action sits directly under the title, in the first screen.
- A one-line strip says the half-hour conversation shows the domain, the brand, and how the current list comes in. No invented price.
- Up to two live schools appear next. A sentence uses the first school’s display name. Posters paint immediately. School films load when the card is near the viewport. The active-school count sits with them.
- Three start steps from the contact copy follow, joined by a vertical line.
- The week chronicle keeps its four moments. The film sits above the paragraph. A tab change fades the film in 250 ms.
- Three short questions close the page: siblings and scholarships, the family phone, this month’s Excel and WhatsApp.
- The bottom note says a free account opens only the public page, up to three sites, and links to registro.
- A fixed WhatsApp control uses the contact href and a token fill. It does not pulse.
- The contact page and the footer do not show an email address. The conversation stays on the contact page and on WhatsApp.
- `prefers-reduced-motion` stops the film autoplay and the fade.
- Copy is in `en.json`, `es.json`, and `pt.json`. Spanish stays neutral tuteo.

**Out of scope:** A public price, a plan grid, new films, stock photos, page-slide transitions, AgendaPro-style tiles, and changing the product or contact pages beyond the shared WhatsApp control in the marketing chrome.

## Surfaces (Web vs PWA)

CentroListo marketing is one tree. `PulsarLandingHome` does not use `useAppSurface`. There is no `src/components/pwa/` pair for this page. Tier: director marketing, desktop-first, same tree on a narrow viewport. Touch targets stay at least 44 px. The fixed control respects the safe area. No Tier A PWA props change.

## Decisions

1. The hero still is a frame from an existing school film, saved as WebP. The chronicle keeps the Sunday film and starts it near the viewport. `www.centrolisto.cl` is already the served host. This change does not add a second redirect.
2. The school count moves next to the proof. The drawing no longer prints it.
3. Featured schools prefer a poster or video, then any school with a public URL, capped at two.
4. Start steps reuse `dict.pulsar.contact.steps`. The home adds only the section title and lead.
5. The WhatsApp number stays `dict.pulsar.contact.whatsappHref`. This change does not invent a phone number.

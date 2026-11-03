# Generic template contact page

**Intent:** A free generic site is a simple public page. It shows how to reach the academy, a Google map of its address, and a contact form. The form sends mail to the CentroListo account that created the site. A free site can send 50 of those messages.

**Done when:**

- The create form asks for phone, WhatsApp, Instagram, Facebook, and address. Each field is optional.
- Those values are saved on the institute theme with the existing brand keys: `contact.phone`, `contact.address`, `social.whatsapp`, `social.instagram`, `social.facebook`.
- `contact.email` on that theme is the CentroListo account email. The owner does not type it again.
- The public generic page lists only the filled contact and social values.
- A filled address shows a Google map embed. An empty address shows no map.
- The page includes a contact form: name, email, optional phone, and message.
- A real free site sends that message to the current CentroListo account email for that site.
- The 50th successful send is the last. The next submit tells the visitor the limit is reached. The message is not sent.
- The CentroListo preview route `/plantilla/{kind}` shows the layout and does not send mail.
- Copy exists in `en.json`, `es.json`, and `pt.json`. Spanish stays neutral tuteo.

**Out of scope:** YouTube, TikTok, and new social networks. A paid plan above 50. Editing the fields again in site setup. Moving the map pin by hand. A second contact inbox.

## Surfaces (Web vs PWA)

The public home is Tier A. Header and footer already split in `LandingSurfaceGate`. The new block lives in the shared generic body. It stacks on a narrow screen. Links and fields are at least 44px tall. The map has a fixed aspect ratio so the page does not jump.

The create form stays on the account screen. That screen is Tier B. The same fields render in the existing form. No second PWA tree.

The preview route stays `LandingScreenDesktop`.

## Context

Generic landings already render phone, email, address, and WhatsApp from theme overrides (`GenericLandingContact`). Facebook and Instagram exist on the brand layer and are not on that block yet. The create form does not ask for them.

`mergeProperties` ignores an empty override. A missing key must stay hidden on a generic site. Do not show the Golden English default phone or social links.

Free sites already have a Pulsar mail allowance (`pulsar_mail_quota`, default 50) for other institute mail. This cap is only for the public contact form.

ADR: `docs/adr/2026-11-03-free-site-contact-mail.md`.

## Decision

- Collect the share fields at site creation. Save them on `site_themes.properties`.
- Show the account email. Send the form to that same account, read at send time from `platform_owners`.
- Count contact sends per free site, not across the owner's three sites. Each free site gets 50.
- Store the count on `platform_tenants` as `free_contact_mail_sent` and `free_contact_mail_quota` (default 50). Staff can change the quota in the database without a deploy.
- Reserve one count before send. Release it if the send fails.
- Use a Google Maps embed URL built from the address. Do not add a Maps API key.

## Options considered

- One pool of 50 for the whole CentroListo account. Rejected. The counter already belongs to one site, and three sites would share one inbox limit.
- Reuse `pulsar_mail_quota` and set it to 50. Rejected. That allowance also covers other institute mail.
- Send the form to institute admins. Rejected. A new free site has no admin inbox. The owner asked for the account email.

## Form behavior

1. Validate name, email, and message on the server.
2. On `/plantilla/{kind}`, return a preview error and send nothing.
3. On a free site, reserve a contact send. If the reserve returns the quota, show the limit message.
4. Send one plain-text mail to the owner email through the existing Pulsar mail path.
5. If the send fails, release the count and show the existing persist error.
6. If the send works, show the success line. Do not store the visitor message in a new table.

## Map

The embed URL is `https://maps.google.com/maps?q={address}&z=16&output=embed`. The iframe has a title from the dictionary, `loading="lazy"`, and a stable 16:9 box.

## Surfaces to edit

- `PulsarAccountCreateForm` and `createOwnerFreeSite`.
- `GenericLandingContact` and `GenericLandingClose`.
- A small server action used only by the generic landing form.
- One additive Pulsar migration for the two columns and the reserve/release functions.
- Dictionaries `en.json`, `es.json`, and `pt.json`.

## Tests

- A pure normalizer accepts a WhatsApp number or a `wa.me` link, and an Instagram handle or URL.
- The quota rule stops at 50 and allows a failed send to be released.
- The landing shows the map only when the address is present.
- The action does not send from the preview route.
- The action does not send when the reserve returns the quota.

## Manual QA (user)

- Create a free site with address, WhatsApp, Instagram, and Facebook. Open the public home. Confirm the links and the map.
- Send one contact message. Confirm it arrives at the CentroListo account inbox.
- Confirm a 26th message is refused.

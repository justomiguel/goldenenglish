# Free-site contact, logo, inbox, and one SEO pair

## Intent

An owner can set phone, WhatsApp, address, and Instagram on the simple editor. An address shows the map. The owner can upload a logo. Visitor form messages stay in an inbox. Google uses one title and one description.

## Done when

- The generic editor saves `contact.phone`, `contact.address`, `social.whatsapp`, and `social.instagram`.
- A blank field clears that key. An invalid phone, WhatsApp, or Instagram does not save.
- The same editor uploads a logo through the existing brand-asset action.
- `platform_free_site_messages` stores each accepted visitor message. The owner inbox lists name, phone, email, text, site, and date.
- The SEO form has one title and one description. The save writes the same text for es, en, and pt.

## Out of scope

- Facebook field.
- A second inbox for institute staff dashboards.
- Applying institute migrations.

## Surfaces (Web vs PWA)

Tier B. The editor and the inbox stay in the existing Pulsar panel. No new PWA tree.

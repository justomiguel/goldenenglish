# Centro Listo llms.txt and contact FAQ schema

## Intent

Give generative search a plain map of Centro Listo and a machine-readable copy of the questions already on the contact page.

## Done when

- `GET /llms.txt` on a Pulsar host returns `text/plain` with the public pages and the Spanish questions.
- The same path on an institute host returns 404.
- `/contacto` emits FAQPage JSON-LD from `dict.pulsar.contact.faqs`.

## Out of scope

- New questions.
- Institute answer pages.
- A WhatsApp number in the text file.

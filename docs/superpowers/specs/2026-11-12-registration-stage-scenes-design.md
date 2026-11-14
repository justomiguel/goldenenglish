# Registration action popups share one scene

## Intent

Every registration action popup follows the pre-enrolled popup. The person card stays first. A photo sits on the left. The stage actions stack on the right, with "or" between alternatives. The commit sits in a plain block under that row. The main button is green. The block is not green.

## Done when

- Contacted, waiting for payment, matrícula paid without a section, waiting for a section, and enrolled each show their own photo.
- Photos live in `public/images/dashboard/` and match the wooden-desk contact photo.
- Desktop modal and PWA sheet both render this panel.

## Out of scope

- The pre-enrolled contact photo and its mail or WhatsApp choice.
- Edit and delete stay on one row.

## Surfaces (Web vs PWA)

Tier B. One shared panel. No second PWA tree.

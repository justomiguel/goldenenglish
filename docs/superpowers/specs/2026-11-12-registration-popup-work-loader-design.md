# Popup actions show a status loader

## Intent

Every action in the registration actions popup that waits on the server closes the popup and shows the status loader. A failure keeps that dialog open and shows the cause.

## Done when

- Mark contacted, matrícula mail, in-person payment, receipt approval, section save, section move, back, and contact mail use the same loader.
- Edit and delete stay immediate. They open their own dialog.
- WhatsApp and call stay direct links.
- A known failure code stays visible after the loader stops.

## Out of scope

- Batch actions.
- The public matrícula page.

## Surfaces (Web vs PWA)

Tier B. The desktop row and the PWA sheet share the loader dialog.

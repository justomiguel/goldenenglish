# Nago logo — remove the yellow heart

## Intent

Remove the yellow heart from the Nago logo. The heart sits between the words Mestre and Fagulha.

## Done when

- `public/images/nago/logo/logo.png` no longer shows that heart.
- The flag, the capoeira figure, and the words stay.
- The file path stays `/images/nago/logo/logo.png`.

## Out of scope

- Other Nago photos (`inicio/1.png`, template shots).
- Copy, layout, and CSS.
- A new logo path or a migration.

## Surfaces (Web vs PWA)

Tier A screens already show this file (header, footer, register, install icon). One asset change. Web and PWA both read the same path. No tree split.

## Notes

The heart is a separate yellow cluster (about y 456–548). The flag diamond ends near y 432. Paint only the heart cluster to the black background.

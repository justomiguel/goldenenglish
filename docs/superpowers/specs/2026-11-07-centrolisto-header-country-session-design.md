# CentroListo header country combo and session

## Intent

The country control is a small combo beside the logo. A signed-in person opens the panel from the main header action. Sign out is an icon.

## Done when

- The country control sits after the logo on desktop and on the PWA header.
- The closed control shows the current flag and the country name in small type.
- Opening it lists Chile, Argentina, Uruguay, and Paraguay, each with a flag and a name.
- Choosing a country still sets `pais` and the market cookie.
- `pulsarStartFreePath` sends a signed-in person to `/{locale}/cuenta`.
- The main header action says "Entrar al panel" when an email is present.
- Sign out is a larger icon button with a strong border. It sits after that action. Its accessible name stays the sign-out label.

## Out of scope

- The create-site form at `/{locale}/cuenta/nuevo`.
- Institute admin sign-out.

## Surfaces (Web vs PWA)

Tier A public marketing. `PulsarSiteChromeEntry` already splits the trees.

- Web: combo after the logo. Main action at the right. Sign-out icon beside it.
- PWA: same combo in the top bar. The bottom thumb opens the panel when an email is present. On Contacto the thumb is hidden, so the top bar keeps the panel link.

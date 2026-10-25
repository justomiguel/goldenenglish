# Public PWA and auth switch

Spec: `docs/superpowers/specs/2026-10-23-public-pwa-and-auth-switch-by-theme-design.md`

## Slices

1. Dictionary keys (`nav.loginShort`, `nav.myPortal`, `nav.publicPwaBar`, `login.registerPrompt`, `login.registerCta`) in en, es, and pt.
2. `PublicHeaderAccountCta` — labeled Ingresar or Mi Portal. Test first.
3. `PublicPwaTabBar` + `PublicExperienceFrame` (dock, safe area, pull-to-refresh on `pwa-mobile`).
4. Wire the frame into landing (narrow), blog shell, register, contact, privacy, and auth chrome. Skip greenfield.
5. Classic header, PWA header, and both footers. Editorial and minimal hero props.
6. Theme headers and register headers: Mozarthitos, Espacio Zenit, Nagô, Mi Mundo, Liora. Visible labels. Zenit logged-in mobile. Mi Mundo login on phones.
7. Blog screens pass shop and session. Mi Mundo font root. Mi Mundo contact screen.
8. Layouts for encuesta, clase-prueba, matricula, and unirse.
9. Login theme chrome and register bridge when inscriptions are on.
10. Portal “Ver sitio” in the header and account sheet. Admin mobile drawer link. Update the drawer test.

Do not commit. The tree has other WIP.

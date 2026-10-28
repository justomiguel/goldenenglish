# CentroListo.cl — Playwright Flow Videos (real institutes)

## Intent

Record the 4 landing moments on **real institute themes**, not invented HTML. Each clip uses a different school so visitors see how the same product looks in Golden, Espacio Zenit, Nagô, and Liora.

## Surfaces (Web vs PWA)

- **Web:** desktop 960×540 recordings of public landings and admin desks.
- **PWA / mobile:** 390×690 recordings of the same routes.
- Showcase player is unchanged (`flow-{0-3}-{desktop|mobile}.webm`). No Tier A hook change.

## Institute map

| Flow | Moment | Institute | Routes |
|---|---|---|---|
| 0 | Domingo, inscripción | Nagô landing → Liora landing → Golden `/es/register` | Public, no session |
| 1 | Martes, aula | Espacio Zenit admin | `/es/dashboard/admin` then `/es/dashboard/admin/academic` |
| 2 | Día 5, cobranza | Golden English admin | `/es/dashboard/admin` then `/es/dashboard/admin/finance` |
| 3 | Viernes, familia | Liora + Golden register on mobile | Public |

Admin clips reuse the Chrome session already logged in on `golden.localhost` and `espaciozenit.localhost` (copy of that profile into Playwright). Do not invent demo HTML. Do not record production student lists as the main story; prefer hub and academic/finance shells.

## Done when

- `npm run videos:centrolisto` writes 8 WebM files under `public/videos/centrolisto/`.
- Each file shows a real tenant theme from `{slug}.localhost:3000` with `dev:pulsar` up.

## Out of scope

- Synthetic `--demo-stage` HTML scenes.
- Logging in with passwords in the script.
- Changing showcase layout.

# CentroListo.cl — Warm Organic Brand Identity (Logo A), Generative Unknotting Animation & Indirect Storytelling ("Crónica de un Día en Paz")

## Intent

Transform the Pulsar platform website into **CentroListo.cl** (`centrolisto.cl` / `www.centrolisto.cl`, keeping `pulsarlab.cl` as an active alias) with a warm, human-centered brand identity (**Logo A: "El Hilo que se Desenreda"**) and an indirect storytelling approach (**Opción 1: "Crónica de un Día en Paz"**) that shows how an academy or educational center feels when administrative noise disappears, strictly obeying `.cursor/rules/44-no-ai-slop-design.mdc`.

## Brand & Storytelling Principles (`.cursor/rules/44-no-ai-slop-design.mdc`)

1. **Zero AI Slop:** No decorative pill/chip rows, no repeated uppercase tracked eyebrows on every section, no 3-box hero metric templates, no repetitive Lucide icon-in-a-box card grids, no red-vs-green "Before/After" confrontation boxes, and no coarse dark "tech-bro" terminal blocks.
2. **Logo A ("El Hilo que se Desenreda"):** A single continuous calligraphic SVG stroke in serene forest sage (`#2D5A47`) that untangles into an open *C* embracing a warm terracotta center seed (`#C87D55`), paired with the `centrolisto` serif/italic wordmark (`Fraunces` + `DM Sans`).
3. **Generative Hero Animation ("Del Enredo a la Calma"):** In the Hero stage, restless tangled threads (representing scattered chats, late-night spreadsheets, and paper lists) smoothly untangle and converge into Logo A's serene loop using SVG `stroke-dashoffset` and exponential easing (`cubic-bezier(0.22, 1, 0.36, 1)`), with full `prefers-reduced-motion: reduce` support.
4. **Indirect Persuasion ("Crónica de un Día en Paz"):** Instead of pushing "our 12 software modules", the narrative walks through 4 recognizable moments in a school's week (*Domingo, 21:40*, *Martes, 16:58*, *Día 5 del mes*, *Fin de semestre*) using React `startTransition` + `<ViewTransition>` to cross-fade the live scene.

## Surfaces (Web vs PWA)

- **Tier B / Public platform narrative + staff control plane (no Tier A student/parent PWA tree)** per `.cursor/rules/05-pwa-mobile-native.mdc` and `.cursor/rules/43-pwa-surface-spec-check.mdc`.
- No shared Tier A hooks, molecules, or `src/components/pwa/` files are modified.

## Architecture & Component Design

### 1. Warm Tactile Palette (`src/lib/pulsar/pulsarBrandProperties.ts` + `src/app/layout.tsx`)

`loadPulsarPlatformProperties()` injects a warm paper-and-sage token palette (all pairs WCAG AA/AAA verified):
- `app.name`: `"CentroListo"`
- `color.background`: `"#FAF8F5"` (Warm Alabaster Paper)
- `color.surface`: `"#FFFFFF"`
- `color.foreground`: `"#1C2420"` (Deep Forest Ink — 14.8:1 on `#FAF8F5`)
- `color.muted`: `"#F2EFE9"` (Soft Warm Stone)
- `color.muted.foreground`: `"#525E57"` (Warm Slate Moss — 6.2:1 on `#FAF8F5`)
- `color.primary`: `"#2D5A47"` (Serene Forest Sage — 7.6:1 on `#FFFFFF`)
- `color.primary.dark`: `"#1F4233"`
- `color.primary.light`: `"#3E755E"`
- `color.primary.foreground`: `"#FFFFFF"`
- `color.secondary`: `"#1C2420"`
- `color.secondary.light`: `"#2C3832"`
- `color.secondary.dark`: `"#111714"`
- `color.secondary.foreground`: `"#FAF8F5"`
- `color.accent`: `"#C87D55"` (Warm Terracotta Clay)
- `color.accent.foreground`: `"#1C2420"`
- `color.border`: `"#E4E0D8"` (Warm Hairline Rule)

### 2. Custom SVG Logo & Generative Hero Stage (`src/components/organisms/pulsar/CentroListoLogoMark.tsx`)

- Exports `CentroListoLogoMark` (compact header/footer mark + `centrolisto` wordmark) and `CentroListoGenerativeStage` (the Hero generative SVG canvas where tangled threads untangle into Logo A, plus an interactive replay/state pulse).

### 3. Screens & Transitions (`src/components/organisms/pulsar/`)

Every file stays ≤ 250 LOC:
1. **`PulsarSiteChrome.tsx`:** Warm editorial header and colophon with `CentroListoLogoMark`, quiet navigation links, and subtle `Control Plane` access.
2. **`PulsarLandingHome.tsx` (`/[locale]`):**
   - Asymmetric Hero (`lg:grid-cols-12`) with `CentroListoGenerativeStage` on the right.
   - `PulsarInteractivePortalShowcase.tsx` (**Crónica de un Día en Paz**): 4 time-of-week moments (*Domingo, 21:40*, *Martes, 16:58*, *Día 5 del mes*, *Fin de semestre*) switched inside `startTransition` + `<ViewTransition>` so the live vignette cross-fades smoothly.
   - **Tres silencios que cuidan tu escuela:** Hairline-divided editorial ledger (`01`, `02`, `03`) covering custom identity/PWA, isolated per-school database (Ley 21.719), and calm family relationships.
3. **`PulsarProductoView.tsx` + `PulsarCompetitorComparisonSection.tsx` (`/[locale]/producto`):**
   - Presents the 12 capabilities (`m1`..`m12`) as a calm, hairline-divided numbered index (`01`..`12`) grouped under 4 chapters of school life (no icon-box card grids).
   - `PulsarCompetitorComparisonSection.tsx`: Calm editorial table comparing *Un lugar propio (CentroListo)* vs. *Agendas por turnos*, *Sistemas escolares rígidos*, and *Hojas sueltas y chats*.
4. **`PulsarClientesView.tsx` (`/[locale]/clientes`):**
   - Live directory of active institutions (`clients`) + a 2-column editorial ledger of disciplines (*Cada espacio tiene su propio ritmo*).
5. **`PulsarContactoView.tsx` (`/[locale]/contacto`):**
   - 3-step calm accompaniment timeline, direct email (`contacto@centrolisto.cl`) and WhatsApp conversation links, what we prepare for your school (`check1`..`check5`), and thoughtful answers (`faqs`).

## Done when

- `.cursor/rules/44-no-ai-slop-design.mdc` is authored in English and indexed in `AGENTS.md`.
- `CentroListoLogoMark` and `CentroListoGenerativeStage` render Logo A and the generative unknotting animation without any Lucide logo icon.
- All 4 pages (`/[locale]`, `/[locale]/producto`, `/[locale]/clientes`, `/[locale]/contacto`) use indirect storytelling and pass all unit/component tests.

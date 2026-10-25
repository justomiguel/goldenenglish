# Public Unauthenticated PWA Experience, Theme-Aware Login, and Bidirectional Public/Portal Switch — Design Spec

**Date:** 2026-10-23  
**Status:** Draft (awaiting user approval — SDD Gate 0)  
**Scope:** All 8 `SiteThemeKind` templates (`classic`, `editorial`, `minimal`, `mozarthitos`, `espaciozenit`, `nago`, `mimundo`, `liora`), all public routes (`/[locale]`, `/register`, `/inscripcion/...`, `/contact`, `/events`, `/blog`, `/tienda`, `/privacidad`, `/encuesta/[slug]`, `/clase-prueba/[token]`, `/matricula/[slug]/[token]`, `/unirse/[token]`, `/login`, `/forgot-password`, `/reset-password`), and all authenticated portal shells (`PortalShell` for Student/Parent, `AdminDashboardShell`, `TeacherDashboardShell`, `AssistantDashboardShell`).

---

## 1. Context and Audit Summary

A comprehensive audit of the public and authenticated surfaces revealed three structural gaps across the 8 `SiteThemeKind` templates:

1. **Unauthenticated Public Pages Lack a True Mobile/PWA Shell:**
   - `PwaPageShell` (`src/components/pwa/molecules/PwaPageShell.tsx`) is currently a no-op wrapper (`<div className="flex min-h-dvh flex-col">{children}</div>`).
   - Unlike `PortalShell` and `AdminDashboardShell`, public pages on `web-mobile` and `pwa-mobile` have no thumb-zone bottom navigation bar (`PublicPwaTabBar`) and do not wire `PwaPullToRefresh`.
   - `LandingSurfaceGate` passes `suppressPwaHeader={marketingShell}`, so the 5 full-bleed marketing templates (`mozarthitos`, `espaciozenit`, `nago`, `mimundo`, `liora`) render the exact same tree on `desktop` and `narrow` without a dedicated mobile/PWA dock.
   - Secondary public pages (`/register`, `/contact`, `/privacidad`, `/events`, `/blog`, `/tienda`, `/q`) do not wrap in `PwaPageShell` or a mobile bottom dock.
   - Transactional and survey public pages (`/encuesta/[slug]`, `/clase-prueba/[token]`, `/matricula/[slug]/[token]`, `/unirse/[token]`) render bare `<article>` or `<section>` nodes with no tenant header, logo, language switcher, or navigation chrome.
   - `PwaInstallPromptHost` (`src/components/molecules/PwaInstallPromptHost.tsx`) uses `bottom-[calc(4.5rem+...)]` on all narrow viewports assuming a bottom tab bar exists; adding a real `PublicPwaTabBar` aligns the install banner above the dock on public pages too.

2. **Inconsistent, Hidden, or Missing Login CTAs Across Themes:**
   - **Mobile top bars hide or shrink Login:**
     - `MiMundoSiteHeader` hides the Login button completely below `640px` (`hidden sm:inline-flex`), leaving only `Reservar`.
     - `NagoSiteHeader` hides the Login label below `1024px` (`sr-only md:not-sr-only md:hidden lg:inline`), rendering a bare gold icon next to the sound toggle and menu trigger.
     - `MozarthitosSiteHeader` and `EspacioZenitSiteHeader` hide the Login text below `640px` (`hidden sm:inline`).
     - `LioraSiteHeader` hides the Login text below `768px` (`hidden md:inline`).
   - **Secondary headers omit Login/Portal CTAs altogether:**
     - `RegisterSiteHeader` (used on classic `/register`, `/contact`, `/privacidad`, `/events`, `/blog`, `/tienda`) has no `sessionEmail` prop and renders neither `Iniciar Sesión` nor `Mi Portal`.
     - `MozarthitosRegisterHeader`, `EspacioZenitRegisterHeader`, `NagoRegisterHeader`, `MiMundoRegisterHeader`, and `LioraRegisterHeader` only render `LanguageSwitcher` and a back-to-home link—never a Login or Portal CTA in the header.
   - **Login screen (`/login`) is generic and lacks a registration bridge:**
     - `LoginScreenDesktop` and `LoginScreenNarrow` use generic token cards (`bg-[var(--color-hero-bg,var(--color-primary-dark))]`) that do not express each tenant's visual personality (`mozarthitos`, `espaciozenit`, `nago`, `mimundo`, `liora`).
     - `/login` has no link to `/register` for visitors who arrive at login first and need to enroll or book a trial class.

3. **Broken or Confusing Switch Between Public Experience and Authenticated Portal:**
   - **Public → Portal (when logged in):**
     - `LandingHeaderPwa` (classic mobile header) and `LandingFooterPwa` replace the primary CTA with `SignOutButton` (`Cerrar Sesión`) when `sessionEmail` is present, hiding the `Panel` link inside the closed hamburger menu (or omitting it in the footer).
     - `EspacioZenitSiteHeader` hides the logged-in account navigation on `<lg` (`hidden lg:flex`), and its mobile drawer only renders the account group when `!sessionEmail`—leaving logged-in mobile users with **no header or menu link** to their portal.
     - `MiMundoSiteHeader` hides the logged-in `Panel` and `Cerrar Sesión` buttons below `768px` (`hidden md:inline-flex`).
     - All public headers use `dict.nav.administration` (`"Panel"` / `"Dashboard"`), which reads as staff back-office rather than a family/student/staff portal entry (`"Mi Portal"` / `"My Portal"`).
   - **Portal → Public (when logged in):**
     - `PortalShell` (`src/components/portal/PortalShell.tsx`, used by both Student and Parent dashboards) has **zero link back to the public site**. `PortalBrand` links to `/dashboard/parent` or `/dashboard/student`, and `PortalAccountList` only lists Profile, Child Details, Language, Install App, and Sign Out. Even though `dict.dashboard.studentChrome.backToSite` and `dict.dashboard.parentChrome.backToSite` (`"Ver sitio"`) exist in the dictionaries, they are never rendered.
     - `AdminMobileDrawer` (`src/components/dashboard/AdminMobileDrawer.tsx`, opened by the hamburger button and the `"Más"` tab in `AdminPwaTabBar`) omits the `"Ver sitio web"` link that `TeacherMobileDrawer` and `WorkplaceMobileDrawer` already provide.

---

## 2. Architecture & Shared Components

### 2.1. `PublicPwaTabBar` & Upgraded `PwaPageShell`

We will introduce a shared, theme-tokenized bottom navigation dock for narrow viewports (`web-mobile` and `pwa-mobile`):

- **Component:** `src/components/pwa/molecules/PublicPwaTabBar.tsx`
- **Destinations (4 to 5 tabs, `min-h-[52px]`, `env(safe-area-inset-bottom)`):**
  1. **Inicio** (`Home` icon) → `/[locale]`
  2. **Cursos / Clases** (`BookOpen` or `Sparkles` icon) → theme-appropriate anchor (`/[locale]#niveles`, `/[locale]#cursos`, `/[locale]#disciplinas`, `/[locale]#clases`, `/[locale]#salas`) or `/[locale]/register` when on subpages
  3. **Eventos** (`CalendarDays` icon) → `/[locale]/events`
  4. **Inscribirse** (`UserPlus` icon, shown when `inscriptionsEnabled !== false` and `!sessionEmail`) → `/[locale]/register` (or **Tienda / Blog** when logged in or inscriptions disabled)
  5. **Ingresar / Mi Portal** (`LogIn` when logged out → `/[locale]/login`; `LayoutDashboard` / `UserCheck` when `sessionEmail` is present → `/[locale]/dashboard`, highlighted with an active session dot)
- **Theme Token Adaptation:**
  - `PublicPwaTabBar` accepts a `tone` or `variant` prop (`"default" | "mozarthitos" | "espaciozenit" | "nago" | "mimundo" | "liora"`) so its surface background, top border, active icon pill, and text contrast match each theme's exact palette (e.g., dark `#070b12` with `--ez-cyan` on Espacio Zenit; dark `--nago-bg` with `--nago-gold` on Nagô; cream `--mm-cream` with `--mm-green` on Mi Mundo; `--liora-cream` with `--liora-rose-deep` on Liora; `--mz-header-red-deep` or crisp surface with `--mz-pink`/`--mz-blue-btn` on Mozarthitos; `--color-surface` with `--color-primary` on Classic/Editorial/Minimal).
- **`PwaPageShell` Enhancement (`src/components/pwa/molecules/PwaPageShell.tsx`):**
  - Wraps narrow public content with `PwaPullToRefresh` (enabled when `surface === "pwa-mobile"`, calling `router.refresh()`).
  - Applies bottom safe-area clearance (`pb-[calc(4.5rem+max(0.5rem,env(safe-area-inset-bottom,0px)))]`) when `PublicPwaTabBar` is rendered so page footers and CTAs are never occluded.

### 2.2. Canonical Public Account Switch CTA (`PublicHeaderAccountCta`)

To eliminate per-header drift, we will extract a reusable molecule `src/components/molecules/PublicHeaderAccountCta.tsx` used by all public site headers and secondary register/content headers:

- **When Logged Out (`!sessionEmail`):**
  - Renders a high-contrast pill link to `/[locale]/login` with leading `LogIn` icon and **visible text on all breakpoints** (`dict.nav.loginShort` / `"Ingresar"` on `<sm`, `dict.nav.login` / `"Iniciar sesión"` on `≥sm`), minimum touch target `44×44px`.
- **When Logged In (`Boolean(sessionEmail)`):**
  - Primary visible action in the top bar is **always** `"Mi Portal"` (`dict.nav.myPortal`, linking to `/[locale]/dashboard`) with `LayoutDashboard` icon and visible label on mobile and desktop.
  - Secondary action is `SignOutButton` (icon-only with `aria-label` + `title` on compact mobile headers, or inside the mobile menu drawer, and labeled on desktop).
  - Never shows `SignOutButton` alone in the top bar without `"Mi Portal"`.

### 2.3. Bidirectional Portal → Public Site Switch

1. **`PortalShell` (`src/components/portal/PortalShell.tsx` — Student & Parent Portals):**
   - **Desktop Top Bar:** Add a `"Ver sitio"` (`config.backToSiteLabel` from `dict.dashboard.studentChrome.backToSite` / `parentChrome.backToSite`) pill link (`href={`/${locale}`}`) with `ExternalLink` / `Globe` icon right before the `PortalAccountSheet` trigger.
   - **Mobile / PWA (`PortalAccountList` & `buildStudentShellConfig` / `buildParentShellConfig`):** Add a `"publicSite"` item (`id: "publicSite"`, `label: chrome.backToSite`, `href: `/${locale}``) at the top of `accountItems` in `buildStudentShellConfig` and `buildParentShellConfig` so mobile/PWA users can jump to the public site in 1 tap from the account sheet (and return to `/dashboard` in 1 tap via the public header or `PublicPwaTabBar`).
2. **`AdminMobileDrawer` (`src/components/dashboard/AdminMobileDrawer.tsx`):**
   - Add the `"Ver sitio web"` (`dict.dashboard.adminChrome.backToSite`) + `LanguageSwitcher` bar inside `AdminMobileDrawer` (matching `TeacherMobileDrawer` and `WorkplaceMobileDrawer`), so admins on mobile/PWA can switch to the public site from the `"Más"` drawer as well as the top header.

### 2.4. Secondary Public Routes & Orphan Route Chrome

1. **`PublicBlogPageShell` (`src/components/organisms/PublicBlogPageShell.tsx`):**
   - Load `merchEnabled` (`loadMerchEnabled()`) and `inscriptionsEnabled` (`getInscriptionsEnabled()`) alongside `blogEnabled`.
   - Pass `sessionEmail`, `merchEnabled`, `shopLabel`, and `inscriptionsEnabled` to all 6 `PublicBlogScreen*` components.
   - Wrap narrow viewports with `PublicPwaTabBar` so `/events`, `/blog`, `/tienda`, and `/q` have the same mobile/PWA bottom dock and top-bar Login/Portal CTA as the home landing.
2. **Orphan Public Routes (`/encuesta/[slug]`, `/clase-prueba/[token]`, `/matricula/[slug]/[token]`, `/unirse/[token]`):**
   - Add `src/app/[locale]/encuesta/layout.tsx`, `src/app/[locale]/clase-prueba/layout.tsx`, `src/app/[locale]/matricula/layout.tsx`, and `src/app/[locale]/unirse/layout.tsx` delegating to `PublicBlogPageShell` (the canonical tenant public shell). This immediately gives every survey, trial fee payment, matrícula payment, and trial conversion page the active tenant's `FontRoot`, header (with logo, back/home navigation, and Login/Portal CTA), footer, and mobile PWA bottom dock.

---

## 3. Theme-by-Theme Specification (All 8 `SiteThemeKind` Values)

### 3.1. `classic`, `editorial`, and `minimal` (Golden English & Standard Tenants)

- **Landing Header (`LandingHeader.tsx` & `LandingHeaderPwa.tsx`):**
  - `LandingHeaderPwa`:
    - When `sessionEmail` is present, render the primary `"Mi Portal"` pill (`href={`/${locale}/dashboard`}`) directly in the top bar (instead of `SignOutButton` alone). Keep `SignOutButton` inside the expandable hamburger drawer alongside section links.
    - When `!sessionEmail`, keep the primary `"Ingresar"` pill visible in the top bar.
    - Add `/events`, `/blog` (when `blogEnabled`), and `/tienda` (when `merchEnabled`) to `LandingHeaderPwa` drawer links so mobile matches desktop `LandingHeader`.
  - `LandingHeader`:
    - Show visible text on the Login button at all breakpoints (`dict.nav.loginShort` on `<sm`, `dict.nav.login` on `≥sm`).
    - When `sessionEmail` is present, show `"Mi Portal"` (`dict.nav.myPortal`) right next to `SignOutButton` in the account area on both desktop and mobile.
- **Landing Sections (`LandingMainSectionsEditorial.tsx` & `LandingMainSectionsMinimal.tsx`):**
  - Forward `publicCtaMode` and `inscriptionsEnabled` props to `LandingHero` so hero registration/trial CTAs behave identically to `classic`.
- **Landing Footer (`LandingFooter.tsx` & `LandingFooterPwa.tsx`):**
  - When `sessionEmail` is present, render `"Mi Portal"` (`href={`/${locale}/dashboard`}`) as the primary footer CTA and `SignOutButton` as secondary.
- **Secondary Header (`RegisterSiteHeader.tsx` & `PublicBlogScreenClassic.tsx`):**
  - Add optional `sessionEmail?: string | null` prop to `RegisterSiteHeader` (and pass it from `PublicBlogScreenClassic`, `RegisterClassicSurface`, `PublicContactScreenClassic`, `PublicPrivacySurfaceByTemplate`).
  - Render `PublicHeaderAccountCta` (`"Ingresar"` when logged out, `"Mi Portal"` when logged in) in `RegisterSiteHeader` alongside `Inicio`, `Eventos`, and `Blog`.
- **Login Surface (`LoginScreenDesktop.tsx` & `LoginScreenNarrow.tsx`):**
  - Add a clear registration bridge footer inside `LoginForm` (or below it when `inscriptionsEnabled`): *"¿Aún no tienes cuenta? Inscríbete aquí"* → `/[locale]/register`.
- **Mobile/PWA Dock:**
  - Render `PublicPwaTabBar` with `variant="default"` on narrow viewports across `/`, `/register`, `/contact`, `/privacidad`, `/events`, `/blog`, `/tienda`.

### 3.2. `mozarthitos` (Mozarthitos)

- **Primary Header (`MozarthitosSiteHeader.tsx`):**
  - Make the Login CTA label visible on mobile (`<sm`) using compact text (`dict.nav.loginShort` / `"Ingresar"`) instead of `hidden sm:inline`, preserving `min-h-[44px]` and yellow pill contrast (`bg-[var(--mz-yellow)] text-[var(--mz-ink-on-white)]`).
  - When `sessionEmail` is present on mobile, show the `"Mi Portal"` label on the dashboard pill (`px-3 text-xs font-bold`) so logged-in parents/staff immediately see their portal entry without guessing an icon.
- **Secondary Header (`MozarthitosRegisterHeader.tsx`):**
  - Accept `sessionEmail?: string | null` (or render `PublicHeaderAccountCta` styled with `.mz-chrome-login` / `.mz-chrome-dash`) in the header bar next to `LanguageSwitcher` and `Inicio`, so `/register`, `/contact`, and `/privacidad` have a top-bar Login / Mi Portal button.
- **Public Content Shell (`PublicBlogScreenMozarthitos.tsx`):**
  - Pass `showShopLink={merchEnabled}` and `shopLabel={dict.shop.catalog.title}` to `MozarthitosSiteHeader`.
  - Render `PublicPwaTabBar` (`variant="mozarthitos"`) on narrow viewports.
- **Login Surface (`/login` under `mozarthitos`):**
  - Enhance `PublicTenantChrome` + `LoginScreenDesktop` / `LoginScreenNarrow` when `templateKind === "mozarthitos"` so the hero/brand panel uses Mozarthitos's signature warm red/pink/yellow aesthetic (`mz-hero-surface` / `--mz-yellow` accent badge) and includes the link to `/[locale]/register`.

### 3.3. `espaciozenit` (Espacio Zenit)

- **Primary Header (`EspacioZenitSiteHeader.tsx`):**
  - **Critical Fix (Logged-In Mobile):** Remove `hidden lg:flex` on the logged-in account nav so the `"Mi Portal"` (`LayoutDashboard`) button is visible in the top bar on mobile and tablet viewports (`<lg`), and also include the `"Mi Portal"` + `SignOutButton` block inside `#ez-mock-mobile-nav` when `sessionEmail` is present.
  - **Logged-Out Mobile:** Show compact visible text (`dict.nav.loginShort` / `"Ingresar"`) on the cyan Login button on `<sm` instead of `hidden sm:inline`.
- **Secondary Header (`EspacioZenitRegisterHeader.tsx`):**
  - Add the cyan Login / Mi Portal button (`PublicHeaderAccountCta` with Espacio Zenit cyan styling) to the top bar alongside `LanguageSwitcher` and `Inicio`.
- **Landing Footer (`LandingEspacioZenitFooter.tsx`):**
  - When `!sessionEmail`, render a clear `"Iniciar Sesión"` button in the footer account block so users who scroll to the bottom can log in directly.
- **Public Content Shell (`PublicBlogScreenEspacioZenit.tsx`):**
  - Pass `showShopLink={merchEnabled}` and `shopLabel={dict.shop.catalog.title}` to `EspacioZenitSiteHeader`.
  - Render `PublicPwaTabBar` (`variant="espaciozenit"`, dark `#070b12` bar with `--ez-cyan` active state) on narrow viewports.
- **Login Surface (`/login` under `espaciozenit`):**
  - Style the login hero/card with Espacio Zenit's dark `#070b12` surface, `border-[rgb(0_174_239_/35%)]` cyan glow, and registration link to `/[locale]/register`.

### 3.4. `nago` (Capoeira Nagô)

- **Primary Header (`NagoSiteHeader.tsx`):**
  - Replace the icon-only mobile login link (`sr-only md:not-sr-only md:hidden lg:inline`) with a bordered gold pill (`border border-[var(--nago-gold)]/55 bg-[var(--nago-gold)]/12 px-2.5 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-[var(--nago-gold)]`) that displays `"Ingresar"` on mobile/tablet and `"Iniciar Sesión"` on desktop.
  - When `sessionEmail` is present, show `"Mi Portal"` text inside the gold pill on all breakpoints.
- **Secondary Header (`NagoRegisterHeader.tsx`):**
  - Add the gold Login / Mi Portal pill in the top bar next to `LanguageSwitcher` and `Inicio`.
- **Landing Footer (`LandingNagoFooter.tsx`):**
  - Add Login / Mi Portal link in the footer navigation list so users at the bottom of the page can enter their portal or sign in.
- **Public Content Shell (`PublicBlogScreenNago.tsx`):**
  - Pass `showShopLink={merchEnabled}` and `shopLabel={dict.shop.catalog.title}` to `NagoSiteHeader`.
  - Render `PublicPwaTabBar` (`variant="nago"`, `--nago-bg` surface with `--nago-gold` active accents) on narrow viewports.
- **Login Surface (`/login` under `nago`):**
  - Apply `.nago-public-sheet` dark/gold treatment and registration link to `/[locale]/register`.
- **Installed app icon:**
  - The home mark is `NAGO_BUNDLED_LOGO` (`/images/nago/logo/logo.png`). The admin chrome uses `brand.logoPath` and the favicon bundle.
  - Manifest icons and the Apple touch icon use the home mark. Do not mark that wide mark `maskable`.
  - Splash and `theme_color` use `#070707`, the home background. The browser tab favicon stays the admin favicon.

### 3.5. `mimundo` (Mi Mundo Jardín Maternal / Infantil)

- **Primary Header (`MiMundoSiteHeader.tsx`):**
  - **Critical Fix (Logged-Out Mobile):** Remove `hidden sm:inline-flex` from the Login link so `"Ingresar"` is always visible in the top bar on phones (`inline-flex min-h-[44px] items-center gap-1.5 rounded-full border border-[var(--mm-green)]/50 bg-white px-3 py-2 text-xs font-semibold text-[var(--mm-green)]`).
  - **Critical Fix (Logged-In Mobile):** Remove `hidden md:inline-flex` from the `"Mi Portal"` (`LayoutDashboard`) link so logged-in families see `"Mi Portal"` directly in the top bar on phones.
  - Add optional `showEventsLink`, `eventsLabel`, `showBlogLink`, `blogLabel`, `showShopLink`, `shopLabel` props to `MiMundoSiteHeader` and wire them from `LandingMainSectionsMimundo` and `PublicBlogScreenMiMundo` so `/events`, `/blog`, and `/tienda` are reachable from the header nav and mobile drawer.
- **Secondary Header (`MiMundoRegisterHeader.tsx`):**
  - Keep back-to-home label visible or clearly paired with a `"Ingresar"` / `"Mi Portal"` pill in the top bar.
- **Public Contact Page (`src/app/[locale]/contact/page.tsx` & `PublicContactScreenMiMundo.tsx`):**
  - Create `src/components/organisms/PublicContactScreenMiMundo.tsx` wrapped in `MiMundoFontRoot` + `MiMundoRegisterHeader` + `.mimundo-public-sheet` paper card + floating doodles, and wire `if (templateKind === "mimundo")` in `src/app/[locale]/contact/page.tsx` so Mi Mundo never falls back to `PublicContactScreenClassic`.
- **Public Content Shell (`PublicBlogScreenMiMundo.tsx`):**
  - Wrap `PublicBlogScreenMiMundo` in `<MiMundoFontRoot>` so `/events`, `/blog`, `/tienda`, and `/q` inherit `--font-mm-display`, `--font-mm-body`, and `--mm-cream` paper tokens.
  - Render `PublicPwaTabBar` (`variant="mimundo"`) on narrow viewports.
- **Login Surface (`/login` under `mimundo`):**
  - Apply Mi Mundo's warm cream/paper surface (`--mm-cream`, `--mm-paper`, `--mm-green` border) and registration link to `/[locale]/register`.

### 3.6. `liora` (Liora Danza & Pilates)

- **Primary Header (`LioraSiteHeader.tsx`):**
  - Make the Login button text (`"Ingresar"` on `<md`, `"Iniciar Sesión"` on `≥md`) and the logged-in `"Mi Portal"` button text visible on mobile phones instead of `hidden md:inline`.
- **Secondary Header (`LioraRegisterHeader.tsx`):**
  - Add the rose-deep Login / Mi Portal pill (`bg-[var(--liora-rose-deep)] text-white`) in the top bar alongside `LanguageSwitcher` and `Inicio`.
- **Landing Footer (`LandingLioraFooter.tsx`):**
  - Add Login / Mi Portal link in the footer navigation column.
- **Public Content Shell (`PublicBlogScreenLiora.tsx`):**
  - Pass `showShopLink={merchEnabled}` and `shopLabel={dict.shop.catalog.title}` to `LioraSiteHeader`.
  - Render `PublicPwaTabBar` (`variant="liora"`, `--liora-cream` surface with `--liora-rose-deep` active indicator) on narrow viewports.
- **Login Surface (`/login` under `liora`):**
  - Apply `.liora-public-sheet` / `.liora-card` editorial cream-and-rose aesthetic and registration link to `/[locale]/register`.

---

## 4. i18n & Dictionary Additions (`es.json`, `en.json`, `pt.json`)

All new user-visible strings will be added to `src/dictionaries/es.json` (neutral Latin American tuteo per Rule 40), `src/dictionaries/en.json` (ASD-STE100 per Rule 41), and `src/dictionaries/pt.json`:

- `nav.loginShort`: `"Ingresar"` / `"Sign in"` / `"Entrar"`
- `nav.myPortal`: `"Mi Portal"` / `"My Portal"` / `"Meu Portal"`
- `nav.publicPwaBar`:
  - `aria`: `"Navegación pública"` / `"Public navigation"` / `"Navegação pública"`
  - `home`: `"Inicio"` / `"Home"` / `"Início"`
  - `courses`: `"Clases"` / `"Classes"` / `"Aulas"`
  - `events`: `"Eventos"` / `"Events"` / `"Eventos"`
  - `register`: `"Inscribirse"` / `"Enroll"` / `"Inscrever-se"`
  - `shop`: `"Tienda"` / `"Shop"` / `"Loja"`
  - `login`: `"Ingresar"` / `"Sign in"` / `"Entrar"`
  - `portal`: `"Mi Portal"` / `"My Portal"` / `"Meu Portal"`
- `login.registerPrompt`: `"¿Aún no tienes cuenta?"` / `"Do not have an account yet?"` / `"Ainda não tem conta?"`
- `login.registerCta`: `"Inscríbete o agenda tu clase"` / `"Enroll or book a trial class"` / `"Inscreva-se ou agende uma aula"`

---

## 5. Risks and Mitigations

- **Risk 1 — File size limit (250 LOC per file, Rule 03):**
  - *Mitigation:* Extract `PublicHeaderAccountCta.tsx`, `PublicPwaTabBar.tsx`, and `LoginRegisterBridge.tsx` as focused molecules under 120 LOC each rather than bloating existing header or surface files.
- **Risk 2 — Tour anchor staleness (Rules 33 & 36):**
  - *Mitigation:* Preserve all existing `data-tour` attributes in `PortalShell`, `PortalAccountSheet`, `PortalAccountList`, `AdminChromeHeader`, and `AdminMobileDrawer`. Run L1 and L2 tour contract tests (`tourAnchorInventory.test.ts`, `tourAnchorDomPresence.test.tsx`, `parentTourAnchorDomPresence.test.tsx`).
- **Risk 3 — WCAG AA contrast across 8 themes (Rule 26):**
  - *Mitigation:* Use each theme's verified token pairs (`--mz-yellow` + `--mz-ink-on-white`, `--ez-cyan` + `black` or `#070b12` + `white`, `--nago-gold` + `--nago-bg`, `--mm-green` + `white`, `--liora-rose-deep` + `white`, `--color-primary` + `--color-primary-foreground`) and avoid `hover:opacity-*`.
- **Risk 4 — Bottom bar overlap with footers or `PwaInstallPromptHost`:**
  - *Mitigation:* `PwaInstallPromptHost` already positions at `bottom-[calc(4.5rem+max(0.5rem,env(safe-area-inset-bottom,0px)))]` on `<md`, which clears a `4.25rem` (`68px`) bottom tab bar. `PwaPageShell` will add matching bottom padding on `<md` so page footers scroll cleanly above `PublicPwaTabBar`.

---

## 6. Definition of Done

1. **Automated Tests (TDD — Rules 02 & 30):**
   - Unit/RTL tests for `PublicPwaTabBar` (logged-out vs logged-in states, active route highlighting, theme variants).
   - Unit/RTL tests for `PublicHeaderAccountCta` and updated headers (`LandingHeaderPwa`, `EspacioZenitSiteHeader`, `MiMundoSiteHeader`, `NagoSiteHeader`, `MozarthitosSiteHeader`, `LioraSiteHeader`, `*RegisterHeader`).
   - Unit/RTL tests for `PublicContactScreenMiMundo` and `/contact` dispatch for `mimundo`.
   - Unit/RTL tests for `PortalShell` + `PortalAccountList` verifying the `"Ver sitio"` (`backToSite`) link renders on both desktop and mobile/PWA without breaking parent/student tour anchor contracts.
   - Unit/RTL tests for `LoginScreenDesktop` and `LoginScreenNarrow` verifying theme-aware chrome and the `/register` bridge link.
   - Coverage gate (`npm run test:coverage`) passes ≥90%.
2. **Product Changelog (Rule 39):**
   - Prepend entry in `src/lib/product-changelog/catalog.ts` describing the unified public PWA experience and quick switch between portal and website.
3. **Manual QA Checklist (User-Owned — Rule 32):**
   - `Manual QA (user)`: On mobile/PWA viewport, inspect `/es` across `golden`, `mozarthitos`, `espaciozenit`, `nago`, `mimundo`, and `liora`: verify the bottom tab bar, pull-to-refresh, and visible `"Ingresar"` button in the top header.
   - `Manual QA (user)`: Navigate to `/es/register`, `/es/contact`, `/es/events`, `/es/tienda` on mobile: verify the header shows `"Ingresar"` (or `"Mi Portal"` when logged in) and `mimundo` renders its own themed `/contact` and font root on `/events`.
   - `Manual QA (user)`: Log in as a parent/student and as an admin: verify 1-tap navigation to `"Ver sitio"` from the portal header/account sheet and 1-tap return via `"Mi Portal"` in the public header and bottom dock.

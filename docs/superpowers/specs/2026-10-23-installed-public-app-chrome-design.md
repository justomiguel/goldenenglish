# Installed public app chrome — design spec

**Date:** 2026-10-23
**Status:** Approved (2026-10-23)
**Continues:** [2026-10-23-public-pwa-and-auth-switch-by-theme-design.md](2026-10-23-public-pwa-and-auth-switch-by-theme-design.md)

The earlier spec added the public dock, the login pill, and the portal switch. This spec covers what still feels like a website after that work.

## Intent

When the institute app is installed, public pages and the student or parent portal use one face. The dock is the navigation. The marketing menu and the marketing footer stay in the mobile browser.

## Done when

1. In `display-mode: standalone`, public marketing headers and marketing footers do not show. A thin top bar shows the home logo and the language switcher. `PublicPwaTabBar` stays.
2. In the mobile browser (`web-mobile`), the current header, footer, and dock stay.
3. Desktop (`web-desktop`) does not change.
4. Survey, trial fee, enrollment payment, and trial-join pages are not inside the blog card.
5. `/logro/[slug]/[token]` and `/b/[token]` use the same public frame. They stay `noindex`.
6. Register, contact, and privacy headers use the real session. A logged-in person sees Mi Portal.
7. Student and parent `PortalShell` use the landing `FontRoot` for `nago`, `liora`, `mimundo`, `mozarthitos`, and `espaciozenit`.

## Out of scope

- Admin, teacher, and assistant shells. That work stays in the admin PWA program.
- Pull-to-refresh inside the mobile browser.
- A new login card per theme. `PublicTenantChrome` already applies the landing font root on `/login`.
- A new home-screen icon for themes other than Nagô. Espacio Zenit `inicio/1.png` is a landing image, not an app icon.
- A square maskable Nagô icon.
- A real route for the Courses tab. The home hash stays.
- Hiding the marketing header in the mobile browser.

## Decision

Hide marketing chrome only when the app is installed.

| Surface | Header | Footer | Dock |
| --- | --- | --- | --- |
| `web-desktop` | Full site header | Marketing footer | Hidden (`md:hidden` already) |
| `web-mobile` | Full site header | Marketing footer | Visible |
| `pwa-mobile` | Thin bar: logo + language | Hidden | Visible |

Rejected options:

- Hide the header on every narrow screen. The mobile browser still has its own chrome. The site header is the brand there.
- Keep both the full header and the dock in the installed app. That is the current gap.

## 1. Installed public chrome

### 1.1 Hide marketing chrome before paint

Add the class `public-marketing-chrome` to each public site header and each marketing footer.

Headers:

- `LandingHeader`, `LandingHeaderPwa`
- `MozarthitosSiteHeader`, `EspacioZenitSiteHeader`, `NagoSiteHeader`, `MiMundoSiteHeader`, `LioraSiteHeader`
- `RegisterSiteHeader` and each `*RegisterHeader`
- The header inside each `PublicBlogScreen*`

Footers:

- `LandingFooter`, `LandingFooterPwa`
- `LandingEspacioZenitFooter`, `LandingNagoFooter`, `LandingLioraFooter`
- The shell footer when Mozarthitos renders it on a public page
- The language footer under blog and flow pages

Global CSS:

```css
@media (display-mode: standalone) {
  .public-marketing-chrome {
    display: none;
  }
}
```

`display-mode: standalone` matches the installed app on current Chrome and Safari. It does not match `web-mobile`.

Old iOS builds that only set `navigator.standalone` can show the marketing header for one frame. `useAppSurface` already documents that one-frame gap. Do not add a second detection path.

### 1.2 Thin top bar

New client component `src/components/pwa/molecules/PublicInstalledTopBar.tsx`.

`PublicExperienceFrame` renders it only when `surface === "pwa-mobile"`.

The bar contains:

- A home link. Nagô uses `resolveNagoLogo`. Other themes use the brand logo already passed into the public shell.
- `LanguageSwitcher`.
- Top safe area (`env(safe-area-inset-top)`).
- Minimum height 44px for each control.

The bar does not render the hamburger, section links, or logout. The dock owns those moves. Logout stays in the portal.

Server `PublicExperienceShell` passes `logoSrc`, `logoAlt`, and `homeHref` into the frame. Do not read the brand inside the client bar.

The frame already sets the theme class (`nago-landing`, `ez-landing mz-landing`, and the others). The thin bar inherits those tokens. Do not put `nago-landing` on the bar itself. That class sets `position: relative` and a page background.

### 1.3 What stays visible

The page body stays. Landings still scroll. The dock still has Home, Courses, Events, the fourth tab, and Account.

Courses remains a hash link to the home. It is not `aria-current`.

## 2. Flow pages leave the blog card

These routes use `PublicBlogPageShell` today, so they render a full site header plus a blog sheet:

- `/encuesta/[slug]`
- `/clase-prueba/[token]`
- `/matricula/[slug]/[token]`
- `/unirse/[token]`

Change their layouts so they render `PublicFlowFrame` instead of the blog screen.

`PublicFlowFrame` provides:

- The theme `FontRoot` through the same switch as `PublicTenantChrome`.
- A compact header with logo, language, and `PublicHeaderAccountCta`, marked `public-marketing-chrome`.
- The page body at full width. No `nago-public-sheet` and no blog language footer.
- `PublicExperienceShell` around that tree, so the dock and the installed thin bar still mount.

Blog, events, shop, and `/q` stay on `PublicBlogScreen*`. Their headers and footers only gain `public-marketing-chrome`.

## 3. Share pages

Wrap these pages in `PublicFlowFrame`:

- `src/app/[locale]/logro/[slug]/[token]/page.tsx`
- `src/app/[locale]/b/[token]/page.tsx`

Keep `robots: { index: false, follow: false }`. Do not add them to the sitemap.

If `/b/[token]` only redirects, wrap the redirect fallback. Do not add a second layout around a redirect that never paints.

## 4. Session on secondary headers

`PublicHeaderAccountCta` with `sessionEmail={null}` shows Ingresar.

Pass the session email from the page into:

- Each `*RegisterHeader` on `/register`, `/contact`, and `/privacidad`
- Any blog or flow header that still hardcodes `null`

`/login`, `/forgot-password`, and `/reset-password` may keep `sessionEmail={null}`. Those routes redirect a logged-in user away.

The dock already loads the session inside `PublicExperienceShell`. The header must show the same state.

## 5. Portal face matches the public app

Student and parent layouts wrap `PortalShell` with `PublicTenantChrome` for the active `templateKind`.

Effects:

- `nago`, `liora`, `mimundo`, `mozarthitos`, and `espaciozenit` keep the landing font root inside the portal.
- `classic`, `editorial`, and `minimal` stay on the root font. `PublicTenantChrome` already returns the children for those kinds.
- The portal does not render the marketing header, the thin public bar, or `PublicPwaTabBar`. `PortalTabBar` stays.
- Admin and teacher layouts do not use `PublicTenantChrome`.

Load `templateKind` on the server in the student and parent layouts. Do not read it from a module global.

## 6. Themes

The rules in sections 1 to 5 apply to all eight kinds. No theme gets a private dock or a private login card.

Nagô install icon and splash stay as shipped: home mark, `purpose: "any"`, splash `#070707`. This spec does not change `manifest.ts`.

## 7. Tests

Each new or edited test file stays self-contained.

- `PublicInstalledTopBar` renders the home link and the language switcher. It does not render a menu button.
- `PublicExperienceFrame` renders the thin bar when the surface mock is `pwa-mobile`. It does not render it for `web-mobile` or `web-desktop`.
- A style or component test asserts that marketing headers carry `public-marketing-chrome`.
- Flow layouts for encuesta, clase-prueba, matricula, and unirse do not render the blog sheet class.
- Logro page test: the public frame is present and robots stay noindex.
- Register header test: a non-null session renders Mi Portal.
- Student or parent shell test: `templateKind="nago"` renders the Nagô font root marker. `templateKind="classic"` does not.

## 8. Copy, analytics, governance

- Reuse `nav.home` and the existing language-switcher labels for the thin bar. Add a key only if the logo link has no accessible name. Add that key to `en.json`, `es.json`, and `pt.json`.
- Spanish stays neutral tuteo. English stays short.
- Do not add a `user_events` type. The home link is navigation the layouts already record.
- No ADR. This spec does not change auth, RLS, or a public API.

## 9. Risks

- **Flash.** Standalone CSS hides the marketing header before paint. The thin bar appears after hydration. Accept that order.
- **Lost language control.** The thin bar must include `LanguageSwitcher`. Hiding the header without it blocks locale change in the installed app.
- **Double chrome.** A header that misses `public-marketing-chrome` stays visible above the thin bar. The test in section 7 locks the class on each header listed in section 1.1.
- **Portal contrast.** Landing tokens can darken the portal. Use the existing font-root pairs. Do not invent hex colors. Check student and parent shells for text on the new background.
- **File size.** Keep `PublicInstalledTopBar` and `PublicFlowFrame` in their own files. Stay under 250 lines.

## 10. Manual QA (user)

- Install the Nagô app. Open the home. Confirm one thin bar, no hamburger, no marketing footer, and the dock.
- Open the same home in mobile Safari without installing. Confirm the full header and the footer remain.
- Open matrícula and a logro link inside the installed app. Confirm they are not a blog card.
- Sign in, open a register page. Confirm the header says Mi Portal.
- Open the student portal inside the installed Nagô app. Confirm the Nagô type is still there and the portal dock is the portal dock.

## 11. Changelog

When this ships, prepend one product-changelog entry. Staff and families will see the installed public chrome and the portal face. Do not write that entry in the spec-only draft.

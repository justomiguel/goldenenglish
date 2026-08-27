# Tenant landing LCP image and font preloads — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking. TDD per task. Do **not** commit unless the user asks (working tree is mixed; rule 37). Do **not** commit spec/plan alone.

**Goal:** Each tenant home has one real LCP `<img>` with `priority`, and `next/font` preloads only the active first-viewport family.

**Architecture:** Shared `LandingHeroPhoto` (`next/image` `fill` + optional `priority`) replaces CSS `background-image` photos. `marketingFontPreload("lcp" | "lazy")` is the only `preload` boolean FontRoots and `app/layout.tsx` pass to `next/font`. Golden and Zenit keep existing `<Image>` trees; they drop extra `priority` and Zenit promotes the first brush line to `<h1>`.

**Tech Stack:** Next.js App Router, `next/image`, `next/font`, Vitest, Testing Library.

## Global Constraints

- Files ≤ 250 lines (`03-architecture.mdc`).
- No new user-facing copy; Zenit `h1` reuses `hero.brushLine1` (`09-i18n-copy.mdc`).
- `priority` only on the single home LCP image (`06-seo-performance.mdc`). Header logos stay as they are (not LCP).
- Tests self-contained under `src/__tests__/`; each file must pass `npx vitest run <file>`.
- Out of scope: `force-dynamic`, sitemap/robots, env/DNS, deleting Zenit fonts, virtualizing the Zenit gallery, `@font-face` migration unless a preview still preloads foreign families.
- No git commit in these tasks unless the user asks.

## File map

| File | Role |
|------|------|
| `src/lib/landing/marketingFontPreload.ts` | `preload: true` only for `"lcp"` |
| `src/components/molecules/LandingHeroPhoto.tsx` | `next/image` fill + priority |
| `src/app/layout.tsx` | root fonts `preload: lazy` |
| `*FontRoot.tsx` (5) | one LCP face, rest lazy |
| `LandingLioraSections.tsx` + `lioraLanding.css` | hero photo → molecule |
| `LandingMozarthitosSections.tsx` + `mozarthitosLanding.css` | banner → molecule; `2.png` not priority |
| `MiMundoHero.tsx` + `mimundoLanding.css` | `hero-bg.jpg` → molecule; logo not priority |
| `NagoHeroMotion.tsx` + `nagoLanding.css` | ken wrapper + molecule |
| `LandingHero.tsx` | one collage `priority` |
| `LandingEspacioZenitHeroMockup.tsx` | `h1` + left dancer only `priority` |

---

### Task 1: `marketingFontPreload`

**Files:**
- Create: `src/lib/landing/marketingFontPreload.ts`
- Test: `src/__tests__/lib/landing/marketingFontPreload.test.ts`

**Interfaces:**
- Consumes: nothing
- Produces: `marketingFontPreload(role: "lcp" | "lazy"): boolean`

- [ ] **Step 1: Write the failing test**

```ts
import { describe, expect, it } from "vitest";
import { marketingFontPreload } from "@/lib/landing/marketingFontPreload";

describe("marketingFontPreload", () => {
  it("preloads only the LCP face", () => {
    expect(marketingFontPreload("lcp")).toBe(true);
    expect(marketingFontPreload("lazy")).toBe(false);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/__tests__/lib/landing/marketingFontPreload.test.ts`

Expected: FAIL (module not found)

- [ ] **Step 3: Implement**

```ts
export type MarketingFontPreloadRole = "lcp" | "lazy";

export function marketingFontPreload(role: MarketingFontPreloadRole): boolean {
  return role === "lcp";
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/__tests__/lib/landing/marketingFontPreload.test.ts`

Expected: PASS

---

### Task 2: Wire `preload` on root + FontRoots

**Files:**
- Modify: `src/app/layout.tsx` (`DM_Sans`, `Fraunces`)
- Modify: `src/components/organisms/LioraFontRoot.tsx`
- Modify: `src/components/organisms/MozarthitosFontRoot.tsx`
- Modify: `src/components/organisms/MiMundoFontRoot.tsx`
- Modify: `src/components/organisms/NagoFontRoot.tsx`
- Modify: `src/components/organisms/EspacioZenitFontRoot.tsx`
- Test: `src/__tests__/lib/landing/marketingFontPreload.wiring.test.ts`

**Interfaces:**
- Consumes: `marketingFontPreload` from Task 1
- Produces: every `next/font` / `localFont` call sets `preload: marketingFontPreload(...)`

LCP faces (one per surface):

| Module | `"lcp"` | `"lazy"` |
|--------|---------|----------|
| `app/layout.tsx` | — | `DM_Sans`, `Fraunces` |
| `LioraFontRoot` | `Cormorant_Garamond` | `Jost` |
| `MozarthitosFontRoot` | `Baloo_2` | `DM_Sans` |
| `MiMundoFontRoot` | `Fraunces` | `Nunito`, `Caveat` |
| `NagoFontRoot` | `Cinzel` | `Outfit` |
| `EspacioZenitFontRoot` | `ezHeroBrush` (`FAST BLAZE.otf`) | other 6 faces |

- [ ] **Step 1: Failing wiring test** (reads source; do not parse TS AST)

```ts
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const root = resolve(__dirname, "../../..");

const files = [
  "src/app/layout.tsx",
  "src/components/organisms/LioraFontRoot.tsx",
  "src/components/organisms/MozarthitosFontRoot.tsx",
  "src/components/organisms/MiMundoFontRoot.tsx",
  "src/components/organisms/NagoFontRoot.tsx",
  "src/components/organisms/EspacioZenitFontRoot.tsx",
];

describe("marketingFontPreload wiring", () => {
  it("every FontRoot and the root layout pass preload through the helper", () => {
    for (const rel of files) {
      const src = readFileSync(resolve(root, rel), "utf8");
      expect(src, rel).toContain("marketingFontPreload");
      expect(src, rel).toMatch(/preload:\s*marketingFontPreload\(/);
    }
  });

  it("root layout does not preload DM Sans or Fraunces", () => {
    const src = readFileSync(resolve(root, "src/app/layout.tsx"), "utf8");
    expect(src).toContain('marketingFontPreload("lazy")');
    expect(src).not.toContain('marketingFontPreload("lcp")');
  });
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `npx vitest run src/__tests__/lib/landing/marketingFontPreload.wiring.test.ts`

Expected: FAIL (no `marketingFontPreload` in those files)

- [ ] **Step 3: Wire each font call**

Import:

```ts
import { marketingFontPreload } from "@/lib/landing/marketingFontPreload";
```

Example (`LioraFontRoot` display vs body):

```ts
const lioraDisplay = Cormorant_Garamond({
  weight: ["300", "400", "500", "600"],
  subsets: ["latin", "latin-ext"],
  variable: "--font-liora-display",
  display: "swap",
  adjustFontFallback: true,
  preload: marketingFontPreload("lcp"),
});

const lioraBody = Jost({
  weight: ["300", "400", "500", "600"],
  subsets: ["latin", "latin-ext"],
  variable: "--font-liora-body",
  display: "swap",
  preload: marketingFontPreload("lazy"),
});
```

`app/layout.tsx`: both fonts `preload: marketingFontPreload("lazy")`.

`EspacioZenitFontRoot`: `ezHeroBrush` → `"lcp"`; `ezDisciplineHiphop`, `ezDisciplineBallet`, `ezBrush`, `ezSerif`, `ezDisplay`, `ezBody` → `"lazy"`. Keep the `mozarthitosLanding.css` import (tokens); do not add more cross-tenant CSS.

Existing `NagoFontRoot.test.tsx` must keep passing (`vi.mock("next/font/google")` unchanged).

- [ ] **Step 4: Run tests**

Run:

```
npx vitest run src/__tests__/lib/landing/marketingFontPreload.wiring.test.ts src/__tests__/lib/landing/marketingFontPreload.test.ts src/__tests__/organisms/NagoFontRoot.test.tsx
```

Expected: PASS

---

### Task 3: `LandingHeroPhoto`

**Files:**
- Create: `src/components/molecules/LandingHeroPhoto.tsx`
- Test: `src/__tests__/molecules/LandingHeroPhoto.test.tsx`

**Interfaces:**
- Consumes: `next/image`
- Produces:

```ts
export type LandingHeroPhotoProps = {
  src: string;
  alt: string;
  sizes: string;
  priority?: boolean;
  className?: string;
};

export function LandingHeroPhoto(props: LandingHeroPhotoProps): JSX.Element
```

- [ ] **Step 1: Failing test**

```tsx
import { render } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/image", () => ({
  default: ({
    src,
    alt,
    priority,
    sizes,
    className,
  }: {
    src: string;
    alt: string;
    priority?: boolean;
    sizes?: string;
    className?: string;
  }) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      sizes={sizes}
      className={className}
      data-priority={priority ? "true" : "false"}
    />
  ),
}));

import { LandingHeroPhoto } from "@/components/molecules/LandingHeroPhoto";

describe("LandingHeroPhoto", () => {
  it("renders the src and marks priority when asked", () => {
    const { container } = render(
      <div className="relative h-40">
        <LandingHeroPhoto
          src="/images/liora/inicio/1.jpg"
          alt=""
          sizes="100vw"
          priority
          className="object-cover"
        />
      </div>,
    );
    const img = container.querySelector("img");
    expect(img).toHaveAttribute("src", "/images/liora/inicio/1.jpg");
    expect(img).toHaveAttribute("data-priority", "true");
    expect(img).toHaveAttribute("sizes", "100vw");
  });

  it("defaults priority off", () => {
    const { container } = render(
      <div className="relative h-40">
        <LandingHeroPhoto src="/x.jpg" alt="x" sizes="50vw" />
      </div>,
    );
    expect(container.querySelector("img")).toHaveAttribute("data-priority", "false");
  });
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `npx vitest run src/__tests__/molecules/LandingHeroPhoto.test.tsx`

Expected: FAIL (module not found)

- [ ] **Step 3: Implement**

```tsx
import Image from "next/image";

export type LandingHeroPhotoProps = {
  src: string;
  alt: string;
  sizes: string;
  priority?: boolean;
  className?: string;
};

export function LandingHeroPhoto({
  src,
  alt,
  sizes,
  priority = false,
  className = "",
}: LandingHeroPhotoProps) {
  const bypassOptimizer = src.startsWith("/images/");
  return (
    <Image
      src={src}
      alt={alt}
      fill
      unoptimized={bypassOptimizer}
      sizes={sizes}
      priority={priority}
      className={className}
    />
  );
}
```

Caller supplies a `relative` sized parent. Do not add a second wrapper that changes crop.

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/__tests__/molecules/LandingHeroPhoto.test.tsx`

Expected: PASS

---

### Task 4: Liora hero photo

**Files:**
- Modify: `src/components/organisms/LandingLioraSections.tsx`
- Modify: `src/styles/lioraLanding.css` (`.liora-hero` — drop photo `background-*` that assume an injected URL; keep `min-height`, `background-color`, overlay)
- Modify: `src/__tests__/components/organisms/LandingLioraSections.test.tsx`

**Interfaces:**
- Consumes: `LandingHeroPhoto`, existing `img("inicio", "1.jpg")`
- Produces: hero contains one priority photo; `hero.style.backgroundImage` is empty

- [ ] **Step 1: Update the two hero-photo tests first (they fail on current CSS bg)**

Replace the `backgroundImage` assertions:

```tsx
  it("falls back to the bundled hero photo when no media override exists", () => {
    const { container } = render(<LandingLioraSections {...defaultProps} />);
    const hero = container.querySelector(".liora-hero") as HTMLElement;
    expect(hero.style.backgroundImage).toBe("");
    expect(
      container.querySelector('img[src="/images/liora/inicio/1.jpg"]'),
    ).toBeTruthy();
  });

  it("uses the CMS override for the hero background when present", () => {
    const override = "https://cdn.example.com/liora/hero.jpg";
    const { container } = render(
      <LandingLioraSections
        {...defaultProps}
        mediaMap={new Map([["inicio::1", override]])}
      />,
    );
    const hero = container.querySelector(".liora-hero") as HTMLElement;
    expect(hero.style.backgroundImage).toBe("");
    expect(container.querySelector(`img[src="${override}"]`)).toBeTruthy();
  });
```

- [ ] **Step 2: Run to verify they fail**

Run: `npx vitest run src/__tests__/components/organisms/LandingLioraSections.test.tsx`

Expected: FAIL (still `backgroundImage`, no `img` for the hero slot)

- [ ] **Step 3: Implement**

In the hero `<section className="liora-hero ...">`, **before** the overlay:

```tsx
<div className="absolute inset-0" aria-hidden>
  <LandingHeroPhoto
    src={img("inicio", "1.jpg")}
    alt=""
    sizes="100vw"
    priority
    className="object-cover object-[center_30%]"
  />
</div>
```

Delete `style={{ backgroundImage: ... }}`.

In `lioraLanding.css`, update the comment and drop `background-size` / `background-position` / `background-repeat` on `.liora-hero` (those applied to the CSS photo). Keep `position: relative`, `min-height`, `background-color`, `overflow: hidden`. Overlay stays.

- [ ] **Step 4: Run the file**

Run: `npx vitest run src/__tests__/components/organisms/LandingLioraSections.test.tsx`

Expected: PASS (all 5 tests)

---

### Task 5: Mozarthitos banner

**Files:**
- Modify: `src/components/organisms/LandingMozarthitosSections.tsx`
- Modify: `src/styles/mozarthitosLanding.css` (`.mz-landing .mz-hero-surface` — keep `#152030`; **remove** `background-image: url("/images/mozarthitos/inicio/banner.jpg")` and the size/position/repeat that only served that photo)
- Test: `src/__tests__/organisms/LandingMozarthitosSections.hero.test.tsx` (new; do not load the whole lower-sections tree if it is heavy — mock `LandingMozarthitosLowerSections` and `MozarthitosBioTabs` like Liora mocks gallery)

**Interfaces:**
- Consumes: `LandingHeroPhoto`, `img("inicio", "banner.jpg")`
- Produces: one priority banner; portrait `2.png` has no `priority`

- [ ] **Step 1: Failing test**

```tsx
import { render } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { mockBrandPublic } from "@/test/fixtures/mockBrandPublic";
import dictEs from "@/dictionaries/es.json";
import type { Dictionary } from "@/types/i18n";

vi.mock("@/components/organisms/LandingMozarthitosLowerSections", () => ({
  LandingMozarthitosLowerSections: () => <div data-testid="mz-lower" />,
}));
vi.mock("@/components/organisms/MozarthitosBioTabs", () => ({
  MozarthitosBioTabs: () => null,
}));

import { LandingMozarthitosSections } from "@/components/organisms/LandingMozarthitosSections";

const dict = dictEs as Dictionary;

describe("LandingMozarthitosSections hero LCP", () => {
  it("paints the banner as a priority img, not CSS background", () => {
    const { container } = render(
      <LandingMozarthitosSections dict={dict} locale="es" />,
    );
    const surface = container.querySelector(".mz-hero-surface") as HTMLElement;
    expect(surface.style.backgroundImage).toBe("");
    const banner = container.querySelector(
      'img[src="/images/mozarthitos/inicio/banner.jpg"]',
    );
    expect(banner).toBeTruthy();
    expect(banner).toHaveAttribute("data-priority", "true");
    const portrait = container.querySelector(
      'img[src="/images/mozarthitos/inicio/2.png"]',
    );
    expect(portrait).toBeTruthy();
    expect(portrait).not.toHaveAttribute("data-priority", "true");
  });
});
```

If the test does **not** mock `next/image`, drop `data-priority` and instead count `priority` by mocking Image like Task 3 **in this file** (same mock). Prefer mocking `next/image` here so the assertion is stable.

`LandingMozarthitosSections` does not take `brand`; `mockBrandPublic` is unused — omit it.

- [ ] **Step 2: Run to verify it fails**

Run: `npx vitest run src/__tests__/organisms/LandingMozarthitosSections.hero.test.tsx`

Expected: FAIL (no banner `img`)

- [ ] **Step 3: Implement**

First child inside the hero `<section className="... mz-hero-surface ...">`:

```tsx
<div className="absolute inset-0" aria-hidden>
  <LandingHeroPhoto
    src={img("inicio", "banner.jpg")}
    alt=""
    sizes="100vw"
    priority
    className="object-cover object-center"
  />
</div>
```

The section already has `relative`. Remove `priority` from the existing `Image` (`2.png`). Keep width/height/sizes.

Keep `::before` velado in CSS.

- [ ] **Step 4: Run the file**

Run: `npx vitest run src/__tests__/organisms/LandingMozarthitosSections.hero.test.tsx`

Expected: PASS

---

### Task 6: Mi Mundo backdrop

**Files:**
- Modify: `src/components/organisms/MiMundoHero.tsx`
- Modify: `src/components/organisms/LandingMimundoSections.tsx` (pass resolved src)
- Modify: `src/styles/mimundoLanding.css` (`.mm-hero-bg::before` — remove `url("/images/mimundo/inicio/hero-bg.jpg")`; keep the dotted `::after` and other decoration)
- Test: `src/__tests__/organisms/MiMundoHero.lcp.test.tsx`

**Interfaces:**
- Consumes: `LandingHeroPhoto`
- Produces: `MiMundoHero` accepts `backdropSrc: string`. Logo `Image` has **no** `priority`. Backdrop is the only `priority` photo.

Default path if a caller omits it: `/images/mimundo/inicio/hero-bg.jpg`.

- [ ] **Step 1: Failing test**

```tsx
import { render } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import dictEs from "@/dictionaries/es.json";
import type { Dictionary } from "@/types/i18n";

vi.mock("next/image", () => ({
  default: ({
    src,
    alt,
    priority,
  }: {
    src: string;
    alt: string;
    priority?: boolean;
  }) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt={alt} data-priority={priority ? "true" : "false"} />
  ),
}));
vi.mock("@/components/molecules/MiMundoButterflyTrails", () => ({
  MiMundoButterflyTrails: () => null,
}));

import { MiMundoHero } from "@/components/organisms/MiMundoHero";

const dict = dictEs as Dictionary;

describe("MiMundoHero LCP", () => {
  it("uses one priority backdrop img and a lazy logo", () => {
    const { container } = render(
      <MiMundoHero
        dict={dict}
        locale="es"
        logoPath="/images/mimundo/logo.png"
        logoAlt="logo"
        backdropSrc="/images/mimundo/inicio/hero-bg.jpg"
      />,
    );
    const backdrop = container.querySelector(
      'img[src="/images/mimundo/inicio/hero-bg.jpg"]',
    );
    expect(backdrop).toHaveAttribute("data-priority", "true");
    const logo = container.querySelector('img[src="/images/mimundo/logo.png"]');
    expect(logo).toHaveAttribute("data-priority", "false");
  });
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `npx vitest run src/__tests__/organisms/MiMundoHero.lcp.test.tsx`

Expected: FAIL (`backdropSrc` not a prop / no backdrop img)

- [ ] **Step 3: Implement**

Add `backdropSrc: string` to `MiMundoHeroProps`.

Inside `<section className="mm-hero-bg ...">`, first layer (under blob is fine):

```tsx
<div
  className="pointer-events-none absolute inset-0 z-0 opacity-[0.12] blur-[2px] saturate-[0.7] mix-blend-overlay"
  aria-hidden
>
  <LandingHeroPhoto
    src={backdropSrc}
    alt=""
    sizes="100vw"
    priority
    className="object-cover object-[center_30%]"
  />
</div>
```

Remove `priority` from the logo `Image`.

`LandingMimundoSections`:

```tsx
import { resolveLandingImageSrcForTheme } from "@/lib/cms/resolveLandingMedia";

<MiMundoHero
  dict={dict}
  locale={locale}
  logoPath={brand.logoPath}
  logoAlt={brand.logoAlt}
  backdropSrc={resolveLandingImageSrcForTheme(
    "mimundo",
    "inicio",
    "hero-bg.jpg",
    mediaMap,
  )}
/>
```

Delete the photo `url(...)` from `.mm-hero-bg::before` (if `::before` becomes empty, delete the whole `::before` rule). Do not touch `::after`.

Watch `MiMundoHero.tsx` line count (already ~212). If over 250, extract the confetti array or trails markup — only if the ceiling is hit.

- [ ] **Step 4: Run tests**

Run: `npx vitest run src/__tests__/organisms/MiMundoHero.lcp.test.tsx src/__tests__/components/organisms/LandingMimundoSections.test.tsx`

Expected: PASS

---

### Task 7: Nago kenburns photo

**Files:**
- Modify: `src/components/organisms/NagoHeroMotion.tsx`
- Modify: `src/components/organisms/LandingNagoSections.tsx`
- Modify: `src/styles/nagoLanding.css` (`.nago-hero-ken` — keep inset, cover animation, **remove** `background-image: url("/images/nago/inicio/hero-chile.png")` and the background-* that only served that PNG)
- Modify: `src/__tests__/organisms/NagoHeroMotion.test.tsx`
- Modify: `src/__tests__/organisms/LandingNagoSections.test.tsx`
- Modify: `src/__tests__/styles/nagoLandingCss.test.ts`

**Interfaces:**
- Consumes: `LandingHeroPhoto`
- Produces: `NagoHeroMotion({ children, photoSrc: string })`. Ken wrapper stays; photo is the molecule with `priority`.

- [ ] **Step 1: Update tests so they fail**

`NagoHeroMotion.test.tsx`: pass `photoSrc="/images/nago/inicio/hero-chile.png"` and assert an `img` with that src exists inside `.nago-hero-ken`.

`LandingNagoSections.test.tsx`: assert `img[src*="hero-chile.png"]` is present.

`nagoLandingCss.test.ts`: **invert** the path assertion:

```ts
  it("does not paint the Chile hero as a CSS background", () => {
    expect(css).not.toContain("/images/nago/inicio/hero-chile.png");
    expect(css).not.toContain("/images/nago/inicio/hero-bg.png");
  });
```

Keep the grain / smooth-scroll tests.

- [ ] **Step 2: Run to verify fail**

Run:

```
npx vitest run src/__tests__/organisms/NagoHeroMotion.test.tsx src/__tests__/organisms/LandingNagoSections.test.tsx src/__tests__/styles/nagoLandingCss.test.ts
```

Expected: FAIL (missing `photoSrc` / CSS still has the PNG url)

- [ ] **Step 3: Implement**

```tsx
export interface NagoHeroMotionProps {
  children: ReactNode;
  photoSrc: string;
}

// inside .nago-hero-ken:
<div className="nago-hero-ken">
  <LandingHeroPhoto
    src={photoSrc}
    alt=""
    sizes="100vw"
    priority
    className="object-cover object-[center_42%]"
  />
</div>
```

`.nago-hero-ken` must be `position: absolute; inset: 0` (already). Add `overflow: hidden` if missing so kenburns clip stays.

`LandingNagoSections`:

```tsx
<NagoHeroMotion photoSrc={img("inicio", "hero-chile.png")}>
```

- [ ] **Step 4: Run the three files**

Expected: PASS

---

### Task 8: Golden one `priority`

**Files:**
- Modify: `src/components/organisms/LandingHero.tsx`
- Test: `src/__tests__/organisms/LandingHero.lcp.test.tsx`

**Interfaces:**
- Consumes: existing `LandingTiltedPhoto`
- Produces: exactly one `priority` tilted photo (`heroImage(0)`). Mobile second photo and desktop photos 1–2 are lazy.

- [ ] **Step 1: Failing test**

```tsx
import { render } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { mockBrandPublic } from "@/test/fixtures/mockBrandPublic";
import dictEs from "@/dictionaries/es.json";
import type { Dictionary } from "@/types/i18n";

vi.mock("@/components/molecules/LandingTiltedPhoto", () => ({
  LandingTiltedPhoto: ({
    src,
    priority,
  }: {
    src: string;
    priority?: boolean;
  }) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt="" data-priority={priority ? "true" : "false"} />
  ),
}));

import { LandingHero } from "@/components/organisms/LandingHero";

describe("LandingHero LCP", () => {
  it("marks only the first collage photo as priority", () => {
    const { container } = render(
      <LandingHero
        dict={dictEs as Dictionary}
        brand={mockBrandPublic}
        locale="es"
      />,
    );
    const flagged = [...container.querySelectorAll("img")].filter(
      (el) => el.getAttribute("data-priority") === "true",
    );
    expect(flagged).toHaveLength(1);
  });
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `npx vitest run src/__tests__/organisms/LandingHero.lcp.test.tsx`

Expected: FAIL (length 5 today)

- [ ] **Step 3: Implement**

Keep `priority` only on the **first** `LandingTiltedPhoto` in the **mobile** pair (`heroImage(0)`). Remove `priority` from the second mobile photo and from all three desktop photos **except** if desktop-only would have zero priority images in the desktop tree — still only one in the whole component: the mobile `heroImage(0)` is enough (same `src` as desktop first). Desktop first photo: **no** second `priority` (duplicate request). So: **only the mobile `heroImage(0)`** has `priority`. Desktop copies stay lazy (same file, browser cache).

- [ ] **Step 4: Run**

Run: `npx vitest run src/__tests__/organisms/LandingHero.lcp.test.tsx src/__tests__/landing/landingBranches.test.tsx src/__tests__/components/smoke-part1.test.tsx`

Expected: PASS. If smoke-part1 is huge and unrelated failures appear, run only `LandingHero.lcp` + `landingBranches`.

---

### Task 9: Zenit `h1` + one dancer `priority`

**Files:**
- Modify: `src/components/organisms/LandingEspacioZenitHeroMockup.tsx`
- Test: `src/__tests__/organisms/LandingEspacioZenitHeroMockup.test.tsx`

**Interfaces:**
- Consumes: existing copy helpers
- Produces: `getByRole("heading", { level: 1 })` is `hero.brushLine1`. Left dancer `priority`. Right dancer not. Left `sizes` stay the painted width (already `min(500px, 94vw)` / `38vw` / `450px` — do not use a `sizes` that implies 1122px).

- [ ] **Step 1: Failing test**

```tsx
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import dictEs from "@/dictionaries/es.json";
import type { Dictionary } from "@/types/i18n";
import { marketingLandingCopy } from "@/lib/landing/mzLandingCopy";

vi.mock("next/image", () => ({
  default: ({
    src,
    priority,
  }: {
    src: string;
    priority?: boolean;
  }) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt="" data-priority={priority ? "true" : "false"} />
  ),
}));

import { LandingEspacioZenitHeroMockup } from "@/components/organisms/LandingEspacioZenitHeroMockup";

const dict = dictEs as Dictionary;
const brush1 = marketingLandingCopy(dict, "ez", "hero.brushLine1");

describe("LandingEspacioZenitHeroMockup LCP", () => {
  it("exposes the first brush line as h1 and only the left dancer is priority", () => {
    const { container } = render(
      <LandingEspacioZenitHeroMockup
        dict={dict}
        locale="es"
        logoSrc="/logo.png"
        logoAlt="logo"
      />,
    );
    expect(
      screen.getByRole("heading", { level: 1, name: brush1 }),
    ).toBeInTheDocument();
    const left = container.querySelector(
      'img[src="/images/espaciozenit/landing/1.png"]',
    );
    const right = container.querySelector(
      'img[src="/images/espaciozenit/landing/2.png"]',
    );
    expect(left).toHaveAttribute("data-priority", "true");
    expect(right).toHaveAttribute("data-priority", "false");
  });
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `npx vitest run src/__tests__/organisms/LandingEspacioZenitHeroMockup.test.tsx`

Expected: FAIL (no `h1`; right dancer also priority)

- [ ] **Step 3: Implement**

1. Delete the visually hidden `<span id="ez-mock-hero-visually-hidden-title">`.
2. Change the first brush `<p>` to `<h1 id="ez-mock-hero-title">` with the **same classes**.
3. Set `aria-labelledby="ez-mock-hero-title"` on the `<section>`.
4. Remove `priority` from the right `Image`.
5. Leave left `priority` and current `sizes`.

Second brush line stays `<p>`.

- [ ] **Step 4: Run**

Run: `npx vitest run src/__tests__/organisms/LandingEspacioZenitHeroMockup.test.tsx`

Expected: PASS

---

### Task 10: CWV after deploy (not a merge gate)

**Files:** none in this drop.

Lab gate is **after** a reachable preview/prod deploy. Recipe (same as sprint 1):

```
npx lighthouse@12 <origin>/es --form-factor=mobile --screenEmulation.mobile --only-categories=performance
```

Homes: Golden, Zenit, Mi Mundo, Mozarthitos, Liora. Skip Nago.

Record vs 26 ago table in the audit canvas (`tenant-perf-seo-audit.canvas.tsx`): LCP < 4.0 s; Load Delay not majority; CLS Good; TBT ≤ 200 ms.

If a preview home still lists **other tenants’** families in the `Link` preload header, stop and apply the spec fallback (do not ship `@font-face` unless that preview check fails). First check: `preload: false` on unused faces should already drop them from `Link`.

---

## Spec coverage

| Spec Done when | Task |
|----------------|------|
| §1 CSS photo → `next/image` priority | 3, 4, 5, 6, 7 |
| §2 one `priority` per home | 5, 6, 8, 9 |
| §3–4 font preloads | 1, 2, 10 (preview check) |
| §5 Zenit `h1` | 9 |
| §6 tests | each task |
| §7 CWV lab | 10 |

## Type consistency

- `marketingFontPreload(role: "lcp" | "lazy"): boolean`
- `LandingHeroPhotoProps`: `src`, `alt`, `sizes`, `priority?`, `className?`
- `NagoHeroMotionProps.photoSrc: string`
- `MiMundoHero` `backdropSrc: string`

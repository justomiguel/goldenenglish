# Nago Cinematic Reveal Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Give the Nagô landing full cinematic scroll coverage (word-mask hero, gallery wipes, Mestre pin, footer/form reveals, CTA press) without adding Motion or GSAP.

**Architecture:** Keep IntersectionObserver + CSS. Add easing tokens and a `mask` variant on `NagoReveal`. Add a pure `planNagoSplitWords` helper plus `NagoSplitWords` for the hero H1 only. Pin Mestre with CSS sticky. Stagger the first six gallery tiles. Do not change header stacking.

**Tech Stack:** Next.js App Router, existing `NagoReveal` / `nagoLanding.css`, Vitest + Testing Library. No `motion`, no GSAP.

**Spec:** [`../specs/2026-08-30-nago-cinematic-reveal-design.md`](../specs/2026-08-30-nago-cinematic-reveal-design.md)

## Global Constraints

- Personality is Cinematic. Three curves only: `--nago-ease-dramatic`, `--nago-spring-smooth` (fallback `--nago-ease-out`), `--nago-ease-snap` (`--nago-ease` aliases snap).
- No Motion, GSAP, or Lenis.
- No CSS keyword easings on one-shot reveals. `linear` only on infinite ambient loops (Ken Burns, discover arrow).
- Reveal travel stays `translate3d(0, 22px, 0)`. Hover lift is `-2px`. Stagger is `80ms`. Duration is `700ms` (cap `800ms`).
- Character/word split only on `#nago-hero-title`. At most six individually staggered words.
- Header stacking contract must stay green. Sticky Mestre `z-index` is `--nago-z-content`, `top` is `--nago-header-h`.
- `prefers-reduced-motion: reduce` is opacity-only: no translate, scale, clip-path, sticky pin, or word split. Extend the existing reduced-motion block; do not add a second policy.
- Do not commit unless the user asked.

## File map

| File | Responsibility |
|------|----------------|
| `src/lib/landing/nagoSplitWords.ts` | Pure split + delay index (testable, no React). |
| `src/components/organisms/NagoSplitWords.tsx` | Hero H1 word mask; reduced-motion passthrough. |
| `src/components/organisms/NagoReveal.tsx` | Add `variant="mask"`; ignore `from`/`drift` on mask. |
| `src/styles/nagoLanding.css` | Tokens, mask keyframes, split words, sticky pin, CTA press, reduced motion. |
| `src/components/organisms/LandingNagoSections.tsx` | Wire `NagoSplitWords` into the hero. |
| Section organisms listed in Task 4 | `variant="mask"` on section title reveals. |
| `src/components/organisms/NagoLandingGallery.tsx` | Media reveal + delay 1,2,3,1,2,3 on first six. |
| `src/components/organisms/LandingNagoMestre.tsx` | `nago-mestre-pin` on the photo column. |
| `src/components/organisms/LandingNagoFooter.tsx` | One `NagoReveal` per column. |
| `src/components/organisms/LandingNagoSections.tsx` | Wrap lead form in `NagoReveal`. |

---

### Task 1: Easing tokens and CSS contract

**Files:**
- Modify: `src/styles/nagoLanding.css` (`.nago-landing` tokens; reduced-motion list)
- Test: `src/__tests__/styles/nagoLandingCss.test.ts`

**Interfaces:**
- Consumes: existing `.nago-landing` custom properties
- Produces: `--nago-ease-dramatic`, `--nago-spring-smooth`, `--nago-ease-out`, `--nago-ease-snap`; `--nago-ease` aliases snap

- [ ] **Step 1: Write the failing CSS contract test**

Add this `it` to `nagoLandingCss.test.ts`:

```ts
  it("locks the cinematic three-curve palette", () => {
    expect(css).toMatch(/--nago-ease-dramatic\s*:\s*cubic-bezier\(0\.77,\s*0,\s*0\.175,\s*1\)/);
    expect(css).toMatch(/--nago-ease-snap\s*:\s*cubic-bezier\(0\.22,\s*1,\s*0\.36,\s*1\)/);
    expect(css).toMatch(/--nago-ease\s*:\s*var\(--nago-ease-snap\)/);
    expect(css).toMatch(/--nago-ease-out\s*:\s*cubic-bezier\(0\.16,\s*1,\s*0\.3,\s*1\)/);
    expect(css).toMatch(/--nago-spring-smooth\s*:\s*linear\(/);
  });
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/__tests__/styles/nagoLandingCss.test.ts`

Expected: FAIL — `locks the cinematic three-curve palette` (tokens missing). Header stacking tests still pass.

- [ ] **Step 3: Add tokens**

In `.nago-landing`, replace `--nago-ease: cubic-bezier(0.22, 1, 0.36, 1);` with:

```css
  --nago-ease-dramatic: cubic-bezier(0.77, 0, 0.175, 1);
  --nago-ease-out: cubic-bezier(0.16, 1, 0.3, 1);
  --nago-ease-snap: cubic-bezier(0.22, 1, 0.36, 1);
  --nago-ease: var(--nago-ease-snap);
  --nago-spring-smooth: linear(
    0, 0.004, 0.016 2.3%, 0.063 4.7%, 0.141 7.2%,
    0.25 9.9%, 0.601 16.5%, 0.815 21.0%, 0.929 25.2%,
    0.987 29.0%, 1.025 33.5%, 1.042 38.0%, 1.04 43.5%,
    1.027 50.0%, 1.013 57.5%, 1.005 67.0%, 1.001 79.0%, 1
  );
```

Do not change `--nago-z-*` or header rules.

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/__tests__/styles/nagoLandingCss.test.ts`

Expected: PASS (all tests in the file).

- [ ] **Step 5: Commit only if the user asked**

```bash
git add src/styles/nagoLanding.css src/__tests__/styles/nagoLandingCss.test.ts
git commit -m "feat(nago): lock cinematic easing tokens"
```

---

### Task 2: `planNagoSplitWords` + `NagoSplitWords` + hero H1

**Files:**
- Create: `src/lib/landing/nagoSplitWords.ts`
- Create: `src/components/organisms/NagoSplitWords.tsx`
- Create: `src/__tests__/lib/landing/nagoSplitWords.test.ts`
- Create: `src/__tests__/organisms/NagoSplitWords.test.tsx`
- Modify: `src/components/organisms/LandingNagoSections.tsx` (hero `h1`)
- Modify: `src/styles/nagoLanding.css` (split-word clip + keyframe; exclude title from lockup fade)

**Interfaces:**
- Consumes: title parts `{ text: string; accent?: boolean }[]`
- Produces:
  - `planNagoSplitWords(parts) => { ariaLabel: string; words: { text: string; accent: boolean; delayIndex: number }[] } | null`
  - `NagoSplitWords({ id, className, parts })` renders `h1`

- [ ] **Step 1: Write the failing planner tests**

```ts
import { describe, expect, it } from "vitest";
import { planNagoSplitWords } from "@/lib/landing/nagoSplitWords";

describe("planNagoSplitWords", () => {
  it("splits parts on spaces and builds the accessible label", () => {
    const planned = planNagoSplitWords([
      { text: "Capoeira que" },
      { text: "transforma.", accent: true },
    ]);
    expect(planned?.ariaLabel).toBe("Capoeira que transforma.");
    expect(planned?.words).toEqual([
      { text: "Capoeira", accent: false, delayIndex: 0 },
      { text: "que", accent: false, delayIndex: 1 },
      { text: "transforma.", accent: true, delayIndex: 2 },
    ]);
  });

  it("caps individual stagger at six words", () => {
    const planned = planNagoSplitWords([
      { text: "one two three four five six seven eight" },
    ]);
    expect(planned?.words.map((w) => w.delayIndex)).toEqual([
      0, 1, 2, 3, 4, 5, 5, 5,
    ]);
  });

  it("returns null for empty or whitespace-only parts", () => {
    expect(planNagoSplitWords([{ text: "   " }, { text: "" }])).toBeNull();
  });
});
```

- [ ] **Step 2: Run planner tests to verify they fail**

Run: `npx vitest run src/__tests__/lib/landing/nagoSplitWords.test.ts`

Expected: FAIL — module not found.

- [ ] **Step 3: Implement the planner**

```ts
export type NagoTitlePart = { text: string; accent?: boolean };

export type NagoSplitWord = {
  text: string;
  accent: boolean;
  delayIndex: number;
};

export function planNagoSplitWords(
  parts: readonly NagoTitlePart[],
): { ariaLabel: string; words: NagoSplitWord[] } | null {
  const words: Omit<NagoSplitWord, "delayIndex">[] = [];
  for (const part of parts) {
    for (const text of part.text.trim().split(/\s+/).filter(Boolean)) {
      words.push({ text, accent: Boolean(part.accent) });
    }
  }
  if (words.length === 0) return null;
  return {
    ariaLabel: words.map((w) => w.text).join(" "),
    words: words.map((w, i) => ({ ...w, delayIndex: Math.min(i, 5) })),
  };
}
```

- [ ] **Step 4: Run planner tests**

Run: `npx vitest run src/__tests__/lib/landing/nagoSplitWords.test.ts`

Expected: PASS.

- [ ] **Step 5: Write the failing component tests**

```tsx
import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { NagoSplitWords } from "@/components/organisms/NagoSplitWords";

const parts = [
  { text: "Capoeira que" },
  { text: "transforma.", accent: true },
] as const;

describe("NagoSplitWords", () => {
  it("exposes the full title and hides split words", () => {
    vi.stubGlobal(
      "matchMedia",
      (query: string) =>
        ({
          matches: query.includes("prefers-reduced-motion") ? false : false,
          media: query,
          addEventListener: vi.fn(),
          removeEventListener: vi.fn(),
        }) as unknown as MediaQueryList,
    );

    render(
      <NagoSplitWords id="nago-hero-title" className="nago-hero-title" parts={parts} />,
    );
    const heading = screen.getByRole("heading", { name: "Capoeira que transforma." });
    expect(heading).toHaveAttribute("id", "nago-hero-title");
    expect(heading.querySelectorAll("[aria-hidden='true']")).toHaveLength(3);
    expect(heading.querySelector(".nago-hero-title-accent")?.textContent).toBe(
      "transforma.",
    );
  });

  it("renders unsplit children when motion is reduced", () => {
    vi.stubGlobal(
      "matchMedia",
      (query: string) =>
        ({
          matches: query.includes("prefers-reduced-motion"),
          media: query,
          addEventListener: vi.fn(),
          removeEventListener: vi.fn(),
        }) as unknown as MediaQueryList,
    );

    render(
      <NagoSplitWords id="nago-hero-title" className="nago-hero-title" parts={parts} />,
    );
    const heading = screen.getByRole("heading", { name: /transforma/i });
    expect(heading.querySelectorAll(".nago-split-word")).toHaveLength(0);
    expect(heading).not.toHaveAttribute("aria-label");
  });
});
```

- [ ] **Step 6: Run component tests to verify they fail**

Run: `npx vitest run src/__tests__/organisms/NagoSplitWords.test.tsx`

Expected: FAIL — module not found.

- [ ] **Step 7: Implement `NagoSplitWords`**

```tsx
"use client";

import { planNagoSplitWords, type NagoTitlePart } from "@/lib/landing/nagoSplitWords";

export function NagoSplitWords({
  id,
  className = "",
  parts,
}: {
  id: string;
  className?: string;
  parts: readonly NagoTitlePart[];
}) {
  const planned = planNagoSplitWords(parts);
  const reduce =
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  if (!planned || reduce) {
    return (
      <h1 id={id} className={className}>
        {parts.map((part, i) =>
          part.accent ? (
            <span key={i} className="nago-hero-title-accent">
              {part.text}
            </span>
          ) : (
            <span key={i}>{part.text} </span>
          ),
        )}
      </h1>
    );
  }

  return (
    <h1 id={id} className={className} aria-label={planned.ariaLabel}>
      {planned.words.map((word, i) => (
        <span key={`${word.text}-${i}`} className="nago-split-word-clip">
          <span
            className={`nago-split-word${word.accent ? " nago-hero-title-accent" : ""}`}
            aria-hidden="true"
            style={{ animationDelay: `${word.delayIndex * 80}ms` }}
          >
            {word.text}
          </span>
        </span>
      ))}
    </h1>
  );
}
```

Put a space between clips with `margin-inline-end: 0.28em` on `.nago-split-word-clip` so words do not collide.

- [ ] **Step 8: Wire the hero and CSS**

In `LandingNagoSections.tsx`, replace the `h1` block with:

```tsx
        <NagoSplitWords
          id="nago-hero-title"
          className="nago-hero-title nago-display max-w-4xl text-5xl leading-[0.9] sm:text-6xl md:text-7xl lg:text-8xl"
          parts={[
            { text: t("hero.title") },
            { text: t("hero.titleAccent"), accent: true },
          ]}
        />
```

Import `NagoSplitWords`.

In `nagoLanding.css`:

1. Change lockup child animation so the title does not double-fade:

```css
.nago-hero-lockup > *:not(.nago-hero-rule):not(.nago-hero-title) {
```

Apply the same `:not(.nago-hero-title)` to the nth-child delay rules if they would still target the h1. Prefer the exclusion selector above as the opacity/animation rule.

2. Add:

```css
@keyframes nago-mask-up {
  from {
    opacity: 0;
    transform: translate3d(0, 110%, 0);
  }
  to {
    opacity: 1;
    transform: none;
  }
}

.nago-split-word-clip {
  display: inline-block;
  overflow: hidden;
  margin-inline-end: 0.28em;
  vertical-align: bottom;
}

.nago-split-word {
  display: inline-block;
  animation: nago-mask-up 0.7s var(--nago-ease-dramatic) both;
}

@media (prefers-reduced-motion: reduce) {
  .nago-split-word,
  .nago-split-word-clip {
    animation: none !important;
    transform: none;
    overflow: visible;
  }
}
```

Add `.nago-split-word` and `.nago-split-word-clip` to the existing reduced-motion selector lists (animation none + transform none).

- [ ] **Step 9: Run split + landing tests**

Run:

```bash
npx vitest run src/__tests__/lib/landing/nagoSplitWords.test.ts src/__tests__/organisms/NagoSplitWords.test.tsx src/__tests__/organisms/LandingNagoSections.test.tsx
```

Expected: PASS. `LandingNagoSections` still finds the H1 via `/transform/i`.

- [ ] **Step 10: Commit only if the user asked**

```bash
git add src/lib/landing/nagoSplitWords.ts src/components/organisms/NagoSplitWords.tsx src/__tests__/lib/landing/nagoSplitWords.test.ts src/__tests__/organisms/NagoSplitWords.test.tsx src/components/organisms/LandingNagoSections.tsx src/styles/nagoLanding.css
git commit -m "feat(nago): mask the hero title word by word"
```

---

### Task 3: `NagoReveal` mask variant

**Files:**
- Modify: `src/components/organisms/NagoReveal.tsx`
- Modify: `src/__tests__/organisms/NagoReveal.test.tsx`
- Modify: `src/styles/nagoLanding.css`

**Interfaces:**
- Consumes: existing `NagoRevealProps`
- Produces: `variant?: "block" | "media" | "mask"`. Mask adds `nago-reveal-mask` and wraps children in `.nago-reveal-mask-inner`. Mask ignores `from` and `drift`.

- [ ] **Step 1: Write the failing mask tests**

Append to `NagoReveal.test.tsx`:

```tsx
  it("masks a line and ignores from and drift", () => {
    const { container } = render(
      <NagoReveal variant="mask" from="left" drift={18}>
        <h2>Horarios</h2>
      </NagoReveal>,
    );
    expect(container.firstElementChild).toHaveClass("nago-reveal-mask");
    expect(container.firstElementChild).not.toHaveClass("nago-reveal-from-left");
    expect(container.querySelector("[data-nago-drift]")).toBeNull();
    expect(container.querySelector(".nago-reveal-mask-inner")).toBeTruthy();
  });
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/__tests__/organisms/NagoReveal.test.tsx`

Expected: FAIL — missing `nago-reveal-mask` (or class not applied).

- [ ] **Step 3: Implement mask**

Update the variant union to `"block" | "media" | "mask"`.

Build `fromClass` only when `variant !== "mask" && from !== "up"`.

Apply `drift` only when `variant !== "mask"`.

When `variant === "mask"`, wrap `body` in `<div className="nago-reveal-mask-inner">{body}</div>` (after optional media frame is skipped — mask is not media).

Class list includes `nago-reveal-mask` when `variant === "mask"`. Do not add `nago-reveal-media` on mask.

- [ ] **Step 4: Add mask CSS**

```css
.nago-reveal-mask {
  overflow: hidden;
  opacity: 1;
  transform: none;
}

.nago-reveal-mask-inner {
  transform: translate3d(0, 110%, 0);
}

.nago-reveal-mask.is-in .nago-reveal-mask-inner {
  animation: nago-mask-up 0.7s var(--nago-ease-dramatic) both;
}

.nago-reveal-mask.d1.is-in .nago-reveal-mask-inner {
  animation-delay: 0.08s;
}

.nago-reveal-mask.d2.is-in .nago-reveal-mask-inner {
  animation-delay: 0.16s;
}

.nago-reveal-mask.d3.is-in .nago-reveal-mask-inner {
  animation-delay: 0.24s;
}
```

In the existing reduced-motion block, add `.nago-reveal-mask-inner` next to `.nago-reveal-media-frame` (animation none, transform none, overflow visible if needed).

Also add a CSS contract assertion in `nagoLandingCss.test.ts`:

```ts
  it("masks reveals with the dramatic curve", () => {
    expect(css).toMatch(
      /\.nago-reveal-mask\.is-in \.nago-reveal-mask-inner[\s\S]*var\(--nago-ease-dramatic\)/,
    );
  });
```

- [ ] **Step 5: Run tests**

Run:

```bash
npx vitest run src/__tests__/organisms/NagoReveal.test.tsx src/__tests__/styles/nagoLandingCss.test.ts
```

Expected: PASS.

- [ ] **Step 6: Commit only if the user asked**

```bash
git add src/components/organisms/NagoReveal.tsx src/__tests__/organisms/NagoReveal.test.tsx src/styles/nagoLanding.css src/__tests__/styles/nagoLandingCss.test.ts
git commit -m "feat(nago): add mask reveal variant"
```

---

### Task 4: Section heading masks

**Files:**
- Modify: `src/components/organisms/LandingNagoPrograms.tsx` — the `NagoReveal` that wraps the section `h2` → `variant="mask"`
- Modify: `src/components/organisms/LandingNagoExperience.tsx` — same
- Modify: `src/components/organisms/LandingNagoMestre.tsx` — the text-column `NagoReveal` that wraps the `h2` → `variant="mask"`
- Modify: `src/components/organisms/LandingNagoHorarios.tsx` — heading reveal → `variant="mask"`
- Modify: `src/components/organisms/LandingNagoAccion.tsx` — heading reveal → `variant="mask"`
- Modify: `src/components/organisms/LandingNagoEvents.tsx` — heading reveal → `variant="mask"`
- Modify: `src/components/organisms/NagoLandingGallery.tsx` — title `NagoReveal` → `variant="mask"`
- Modify: `src/components/organisms/LandingNagoTestimonials.tsx` — heading reveal → `variant="mask"`
- Modify: `src/components/organisms/LandingNagoConvert.tsx` — the reveal that wraps `cta.title` → `variant="mask"`
- Test: `src/__tests__/organisms/LandingNagoSections.test.tsx`

**Interfaces:**
- Consumes: `NagoReveal` `variant="mask"` from Task 3
- Produces: every major section `h2` enters with the mask. Pillar card titles stay `block` (they are not section headings).

- [ ] **Step 1: Write the failing coverage assertion**

Append to `LandingNagoSections.test.tsx`:

```tsx
  it("masks major section titles", () => {
    const { container } = render(
      <LandingNagoSections dict={dictEn} brand={mockBrandPublic} locale="es" />,
    );
    const masks = container.querySelectorAll(".nago-reveal-mask");
    expect(masks.length).toBeGreaterThanOrEqual(8);
    expect(
      screen.getByRole("heading", { name: dictEn.landing.nago.programas.sectionTitle })
        .closest(".nago-reveal-mask"),
    ).toBeTruthy();
    expect(
      screen.getByRole("heading", { name: dictEn.landing.nago.galeria.sectionTitle })
        .closest(".nago-reveal-mask"),
    ).toBeTruthy();
  });
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/__tests__/organisms/LandingNagoSections.test.tsx`

Expected: FAIL — `masks.length` is 0 or headings are not inside `.nago-reveal-mask`.

- [ ] **Step 3: Add `variant="mask"` on each listed heading `NagoReveal`**

Only the reveal that owns the section `h2`. Do not convert program cards, event cards, or pillar tiles.

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/__tests__/organisms/LandingNagoSections.test.tsx`

Expected: PASS.

- [ ] **Step 5: Commit only if the user asked**

```bash
git add src/components/organisms/LandingNagoPrograms.tsx src/components/organisms/LandingNagoExperience.tsx src/components/organisms/LandingNagoMestre.tsx src/components/organisms/LandingNagoHorarios.tsx src/components/organisms/LandingNagoAccion.tsx src/components/organisms/LandingNagoEvents.tsx src/components/organisms/NagoLandingGallery.tsx src/components/organisms/LandingNagoTestimonials.tsx src/components/organisms/LandingNagoConvert.tsx src/__tests__/organisms/LandingNagoSections.test.tsx
git commit -m "feat(nago): mask section titles on scroll"
```

---

### Task 5: Gallery media stagger

**Files:**
- Modify: `src/components/organisms/NagoLandingGallery.tsx`
- Create: `src/__tests__/organisms/NagoLandingGallery.test.tsx`

**Interfaces:**
- Consumes: `NagoReveal` `variant="media"` and `delay?: 1 | 2 | 3`
- Produces: 10 tiles (`NAGO_TEMPLATE_GALLERY_URLS`). Index `i < 6` gets `delay={((i % 3) + 1) as 1 | 2 | 3}`. Index `i >= 6` has no `delay`.

- [ ] **Step 1: Write the failing gallery test**

```tsx
import { describe, expect, it, vi } from "vitest";
import { render } from "@testing-library/react";
import { NagoLandingGallery } from "@/components/organisms/NagoLandingGallery";
import { dictEn } from "@/test/dictEn";
import { NAGO_TEMPLATE_GALLERY_URLS } from "@/lib/landing/nagoTemplateImages";

vi.mock("next/image", () => ({
  default: (props: { src: string; alt: string }) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={props.src} alt={props.alt} />
  ),
}));

describe("NagoLandingGallery", () => {
  it("wipes tiles and staggers only the first six", () => {
    const { container } = render(<NagoLandingGallery dict={dictEn} />);
    const tiles = container.querySelectorAll(".nago-masonry-item .nago-reveal-media");
    expect(tiles.length).toBe(NAGO_TEMPLATE_GALLERY_URLS.length);
    expect(NAGO_TEMPLATE_GALLERY_URLS.length).toBeGreaterThan(6);
    const delays = [...tiles].map((el) => {
      if (el.classList.contains("d1")) return 1;
      if (el.classList.contains("d2")) return 2;
      if (el.classList.contains("d3")) return 3;
      return 0;
    });
    expect(delays.slice(0, 6)).toEqual([1, 2, 3, 1, 2, 3]);
    expect(delays.slice(6).every((d) => d === 0)).toBe(true);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/__tests__/organisms/NagoLandingGallery.test.tsx`

Expected: FAIL — `tiles.length` is 0 (items are plain `div`s).

- [ ] **Step 3: Wrap each masonry item**

Replace the `images.map` item wrapper with:

```tsx
          <NagoReveal
            key={src}
            variant="media"
            className="nago-masonry-item"
            delay={i < 6 ? (((i % 3) + 1) as 1 | 2 | 3) : undefined}
          >
            <button
              type="button"
              className="relative block w-full overflow-hidden border-0 bg-transparent p-0"
              onClick={() => openAt(i)}
              aria-label={t("previewOpenAria").replace("{n}", String(i + 1))}
            >
              <Image
                src={src}
                alt=""
                width={i % 2 === 0 ? 720 : 560}
                height={i % 2 === 0 ? 960 : 420}
                className="h-auto w-full object-cover"
                sizes="(max-width:640px) 100vw, 33vw"
              />
            </button>
          </NagoReveal>
```

Remove the extra inner `div.nago-masonry-item` so columns still break correctly (`NagoReveal` root gets `nago-masonry-item`).

- [ ] **Step 4: Run the gallery test**

Run: `npx vitest run src/__tests__/organisms/NagoLandingGallery.test.tsx`

Expected: PASS.

- [ ] **Step 5: Commit only if the user asked**

```bash
git add src/components/organisms/NagoLandingGallery.tsx src/__tests__/organisms/NagoLandingGallery.test.tsx
git commit -m "feat(nago): wipe and stagger gallery tiles"
```

---

### Task 6: Mestre sticky pin

**Files:**
- Modify: `src/components/organisms/LandingNagoMestre.tsx`
- Modify: `src/styles/nagoLanding.css`
- Modify: `src/__tests__/organisms/LandingNagoSections.test.tsx`

**Interfaces:**
- Consumes: `--nago-header-h`, `--nago-z-content`
- Produces: photo `NagoReveal` has class `nago-mestre-pin`. Sticky only from `lg` (`1024px`). Reduced-motion forces `position: static`.

- [ ] **Step 1: Write the failing pin assertion**

Append to `LandingNagoSections.test.tsx`:

```tsx
  it("pins the mestre photo below the header", () => {
    const { container } = render(
      <LandingNagoSections dict={dictEn} brand={mockBrandPublic} locale="es" />,
    );
    expect(container.querySelector(".nago-mestre-pin")).toBeTruthy();
  });
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/__tests__/organisms/LandingNagoSections.test.tsx`

Expected: FAIL — `.nago-mestre-pin` missing.

- [ ] **Step 3: Add the class and CSS**

On the photo `NagoReveal` in `LandingNagoMestre.tsx`:

```tsx
        <NagoReveal variant="media" drift={-24} className="nago-mestre-pin">
```

CSS:

```css
@media (min-width: 1024px) {
  .nago-mestre-pin {
    position: sticky;
    top: var(--nago-header-h);
    z-index: var(--nago-z-content);
    align-self: start;
  }
}

@media (prefers-reduced-motion: reduce) {
  .nago-mestre-pin {
    position: static;
  }
}
```

Put the reduced-motion `position: static` rule inside the existing `@media (prefers-reduced-motion: reduce)` block, not a second copy of the whole block.

Add a CSS contract line:

```ts
  it("pins mestre under the header token", () => {
    expect(css).toMatch(
      /\.nago-mestre-pin\s*\{[^}]*top:\s*var\(--nago-header-h\)/,
    );
    expect(css).toMatch(
      /\.nago-mestre-pin\s*\{[^}]*z-index:\s*var\(--nago-z-content\)/,
    );
  });
```

The `min-width` media query wraps the rule, so the regex may need `[\s\S]*\.nago-mestre-pin[\s\S]*top:\s*var\(--nago-header-h\)`. Use that looser match if the first fails.

- [ ] **Step 4: Run tests**

Run:

```bash
npx vitest run src/__tests__/organisms/LandingNagoSections.test.tsx src/__tests__/styles/nagoLandingCss.test.ts src/__tests__/organisms/NagoSiteHeader.test.tsx src/__tests__/organisms/LandingMainSectionsNago.test.tsx
```

Expected: PASS. Header stacking still green.

- [ ] **Step 5: Commit only if the user asked**

```bash
git add src/components/organisms/LandingNagoMestre.tsx src/styles/nagoLanding.css src/__tests__/organisms/LandingNagoSections.test.tsx src/__tests__/styles/nagoLandingCss.test.ts
git commit -m "feat(nago): pin the mestre photo on desktop"
```

---

### Task 7: Footer, lead form, CTA press

**Files:**
- Modify: `src/components/organisms/LandingNagoFooter.tsx`
- Modify: `src/components/organisms/LandingNagoSections.tsx` (lead form wrapper)
- Modify: `src/styles/nagoLanding.css` (`.nago-btn` hover/active)
- Modify: `src/__tests__/organisms/LandingNagoSections.test.tsx`
- Modify: `src/__tests__/styles/nagoLandingCss.test.ts`

**Interfaces:**
- Consumes: `NagoReveal` `block` (default)
- Produces: three footer column reveals; lead form wrapped in `NagoReveal`; `.nago-btn` lift `-2px` and press `scale(0.97)` behind `(hover: hover) and (pointer: fine)`

- [ ] **Step 1: Write the failing coverage + CSS tests**

In `LandingNagoSections.test.tsx`:

```tsx
  it("reveals footer columns and the lead form", () => {
    const { container } = render(
      <LandingNagoSections dict={dictEn} brand={mockBrandPublic} locale="es" />,
    );
    const footerReveals = container.querySelectorAll("footer .nago-reveal");
    expect(footerReveals.length).toBeGreaterThanOrEqual(3);
    expect(container.querySelector(".nago-lead")?.closest(".nago-reveal")).toBeTruthy();
  });
```

In `nagoLandingCss.test.ts`:

```ts
  it("lifts and presses nago buttons on fine pointers", () => {
    expect(css).toMatch(
      /@media \(hover:\s*hover\) and \(pointer:\s*fine\)[\s\S]*\.nago-btn:hover[\s\S]*translate3d\(0,\s*-2px,\s*0\)/,
    );
    expect(css).toMatch(/\.nago-btn:active[\s\S]*scale\(0\.97\)/);
  });
```

- [ ] **Step 2: Run tests to verify they fail**

Run:

```bash
npx vitest run src/__tests__/organisms/LandingNagoSections.test.tsx src/__tests__/styles/nagoLandingCss.test.ts
```

Expected: FAIL — no footer `.nago-reveal`, no lead wrap, no `-2px` hover.

- [ ] **Step 3: Implement wrappers and button motion**

Footer: import `NagoReveal`. Wrap the three `md` columns (brand, enlaces, síguenos) each in `<NagoReveal>…</NagoReveal>`. Do not wrap every `<li>`.

Lead form: in `LandingNagoSections.tsx`:

```tsx
      <section className="bg-[var(--nago-bg)] px-[max(1.25rem,env(safe-area-inset-left))] py-14 pe-[max(1.25rem,env(safe-area-inset-right))]">
        <NagoReveal>
          <NagoLandingLeadForm dict={dict} locale={locale} />
        </NagoReveal>
      </section>
```

Import `NagoReveal` there if not already imported (it is not — sections file only imports motion/gallery/footer today). Add the import.

Button CSS — replace the unbounded hover/active with:

```css
.nago-btn {
  /* keep existing layout rules */
  transition:
    background-color 0.2s var(--nago-ease-snap),
    color 0.2s var(--nago-ease-snap),
    border-color 0.2s var(--nago-ease-snap),
    transform 0.2s var(--nago-ease-snap);
}

@media (hover: hover) and (pointer: fine) {
  .nago-btn:hover {
    background: var(--nago-gold);
    color: #111;
    transform: translate3d(0, -2px, 0);
  }
}

.nago-btn:active {
  transform: scale(0.97);
  transition-duration: 0.16s;
}
```

If `.nago-btn-solid:hover` or `.nago-btn-dark:hover` already set colors, keep those color rules and only add the transform on the shared `.nago-btn:hover` inside the hover media query. Do not use `transition: all`.

Existing reduced-motion already zeroes `.nago-btn` animation/transition. Keep that.

- [ ] **Step 4: Run tests**

Run:

```bash
npx vitest run src/__tests__/organisms/LandingNagoSections.test.tsx src/__tests__/styles/nagoLandingCss.test.ts src/__tests__/organisms/LandingMainSectionsNago.test.tsx src/__tests__/organisms/NagoSiteHeader.test.tsx
```

Expected: PASS.

- [ ] **Step 5: Commit only if the user asked**

```bash
git add src/components/organisms/LandingNagoFooter.tsx src/components/organisms/LandingNagoSections.tsx src/styles/nagoLanding.css src/__tests__/organisms/LandingNagoSections.test.tsx src/__tests__/styles/nagoLandingCss.test.ts
git commit -m "feat(nago): reveal footer and form, press CTAs"
```

---

### Task 8: Verify the motion gate

**Files:**
- None new. Read-only verification.

**Interfaces:**
- Consumes: all prior tasks
- Produces: evidence that the spec success criteria hold

- [ ] **Step 1: Run the full Nago motion + header suite**

```bash
npx vitest run \
  src/__tests__/styles/nagoLandingCss.test.ts \
  src/__tests__/lib/landing/nagoSplitWords.test.ts \
  src/__tests__/organisms/NagoSplitWords.test.tsx \
  src/__tests__/organisms/NagoReveal.test.tsx \
  src/__tests__/organisms/NagoLandingGallery.test.tsx \
  src/__tests__/organisms/LandingNagoSections.test.tsx \
  src/__tests__/organisms/LandingMainSectionsNago.test.tsx \
  src/__tests__/organisms/NagoSiteHeader.test.tsx \
  src/__tests__/organisms/PublicBlogScreenNago.test.tsx
```

Expected: all PASS. No new `motion` / `gsap` in `package.json`.

- [ ] **Step 2: Browser check on `http://localhost:3000/es` (nago env)**

Scroll at a reading pace:

1. Hero title reveals word by word. Header stays above the Ken Burns photo.
2. Section titles mask in. Gallery tiles wipe; first six stagger, the rest do not trickle one-by-one.
3. Desktop (`lg+`): Mestre photo sticks under the header while stats scroll. It never paints over the nav.
4. Footer columns and the lead form fade up.
5. OS reduced-motion: no split, no pin, no wipes — content is visible immediately.

- [ ] **Step 3: Commit only if the user asked**

No extra files unless Step 2 forced a one-line CSS fix. If so, add a focused test first (TDD), then commit that fix only if asked.

---

## Self-review

**Spec coverage**

| Spec requirement | Task |
|------------------|------|
| Three-curve palette / `--nago-ease` alias | 1 |
| Hero word split, aria-label, cap 6, reduced-motion unsplit | 2 |
| Exclude H1 from lockup double-fade | 2 |
| `NagoReveal` mask; ignore from/drift | 3 |
| Section headings mask | 4 |
| Gallery media + delay 1,2,3,1,2,3 then none | 5 |
| Mestre sticky `lg+`, under header z | 6 |
| Footer columns + lead form reveals | 7 |
| CTA lift/press, no `transition: all` | 7 |
| Header stacking unchanged | 6, 8 |
| Reduced-motion single gate | 1–7 CSS |
| No Motion/GSAP | Global + 8 |
| Tests are contracts, not `z-[80]` | all test steps |

**Placeholders:** none. Gallery length is `NAGO_TEMPLATE_GALLERY_URLS` (10). Delay formula is `(i % 3) + 1`.

**Types:** `NagoTitlePart`, `NagoSplitWord`, `planNagoSplitWords`, `NagoSplitWords`, `variant="mask"` are named the same in every task.

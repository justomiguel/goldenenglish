# Parent Portal Shell (Phase 1) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the family portal chrome with a portal-agnostic shell driven by a config object, moving language and sign out into an account sheet, without changing a single route.

**Architecture:** A pure builder produces a `PortalShellConfig` server-side in `parent/layout.tsx`. A client `PortalShell` reads `useAppSurface()` and renders either `PortalTabBar` (narrow) or `PortalTopNav` (desktop) from the same `destinations` array, so the two surfaces cannot drift. Destinations still point at today's routes; the reduction from five to four happens in phase 2, once `/parent/child` exists.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript strict, Tailwind CSS 4, `lucide-react`, Vitest + Testing Library.

**Spec:** [`docs/superpowers/specs/2026-08-07-parent-portal-layout-redesign-design.md`](../specs/2026-08-07-parent-portal-layout-redesign-design.md)

## Global Constraints

- No route changes and no redirects in this phase. `/parent/settings` keeps existing and keeps rendering; it merely stops being linked from the chrome.
- No migrations.
- The student portal keeps mounting `ParentDashboardShell` untouched. Nothing in `src/app/[locale]/dashboard/student/**` is modified. `ParentDashboardShell`, `ParentDashboardShellClient`, `ParentPwaShell`, `ParentPwaTabBar`, `ParentSidebar` and `ParentBreadcrumb` therefore stay in the tree and keep their tests passing; they are deleted in phases 2 and 5.
- Copy lands in `es`, `en` and `pt` in the same task that introduces it. Default locale is `es`.
- `includePayments` gating is preserved exactly: when false, the payments destination is absent.
- Focus stays in the URL. Every destination href preserves `studentId` and `sectionId` through `withParentFocusHref`.
- Tests are self-contained per `.cursor/rules/30-harness-self-contained-tests.mdc`: mocks and fixtures live in the file, and each file runs alone.
- The account sheet is a custom component. No `window.confirm`, `alert` or `prompt` (`.cursor/rules/18-no-native-browser-dialogs.mdc`), and it follows `.cursor/rules/19-modal-ux.mdc` for focus and dismissal.
- Tour anchors are updated in the same task that moves their surface (`.cursor/rules/36-parent-tutorials-contract.mdc`).

## Deviations from the spec, and why

- **`PortalDestination.badgeCount` is not implemented.** Nothing produces an unread count until the Today feed exists in phase 3. Adding the field now would ship a prop no caller sets.
- **The shell renders both chip groups — children and sections.** The spec places section chips inside the child screen, which does not exist until phase 4. Rendering only child chips now would leave multi-section families with no way to switch sections between phase 1 and phase 4. Phase 4 moves the section group into the child screen.
- **The account sheet omits "notifications" and "install the app"** in this phase. Both become Today-feed items in phase 3; there is nothing to link to yet.

---

### Task 1: Shell config types and the parent config builder

**Files:**
- Create: `src/lib/portal/portalShellTypes.ts`
- Create: `src/lib/portal/buildParentShellConfig.ts`
- Test: `src/__tests__/lib/portal/buildParentShellConfig.test.ts`

**Interfaces:**
- Consumes: `Dictionary` from `@/types/i18n`, `ParentFocusCatalog` and `ResolvedParentFocus` from `@/lib/parent/parentFocusTypes`.
- Produces: `PortalIconName`, `PortalDestination`, `PortalAccountItem`, `PortalSubjectGroup`, `PortalShellConfig`, and `buildParentShellConfig(input: BuildParentShellConfigInput): PortalShellConfig`.

- [ ] **Step 1: Write the failing test**

Create `src/__tests__/lib/portal/buildParentShellConfig.test.ts`:

```tsx
import { describe, it, expect } from "vitest";
import { buildParentShellConfig } from "@/lib/portal/buildParentShellConfig";
import { dictEn } from "@/test/dictEn";

const BASE = "/en/dashboard/parent";

// ParentFocusCatalog keeps sections in a separate map, not nested under each
// student, and the section display field is `classLabel`.
function catalog(students: { id: string; label: string; sections: { id: string; label: string }[] }[]) {
  return {
    students: students.map((student) => ({
      studentId: student.id,
      displayName: student.label,
    })),
    sectionsByStudentId: Object.fromEntries(
      students.map((student) => [
        student.id,
        student.sections.map((section) => ({
          sectionId: section.id,
          classLabel: section.label,
        })),
      ]),
    ),
  };
}

function build(overrides?: Partial<Parameters<typeof buildParentShellConfig>[0]>) {
  return buildParentShellConfig({
    locale: "en",
    baseHref: BASE,
    dict: dictEn,
    includePayments: true,
    focusCatalog: catalog([{ id: "s1", label: "Mateo", sections: [{ id: "sec1", label: "B1" }] }]),
    activeStudentId: "s1",
    activeSectionId: "sec1",
    ...overrides,
  });
}

describe("buildParentShellConfig", () => {
  it("produces five destinations in reading order when payments are enabled", () => {
    const config = build();
    expect(config.destinations.map((d) => d.id)).toEqual([
      "home",
      "calendar",
      "progress",
      "payments",
      "messages",
    ]);
  });

  it("omits payments when the viewer has no financial access", () => {
    const config = build({ includePayments: false });
    expect(config.destinations.map((d) => d.id)).toEqual([
      "home",
      "calendar",
      "progress",
      "messages",
    ]);
  });

  it("points destinations at today's routes under the given base", () => {
    const hrefs = Object.fromEntries(build().destinations.map((d) => [d.id, d.href]));
    expect(hrefs).toEqual({
      home: BASE,
      calendar: `${BASE}/calendar`,
      progress: `${BASE}/progress`,
      payments: `${BASE}/payments`,
      messages: `${BASE}/messages`,
    });
  });

  it("keeps legacy prefixes mapping onto their destination", () => {
    const progress = build().destinations.find((d) => d.id === "progress");
    expect(progress?.matchPrefixes).toEqual([
      `${BASE}/tasks`,
      `${BASE}/assessments`,
      `${BASE}/feedback`,
      `${BASE}/badges`,
    ]);
    const payments = build().destinations.find((d) => d.id === "payments");
    expect(payments?.matchPrefixes).toEqual([`${BASE}/billing`]);
  });

  it("offers profile, child details, language and sign out in the account menu", () => {
    expect(build().accountItems.map((item) => item.id)).toEqual([
      "profile",
      "childDetails",
      "language",
      "signOut",
    ]);
  });

  it("drops child details when no student is linked", () => {
    const config = build({ focusCatalog: catalog([]), activeStudentId: null });
    expect(config.accountItems.map((item) => item.id)).toEqual([
      "profile",
      "language",
      "signOut",
    ]);
  });

  it("emits no subject groups for one child in one section", () => {
    expect(build().subjectGroups).toEqual([]);
  });

  it("emits a child group only when the tutor has more than one ward", () => {
    const config = build({
      focusCatalog: catalog([
        { id: "s1", label: "Mateo", sections: [{ id: "sec1", label: "B1" }] },
        { id: "s2", label: "Ana", sections: [{ id: "sec9", label: "A2" }] },
      ]),
    });
    expect(config.subjectGroups).toHaveLength(1);
    expect(config.subjectGroups[0].param).toBe("studentId");
    expect(config.subjectGroups[0].options.map((o) => o.id)).toEqual(["s1", "s2"]);
    expect(config.subjectGroups[0].activeId).toBe("s1");
  });

  it("emits a section group only when the active child has more than one section", () => {
    const config = build({
      focusCatalog: catalog([
        {
          id: "s1",
          label: "Mateo",
          sections: [
            { id: "sec1", label: "B1" },
            { id: "sec2", label: "Conversation" },
          ],
        },
      ]),
    });
    expect(config.subjectGroups.map((g) => g.param)).toEqual(["sectionId"]);
    expect(config.subjectGroups[0].options.map((o) => o.label)).toEqual(["B1", "Conversation"]);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/__tests__/lib/portal/buildParentShellConfig.test.ts`
Expected: FAIL — `Failed to resolve import "@/lib/portal/buildParentShellConfig"`.

- [ ] **Step 3: Write the types**

Create `src/lib/portal/portalShellTypes.ts`:

```ts
export type PortalIconName = "home" | "calendar" | "progress" | "payments" | "messages";

export interface PortalDestination {
  id: string;
  href: string;
  label: string;
  icon: PortalIconName;
  /** Extra path prefixes that should light up this destination. */
  matchPrefixes?: string[];
}

export type PortalAccountAction = "signOut" | "language";

export interface PortalAccountItem {
  id: string;
  label: string;
  meta?: string;
  href?: string;
  action?: PortalAccountAction;
}

export interface PortalSubjectOption {
  id: string;
  label: string;
}

export interface PortalSubjectGroup {
  /** URL search param this group writes to. */
  param: "studentId" | "sectionId";
  label: string;
  options: PortalSubjectOption[];
  activeId: string;
}

export interface PortalShellConfig {
  baseHref: string;
  brandBadge: string;
  ariaHeader: string;
  ariaTabBar: string;
  ariaTopNav: string;
  accountOpenLabel: string;
  accountHeading: string;
  accountCloseLabel: string;
  destinations: PortalDestination[];
  accountItems: PortalAccountItem[];
  /** Rendered only for groups with more than one option; empty is the common case. */
  subjectGroups: PortalSubjectGroup[];
}
```

- [ ] **Step 4: Write the builder**

Create `src/lib/portal/buildParentShellConfig.ts`:

```ts
import type { Dictionary } from "@/types/i18n";
import type { ParentFocusCatalog } from "@/lib/parent/parentFocusTypes";
import type {
  PortalAccountItem,
  PortalDestination,
  PortalShellConfig,
  PortalSubjectGroup,
} from "@/lib/portal/portalShellTypes";

export interface BuildParentShellConfigInput {
  locale: string;
  baseHref: string;
  dict: Dictionary;
  includePayments: boolean;
  focusCatalog: ParentFocusCatalog;
  activeStudentId: string | null;
  activeSectionId: string | null;
}

export function buildParentShellConfig(
  input: BuildParentShellConfigInput,
): PortalShellConfig {
  const { locale, baseHref, dict, includePayments, focusCatalog } = input;
  const nav = dict.dashboard.parentNav;
  const chrome = dict.dashboard.parentChrome;
  const portal = dict.dashboard.portal;

  const destinations: PortalDestination[] = [
    { id: "home", href: baseHref, label: nav.home, icon: "home" },
    { id: "calendar", href: `${baseHref}/calendar`, label: nav.calendar, icon: "calendar" },
    {
      id: "progress",
      href: `${baseHref}/progress`,
      label: nav.progress,
      icon: "progress",
      matchPrefixes: [
        `${baseHref}/tasks`,
        `${baseHref}/assessments`,
        `${baseHref}/feedback`,
        `${baseHref}/badges`,
      ],
    },
  ];

  if (includePayments) {
    destinations.push({
      id: "payments",
      href: `${baseHref}/payments`,
      label: nav.payments,
      icon: "payments",
      matchPrefixes: [`${baseHref}/billing`],
    });
  }

  destinations.push({
    id: "messages",
    href: `${baseHref}/messages`,
    label: nav.messages,
    icon: "messages",
  });

  const students = focusCatalog.students;
  const activeStudent =
    students.find((student) => student.studentId === input.activeStudentId) ?? students[0] ?? null;
  const sections = activeStudent
    ? focusCatalog.sectionsByStudentId[activeStudent.studentId] ?? []
    : [];
  const activeSection =
    sections.find((section) => section.sectionId === input.activeSectionId) ?? sections[0] ?? null;

  const accountItems: PortalAccountItem[] = [
    { id: "profile", label: nav.myProfile, href: `/${locale}/dashboard/profile` },
  ];

  if (activeStudent) {
    accountItems.push({
      id: "childDetails",
      label: portal.accountChildDetails,
      meta: activeStudent.displayName,
      href: `${baseHref}/children/${activeStudent.studentId}`,
    });
  }

  accountItems.push(
    { id: "language", label: portal.accountLanguage, action: "language" },
    { id: "signOut", label: dict.nav.logout, action: "signOut" },
  );

  const subjectGroups: PortalSubjectGroup[] = [];

  if (students.length > 1) {
    subjectGroups.push({
      param: "studentId",
      label: portal.subjectChildLabel,
      options: students.map((student) => ({
        id: student.studentId,
        label: student.displayName,
      })),
      activeId: activeStudent?.studentId ?? students[0].studentId,
    });
  }

  if (sections.length > 1 && activeSection) {
    subjectGroups.push({
      param: "sectionId",
      label: portal.subjectSectionLabel,
      options: sections.map((section) => ({
        id: section.sectionId,
        label: section.classLabel,
      })),
      activeId: activeSection.sectionId,
    });
  }

  return {
    baseHref,
    brandBadge: chrome.badge,
    ariaHeader: chrome.ariaHeader,
    ariaTabBar: portal.tabBarAria,
    ariaTopNav: portal.topNavAria,
    accountOpenLabel: portal.accountOpen,
    accountHeading: portal.accountHeading,
    accountCloseLabel: portal.accountClose,
    destinations,
    accountItems,
    subjectGroups,
  };
}
```

- [ ] **Step 5: Add the dictionary group in all three locales**

The builder reads `dict.dashboard.portal`, which does not exist yet. Add this block inside `dashboard` in `src/dictionaries/en.json`, immediately before `"parentChrome"`:

```json
"portal": {
  "tabBarAria": "App navigation",
  "topNavAria": "Main navigation",
  "accountOpen": "Open account menu",
  "accountHeading": "Account",
  "accountClose": "Close",
  "accountLanguage": "Language",
  "accountChildDetails": "Student details",
  "subjectChildLabel": "Student",
  "subjectSectionLabel": "Class"
},
```

`src/dictionaries/es.json`, same position:

```json
"portal": {
  "tabBarAria": "Navegación de la app",
  "topNavAria": "Navegación principal",
  "accountOpen": "Abrir menú de cuenta",
  "accountHeading": "Cuenta",
  "accountClose": "Cerrar",
  "accountLanguage": "Idioma",
  "accountChildDetails": "Datos del alumno",
  "subjectChildLabel": "Alumno",
  "subjectSectionLabel": "Clase"
},
```

`src/dictionaries/pt.json`, same position:

```json
"portal": {
  "tabBarAria": "Navegação do app",
  "topNavAria": "Navegação principal",
  "accountOpen": "Abrir menu da conta",
  "accountHeading": "Conta",
  "accountClose": "Fechar",
  "accountLanguage": "Idioma",
  "accountChildDetails": "Dados do aluno",
  "subjectChildLabel": "Aluno",
  "subjectSectionLabel": "Turma"
},
```

`Dictionary` is `typeof en`, so adding the keys to `en.json` types them everywhere. The existing locale parity test in `src/__tests__/i18n/dictionaries.test.ts` covers the other two.

- [ ] **Step 6: Run tests to verify they pass**

Run: `npx vitest run src/__tests__/lib/portal/buildParentShellConfig.test.ts src/__tests__/i18n/dictionaries.test.ts`
Expected: PASS, 9 tests in the first file, existing count in the second.

- [ ] **Step 7: Commit**

```bash
git add src/lib/portal/portalShellTypes.ts src/lib/portal/buildParentShellConfig.ts \
  src/__tests__/lib/portal/buildParentShellConfig.test.ts \
  src/dictionaries/en.json src/dictionaries/es.json src/dictionaries/pt.json
git commit -m "feat(portal): shell config types and parent config builder"
```

---

### Task 2: Active destination resolution

**Files:**
- Create: `src/lib/portal/resolveActiveDestination.ts`
- Test: `src/__tests__/lib/portal/resolveActiveDestination.test.ts`

**Interfaces:**
- Consumes: `PortalDestination` from `src/lib/portal/portalShellTypes.ts` (Task 1).
- Produces: `resolveActiveDestination(pathname: string, destinations: PortalDestination[]): string | null`.

Longest-prefix wins, so the base href does not swallow its children. This replaces the hand-written `resolveParentPwaTab`.

- [ ] **Step 1: Write the failing test**

Create `src/__tests__/lib/portal/resolveActiveDestination.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { resolveActiveDestination } from "@/lib/portal/resolveActiveDestination";
import type { PortalDestination } from "@/lib/portal/portalShellTypes";

const BASE = "/es/dashboard/parent";

const DESTINATIONS: PortalDestination[] = [
  { id: "home", href: BASE, label: "Inicio", icon: "home" },
  { id: "calendar", href: `${BASE}/calendar`, label: "Asistencias", icon: "calendar" },
  {
    id: "progress",
    href: `${BASE}/progress`,
    label: "Progreso",
    icon: "progress",
    matchPrefixes: [`${BASE}/tasks`, `${BASE}/badges`],
  },
  {
    id: "payments",
    href: `${BASE}/payments`,
    label: "Pagos",
    icon: "payments",
    matchPrefixes: [`${BASE}/billing`],
  },
];

describe("resolveActiveDestination", () => {
  it("matches the base path to home", () => {
    expect(resolveActiveDestination(BASE, DESTINATIONS)).toBe("home");
  });

  it("ignores a trailing slash on the base path", () => {
    expect(resolveActiveDestination(`${BASE}/`, DESTINATIONS)).toBe("home");
  });

  it("prefers the longest matching destination over the base", () => {
    expect(resolveActiveDestination(`${BASE}/calendar`, DESTINATIONS)).toBe("calendar");
  });

  it("matches nested paths under a destination", () => {
    expect(resolveActiveDestination(`${BASE}/payments/mp-return`, DESTINATIONS)).toBe("payments");
  });

  it("matches a declared legacy prefix", () => {
    expect(resolveActiveDestination(`${BASE}/tasks/abc-123`, DESTINATIONS)).toBe("progress");
    expect(resolveActiveDestination(`${BASE}/billing`, DESTINATIONS)).toBe("payments");
  });

  it("does not match a sibling that merely shares a string prefix", () => {
    expect(resolveActiveDestination(`${BASE}/calendarium`, DESTINATIONS)).toBe("home");
  });

  it("returns null when the path is outside the portal", () => {
    expect(resolveActiveDestination("/es/dashboard/admin", DESTINATIONS)).toBeNull();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/__tests__/lib/portal/resolveActiveDestination.test.ts`
Expected: FAIL — `Failed to resolve import "@/lib/portal/resolveActiveDestination"`.

- [ ] **Step 3: Write the implementation**

Create `src/lib/portal/resolveActiveDestination.ts`:

```ts
import type { PortalDestination } from "@/lib/portal/portalShellTypes";

function stripTrailingSlash(value: string): string {
  return value.length > 1 ? value.replace(/\/+$/, "") : value;
}

function matches(path: string, candidate: string): boolean {
  const prefix = stripTrailingSlash(candidate);
  return path === prefix || path.startsWith(`${prefix}/`);
}

export function resolveActiveDestination(
  pathname: string,
  destinations: PortalDestination[],
): string | null {
  const path = stripTrailingSlash(pathname);
  let bestId: string | null = null;
  let bestLength = -1;

  for (const destination of destinations) {
    const candidates = [destination.href, ...(destination.matchPrefixes ?? [])];
    for (const candidate of candidates) {
      if (!matches(path, candidate)) continue;
      const length = stripTrailingSlash(candidate).length;
      if (length > bestLength) {
        bestLength = length;
        bestId = destination.id;
      }
    }
  }

  return bestId;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/__tests__/lib/portal/resolveActiveDestination.test.ts`
Expected: PASS, 7 tests.

- [ ] **Step 5: Commit**

```bash
git add src/lib/portal/resolveActiveDestination.ts \
  src/__tests__/lib/portal/resolveActiveDestination.test.ts
git commit -m "feat(portal): resolve active destination by longest path prefix"
```

---

### Task 3: Portal icon map and bottom tab bar

**Files:**
- Create: `src/components/portal/PortalIcon.tsx`
- Create: `src/components/portal/PortalTabBar.tsx`
- Test: `src/__tests__/components/portal/PortalTabBar.test.tsx`

**Interfaces:**
- Consumes: `PortalDestination` (Task 1), `resolveActiveDestination` (Task 2), `withParentFocusHref` from `@/lib/parent/withParentFocusHref`.
- Produces: `PortalIcon({ name, className })` and `PortalTabBar({ destinations, ariaLabel, tourAnchor })`.

- [ ] **Step 1: Write the failing test**

Create `src/__tests__/components/portal/PortalTabBar.test.tsx`:

```tsx
import { describe, it, expect, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { mockPathname, mockSearchParams } from "@/test/navigationMock";
import { PortalTabBar } from "@/components/portal/PortalTabBar";
import type { PortalDestination } from "@/lib/portal/portalShellTypes";

const BASE = "/es/dashboard/parent";

const DESTINATIONS: PortalDestination[] = [
  { id: "home", href: BASE, label: "Inicio", icon: "home" },
  { id: "calendar", href: `${BASE}/calendar`, label: "Asistencias", icon: "calendar" },
  { id: "progress", href: `${BASE}/progress`, label: "Progreso", icon: "progress" },
  { id: "messages", href: `${BASE}/messages`, label: "Mensajes", icon: "messages" },
];

describe("PortalTabBar", () => {
  beforeEach(() => {
    mockPathname.mockReturnValue(BASE);
    mockSearchParams.mockReturnValue(new URLSearchParams());
  });

  it("names the navigation landmark", () => {
    render(<PortalTabBar destinations={DESTINATIONS} ariaLabel="Navegación de la app" />);
    expect(screen.getByRole("navigation", { name: "Navegación de la app" })).toBeInTheDocument();
  });

  it("renders one link per destination with its label", () => {
    render(<PortalTabBar destinations={DESTINATIONS} ariaLabel="Navegación de la app" />);
    expect(screen.getAllByRole("link")).toHaveLength(4);
    for (const destination of DESTINATIONS) {
      expect(screen.getByRole("link", { name: destination.label })).toBeInTheDocument();
    }
  });

  it("marks only the active destination with aria-current", () => {
    mockPathname.mockReturnValue(`${BASE}/calendar`);
    render(<PortalTabBar destinations={DESTINATIONS} ariaLabel="Navegación de la app" />);
    const current = screen.getAllByRole("link").filter((link) => link.getAttribute("aria-current"));
    expect(current).toHaveLength(1);
    expect(current[0]).toHaveAccessibleName("Asistencias");
  });

  it("carries studentId and sectionId onto every href", () => {
    mockSearchParams.mockReturnValue(new URLSearchParams("studentId=s2&sectionId=sec7"));
    render(<PortalTabBar destinations={DESTINATIONS} ariaLabel="Navegación de la app" />);
    for (const link of screen.getAllByRole("link")) {
      const href = link.getAttribute("href") ?? "";
      expect(href).toContain("studentId=s2");
      expect(href).toContain("sectionId=sec7");
    }
  });

  it("adds no query string when there is no focus in the URL", () => {
    render(<PortalTabBar destinations={DESTINATIONS} ariaLabel="Navegación de la app" />);
    for (const link of screen.getAllByRole("link")) {
      expect(link.getAttribute("href") ?? "").not.toContain("?");
    }
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/__tests__/components/portal/PortalTabBar.test.tsx`
Expected: FAIL — `Failed to resolve import "@/components/portal/PortalTabBar"`.

- [ ] **Step 3: Write the icon map**

Create `src/components/portal/PortalIcon.tsx`:

```tsx
import { CalendarCheck, Home, MessageCircle, TrendingUp, Wallet } from "lucide-react";
import type { PortalIconName } from "@/lib/portal/portalShellTypes";

const ICONS: Record<PortalIconName, typeof Home> = {
  home: Home,
  calendar: CalendarCheck,
  progress: TrendingUp,
  payments: Wallet,
  messages: MessageCircle,
};

export function PortalIcon({ name, className }: { name: PortalIconName; className?: string }) {
  const Glyph = ICONS[name];
  return <Glyph className={className} aria-hidden />;
}
```

- [ ] **Step 4: Write the tab bar**

Create `src/components/portal/PortalTabBar.tsx`:

```tsx
"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import type { PortalDestination } from "@/lib/portal/portalShellTypes";
import { resolveActiveDestination } from "@/lib/portal/resolveActiveDestination";
import { withParentFocusHref } from "@/lib/parent/withParentFocusHref";
import { PortalIcon } from "@/components/portal/PortalIcon";

export interface PortalTabBarProps {
  destinations: PortalDestination[];
  ariaLabel: string;
  tourAnchor?: string;
}

export function PortalTabBar({ destinations, ariaLabel, tourAnchor }: PortalTabBarProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const studentId = searchParams.get("studentId");
  const sectionId = searchParams.get("sectionId");
  const activeId = resolveActiveDestination(pathname, destinations);

  return (
    <nav
      aria-label={ariaLabel}
      {...(tourAnchor ? { "data-tour": tourAnchor } : {})}
      className="fixed inset-x-0 bottom-0 z-50 border-t border-[var(--color-border)] bg-[var(--color-surface)]/95 backdrop-blur-md"
      style={{ paddingBottom: "max(0.5rem, env(safe-area-inset-bottom, 0px))" }}
    >
      <ul className="mx-auto flex max-w-[var(--layout-max-width)] items-stretch justify-around px-1 pt-1">
        {destinations.map((destination) => {
          const isActive = destination.id === activeId;
          return (
            <li key={destination.id} className="min-w-0 flex-1">
              <Link
                href={withParentFocusHref(destination.href, { studentId, sectionId })}
                aria-current={isActive ? "page" : undefined}
                className={`flex min-h-[52px] flex-col items-center justify-center gap-0.5 rounded-[var(--layout-border-radius)] px-1 py-1.5 text-[0.625rem] font-semibold leading-tight transition ${
                  isActive
                    ? "text-[var(--color-primary)]"
                    : "text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)]"
                }`}
              >
                <PortalIcon name={destination.icon} className="h-5 w-5 shrink-0" />
                <span className="max-w-full truncate">{destination.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npx vitest run src/__tests__/components/portal/PortalTabBar.test.tsx`
Expected: PASS, 5 tests.

- [ ] **Step 6: Commit**

```bash
git add src/components/portal/PortalIcon.tsx src/components/portal/PortalTabBar.tsx \
  src/__tests__/components/portal/PortalTabBar.test.tsx
git commit -m "feat(portal): portal-agnostic bottom tab bar"
```

---

### Task 4: Account sheet

**Files:**
- Create: `src/components/portal/PortalAccountSheet.tsx`
- Test: `src/__tests__/components/portal/PortalAccountSheet.test.tsx`

**Interfaces:**
- Consumes: `PortalAccountItem` (Task 1), `SignOutButton` from `@/components/molecules/SignOutButton`, `LanguageSwitcher` from `@/components/molecules/LanguageSwitcher`.
- Produces: `PortalAccountSheet({ locale, items, openLabel, heading, closeLabel, localeLabels, signOutLabel, triggerTourAnchor, signOutTourAnchor })`.

The trigger is the avatar button in the header. The panel is a `role="dialog"` with `aria-modal`, closed by the close button or `Escape`.

- [ ] **Step 1: Write the failing test**

Create `src/__tests__/components/portal/PortalAccountSheet.test.tsx`:

```tsx
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { PortalAccountSheet } from "@/components/portal/PortalAccountSheet";
import { dictEn } from "@/test/dictEn";
import type { PortalAccountItem } from "@/lib/portal/portalShellTypes";

const ITEMS: PortalAccountItem[] = [
  { id: "profile", label: "My profile", href: "/en/dashboard/profile" },
  { id: "childDetails", label: "Student details", meta: "Mateo", href: "/en/dashboard/parent/children/s1" },
  { id: "language", label: "Language", action: "language" },
  { id: "signOut", label: "Sign out", action: "signOut" },
];

function renderSheet() {
  return render(
    <PortalAccountSheet
      locale="en"
      items={ITEMS}
      openLabel="Open account menu"
      heading="Account"
      closeLabel="Close"
      localeLabels={dictEn.common.locale}
      signOutLabel="Sign out"
    />,
  );
}

describe("PortalAccountSheet", () => {
  it("starts closed, exposing only the trigger", () => {
    renderSheet();
    expect(screen.getByRole("button", { name: "Open account menu" })).toBeInTheDocument();
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("opens a modal dialog with the heading when the trigger is pressed", async () => {
    const user = userEvent.setup();
    renderSheet();
    await user.click(screen.getByRole("button", { name: "Open account menu" }));
    const dialog = screen.getByRole("dialog", { name: "Account" });
    expect(dialog).toHaveAttribute("aria-modal", "true");
  });

  it("renders link items with their href and meta line", async () => {
    const user = userEvent.setup();
    renderSheet();
    await user.click(screen.getByRole("button", { name: "Open account menu" }));
    expect(screen.getByRole("link", { name: /My profile/ })).toHaveAttribute(
      "href",
      "/en/dashboard/profile",
    );
    expect(screen.getByText("Mateo")).toBeInTheDocument();
  });

  it("renders the language control and a sign-out control inside the sheet", async () => {
    const user = userEvent.setup();
    renderSheet();
    await user.click(screen.getByRole("button", { name: "Open account menu" }));
    const dialog = screen.getByRole("dialog", { name: "Account" });
    expect(dialog).toHaveTextContent("Language");
    expect(screen.getByRole("button", { name: "Sign out" })).toBeInTheDocument();
  });

  it("closes on the close button", async () => {
    const user = userEvent.setup();
    renderSheet();
    await user.click(screen.getByRole("button", { name: "Open account menu" }));
    await user.click(screen.getByRole("button", { name: "Close" }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("closes on Escape", async () => {
    const user = userEvent.setup();
    renderSheet();
    await user.click(screen.getByRole("button", { name: "Open account menu" }));
    await user.keyboard("{Escape}");
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/__tests__/components/portal/PortalAccountSheet.test.tsx`
Expected: FAIL — `Failed to resolve import "@/components/portal/PortalAccountSheet"`.

- [ ] **Step 3: Write the implementation**

Create `src/components/portal/PortalAccountSheet.tsx`:

```tsx
"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { User, X } from "lucide-react";
import type { Dictionary } from "@/types/i18n";
import type { PortalAccountItem } from "@/lib/portal/portalShellTypes";
import { SignOutButton } from "@/components/molecules/SignOutButton";
import { LanguageSwitcher } from "@/components/molecules/LanguageSwitcher";

export interface PortalAccountSheetProps {
  locale: string;
  items: PortalAccountItem[];
  openLabel: string;
  heading: string;
  closeLabel: string;
  localeLabels: Dictionary["common"]["locale"];
  signOutLabel: string;
  triggerTourAnchor?: string;
  signOutTourAnchor?: string;
}

const rowClass =
  "flex w-full items-center justify-between gap-3 rounded-[var(--layout-border-radius)] px-3 py-3 text-left text-sm text-[var(--color-foreground)] transition hover:bg-[var(--color-muted)]";

export function PortalAccountSheet({
  locale,
  items,
  openLabel,
  heading,
  closeLabel,
  localeLabels,
  signOutLabel,
  triggerTourAnchor,
  signOutTourAnchor,
}: PortalAccountSheetProps) {
  const [open, setOpen] = useState(false);
  const close = useCallback(() => setOpen(false), []);

  useEffect(() => {
    if (!open) return;
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") close();
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, close]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={openLabel}
        {...(triggerTourAnchor ? { "data-tour": triggerTourAnchor } : {})}
        className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-full border border-[var(--color-border)] bg-[var(--color-background)] text-[var(--color-primary)] transition hover:bg-[var(--color-muted)]"
      >
        <User className="h-5 w-5" aria-hidden />
      </button>

      {open ? (
        <div className="fixed inset-0 z-[60] flex items-end justify-center md:items-start md:justify-end md:p-4">
          <button
            type="button"
            aria-hidden
            tabIndex={-1}
            onClick={close}
            className="absolute inset-0 bg-[var(--color-foreground)]/40"
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-label={heading}
            className="relative w-full max-w-md rounded-t-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4 md:rounded-[var(--layout-border-radius)]"
            style={{ paddingBottom: "max(1rem, env(safe-area-inset-bottom, 0px))" }}
          >
            <div className="mb-2 flex items-center justify-between">
              <p className="font-display text-sm font-semibold text-[var(--color-foreground)]">
                {heading}
              </p>
              <button
                type="button"
                onClick={close}
                aria-label={closeLabel}
                className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-full text-[var(--color-muted-foreground)] transition hover:bg-[var(--color-muted)]"
              >
                <X className="h-5 w-5" aria-hidden />
              </button>
            </div>

            <ul className="flex flex-col">
              {items.map((item) => (
                <li key={item.id}>
                  {item.href ? (
                    <Link href={item.href} onClick={close} className={rowClass}>
                      <span className="min-w-0">
                        <span className="block truncate">{item.label}</span>
                        {item.meta ? (
                          <span className="block truncate text-xs text-[var(--color-muted-foreground)]">
                            {item.meta}
                          </span>
                        ) : null}
                      </span>
                    </Link>
                  ) : item.action === "language" ? (
                    <div className={rowClass}>
                      <span>{item.label}</span>
                      <LanguageSwitcher locale={locale} labels={localeLabels} />
                    </div>
                  ) : (
                    <div className={rowClass}>
                      <SignOutButton
                        locale={locale}
                        label={signOutLabel}
                        tourAnchor={signOutTourAnchor}
                        className="text-sm font-medium text-[var(--color-foreground)]"
                      />
                    </div>
                  )}
                </li>
              ))}
            </ul>
          </div>
        </div>
      ) : null}
    </>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/__tests__/components/portal/PortalAccountSheet.test.tsx`
Expected: PASS, 6 tests.

`SignOutButton` renders a `<button type="button">` containing `<span>{label}</span>` whenever `iconOnly` is false, so its accessible name is exactly the `label` passed in. The sheet passes `signOutLabel`, which is why `getByRole("button", { name: "Sign out" })` resolves.

- [ ] **Step 5: Commit**

```bash
git add src/components/portal/PortalAccountSheet.tsx \
  src/__tests__/components/portal/PortalAccountSheet.test.tsx
git commit -m "feat(portal): account sheet holding profile, language and sign out"
```

---

### Task 5: Desktop top navigation

**Files:**
- Create: `src/components/portal/PortalTopNav.tsx`
- Test: `src/__tests__/components/portal/PortalTopNav.test.tsx`

**Interfaces:**
- Consumes: `PortalDestination` (Task 1), `resolveActiveDestination` (Task 2), `withParentFocusHref`.
- Produces: `PortalTopNav({ destinations, ariaLabel })`.

Same destinations array as the tab bar, so desktop and mobile cannot diverge.

- [ ] **Step 1: Write the failing test**

Create `src/__tests__/components/portal/PortalTopNav.test.tsx`:

```tsx
import { describe, it, expect, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { mockPathname, mockSearchParams } from "@/test/navigationMock";
import { PortalTopNav } from "@/components/portal/PortalTopNav";
import type { PortalDestination } from "@/lib/portal/portalShellTypes";

const BASE = "/es/dashboard/parent";

const DESTINATIONS: PortalDestination[] = [
  { id: "home", href: BASE, label: "Inicio", icon: "home" },
  { id: "payments", href: `${BASE}/payments`, label: "Pagos", icon: "payments" },
  { id: "messages", href: `${BASE}/messages`, label: "Mensajes", icon: "messages" },
];

describe("PortalTopNav", () => {
  beforeEach(() => {
    mockPathname.mockReturnValue(BASE);
    mockSearchParams.mockReturnValue(new URLSearchParams());
  });

  it("names the navigation landmark", () => {
    render(<PortalTopNav destinations={DESTINATIONS} ariaLabel="Navegación principal" />);
    expect(screen.getByRole("navigation", { name: "Navegación principal" })).toBeInTheDocument();
  });

  it("renders the same destinations as the tab bar", () => {
    render(<PortalTopNav destinations={DESTINATIONS} ariaLabel="Navegación principal" />);
    expect(screen.getAllByRole("link").map((link) => link.textContent)).toEqual([
      "Inicio",
      "Pagos",
      "Mensajes",
    ]);
  });

  it("marks the active destination", () => {
    mockPathname.mockReturnValue(`${BASE}/payments/mp-return`);
    render(<PortalTopNav destinations={DESTINATIONS} ariaLabel="Navegación principal" />);
    expect(screen.getByRole("link", { name: "Pagos" })).toHaveAttribute("aria-current", "page");
  });

  it("preserves focus params on every href", () => {
    mockSearchParams.mockReturnValue(new URLSearchParams("studentId=s3"));
    render(<PortalTopNav destinations={DESTINATIONS} ariaLabel="Navegación principal" />);
    for (const link of screen.getAllByRole("link")) {
      expect(link.getAttribute("href") ?? "").toContain("studentId=s3");
    }
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/__tests__/components/portal/PortalTopNav.test.tsx`
Expected: FAIL — `Failed to resolve import "@/components/portal/PortalTopNav"`.

- [ ] **Step 3: Write the implementation**

Create `src/components/portal/PortalTopNav.tsx`:

```tsx
"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import type { PortalDestination } from "@/lib/portal/portalShellTypes";
import { resolveActiveDestination } from "@/lib/portal/resolveActiveDestination";
import { withParentFocusHref } from "@/lib/parent/withParentFocusHref";

export interface PortalTopNavProps {
  destinations: PortalDestination[];
  ariaLabel: string;
}

export function PortalTopNav({ destinations, ariaLabel }: PortalTopNavProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const studentId = searchParams.get("studentId");
  const sectionId = searchParams.get("sectionId");
  const activeId = resolveActiveDestination(pathname, destinations);

  return (
    <nav aria-label={ariaLabel}>
      <ul className="flex items-center gap-1">
        {destinations.map((destination) => {
          const isActive = destination.id === activeId;
          return (
            <li key={destination.id}>
              <Link
                href={withParentFocusHref(destination.href, { studentId, sectionId })}
                aria-current={isActive ? "page" : undefined}
                className={`inline-flex min-h-10 items-center rounded-[var(--layout-border-radius)] px-3 py-2 text-sm transition ${
                  isActive
                    ? "font-semibold text-[var(--color-primary)]"
                    : "font-medium text-[var(--color-muted-foreground)] hover:bg-[var(--color-muted)] hover:text-[var(--color-foreground)]"
                }`}
              >
                {destination.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/__tests__/components/portal/PortalTopNav.test.tsx`
Expected: PASS, 4 tests.

- [ ] **Step 5: Commit**

```bash
git add src/components/portal/PortalTopNav.tsx \
  src/__tests__/components/portal/PortalTopNav.test.tsx
git commit -m "feat(portal): desktop top navigation sharing the destination list"
```

---

### Task 6: Subject chips

**Files:**
- Create: `src/components/portal/PortalSubjectChips.tsx`
- Test: `src/__tests__/components/portal/PortalSubjectChips.test.tsx`

**Interfaces:**
- Consumes: `PortalSubjectGroup` (Task 1).
- Produces: `PortalSubjectChips({ groups })`.

Chips are links, not buttons, so a focus change is a real navigation with a history entry. Choosing a child clears `sectionId`, matching the reset rule already established for the focus switcher.

- [ ] **Step 1: Write the failing test**

Create `src/__tests__/components/portal/PortalSubjectChips.test.tsx`:

```tsx
import { describe, it, expect, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { mockPathname, mockSearchParams } from "@/test/navigationMock";
import { PortalSubjectChips } from "@/components/portal/PortalSubjectChips";
import type { PortalSubjectGroup } from "@/lib/portal/portalShellTypes";

const BASE = "/es/dashboard/parent/progress";

const CHILD_GROUP: PortalSubjectGroup = {
  param: "studentId",
  label: "Alumno",
  activeId: "s1",
  options: [
    { id: "s1", label: "Mateo" },
    { id: "s2", label: "Ana" },
  ],
};

const SECTION_GROUP: PortalSubjectGroup = {
  param: "sectionId",
  label: "Clase",
  activeId: "sec1",
  options: [
    { id: "sec1", label: "B1" },
    { id: "sec2", label: "Conversation" },
  ],
};

describe("PortalSubjectChips", () => {
  beforeEach(() => {
    mockPathname.mockReturnValue(BASE);
    mockSearchParams.mockReturnValue(new URLSearchParams("studentId=s1&sectionId=sec1"));
  });

  it("renders nothing when there are no groups", () => {
    const { container } = render(<PortalSubjectChips groups={[]} />);
    expect(container).toBeEmptyDOMElement();
  });

  it("renders one labelled group per entry", () => {
    render(<PortalSubjectChips groups={[CHILD_GROUP, SECTION_GROUP]} />);
    expect(screen.getByRole("group", { name: "Alumno" })).toBeInTheDocument();
    expect(screen.getByRole("group", { name: "Clase" })).toBeInTheDocument();
  });

  it("marks the active option and only that one", () => {
    render(<PortalSubjectChips groups={[CHILD_GROUP]} />);
    expect(screen.getByRole("link", { name: "Mateo" })).toHaveAttribute("aria-current", "true");
    expect(screen.getByRole("link", { name: "Ana" })).not.toHaveAttribute("aria-current");
  });

  it("clears sectionId when switching child", () => {
    render(<PortalSubjectChips groups={[CHILD_GROUP]} />);
    const href = screen.getByRole("link", { name: "Ana" }).getAttribute("href") ?? "";
    expect(href).toContain("studentId=s2");
    expect(href).not.toContain("sectionId=");
  });

  it("keeps studentId when switching section", () => {
    render(<PortalSubjectChips groups={[SECTION_GROUP]} />);
    const href = screen.getByRole("link", { name: "Conversation" }).getAttribute("href") ?? "";
    expect(href).toContain("studentId=s1");
    expect(href).toContain("sectionId=sec2");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/__tests__/components/portal/PortalSubjectChips.test.tsx`
Expected: FAIL — `Failed to resolve import "@/components/portal/PortalSubjectChips"`.

- [ ] **Step 3: Write the implementation**

Create `src/components/portal/PortalSubjectChips.tsx`:

```tsx
"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import type { PortalSubjectGroup } from "@/lib/portal/portalShellTypes";

export interface PortalSubjectChipsProps {
  groups: PortalSubjectGroup[];
}

function buildHref(
  pathname: string,
  searchParams: URLSearchParams,
  param: PortalSubjectGroup["param"],
  optionId: string,
): string {
  const next = new URLSearchParams(searchParams.toString());
  next.set(param, optionId);
  if (param === "studentId") next.delete("sectionId");
  const query = next.toString();
  return query ? `${pathname}?${query}` : pathname;
}

export function PortalSubjectChips({ groups }: PortalSubjectChipsProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  if (groups.length === 0) return null;

  return (
    <div className="flex flex-col gap-2">
      {groups.map((group) => (
        <div
          key={group.param}
          role="group"
          aria-label={group.label}
          className="flex gap-2 overflow-x-auto"
        >
          {group.options.map((option) => {
            const isActive = option.id === group.activeId;
            return (
              <Link
                key={option.id}
                href={buildHref(pathname, new URLSearchParams(searchParams.toString()), group.param, option.id)}
                aria-current={isActive ? "true" : undefined}
                className={`inline-flex min-h-9 shrink-0 items-center rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
                  isActive
                    ? "border-[var(--color-primary)] bg-[var(--color-primary)] text-[var(--color-primary-foreground)]"
                    : "border-[var(--color-border)] bg-[var(--color-background)] text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)]"
                }`}
              >
                {option.label}
              </Link>
            );
          })}
        </div>
      ))}
    </div>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/__tests__/components/portal/PortalSubjectChips.test.tsx`
Expected: PASS, 5 tests.

- [ ] **Step 5: Commit**

```bash
git add src/components/portal/PortalSubjectChips.tsx \
  src/__tests__/components/portal/PortalSubjectChips.test.tsx
git commit -m "feat(portal): subject chips for multi-child and multi-section families"
```

---

### Task 7: PortalShell and wiring the parent layout

**Files:**
- Create: `src/components/portal/PortalShell.tsx`
- Modify: `src/app/[locale]/dashboard/parent/layout.tsx`
- Modify: `src/lib/parent-tutorials/selectors.ts`
- Test: `src/__tests__/components/portal/PortalShell.test.tsx`

**Interfaces:**
- Consumes: `PortalShellConfig` (Task 1), `PortalTabBar` (Task 3), `PortalAccountSheet` (Task 4), `PortalTopNav` (Task 5), `PortalSubjectChips` (Task 6), `useAppSurface` from `@/hooks/useAppSurface`, `PwaPullToRefresh` from `@/components/pwa/molecules/PwaPullToRefresh`.
- Produces: `PortalShell({ locale, brand, config, dict, children })`.

- [ ] **Step 1: Write the failing test**

Create `src/__tests__/components/portal/PortalShell.test.tsx`:

```tsx
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { mockPathname, mockSearchParams } from "@/test/navigationMock";
import { dictEn } from "@/test/dictEn";
import type { PortalShellConfig } from "@/lib/portal/portalShellTypes";

const surface = vi.hoisted(() => ({ value: "pwa-mobile" as string }));
vi.mock("@/hooks/useAppSurface", () => ({
  useAppSurface: () => surface.value,
}));

const { PortalShell } = await import("@/components/portal/PortalShell");

const BASE = "/en/dashboard/parent";

const CONFIG: PortalShellConfig = {
  baseHref: BASE,
  brandBadge: "Family",
  ariaHeader: "Family panel",
  ariaTabBar: "App navigation",
  ariaTopNav: "Main navigation",
  accountOpenLabel: "Open account menu",
  accountHeading: "Account",
  accountCloseLabel: "Close",
  destinations: [
    { id: "home", href: BASE, label: "Home", icon: "home" },
    { id: "messages", href: `${BASE}/messages`, label: "Messages", icon: "messages" },
  ],
  accountItems: [{ id: "profile", label: "My profile", href: "/en/dashboard/profile" }],
  subjectGroups: [],
};

const BRAND = {
  name: "Golden English",
  logoPath: "/images/logo.png",
  logoAlt: "Golden English",
  tagline: "",
  taglineEn: "",
} as never;

function renderShell(config: PortalShellConfig = CONFIG) {
  return render(
    <PortalShell locale="en" brand={BRAND} dict={dictEn} config={config}>
      <p>page body</p>
    </PortalShell>,
  );
}

describe("PortalShell", () => {
  beforeEach(() => {
    surface.value = "pwa-mobile";
    mockPathname.mockReturnValue(BASE);
    mockSearchParams.mockReturnValue(new URLSearchParams());
  });

  it("renders the tab bar and not the top nav on narrow surfaces", () => {
    renderShell();
    expect(screen.getByRole("navigation", { name: "App navigation" })).toBeInTheDocument();
    expect(screen.queryByRole("navigation", { name: "Main navigation" })).not.toBeInTheDocument();
  });

  it("renders the top nav and not the tab bar on desktop", () => {
    surface.value = "web-desktop";
    renderShell();
    expect(screen.getByRole("navigation", { name: "Main navigation" })).toBeInTheDocument();
    expect(screen.queryByRole("navigation", { name: "App navigation" })).not.toBeInTheDocument();
  });

  it("exposes the account trigger and no standalone sign-out control in the header", () => {
    renderShell();
    expect(screen.getByRole("button", { name: "Open account menu" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: dictEn.nav.logout })).not.toBeInTheDocument();
  });

  it("renders the page body", () => {
    renderShell();
    expect(screen.getByText("page body")).toBeInTheDocument();
  });

  it("renders no subject chips for a single child in a single section", () => {
    renderShell();
    expect(screen.queryByRole("group")).not.toBeInTheDocument();
  });

  it("renders subject chips when the config carries a group", () => {
    renderShell({
      ...CONFIG,
      subjectGroups: [
        {
          param: "studentId",
          label: "Student",
          activeId: "s1",
          options: [
            { id: "s1", label: "Mateo" },
            { id: "s2", label: "Ana" },
          ],
        },
      ],
    });
    expect(screen.getByRole("group", { name: "Student" })).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/__tests__/components/portal/PortalShell.test.tsx`
Expected: FAIL — `Failed to resolve import "@/components/portal/PortalShell"`.

- [ ] **Step 3: Add the new tour anchors**

In `src/lib/parent-tutorials/selectors.ts`, add three entries to `PARENT_TOUR_ANCHORS`, keeping every existing entry untouched:

```ts
  portalHeader: "portal-header",
  portalAccountTrigger: "portal-account-trigger",
  portalTabBar: "portal-tab-bar",
```

The old `chromeHeader`, `chromeProfile`, `chromeSignOut`, `sidebar` and `tabBar` entries stay, because `ParentPwaShell` and `ParentSidebar` still render for students until phase 6.

- [ ] **Step 4: Write PortalShell**

Create `src/components/portal/PortalShell.tsx`:

```tsx
"use client";

import { useCallback, type ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { BrandPublic } from "@/lib/brand/server";
import type { Dictionary } from "@/types/i18n";
import type { PortalShellConfig } from "@/lib/portal/portalShellTypes";
import { useAppSurface } from "@/hooks/useAppSurface";
import { PortalTabBar } from "@/components/portal/PortalTabBar";
import { PortalTopNav } from "@/components/portal/PortalTopNav";
import { PortalAccountSheet } from "@/components/portal/PortalAccountSheet";
import { PortalSubjectChips } from "@/components/portal/PortalSubjectChips";
import { PwaPullToRefresh } from "@/components/pwa/molecules/PwaPullToRefresh";
import { PARENT_TOUR_ANCHORS } from "@/lib/parent-tutorials/selectors";

export interface PortalShellProps {
  locale: string;
  brand: BrandPublic;
  dict: Dictionary;
  config: PortalShellConfig;
  children: ReactNode;
}

export function PortalShell({ locale, brand, dict, config, children }: PortalShellProps) {
  const router = useRouter();
  const surface = useAppSurface();
  const isDesktop = surface === "web-desktop";
  const isInstalledApp = surface === "pwa-mobile";
  const refresh = useCallback(() => router.refresh(), [router]);
  const bypassLogoOptimizer = brand.logoPath.startsWith("/images/");

  const accountSheet = (
    <PortalAccountSheet
      locale={locale}
      items={config.accountItems}
      openLabel={config.accountOpenLabel}
      heading={config.accountHeading}
      closeLabel={config.accountCloseLabel}
      localeLabels={dict.common.locale}
      signOutLabel={dict.nav.logout}
      triggerTourAnchor={PARENT_TOUR_ANCHORS.portalAccountTrigger}
    />
  );

  return (
    <div className="flex min-h-dvh flex-col bg-[var(--color-muted)]">
      <header
        data-tour={PARENT_TOUR_ANCHORS.portalHeader}
        aria-label={config.ariaHeader}
        className="sticky top-0 z-40 border-b border-[var(--color-border)] bg-[var(--color-surface)]/95 backdrop-blur-md"
        style={{ paddingTop: "max(0.5rem, env(safe-area-inset-top, 0px))" }}
      >
        <div className="mx-auto flex max-w-[var(--layout-max-width)] items-center gap-4 px-4 py-2.5">
          <Link href={config.baseHref} className="flex min-w-0 items-center gap-2.5">
            <Image
              src={brand.logoPath}
              alt={brand.logoAlt || brand.name}
              width={36}
              height={36}
              unoptimized={bypassLogoOptimizer}
              className="h-9 w-9 rounded-[var(--layout-border-radius)] object-contain"
              priority
            />
            <span className="min-w-0">
              <span className="block truncate font-display text-sm font-semibold text-[var(--color-primary)]">
                {brand.name}
              </span>
              <span className="block text-[0.65rem] font-medium uppercase tracking-wider text-[var(--color-muted-foreground)]">
                {config.brandBadge}
              </span>
            </span>
          </Link>

          {isDesktop ? (
            <PortalTopNav destinations={config.destinations} ariaLabel={config.ariaTopNav} />
          ) : null}

          <div className="ml-auto shrink-0">{accountSheet}</div>
        </div>
      </header>

      <main
        className="mx-auto w-full max-w-[var(--layout-max-width)] flex-1 px-4 py-4"
        style={
          isDesktop
            ? undefined
            : { paddingBottom: "calc(4.5rem + max(0.5rem, env(safe-area-inset-bottom, 0px)))" }
        }
      >
        <PwaPullToRefresh
          onRefresh={refresh}
          copy={dict.pwa.pullToRefresh}
          enabled={isInstalledApp}
        >
          <div className="flex flex-col gap-4">
            <PortalSubjectChips groups={config.subjectGroups} />
            {children}
          </div>
        </PwaPullToRefresh>
      </main>

      {isDesktop ? null : (
        <PortalTabBar
          destinations={config.destinations}
          ariaLabel={config.ariaTabBar}
          tourAnchor={PARENT_TOUR_ANCHORS.portalTabBar}
        />
      )}
    </div>
  );
}
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npx vitest run src/__tests__/components/portal/PortalShell.test.tsx`
Expected: PASS, 6 tests.

- [ ] **Step 6: Wire the parent layout**

The current file never passes `includePayments`, relying on the shell's `true` default, so the literal below preserves today's behaviour exactly. Replace the whole file with:

```tsx
import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { getBrandForRequest } from "@/lib/brand/server";
import { PortalShell } from "@/components/portal/PortalShell";
import { buildParentShellConfig } from "@/lib/portal/buildParentShellConfig";
import { loadParentFocusCatalog } from "@/lib/parent/loadParentFocusCatalog";

interface LayoutProps {
  children: ReactNode;
  params: Promise<{ locale: string }>;
}

export default async function ParentDashboardLayout({
  children,
  params,
}: LayoutProps) {
  const { locale } = await params;
  const dict = await getDictionary(locale);
  const brand = await getBrandForRequest();
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/${locale}/login?next=/${locale}/dashboard/parent`);

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  if (profile?.role !== "parent") redirect(`/${locale}/dashboard`);

  const focusCatalog = await loadParentFocusCatalog(supabase, user.id);

  const config = buildParentShellConfig({
    locale,
    baseHref: `/${locale}/dashboard/parent`,
    dict,
    includePayments: true,
    focusCatalog,
    activeStudentId: null,
    activeSectionId: null,
  });

  return (
    <PortalShell locale={locale} brand={brand} dict={dict} config={config}>
      {children}
    </PortalShell>
  );
}
```

`activeStudentId` and `activeSectionId` are `null` because a layout receives no `searchParams`. `buildParentShellConfig` then falls back to the first student and their first section, which is the same default `resolveParentFocus` applies, so the highlighted chip matches what the pages render.

- [ ] **Step 7: Run the affected suites**

Run: `npx vitest run src/__tests__/components/portal src/__tests__/lib/portal src/__tests__/components/ParentDashboardShell.test.tsx src/__tests__/lib/parent-tutorials`
Expected: PASS. `ParentDashboardShell.test.tsx` must still pass untouched — the student portal keeps using it.

- [ ] **Step 8: Type-check and lint**

Run: `npx tsc --noEmit && npm run lint`
Expected: no errors; only the pre-existing warnings.

- [ ] **Step 9: Commit**

```bash
git add src/components/portal/PortalShell.tsx \
  src/__tests__/components/portal/PortalShell.test.tsx \
  src/lib/parent-tutorials/selectors.ts \
  "src/app/[locale]/dashboard/parent/layout.tsx"
git commit -m "feat(parent): mount the portal shell with an account sheet"
```

---

## Implementation status

All seven tasks are implemented. `npx tsc --noEmit` is clean, `npm run lint` reports zero errors and no new
warnings, and the full Vitest suite passes (970 files, 4479 tests). Nothing is committed; the working tree
also carries unrelated in-progress work.

Decisions taken during implementation that differ from the plan as written:

- **Tour anchors moved into `PortalShellConfig`.** The plan had `PortalShell` importing `PARENT_TOUR_ANCHORS`
  directly, which would have made the "generic" shell parent-specific. `PortalShellConfig.tourAnchors` now
  carries them, and `buildParentShellConfig` fills them in, so the student portal can supply its own in a
  later phase.
- **Subject chips reconcile against the URL themselves.** App Router layouts never receive `searchParams`, so
  `buildParentShellConfig` can only supply a server-side default. `PortalSubjectChips` treats `activeId` as
  that default and lets a valid `?studentId=` / `?sectionId=` in the URL win.
- **The parent home tour was repointed, not just extended.** `parent-sidebar` no longer renders for parents,
  so the desktop step now targets `parent-portal-top-nav` (also updated in the L3 runtime matrix), and the
  profile step targets `parent-portal-account`. The standalone sign-out step was removed because sign out now
  lives inside the account sheet; its copy was folded into the account step in all three dictionaries.
- **The account sheet traps focus and locks body scroll.** Not in the plan, but `role="dialog"` with
  `aria-modal` requires it to be true.

## Manual QA before closing the phase

Owned by the user per `.cursor/rules/32-manual-qa-user-owned.mdc`. Run `npm run dev:golden` and log in as a parent.

1. At 390 px: five tabs — Inicio, Asistencias, Progreso, Pagos, Mensajes — and no Configuración tab.
2. Tap the avatar: the sheet opens with Mi perfil, Datos del alumno, Idioma and Cerrar sesión. Escape closes it. Changing the language works from inside the sheet.
3. At 1440 px: the same five destinations in the header, no sidebar, no breadcrumb.
4. Navigate to Pagos and back: the active destination follows on both surfaces.
5. With `?studentId=` in the URL, confirm every tab and top-nav link keeps it.
6. A parent with two children sees a chip row; switching child changes the URL and drops `sectionId`.
7. In the installed app, pull to refresh still works.
8. Log in as a student and confirm the portal is unchanged from today.

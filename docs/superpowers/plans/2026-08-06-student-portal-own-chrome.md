# Student Portal Own Chrome Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A logged-in student sees wording written for them, instead of the family portal's chrome that tells them they are in "Área familias".

**Architecture:** The student layout already mounts `ParentDashboardShell`. That shell's client component, its desktop branch and its PWA branch all accept optional `navDict` and `chromeLabels` overrides — the server wrapper just never declared or forwarded them. So: complete `dashboard.studentNav` with the 8 keys it is missing relative to `dashboard.parentNav`, forward the two props through the wrapper, and pass the student dictionaries from the student layout. No component tree changes, no routing changes, no migrations.

**Tech Stack:** Next.js App Router (server components), React, TypeScript, Vitest + Testing Library, JSON dictionaries in `src/dictionaries/`.

**Spec:** [`docs/superpowers/specs/2026-08-06-student-portal-own-chrome-design.md`](../specs/2026-08-06-student-portal-own-chrome-design.md)

## Global Constraints

- No Supabase migrations. This feature changes no schema.
- Do not modify, mount or delete `StudentDashboardShell`, `StudentSidebar`, `StudentSidebarNavContent`, `StudentBreadcrumb`, `StudentMobileDrawer` or `buildStudentSidebarNavGroups`. That dead tree is spec 8's problem.
- Do not rename `ParentDashboardShell` or any parent-prefixed component.
- The family portal must render exactly as it does today. No parent-facing copy changes.
- All user-visible copy goes in `src/dictionaries/{en,es,pt}.json`. No literals in components — `.cursor/rules/09-i18n-copy.mdc`.
- `es` copy uses the voseo second person already used by the `studentNav.tip*` entries ("Abrí", "Cerrá", "Respondé").
- Tests are self-contained per `.cursor/rules/30-harness-self-contained-tests.mdc`: local mocks, no shared mutable state between files.
- `Dictionary` is `typeof en`, so `en.json` is what defines the type. Keys must be added to `en.json` for the overrides to typecheck.
- Run tests with `npx vitest run <path>`. The full `npm run precommit` gate (lint, build, coverage, e2e) runs on every `git commit`; expect several minutes.

---

### Task 1: Complete the student navigation dictionary

`dashboard.studentNav` is missing 8 keys that `dashboard.parentNav` has. They are load-bearing: `ParentPwaTabBar` reads `progress`, `settings` and `pwaTabBarAria` for three of its six tabs and its accessible name, `ParentBreadcrumb` reads `breadcrumbProgress` and `breadcrumbSettings`, and `buildParentSidebarNavGroups` reads `tipProgress` and `tipSettings`. Without them the student portal would render `undefined` labels.

**Files:**
- Modify: `src/dictionaries/en.json` — `dashboard.studentNav`
- Modify: `src/dictionaries/es.json` — `dashboard.studentNav`
- Modify: `src/dictionaries/pt.json` — `dashboard.studentNav`
- Test: `src/__tests__/i18n/dictionaries.test.ts`

**Interfaces:**
- Consumes: nothing from earlier tasks.
- Produces: `Dictionary["dashboard"]["studentNav"]` becomes structurally assignable to `Dictionary["dashboard"]["parentNav"]`. Tasks 2 and 3 depend on this; without it they will not typecheck.

- [ ] **Step 1: Write the failing test**

Append this `it` block inside the existing `describe("getDictionary", ...)` in `src/__tests__/i18n/dictionaries.test.ts`, just before the `"falls back to default for unknown locale"` test:

```ts
  it("gives studentNav every key parentNav has, in all locales", async () => {
    for (const locale of ["es", "en", "pt"] as const) {
      const d = await getDictionary(locale);
      const parentKeys = Object.keys(d.dashboard.parentNav);
      const studentNav = d.dashboard.studentNav as Record<string, string>;
      const missing = parentKeys.filter((key) => !(key in studentNav));
      expect(missing, `${locale} studentNav is missing keys`).toEqual([]);
      for (const key of parentKeys) {
        expect(studentNav[key], `${locale} studentNav.${key}`).toBeTruthy();
      }
    }
  });
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/__tests__/i18n/dictionaries.test.ts -t "every key parentNav has"`

Expected: FAIL. The message reads `es studentNav is missing keys` and the diff lists
`progress`, `settings`, `pwaTabBarAria`, `breadcrumbChild`, `breadcrumbProgress`, `breadcrumbSettings`, `tipProgress`, `tipSettings`.

- [ ] **Step 3: Add the keys to `en.json`**

In `src/dictionaries/en.json`, inside `dashboard.studentNav`, add `progress` after `calendar`, `settings` after `messages`, and the rest alongside their neighbours so the block mirrors `parentNav`'s ordering:

```json
      "progress": "Progress",
      "settings": "Settings",
      "pwaTabBarAria": "App navigation",
      "breadcrumbChild": "Student",
      "breadcrumbProgress": "Progress",
      "breadcrumbSettings": "Settings",
      "tipProgress": "Your tasks, mini-tests, feedback, and achievements in one place.",
      "tipSettings": "Language and app preferences."
```

- [ ] **Step 4: Add the keys to `es.json`**

In `src/dictionaries/es.json`, inside `dashboard.studentNav`:

```json
      "progress": "Progreso",
      "settings": "Configuración",
      "pwaTabBarAria": "Navegación de la app",
      "breadcrumbChild": "Alumno",
      "breadcrumbProgress": "Progreso",
      "breadcrumbSettings": "Configuración",
      "tipProgress": "Tus tareas, mini-tests, devoluciones y logros en un solo lugar.",
      "tipSettings": "Idioma y preferencias de la app."
```

- [ ] **Step 5: Add the keys to `pt.json`**

In `src/dictionaries/pt.json`, inside `dashboard.studentNav`:

```json
      "progress": "Progresso",
      "settings": "Configurações",
      "pwaTabBarAria": "Navegação do app",
      "breadcrumbChild": "Aluno",
      "breadcrumbProgress": "Progresso",
      "breadcrumbSettings": "Configurações",
      "tipProgress": "Suas tarefas, mini-testes, feedback e conquistas em um só lugar.",
      "tipSettings": "Idioma e preferências do app."
```

- [ ] **Step 6: Run test to verify it passes**

Run: `npx vitest run src/__tests__/i18n/dictionaries.test.ts`

Expected: PASS, all tests in the file green.

- [ ] **Step 7: Commit**

```bash
git add src/dictionaries/en.json src/dictionaries/es.json src/dictionaries/pt.json src/__tests__/i18n/dictionaries.test.ts
git commit -m "feat(i18n): give studentNav the keys the shared shell needs"
```

---

### Task 2: Forward nav and chrome overrides through the shell wrapper

`ParentDashboardShellClient` already declares `chromeLabels` and `navDict` and threads them to the desktop sidebar, the breadcrumb and `ParentPwaShell`. The server wrapper `ParentDashboardShell` does not declare them, so the student layout has no way to reach that behavior.

**Files:**
- Modify: `src/components/dashboard/ParentDashboardShell.tsx` (whole file, 34 lines)
- Test: `src/__tests__/components/ParentDashboardShell.test.tsx`

**Interfaces:**
- Consumes: `Dictionary["dashboard"]["studentNav"]` with all `parentNav` keys, from Task 1.
- Produces: `ParentDashboardShellProps` gains two optional props with these exact names and types, which Task 3 passes:

```ts
chromeLabels?: Dictionary["dashboard"]["parentChrome"];
navDict?: Dictionary["dashboard"]["parentNav"];
```

- [ ] **Step 1: Write the failing tests**

In `src/__tests__/components/ParentDashboardShell.test.tsx`, add this `it` block inside the existing `describe("ParentDashboardShell", ...)`, after the `"renders simplified desktop nav links for the family portal"` test. The existing file already imports `render`, `screen`, `dictEn`, `mockBrandPublic` and `mockPathname`:

```tsx
  it("renders student wording when given the student dictionaries", () => {
    mockPathname.mockReturnValue("/en/dashboard/student");

    render(
      <ParentDashboardShell
        locale="en"
        dict={dictEn}
        brand={mockBrandPublic}
        baseHref="/en/dashboard/student"
        navDict={dictEn.dashboard.studentNav}
        chromeLabels={dictEn.dashboard.studentChrome}
      >
        <p>Student content</p>
      </ParentDashboardShell>,
    );

    expect(
      screen.getByRole("navigation", { name: dictEn.dashboard.studentNav.aria }),
    ).toBeInTheDocument();
    expect(screen.getByText(dictEn.dashboard.studentChrome.badge)).toBeInTheDocument();
    expect(screen.getByText(dictEn.dashboard.studentNav.navScopeStudent)).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: dictEn.dashboard.studentNav.calendar }),
    ).toHaveAttribute("href", "/en/dashboard/student/calendar");
    expect(
      screen.queryByText(dictEn.dashboard.parentNav.navScopeStudent),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: dictEn.dashboard.parentNav.calendar }),
    ).not.toBeInTheDocument();
    expect(screen.queryByText(dictEn.dashboard.parentChrome.badge)).not.toBeInTheDocument();
  });
```

Then add this second `describe` block at the end of the same file, covering the PWA branch directly. `ParentPwaTabBar` is already imported in this file via `resolveParentPwaTab`; extend that import to `import { ParentPwaTabBar, resolveParentPwaTab } from "@/components/pwa/molecules/ParentPwaTabBar";`:

```tsx
describe("ParentPwaTabBar with the student dictionary", () => {
  it("labels every tab and names the landmark", () => {
    mockPathname.mockReturnValue("/en/dashboard/student");

    render(
      <ParentPwaTabBar
        locale="en"
        dict={dictEn.dashboard.studentNav}
        baseHref="/en/dashboard/student"
      />,
    );

    const nav = screen.getByRole("navigation", {
      name: dictEn.dashboard.studentNav.pwaTabBarAria,
    });
    expect(nav).toBeInTheDocument();
    const links = screen.getAllByRole("link");
    expect(links).toHaveLength(6);
    for (const link of links) {
      expect(link.textContent?.trim()).toBeTruthy();
      expect(link.textContent).not.toContain("undefined");
      expect(link.getAttribute("href")).toContain("/en/dashboard/student");
    }
  });

  it("omits the payments tab for minors", () => {
    mockPathname.mockReturnValue("/en/dashboard/student");

    render(
      <ParentPwaTabBar
        locale="en"
        dict={dictEn.dashboard.studentNav}
        baseHref="/en/dashboard/student"
        includePayments={false}
      />,
    );

    expect(screen.getAllByRole("link")).toHaveLength(5);
    expect(
      screen.queryByRole("link", { name: dictEn.dashboard.studentNav.payments }),
    ).not.toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run src/__tests__/components/ParentDashboardShell.test.tsx`

Expected: the `"renders student wording"` test FAILS with
`Unable to find an accessible element with the role "navigation" and name "Student navigation"`.
Vitest strips types, so the unknown props do not raise a TypeScript error at run time — they are silently dropped, and the shell keeps rendering the family dictionaries. Your editor will flag the unknown props; that is expected until Step 3.

The two `ParentPwaTabBar` tests should already PASS once Task 1 is done, because that component accepts the dictionary directly. If either fails, the Task 1 keys are missing or empty — fix that before continuing.

- [ ] **Step 3: Forward the two props**

Replace the whole contents of `src/components/dashboard/ParentDashboardShell.tsx` with:

```tsx
import type { ReactNode } from "react";
import type { BrandPublic } from "@/lib/brand/server";
import type { Dictionary } from "@/types/i18n";
import { ParentDashboardShellClient } from "@/components/dashboard/ParentDashboardShellClient";

export interface ParentDashboardShellProps {
  locale: string;
  dict: Dictionary;
  brand: BrandPublic;
  children: ReactNode;
  baseHref?: string;
  includePayments?: boolean;
  /** Override chrome labels; defaults to parent chrome. */
  chromeLabels?: Dictionary["dashboard"]["parentChrome"];
  /** Override nav dict; defaults to parent nav. */
  navDict?: Dictionary["dashboard"]["parentNav"];
}

export function ParentDashboardShell({
  locale,
  dict,
  brand,
  children,
  baseHref,
  includePayments,
  chromeLabels,
  navDict,
}: ParentDashboardShellProps) {
  return (
    <ParentDashboardShellClient
      locale={locale}
      dict={dict}
      brand={brand}
      baseHref={baseHref}
      includePayments={includePayments}
      chromeLabels={chromeLabels}
      navDict={navDict}
    >
      {children}
    </ParentDashboardShellClient>
  );
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run src/__tests__/components/ParentDashboardShell.test.tsx`

Expected: PASS, all five tests in the file green. The pre-existing family-portal test must still pass unchanged — that is the guard that the family portal did not move.

- [ ] **Step 5: Commit**

```bash
git add src/components/dashboard/ParentDashboardShell.tsx src/__tests__/components/ParentDashboardShell.test.tsx
git commit -m "feat(dashboard): let the shell wrapper take nav and chrome overrides"
```

---

### Task 3: Point the student layout at the student dictionaries

The one-line change the previous two tasks were built for.

**Files:**
- Modify: `src/app/[locale]/dashboard/student/layout.tsx:38-48`
- Create: `src/__tests__/app/studentDashboardLayout.test.tsx`

**Interfaces:**
- Consumes: `chromeLabels` and `navDict` on `ParentDashboardShellProps`, from Task 2.
- Produces: nothing further depends on this task.

- [ ] **Step 1: Write the failing test**

Create `src/__tests__/app/studentDashboardLayout.test.tsx`. It mocks the layout's four dependencies and inspects the returned React element's props, so no DOM render and no Supabase are involved. Note the local `next/navigation` mock: the global setup mock in `src/test/setup.tsx` does not export `redirect`, and this file needs it.

```tsx
import { describe, it, expect, vi } from "vitest";
import type { ReactElement } from "react";
import { dictEn } from "@/test/dictEn";
import { mockBrandPublic } from "@/test/fixtures/mockBrandPublic";

const redirectMock = vi.fn();

vi.mock("next/navigation", () => ({
  redirect: (...args: unknown[]) => redirectMock(...args),
}));

vi.mock("@/lib/i18n/dictionaries", () => ({
  getDictionary: async () => dictEn,
}));

vi.mock("@/lib/brand/server", () => ({
  getBrandForRequest: async () => mockBrandPublic,
}));

vi.mock("@/lib/profile/getProfilePermissions", () => ({
  getProfilePermissions: async () => ({ canAccessPaymentsModule: true }),
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => ({
    auth: {
      getUser: async () => ({ data: { user: { id: "student-1" } } }),
    },
    from: () => ({
      select: () => ({
        eq: () => ({
          single: async () => ({ data: { role: "student" } }),
        }),
      }),
    }),
  }),
}));

import StudentDashboardLayout from "@/app/[locale]/dashboard/student/layout";

describe("StudentDashboardLayout", () => {
  it("passes the student nav and chrome dictionaries to the shell", async () => {
    const element = (await StudentDashboardLayout({
      children: <p>Student content</p>,
      params: Promise.resolve({ locale: "en" }),
    })) as ReactElement<Record<string, unknown>>;

    expect(redirectMock).not.toHaveBeenCalled();
    expect(element.props.navDict).toBe(dictEn.dashboard.studentNav);
    expect(element.props.chromeLabels).toBe(dictEn.dashboard.studentChrome);
    expect(element.props.baseHref).toBe("/en/dashboard/student");
    expect(element.props.includePayments).toBe(true);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/__tests__/app/studentDashboardLayout.test.tsx`

Expected: FAIL with `expected undefined to be { ... }` on the `navDict` assertion. The layout renders the shell without either override.

- [ ] **Step 3: Pass the student dictionaries**

In `src/app/[locale]/dashboard/student/layout.tsx`, add two props to the `ParentDashboardShell` element. The rest of the file — auth guard, role check, `getProfilePermissions`, `baseHref` — is unchanged:

```tsx
  return (
    <ParentDashboardShell
      locale={locale}
      dict={dict}
      brand={brand}
      baseHref={baseHref}
      includePayments={includePayments}
      navDict={dict.dashboard.studentNav}
      chromeLabels={dict.dashboard.studentChrome}
    >
      {children}
    </ParentDashboardShell>
  );
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/__tests__/app/studentDashboardLayout.test.tsx`

Expected: PASS.

- [ ] **Step 5: Run the affected suites together**

Run: `npx vitest run src/__tests__/app/studentDashboardLayout.test.tsx src/__tests__/components/ParentDashboardShell.test.tsx src/__tests__/i18n/dictionaries.test.ts src/__tests__/student src/__tests__/parent`

Expected: PASS. The `student/` and `parent/` suites are included to confirm neither portal regressed.

- [ ] **Step 6: Commit**

```bash
git add src/app/[locale]/dashboard/student/layout.tsx src/__tests__/app/studentDashboardLayout.test.tsx
git commit -m "fix(student): show students their own portal wording"
```

---

## Verification

After Task 3, the whole spec is implemented. Confirm before handing back:

- [ ] `npx vitest run` is green.
- [ ] `git diff` touches only these 7 files: the three dictionaries, `ParentDashboardShell.tsx`, the student layout, and the two test files. Nothing under `src/components/dashboard/Student*.tsx`.
- [ ] `rg -n "studentNav|studentChrome" src/app src/components` shows the student layout as the only non-test consumer.

Manual QA in the browser belongs to the user per `.cursor/rules/32-manual-qa-user-owned.mdc`; the checklist is at the end of the spec.

# Edit Academic Section Name — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Admins can rename an academic section from Configuration and from the section page title, with app-layer uniqueness per cohort and no DB migrations.

**Architecture:** Mirror the room-label pattern: a dedicated server action updates `academic_sections.name` after admin auth, validation, and a case-insensitive sibling-name check; a shared client editor mounts in the Clase settings group and as an inline title control; dictionaries supply all copy.

**Tech Stack:** Next.js App Router server actions, Zod, Supabase JS client, Vitest + Testing Library, `es`/`en`/`pt` dictionaries (`Dictionary` inferred from `en.json`).

**Spec:** `docs/superpowers/specs/2026-08-06-edit-section-name-design.md`

## Global Constraints

- Admin only via `assertAdmin` — teachers never get rename UI.
- No Supabase migrations, no UNIQUE constraints, no `masterdb.sql` changes.
- Name: trim, min length 2, max length 120.
- Duplicate in same `cohort_id` (case-insensitive after trim) → `{ ok: false, code: "DUPLICATE" }`.
- Same name after trim → `{ ok: true }` no-op (no update/audit).
- Copy only via dictionaries; no hardcoded user-facing strings.
- Follow room-label patterns for audit, revalidate, and editor chrome.
- Files stay focused (≤250 lines preferred); one main export per component file.

---

## File map

| Path | Responsibility |
|------|----------------|
| `src/app/[locale]/dashboard/admin/academic/sectionNameActions.ts` | `updateAcademicSectionNameAction` |
| `src/__tests__/app/sectionNameActions.test.ts` | Action unit tests |
| `src/dictionaries/en.json` / `es.json` / `pt.json` | `academicSectionPage.nameEditor` keys |
| `src/components/organisms/AcademicSectionNameEditor.tsx` | Embedded + inline rename UI |
| `src/__tests__/components/AcademicSectionNameEditor.test.tsx` | Editor tests |
| `src/lib/academics/resolveAcademicSectionPageSubdicts.ts` | Expose `nameEditorDict` |
| `src/components/organisms/AcademicSectionSettingsSummary.tsx` | Mount embedded editor in Clase |
| `src/components/organisms/AcademicSectionConfigurationPanel.tsx` | Thread `nameEditorDict` |
| `src/components/organisms/AcademicSectionPageHeader.tsx` | Inline editor in title |
| `src/components/organisms/AcademicSectionPageShellBody.tsx` | Pass dicts/props |
| `src/__tests__/components/AcademicSectionConfigurationPanel.test.tsx` | Mock name editor; pass dict |

---

### Task 1: Server action (TDD)

**Files:**
- Create: `src/__tests__/app/sectionNameActions.test.ts`
- Create: `src/app/[locale]/dashboard/admin/academic/sectionNameActions.ts`

**Interfaces:**
- Consumes: `assertAdmin`, `recordSystemAudit`, `revalidateAcademicSurfaces`, `revalidatePath`
- Produces: `updateAcademicSectionNameAction(input: { locale: string; sectionId: string; name: string }): Promise<{ ok: true } | { ok: false; code: "PARSE" | "DUPLICATE" | "SAVE" }>`

- [ ] **Step 1: Write the failing tests**

Create `src/__tests__/app/sectionNameActions.test.ts`:

```ts
/** @vitest-environment node */
import { beforeEach, describe, expect, it, vi } from "vitest";
import { updateAcademicSectionNameAction } from "@/app/[locale]/dashboard/admin/academic/sectionNameActions";

const { mockAssertAdmin, recordSystemAudit, revalidatePath, revalidateAcademicSurfaces } = vi.hoisted(() => ({
  mockAssertAdmin: vi.fn(),
  recordSystemAudit: vi.fn().mockResolvedValue({ ok: true }),
  revalidatePath: vi.fn(),
  revalidateAcademicSurfaces: vi.fn(),
}));

vi.mock("@/lib/dashboard/assertAdmin", () => ({
  assertAdmin: () => mockAssertAdmin(),
}));

vi.mock("@/lib/analytics/server/recordSystemAudit", () => ({
  recordSystemAudit,
}));

vi.mock("next/cache", () => ({
  revalidatePath,
}));

vi.mock("@/app/[locale]/dashboard/admin/academic/revalidatePaths", () => ({
  revalidateAcademicSurfaces,
}));

const SECTION_ID = "00000000-0000-4000-8000-000000000001";
const COHORT_ID = "00000000-0000-4000-8000-0000000000c1";

function mockFromForRename(opts: {
  currentName: string;
  siblings: { id: string; name: string }[];
  updateRow?: { id: string; cohort_id: string; name: string } | null;
  updateError?: unknown;
}) {
  const selectCurrent = {
    eq: vi.fn().mockReturnValue({
      maybeSingle: vi.fn().mockResolvedValue({
        data: { id: SECTION_ID, cohort_id: COHORT_ID, name: opts.currentName },
        error: null,
      }),
    }),
  };
  const selectSiblings = {
    eq: vi.fn().mockReturnValue({
      neq: vi.fn().mockResolvedValue({ data: opts.siblings, error: null }),
    }),
  };
  let selectCall = 0;
  const select = vi.fn(() => {
    selectCall += 1;
    return selectCall === 1 ? selectCurrent : selectSiblings;
  });
  const update = vi.fn().mockReturnValue({
    eq: vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        maybeSingle: vi.fn().mockResolvedValue({
          data: opts.updateRow ?? { id: SECTION_ID, cohort_id: COHORT_ID, name: "Nuevo nombre" },
          error: opts.updateError ?? null,
        }),
      }),
    }),
  });
  const from = vi.fn((table: string) => {
    if (table !== "academic_sections") throw new Error(`Unexpected table ${table}`);
    return { select, update };
  });
  mockAssertAdmin.mockResolvedValue({ supabase: { from } });
  return { update, from };
}

describe("updateAcademicSectionNameAction", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns PARSE for short names", async () => {
    const r = await updateAcademicSectionNameAction({
      locale: "es",
      sectionId: SECTION_ID,
      name: "A",
    });
    expect(r).toEqual({ ok: false, code: "PARSE" });
    expect(mockAssertAdmin).not.toHaveBeenCalled();
  });

  it("returns ok without update when name unchanged after trim", async () => {
    const { update } = mockFromForRename({
      currentName: "Alpha",
      siblings: [],
    });
    // Only first select (current row) should run; simplify by mocking select once:
    const maybeSingle = vi.fn().mockResolvedValue({
      data: { id: SECTION_ID, cohort_id: COHORT_ID, name: "Alpha" },
      error: null,
    });
    const from = vi.fn(() => ({
      select: vi.fn().mockReturnValue({ eq: vi.fn().mockReturnValue({ maybeSingle }) }),
      update,
    }));
    mockAssertAdmin.mockResolvedValue({ supabase: { from } });

    const r = await updateAcademicSectionNameAction({
      locale: "es",
      sectionId: SECTION_ID,
      name: "  Alpha  ",
    });
    expect(r).toEqual({ ok: true });
    expect(update).not.toHaveBeenCalled();
    expect(recordSystemAudit).not.toHaveBeenCalled();
  });

  it("returns DUPLICATE when another section in cohort has same name case-insensitively", async () => {
    mockFromForRename({
      currentName: "Alpha",
      siblings: [{ id: "00000000-0000-4000-8000-000000000002", name: "beta" }],
    });
    const r = await updateAcademicSectionNameAction({
      locale: "es",
      sectionId: SECTION_ID,
      name: "Beta",
    });
    expect(r).toEqual({ ok: false, code: "DUPLICATE" });
  });

  it("updates name, audits, and revalidates on success", async () => {
    const { update } = mockFromForRename({
      currentName: "Alpha",
      siblings: [{ id: "00000000-0000-4000-8000-000000000002", name: "Other" }],
      updateRow: { id: SECTION_ID, cohort_id: COHORT_ID, name: "Nuevo nombre" },
    });
    const r = await updateAcademicSectionNameAction({
      locale: "es",
      sectionId: SECTION_ID,
      name: "Nuevo nombre",
    });
    expect(r).toEqual({ ok: true });
    expect(update).toHaveBeenCalledWith({ name: "Nuevo nombre" });
    expect(recordSystemAudit).toHaveBeenCalledWith(
      expect.objectContaining({
        action: "academic_section_name_updated",
        resourceType: "academic_section",
        resourceId: SECTION_ID,
      }),
    );
    expect(revalidateAcademicSurfaces).toHaveBeenCalledWith("es");
    expect(revalidatePath).toHaveBeenCalled();
  });

  it("returns SAVE when update returns no row", async () => {
    mockFromForRename({
      currentName: "Alpha",
      siblings: [],
      updateRow: null,
    });
    const r = await updateAcademicSectionNameAction({
      locale: "es",
      sectionId: SECTION_ID,
      name: "Nuevo nombre",
    });
    expect(r).toEqual({ ok: false, code: "SAVE" });
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run src/__tests__/app/sectionNameActions.test.ts`

Expected: FAIL — module `sectionNameActions` not found.

- [ ] **Step 3: Implement the action**

Create `src/app/[locale]/dashboard/admin/academic/sectionNameActions.ts`:

```ts
"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { assertAdmin } from "@/lib/dashboard/assertAdmin";
import { recordSystemAudit } from "@/lib/analytics/server/recordSystemAudit";
import { revalidateAcademicSurfaces } from "@/app/[locale]/dashboard/admin/academic/revalidatePaths";
import { logServerActionException, logSupabaseClientError } from "@/lib/logging/serverActionLog";

const uuid = z.string().uuid();
const nameZ = z
  .string()
  .transform((s) => s.trim())
  .pipe(z.string().min(2).max(120));

const S = "updateAcademicSectionNameAction" as const;

export async function updateAcademicSectionNameAction(input: {
  locale: string;
  sectionId: string;
  name: string;
}): Promise<{ ok: true } | { ok: false; code: "PARSE" | "DUPLICATE" | "SAVE" }> {
  const sectionId = uuid.safeParse(input.sectionId.trim());
  const name = nameZ.safeParse(input.name);
  if (!sectionId.success || !name.success) return { ok: false, code: "PARSE" };

  try {
    const { supabase } = await assertAdmin();

    const { data: currentRow, error: loadErr } = await supabase
      .from("academic_sections")
      .select("id, cohort_id, name")
      .eq("id", sectionId.data)
      .maybeSingle();

    const current = currentRow as { id: string; cohort_id: string; name: string } | null;
    if (loadErr || !current?.id) {
      if (loadErr) logSupabaseClientError(`${S}:load`, loadErr, { sectionId: sectionId.data });
      return { ok: false, code: "SAVE" };
    }

    if (current.name.trim() === name.data) return { ok: true };

    const { data: siblings, error: sibErr } = await supabase
      .from("academic_sections")
      .select("id, name")
      .eq("cohort_id", current.cohort_id)
      .neq("id", sectionId.data);

    if (sibErr) {
      logSupabaseClientError(`${S}:siblings`, sibErr, { sectionId: sectionId.data });
      return { ok: false, code: "SAVE" };
    }

    const needle = name.data.toLowerCase();
    const clash = ((siblings ?? []) as { id: string; name: string }[]).some(
      (row) => row.name.trim().toLowerCase() === needle,
    );
    if (clash) return { ok: false, code: "DUPLICATE" };

    const { data: row, error: upErr } = await supabase
      .from("academic_sections")
      .update({ name: name.data })
      .eq("id", sectionId.data)
      .select("id, cohort_id, name")
      .maybeSingle();

    const section = row as { id: string; cohort_id: string; name: string } | null;
    if (upErr || !section?.id) {
      if (upErr) logSupabaseClientError(`${S}:update`, upErr, { sectionId: sectionId.data });
      return { ok: false, code: "SAVE" };
    }

    void recordSystemAudit({
      action: "academic_section_name_updated",
      resourceType: "academic_section",
      resourceId: section.id,
      payload: { cohort_id: section.cohort_id, name: section.name },
    });

    revalidateAcademicSurfaces(input.locale);
    revalidatePath(`/${input.locale}/dashboard/admin/academic/${section.cohort_id}`, "page");
    revalidatePath(`/${input.locale}/dashboard/admin/academic/${section.cohort_id}/${section.id}`, "page");
    return { ok: true };
  } catch (err) {
    logServerActionException(S, err, { sectionId: input.sectionId.trim() });
    return { ok: false, code: "SAVE" };
  }
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run src/__tests__/app/sectionNameActions.test.ts`

Expected: PASS (all 5 tests). If the no-op mock chain is brittle, adjust the test’s Supabase mock to match the action’s call order (select current → select siblings → update) without changing product behavior.

- [ ] **Step 5: Commit**

```bash
git add src/app/[locale]/dashboard/admin/academic/sectionNameActions.ts \
  src/__tests__/app/sectionNameActions.test.ts
git commit -m "$(cat <<'EOF'
feat(academic): add server action to rename sections

EOF
)"
```

---

### Task 2: i18n keys

**Files:**
- Modify: `src/dictionaries/en.json` (under `dashboard.academicSectionPage`, next to `roomLabel`)
- Modify: `src/dictionaries/es.json` (same path)
- Modify: `src/dictionaries/pt.json` (same path)

**Interfaces:**
- Produces: `Dictionary["dashboard"]["academicSectionPage"]["nameEditor"]` with keys below (types update automatically via `typeof en`)

- [ ] **Step 1: Add `nameEditor` block to `en.json`**

Insert immediately after the `roomLabel` object:

```json
"nameEditor": {
  "title": "Section name",
  "lead": "Display name for this section in admin lists and the section page.",
  "label": "Name",
  "placeholder": "e.g. Morning A",
  "save": "Save name",
  "cancel": "Cancel",
  "editNameAria": "Edit section name",
  "success": "Section name updated.",
  "error": "Could not save. Try again.",
  "duplicate": "Another section in this cohort already uses that name.",
  "tooShort": "Use at least 2 characters."
}
```

- [ ] **Step 2: Add Spanish keys to `es.json`**

```json
"nameEditor": {
  "title": "Nombre de la sección",
  "lead": "Nombre visible de esta sección en listas admin y en la página de la sección.",
  "label": "Nombre",
  "placeholder": "p. ej. Mañana A",
  "save": "Guardar nombre",
  "cancel": "Cancelar",
  "editNameAria": "Editar nombre de la sección",
  "success": "Nombre de la sección actualizado.",
  "error": "No se pudo guardar. Intentá de nuevo.",
  "duplicate": "Otra sección de este cohort ya usa ese nombre.",
  "tooShort": "Usá al menos 2 caracteres."
}
```

- [ ] **Step 3: Add Portuguese keys to `pt.json`**

```json
"nameEditor": {
  "title": "Nome da seção",
  "lead": "Nome de exibição desta seção nas listas admin e na página da seção.",
  "label": "Nome",
  "placeholder": "ex. Manhã A",
  "save": "Salvar nome",
  "cancel": "Cancelar",
  "editNameAria": "Editar nome da seção",
  "success": "Nome da seção atualizado.",
  "error": "Não foi possível salvar. Tente novamente.",
  "duplicate": "Outra seção deste cohort já usa esse nome.",
  "tooShort": "Use pelo menos 2 caracteres."
}
```

- [ ] **Step 4: Sanity-check JSON**

Run: `node -e "JSON.parse(require('fs').readFileSync('src/dictionaries/en.json','utf8')); JSON.parse(require('fs').readFileSync('src/dictionaries/es.json','utf8')); JSON.parse(require('fs').readFileSync('src/dictionaries/pt.json','utf8')); console.log('ok')"`

Expected: `ok`

- [ ] **Step 5: Commit**

```bash
git add src/dictionaries/en.json src/dictionaries/es.json src/dictionaries/pt.json
git commit -m "$(cat <<'EOF'
feat(i18n): add section name editor copy

EOF
)"
```

---

### Task 3: `AcademicSectionNameEditor` (TDD)

**Files:**
- Create: `src/__tests__/components/AcademicSectionNameEditor.test.tsx`
- Create: `src/components/organisms/AcademicSectionNameEditor.tsx`

**Interfaces:**
- Consumes: `updateAcademicSectionNameAction`, `Dictionary["dashboard"]["academicSectionPage"]["nameEditor"]`
- Produces:

```ts
export interface AcademicSectionNameEditorProps {
  locale: string;
  sectionId: string;
  initialName: string;
  dict: Dictionary["dashboard"]["academicSectionPage"]["nameEditor"];
  variant: "embedded" | "inline";
}
```

- [ ] **Step 1: Write the failing component tests**

Create `src/__tests__/components/AcademicSectionNameEditor.test.tsx`:

```tsx
/** @vitest-environment jsdom */
import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AcademicSectionNameEditor } from "@/components/organisms/AcademicSectionNameEditor";

const { updateName, refresh } = vi.hoisted(() => ({
  updateName: vi.fn(),
  refresh: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh }),
}));

vi.mock("@/app/[locale]/dashboard/admin/academic/sectionNameActions", () => ({
  updateAcademicSectionNameAction: (...args: unknown[]) => updateName(...args),
}));

const dict = {
  title: "Section name",
  lead: "Lead",
  label: "Name",
  placeholder: "e.g. Morning A",
  save: "Save name",
  cancel: "Cancel",
  editNameAria: "Edit section name",
  success: "Section name updated.",
  error: "Could not save. Try again.",
  duplicate: "Another section in this cohort already uses that name.",
  tooShort: "Use at least 2 characters.",
};

const sectionId = "00000000-0000-4000-8000-000000000001";

describe("AcademicSectionNameEditor", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("embedded: saves dirty name and refreshes", async () => {
    updateName.mockResolvedValue({ ok: true });
    const user = userEvent.setup();
    render(
      <AcademicSectionNameEditor
        locale="es"
        sectionId={sectionId}
        initialName="Alpha"
        dict={dict}
        variant="embedded"
      />,
    );

    const input = screen.getByLabelText(dict.label);
    await user.clear(input);
    await user.type(input, "Beta");
    await user.click(screen.getByRole("button", { name: dict.save }));

    await waitFor(() => {
      expect(updateName).toHaveBeenCalledWith({
        locale: "es",
        sectionId,
        name: "Beta",
      });
    });
    expect(await screen.findByText(dict.success)).toBeInTheDocument();
    expect(refresh).toHaveBeenCalled();
  });

  it("embedded: shows duplicate message and keeps value", async () => {
    updateName.mockResolvedValue({ ok: false, code: "DUPLICATE" });
    const user = userEvent.setup();
    render(
      <AcademicSectionNameEditor
        locale="es"
        sectionId={sectionId}
        initialName="Alpha"
        dict={dict}
        variant="embedded"
      />,
    );

    const input = screen.getByLabelText(dict.label);
    await user.clear(input);
    await user.type(input, "Taken");
    await user.click(screen.getByRole("button", { name: dict.save }));

    expect(await screen.findByText(dict.duplicate)).toBeInTheDocument();
    expect(refresh).not.toHaveBeenCalled();
    expect(input).toHaveValue("Taken");
  });

  it("inline: opens edit mode, saves, then exits editing", async () => {
    updateName.mockResolvedValue({ ok: true });
    const user = userEvent.setup();
    render(
      <AcademicSectionNameEditor
        locale="es"
        sectionId={sectionId}
        initialName="Alpha"
        dict={dict}
        variant="inline"
      />,
    );

    expect(screen.getByRole("heading", { level: 1, name: "Alpha" })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: dict.editNameAria }));
    const input = screen.getByLabelText(dict.label);
    await user.clear(input);
    await user.type(input, "Gamma");
    await user.click(screen.getByRole("button", { name: dict.save }));

    await waitFor(() => expect(refresh).toHaveBeenCalled());
    expect(screen.queryByLabelText(dict.label)).not.toBeInTheDocument();
  });

  it("inline: stays in edit mode on duplicate", async () => {
    updateName.mockResolvedValue({ ok: false, code: "DUPLICATE" });
    const user = userEvent.setup();
    render(
      <AcademicSectionNameEditor
        locale="es"
        sectionId={sectionId}
        initialName="Alpha"
        dict={dict}
        variant="inline"
      />,
    );

    await user.click(screen.getByRole("button", { name: dict.editNameAria }));
    const input = screen.getByLabelText(dict.label);
    await user.clear(input);
    await user.type(input, "Taken");
    await user.click(screen.getByRole("button", { name: dict.save }));

    expect(await screen.findByText(dict.duplicate)).toBeInTheDocument();
    expect(screen.getByLabelText(dict.label)).toBeInTheDocument();
    expect(refresh).not.toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run src/__tests__/components/AcademicSectionNameEditor.test.tsx`

Expected: FAIL — component module not found.

- [ ] **Step 3: Implement the editor**

Create `src/components/organisms/AcademicSectionNameEditor.tsx`:

```tsx
"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Pencil, Save, X } from "lucide-react";
import type { Dictionary } from "@/types/i18n";
import { Button } from "@/components/atoms/Button";
import { Label } from "@/components/atoms/Label";
import { Input } from "@/components/atoms/Input";
import { updateAcademicSectionNameAction } from "@/app/[locale]/dashboard/admin/academic/sectionNameActions";
import { ADMIN_TOUR_ANCHORS } from "@/lib/admin-tutorials/selectors";

export interface AcademicSectionNameEditorProps {
  locale: string;
  sectionId: string;
  initialName: string;
  dict: Dictionary["dashboard"]["academicSectionPage"]["nameEditor"];
  variant: "embedded" | "inline";
}

function messageForCode(
  code: "PARSE" | "DUPLICATE" | "SAVE",
  dict: AcademicSectionNameEditorProps["dict"],
): string {
  if (code === "DUPLICATE") return dict.duplicate;
  if (code === "PARSE") return dict.tooShort;
  return dict.error;
}

export function AcademicSectionNameEditor({
  locale,
  sectionId,
  initialName,
  dict,
  variant,
}: AcademicSectionNameEditorProps) {
  const router = useRouter();
  const [value, setValue] = useState(initialName);
  const [editing, setEditing] = useState(variant === "embedded");
  const [msg, setMsg] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const dirty = value.trim() !== initialName.trim();

  const save = () => {
    setMsg(null);
    start(async () => {
      const r = await updateAcademicSectionNameAction({ locale, sectionId, name: value });
      if (r.ok) {
        setMsg(dict.success);
        if (variant === "inline") setEditing(false);
        router.refresh();
        return;
      }
      setMsg(messageForCode(r.code, dict));
    });
  };

  const cancelInline = () => {
    setValue(initialName);
    setMsg(null);
    setEditing(false);
  };

  if (variant === "inline" && !editing) {
    return (
      <div className="flex min-w-0 items-center gap-2">
        <h1
          className="truncate text-2xl font-semibold tracking-tight text-[var(--color-foreground)]"
          data-tour={ADMIN_TOUR_ANCHORS.sectionDetailTitle}
        >
          {initialName}
        </h1>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="shrink-0"
          aria-label={dict.editNameAria}
          onClick={() => {
            setValue(initialName);
            setMsg(null);
            setEditing(true);
          }}
        >
          <Pencil className="h-4 w-4" aria-hidden />
        </Button>
      </div>
    );
  }

  const fields = (
    <div className={variant === "inline" ? "space-y-2" : "mt-3 space-y-2"}>
      <Label htmlFor={`sec-name-${sectionId}`}>{dict.label}</Label>
      <Input
        id={`sec-name-${sectionId}`}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        disabled={pending}
        maxLength={120}
        className={variant === "inline" ? "max-w-xl text-2xl font-semibold" : "max-w-md"}
        placeholder={dict.placeholder}
        data-tour={variant === "inline" ? ADMIN_TOUR_ANCHORS.sectionDetailTitle : undefined}
      />
      <div className="flex flex-wrap items-center gap-2">
        <Button type="button" disabled={pending || !dirty} isLoading={pending} onClick={save}>
          {!pending ? <Save className="h-4 w-4 shrink-0" aria-hidden /> : null}
          {dict.save}
        </Button>
        {variant === "inline" ? (
          <Button type="button" variant="ghost" disabled={pending} onClick={cancelInline}>
            <X className="h-4 w-4 shrink-0" aria-hidden />
            {dict.cancel}
          </Button>
        ) : null}
      </div>
      {msg ? (
        <p className="text-sm text-[var(--color-foreground)]" role="status">
          {msg}
        </p>
      ) : null}
    </div>
  );

  if (variant === "inline") {
    return <div className="min-w-0">{fields}</div>;
  }

  return (
    <div>
      <p className="text-xs text-[var(--color-muted-foreground)]">{dict.lead}</p>
      {fields}
    </div>
  );
}
```

If `Button` does not support `variant="ghost"` / `size="sm"` in this repo, match the props used by `AdminUserInlineEditableField` / nearby academic editors instead of inventing new Button API.

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run src/__tests__/components/AcademicSectionNameEditor.test.tsx`

Expected: PASS. Adjust Button/Label APIs only if compile/runtime fails against existing atoms.

- [ ] **Step 5: Commit**

```bash
git add src/components/organisms/AcademicSectionNameEditor.tsx \
  src/__tests__/components/AcademicSectionNameEditor.test.tsx
git commit -m "$(cat <<'EOF'
feat(academic): add section name editor UI

EOF
)"
```

---

### Task 4: Wire into section shell (header + configuration)

**Files:**
- Modify: `src/lib/academics/resolveAcademicSectionPageSubdicts.ts`
- Modify: `src/components/organisms/AcademicSectionSettingsSummary.tsx`
- Modify: `src/components/organisms/AcademicSectionConfigurationPanel.tsx`
- Modify: `src/components/organisms/AcademicSectionPageHeader.tsx`
- Modify: `src/components/organisms/AcademicSectionPageShellBody.tsx`
- Modify: `src/__tests__/components/AcademicSectionConfigurationPanel.test.tsx`

**Interfaces:**
- Consumes: `AcademicSectionNameEditor`, `nameEditorDict` from subdicts
- Produces: Admin section page shows rename in title and Configuration → Clase

- [ ] **Step 1: Expose `nameEditorDict` in subdicts resolver**

In `resolveAcademicSectionPageSubdicts.ts`, add next to `roomLabelDict`:

```ts
nameEditorDict: d.nameEditor ?? dEn.nameEditor,
```

- [ ] **Step 2: Thread dict through Configuration panel → Settings summary**

In `AcademicSectionConfigurationPanel.tsx`:

- Add prop `nameEditorDict: PageDict["nameEditor"]`
- Pass it to `AcademicSectionSettingsSummary`

In `AcademicSectionSettingsSummary.tsx`:

- Import `AcademicSectionNameEditor`
- Add prop `nameEditorDict: PageDict["nameEditor"]`
- Inside Clase group, **before** `AcademicSectionPeriodEditor`:

```tsx
<AcademicSectionNameEditor
  variant="embedded"
  locale={locale}
  sectionId={sectionId}
  initialName={section.name}
  dict={nameEditorDict}
/>
```

- [ ] **Step 3: Replace static header title with inline editor**

In `AcademicSectionPageHeader.tsx`:

- Make it a client-capable boundary: either mark the header `"use client"` **or** keep the header as a server component and accept a pre-built `titleSlot: ReactNode`. Prefer converting the header to `"use client"` only if lifecycle children already require client; otherwise pass `nameEditorDict` and render `AcademicSectionNameEditor` with `variant="inline"` instead of `<h1>{sectionName}</h1>`.

Minimal change (preferred if header can be client or already pulls client children):

```tsx
import { AcademicSectionNameEditor } from "@/components/organisms/AcademicSectionNameEditor";

// props add:
nameEditorDict: Dictionary["dashboard"]["academicSectionPage"]["nameEditor"];

// replace the <h1>...</h1> block with:
<AcademicSectionNameEditor
  variant="inline"
  locale={locale}
  sectionId={sectionId}
  initialName={sectionName}
  dict={nameEditorDict}
/>
```

Keep tour anchor on the title via the editor (`sectionDetailTitle`) — do not leave a duplicate empty `<h1>`.

- [ ] **Step 4: Pass props from `AcademicSectionPageShellBody`**

Destructure `nameEditorDict` from `subdicts` and pass:

- to `AcademicSectionPageHeader` as `nameEditorDict`
- to `AcademicSectionConfigurationPanel` as `nameEditorDict`

- [ ] **Step 5: Update ConfigurationPanel test**

In `AcademicSectionConfigurationPanel.test.tsx`:

```tsx
vi.mock("@/components/organisms/AcademicSectionNameEditor", () => ({
  AcademicSectionNameEditor: () => <div data-testid="name-editor" />,
}));
```

Add prop:

```tsx
nameEditorDict={{} as PageDict["nameEditor"]}
```

- [ ] **Step 6: Run targeted tests**

Run:

```bash
npx vitest run \
  src/__tests__/app/sectionNameActions.test.ts \
  src/__tests__/components/AcademicSectionNameEditor.test.tsx \
  src/__tests__/components/AcademicSectionConfigurationPanel.test.tsx
```

Expected: all PASS.

- [ ] **Step 7: Commit**

```bash
git add \
  src/lib/academics/resolveAcademicSectionPageSubdicts.ts \
  src/components/organisms/AcademicSectionSettingsSummary.tsx \
  src/components/organisms/AcademicSectionConfigurationPanel.tsx \
  src/components/organisms/AcademicSectionPageHeader.tsx \
  src/components/organisms/AcademicSectionPageShellBody.tsx \
  src/__tests__/components/AcademicSectionConfigurationPanel.test.tsx
git commit -m "$(cat <<'EOF'
feat(academic): wire section rename into header and config

EOF
)"
```

---

### Task 5: Verification

**Files:** none new (manual + targeted automated)

- [ ] **Step 1: Re-run full related Vitest set**

```bash
npx vitest run \
  src/__tests__/app/sectionNameActions.test.ts \
  src/__tests__/components/AcademicSectionNameEditor.test.tsx \
  src/__tests__/components/AcademicSectionConfigurationPanel.test.tsx
```

Expected: PASS.

- [ ] **Step 2: Confirm no migration files were added**

Run: `git status --short supabase/`

Expected: empty (no new/modified migrations).

- [ ] **Step 3: Manual QA checklist (admin)**

1. Section page → pencil on title → rename → success → title updates; cohort cards show new name.
2. Configuration → Clase → rename → save → same persistence.
3. Duplicate name in cohort → duplicate error; name unchanged; inline stays open.
4. 1-character name → tooShort / PARSE messaging.
5. Archived section rename succeeds.
6. Teacher section views: no rename control.

- [ ] **Step 4: Final commit only if verification fixed anything**; otherwise done.

---

## Spec coverage checklist

| Spec requirement | Task |
|------------------|------|
| Admin-only rename action | Task 1 |
| No DB migrations / constraints | Global + Task 5 |
| Min 2 / max 120 / trim | Task 1 |
| Case-insensitive duplicate → `DUPLICATE` | Task 1 |
| No-op when unchanged | Task 1 |
| Audit + revalidate | Task 1 |
| Embedded editor in Clase | Tasks 3–4 |
| Inline editor on `<h1>` | Tasks 3–4 |
| i18n es/en/pt | Task 2 |
| Vitest action + editor | Tasks 1, 3 |
| Teacher out of scope | Global (no teacher wiring) |

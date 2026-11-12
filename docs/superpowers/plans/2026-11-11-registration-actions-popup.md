# Registration actions popup Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** The Acciones panel shows one light commit button inside a dark green step block, and every other control sits under that block.

**Architecture:** Add a `stepCommit` button variant and a presentational `AdminRegistrationStepBlock`. `AdminRegistrationFunnelPanel` chooses the one commit control for the open stage and renders the other controls as ghost. Desktop and the phone sheet already mount this panel. Do not fork them.

**Tech Stack:** Next.js App Router, React, Tailwind tokens, Vitest, Testing Library.

**Spec:** `docs/superpowers/specs/2026-11-11-registration-actions-popup-design.md`

## Global Constraints

- Work on `main`. Do not create a branch or a worktree.
- Do not commit per task. One commit later, only when the user asks, and it includes the spec, this plan, and the changelog row.
- Source files under `src/` stay at or under 250 lines (`readFileSync` split on `\n`).
- Visible copy stays in `en.json`, `es.json`, and `pt.json`. This change adds no new sentence.
- Spanish product copy stays neutral tuteo. Do not edit those sentences here.
- Ghost and `stepCommit` do not use `hover:opacity`.
- Do not put white text on the raw `--color-success` token.
- The panel has one filled button. `ConfirmActionModal` keeps its own confirm button.
- Do not change stage rules, revert, contact mail, batch, or the arrow.
- Before the first `src/` edit, point `.cursor/sdd-gate0-approved` at this spec.

## File map

- Modify: `src/components/atoms/Button.tsx` — add `stepCommit`.
- Create: `src/components/dashboard/AdminRegistrationStepBlock.tsx` — the dark block and the sentence.
- Modify: `src/components/dashboard/AdminRegistrationFunnelPanel.tsx` — three zones.
- Test: `src/__tests__/components/dashboard/AdminRegistrationFunnelPanel.test.tsx`
- Create: `supabase/pulsar-migrations/040_registration_actions_popup_changelog.sql`
- Do not edit `AdminRegistrationTableRow.tsx` or `AdminRegistrationActionsSheet.tsx`.

---

### Task 1: Lock the step block in tests

**Files:**
- Test: `src/__tests__/components/dashboard/AdminRegistrationFunnelPanel.test.tsx`

**Interfaces:**
- Consumes: `labels.funnel.stepRegistered`, `labels.funnel.stepContacted`, `labels.funnel.stepAwaitingPayment`, `labels.funnel.stepPaid`, `labels.markContacted`, `labels.matricula.sendMail`, `labels.matricula.markInPerson`, `labels.matricula.saveSection`, `labels.matricula.receiptPending`, `labels.matricula.assignSection`, `labels.editTitle`, `labels.delete`, `labels.funnel.back`, `labels.funnel.close`, `labels.whatsappCta`
- Produces: tests that require `[data-step-block]` around exactly one commit button

- [ ] **Step 1: Write the failing tests**

Add this helper under `renderPanel`:

```tsx
function stepBlock(): HTMLElement {
  const node = document.querySelector("[data-step-block]");
  if (!(node instanceof HTMLElement)) throw new Error("missing step block");
  return node;
}
```

Replace the first two tests with these four. Keep the contact-mail tests and the unknown payment-code test.

```tsx
it("puts mark contacted inside the block on Inscriptos", () => {
  renderPanel(row({ status: "new", enrollmentFeeMailSentAt: null }));
  const block = stepBlock();
  expect(block).toHaveTextContent(labels.funnel.stepRegistered);
  expect(block).toContainElement(screen.getByRole("button", { name: labels.markContacted }));
  expect(screen.getByRole("button", { name: labels.markContacted }).className).toContain("color-background");
  expect(screen.queryByRole("button", { name: labels.funnel.back })).not.toBeInTheDocument();
  expect(screen.queryByRole("link", { name: labels.whatsappCta })).not.toBeInTheDocument();
});

it("puts the matrícula mail inside the block on Contactados", () => {
  renderPanel(row({ enrollmentFeeMailSentAt: null }));
  const block = stepBlock();
  expect(block).toHaveTextContent(labels.funnel.stepContacted);
  expect(block).toContainElement(screen.getByRole("button", { name: labels.matricula.sendMail }));
  expect(block).not.toContainElement(screen.getByRole("button", { name: labels.matricula.markInPerson }));
  expect(screen.getByRole("button", { name: labels.matricula.markInPerson }).className).toContain("bg-transparent");
});

it("puts mark paid inside the block while waiting for payment", () => {
  renderPanel(row());
  const block = stepBlock();
  expect(block).toHaveTextContent(labels.funnel.stepAwaitingPayment);
  expect(block).toContainElement(screen.getByRole("button", { name: labels.matricula.markInPerson }));
  expect(block).not.toContainElement(screen.getByRole("button", { name: labels.matricula.sendMail }));
  expect(screen.queryByRole("button", { name: labels.matricula.receiptPending })).not.toBeInTheDocument();
  expect(screen.queryByText(labels.joinBilling.legend)).not.toBeInTheDocument();
});

it("puts save section inside the block and the select outside it", () => {
  renderPanel(row({ feeCaptured: true, acceptedStudentId: "stu", intakeState: "needs_section" }));
  const block = stepBlock();
  expect(block).toHaveTextContent(labels.funnel.stepPaid);
  expect(block).toContainElement(screen.getByRole("button", { name: labels.matricula.saveSection }));
  expect(block).not.toContainElement(screen.getByLabelText(labels.matricula.assignSection));
  expect(screen.getByRole("button", { name: labels.matricula.saveSection })).toBeDisabled();
  expect(screen.getByText(labels.joinBilling.legend)).toBeInTheDocument();
  expect(screen.queryByRole("button", { name: labels.matricula.sendMail })).not.toBeInTheDocument();
  for (const name of [labels.editTitle, labels.delete, labels.funnel.close]) {
    expect(screen.getByRole("button", { name }).className).not.toContain(
      "bg-[color-mix(in_srgb,var(--color-success)_55%,black)]",
    );
  }
});
```

The default `row()` is `status: "contacted"` with mail sent, so it stays `awaiting_payment`. Clearing `enrollmentFeeMailSentAt` makes that same row `contacted`.

- [ ] **Step 2: Run the tests and confirm they fail**

Run: `npx vitest run src/__tests__/components/dashboard/AdminRegistrationFunnelPanel.test.tsx`

Expected: FAIL because `[data-step-block]` is missing.

---

### Task 2: Render the step block

**Files:**
- Modify: `src/components/atoms/Button.tsx`
- Create: `src/components/dashboard/AdminRegistrationStepBlock.tsx`
- Modify: `src/components/dashboard/AdminRegistrationFunnelPanel.tsx`

**Interfaces:**
- Consumes: the existing panel handlers. Do not change their signatures.
- Produces: `Button` variant `stepCommit`. `AdminRegistrationStepBlock({ sentence, children })` renders `data-step-block`.

- [ ] **Step 1: Add the variant**

In `Button.tsx`, add `stepCommit` to `ButtonVariant` and to `variantClasses`:

```tsx
stepCommit:
  "bg-[var(--color-background)] text-[color-mix(in_srgb,var(--color-success)_55%,black)] hover:bg-[var(--color-muted)] focus-visible:ring-[var(--color-success)]",
```

Do not add `hover:opacity` or a scale hover.

- [ ] **Step 2: Add the block**

Create `src/components/dashboard/AdminRegistrationStepBlock.tsx`:

```tsx
import type { ReactNode } from "react";

export function AdminRegistrationStepBlock({
  sentence,
  children,
}: {
  sentence: string;
  children: ReactNode;
}) {
  return (
    <div
      data-step-block
      className="flex w-full flex-col gap-3 bg-[color-mix(in_srgb,var(--color-success)_55%,black)] p-4 text-white"
    >
      <p className="text-sm text-white">{sentence}</p>
      {children}
    </div>
  );
}
```

- [ ] **Step 3: Rebuild the panel body**

Keep `run`, `confirmRevert`, the state, and the `stepText` map. `awaiting_section` still uses `labels.funnel.stepAwaitingSection`. Replace the returned tree with three zones.

Zone 1. One `AdminRegistrationStepBlock` with `sentence={stepText}` and exactly one button:

| Stage | Button |
|---|---|
| `registered` | `variant="stepCommit"`, `UserPlus`, `labels.markContacted`, `onClick={() => onMarkContacted(row)}` |
| `contacted` | `variant="stepCommit"`, `Mail`, `labels.matricula.sendMail`, `onClick={() => onStartEnrollmentFee(row)}` |
| `awaiting_payment` | `variant="stepCommit"`, `Banknote`, `labels.matricula.markInPerson`, `onClick` calls `run(() => markRegistrationPaidInPersonAction(...))` |
| `paid_without_section` or `awaiting_section` | `variant="stepCommit"`, `UserPlus`, `labels.matricula.saveSection`, disabled when `disabled \|\| !sectionId`, `onClick` calls `run(() => assignRegistrationCohortSectionAction(...))` |

Every commit button uses `type="button"`, `className="min-h-11 w-full justify-start"`, and `disabled={disabled}` except the section button, which also requires `sectionId`.

Zone 2, under the block:

- `registered`: ghost `labels.funnel.sendMail` opens the composer. Render `RegistrationContactMailForm` when `composeOpen`. Render the WhatsApp link only when `digits` is set. Keep the current `wa.me` href.
- `contacted` or `awaiting_payment`: keep the `lines.map` status paragraphs.
- `contacted` only: ghost `labels.matricula.markInPerson` calls the same `markRegistrationPaidInPersonAction`.
- `awaiting_payment` only: ghost `labels.matricula.sendMail` calls `onStartEnrollmentFee`. When `row.enrollmentFeeReceiptPath` is set, ghost `labels.matricula.receiptPending` still calls `approveRegistrationReceiptAction` with `joinDisposition: { kind: "behind" }`.
- Section stages: keep the select and `AdminRegistrationJoinBillingFields` here, outside the block.

Ghost buttons use `variant="ghost"`, `type="button"`, `className="min-h-11 justify-start"`, and the same leading icon they use today.

Zone 3. A top border `border-t border-[var(--color-border)] pt-3`, then:

- Edit: ghost, `Pencil`, `labels.editTitle`, `onClick={() => { onClose(); onEdit(row); }}`
- Delete: ghost, `Trash2`, `labels.delete`, `className="min-h-11 justify-start border border-[var(--color-error)] text-[var(--color-error)]"`
- Back, only when `stage !== "registered"`: ghost, `Undo2`, `labels.funnel.back`, opens `setConfirmBack(true)`
- Close: ghost, `labels.funnel.close`, `onClick={onClose}`

Leave `ConfirmActionModal` as it is. Leave the error paragraph under the tools, above the quiet row.

Count lines. If `AdminRegistrationFunnelPanel.tsx` would pass 250, move only the zone markup that is still pure into the step-block file. Keep the handlers in the panel.

- [ ] **Step 4: Run the panel tests**

Run: `npx vitest run src/__tests__/components/dashboard/AdminRegistrationFunnelPanel.test.tsx src/__tests__/components/ButtonDestructive.test.tsx`

Expected: PASS.

- [ ] **Step 5: Confirm both surfaces still mount the panel**

Run: `rg -n "AdminRegistrationFunnelPanel" src/components/dashboard/AdminRegistrationTableRow.tsx src/components/pwa/molecules/AdminRegistrationActionsSheet.tsx`

Expected: one import in each file. Do not edit those files.

---

### Task 3: Changelog row

**Files:**
- Create: `supabase/pulsar-migrations/040_registration_actions_popup_changelog.sql`

- [ ] **Step 1: Add the row**

```sql
insert into public.platform_changelog_entries (
  id, published_on, area, title_es, title_en, title_pt, summary_es, summary_en, summary_pt, position
) values (
  'registration-actions-popup', '2026-11-11', 'registrations',
  'La acción de la etapa queda sola en Acciones',
  'The stage action stands alone in Actions',
  'A ação da etapa fica sozinha em Ações',
  'El popup muestra la frase del paso y un solo botón. Editar, borrar y volver quedan debajo.',
  'The popup shows the step sentence and one button. Edit, delete, and back sit below it.',
  'O popup mostra a frase do passo e um só botão. Editar, apagar e voltar ficam abaixo.',
  0
) on conflict (id) do nothing;
```

Do not apply this file in the task. Do not put a password in it.

## Spec coverage

- Dark block, light commit button, one filled button: Task 2.
- Ghost tools and the quiet row, no back on Inscriptos: Task 2.
- Commit button per stage, receipt still approves, section fields outside the block: Task 2.
- Same panel on Web and the phone sheet: Task 2 step 5. No layout fork.
- Tests listed in the spec: Task 1.
- Batch spec Actions popup section already points at this spec. No further edit.

# Registration funnel width, stage contrast, and chosen batch

**Intent:** Every stage of the Inscripciones arrow is visible. The arrow fills the table width. Staff mark the leads they want, then move that set together.

**Done when:**

- The arrow row is as wide as the table toolbar. Each segment takes an equal share of that width.
- An idle segment is not the same fill as its neighbor. The active segment uses the primary fill and `aria-pressed="true"`. Idle text stays readable on its fill.
- Each visible row has a checkbox. Seleccionar todos marks every row on the visible page. The header checkbox does the same. Quitar selección clears that page.
- The batch button stays disabled until at least one row is marked.
- Inscriptos shows Marcar contactados. The confirm names the marked count. The action marks only those ids.
- A fee lead only changes to contacted. A lead with no matrícula is marked contacted and gets a student account, the same as the single-lead action.
- Every later stage shows Volver un paso. The confirm names the marked count. Each marked lead undoes one step, the same as the single-lead revert. The student account stays when that revert keeps it.
- A page change or a stage change clears the marks.
- The matrícula mail, the in-person payment, and the section assign stay one lead at a time.

**Out of scope:** A batch of every lead in the stage without a mark. Batch mail. Batch payment. Batch section assign. A new fee column. Changing who belongs in a stage.

## Arrow

`RegistrationFunnelArrows` uses `w-full`. Each button uses `flex-1` and a minimum width so the label does not collapse. On a narrow viewport the row scrolls, and the group still spans the screen.

A stage before the active one is darker. A stage after the active one is lighter. Neighbors do not share one fill. The last segment ends in a point. Each segment draws one 1px black stroke on its own outline. A shared edge is drawn once. The label stays on one line so every arrow has the same height. Do not use one shared muted fill. Do not use `hover:opacity`. Hover darkens the segment fill. The active segment uses `bg-[var(--color-primary)]` and `text-[var(--color-primary-foreground)]`.

## Actions popup

Superseded by `docs/superpowers/specs/2026-11-11-registration-actions-popup-design.md`. The commit control is the light button inside the dark step block. Mail, edit, delete, and back stay under that block.

## Chosen batch

The checkbox is the first control on the desktop row and on the narrow card. The label comes from the dictionaries. The header checkbox uses `aria-checked="mixed"` when only some rows on the page are marked.

Seleccionar todos sits with the batch button. It has a leading icon and a target of at least 44px. It marks every row on the visible page. The page size stays `DEFAULT_TABLE_PAGE_SIZE` (25). The control does not load the next page. When every visible row is marked, the control label is Quitar selección and it clears the page. The header checkbox calls the same two actions.

The batch button sits under the arrow. It has a leading icon and a target of at least 44px. Confirm with `ConfirmActionModal` before the action.

The server receives the marked ids. It loads each id, checks that the lead is still in the open stage, and calls the existing single-lead path. An id that left the stage counts as failed. An unmarked id is not updated.

| Stage | Batch |
|---|---|
| registered | `markRegistrationContacted` for each marked id |
| contacted, awaiting_payment, paid_without_section, awaiting_section | `registrationFunnelRevert` for each marked id |

After success, `revalidatePath` and `router.refresh()`. `recordSystemAudit` stores the stage, the updated count, and the failed count. Do not store emails.

## Errors

Each code has its own sentence in `en.json`, `es.json`, and `pt.json`. Spanish is neutral tuteo. The sentence includes the code.

- `funnel_batch_empty` — no marked id is still in the stage. Refresh the list.
- `funnel_batch_partial` — some marked leads moved and some did not. The sentence includes both counts.
- `forbidden`, `save_failed` — same causes as the single-lead actions.

An unknown code stays visible.

## Surfaces (Web vs PWA)

Tier B. Web and the narrow list share the same selection state in `AdminRegistrationsScreen`.

- Web (`web-desktop`): the arrow fills the table width. The header checkbox is in the table header. Seleccionar todos and the batch button sit under the arrow.
- Narrow (`web-mobile` / `pwa-mobile`): the arrow spans the screen and may scroll. Each card has a checkbox of at least 44px. Seleccionar todos marks the visible cards. The batch button is full width.

## Tests

- Idle segments do not share one class that paints them all `bg-[var(--color-muted)]`. The group is `w-full`.
- Seleccionar todos marks every row on the page. Quitar selección clears them. A later page stays unmarked.
- The batch button is disabled when no row is marked. A click with two marked rows sends only those two ids.
- A fee lead and a zero-fee lead in the marked set both leave Inscriptos. The zero-fee lead keeps the student id the single action creates.
- A paid lead in the marked set loses the payment and stays in the account.
- An id that is no longer in the stage does not change. An empty id list returns `funnel_batch_empty`. A mixed failure returns `funnel_batch_partial` with both counts. An unknown code stays in the message.

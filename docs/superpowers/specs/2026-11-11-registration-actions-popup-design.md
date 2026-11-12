# Registration actions popup — step block

**Intent:** The Acciones popup shows one action for the open stage. Edit, delete, and back stay in the popup, smaller, under that action.

**Done when:**

- The open stage has one dark green block. The block holds the step sentence and one light button.
- The panel has one filled button. The confirm dialog keeps its own confirm button.
- Mail, WhatsApp, the receipt control, edit, delete, back, and close sit under the block and use the ghost treatment. The section select and the billing fields sit under the block and stay fields.
- Inscriptos has no back control.
- The same panel is the desktop modal and the phone sheet.
- Stage rules, revert, contact mail, and batch stay as they are.

**Out of scope:** A new stage. A new server action. Batch mail, batch payment, or batch section assign. Arrow colors or the arrow stroke. Removing edit, delete, or back.

## Layout

`AdminRegistrationFunnelPanel` renders three zones, in this order:

1. **Step block.** Background is the dark success mix already used by the success button (`color-mix` of `--color-success` at 55% with black). The sentence is white. The commit button is a light surface with that same dark green as its text. Do not put white text on the raw `--color-success` token.
2. **Step tools.** Ghost buttons and the existing text lines. A leading Lucide icon stays. The target is at least 44px.
3. **Quiet row.** Edit, delete, and close. Back is in this row only when the stage is not registered. Ghost. Delete keeps the error border and the error text. A hairline separates this row from the tools.

The contact composer still opens inside the panel. It does not open a second dialog. Sending that mail does not change the stage.

The error sentence stays under the tools. It keeps the stable code.

If `AdminRegistrationFunnelPanel.tsx` would pass 250 lines, move the step block into its own component. The panel keeps the handlers.

## Commit button by stage

| Stage | Button inside the block | Ghost tools under the block |
|---|---|---|
| registered | Marcar contactado | Enviar mail. WhatsApp only when a number exists. |
| contacted | Enviar mail de matrícula | Marcar pagado presencial. Payment status lines when they exist. |
| awaiting_payment | Marcar pagado presencial | Enviar mail de matrícula. The receipt control only when a receipt path exists. Payment status lines when they exist. |
| paid_without_section | Guardar sección | Section select and join-billing fields. The button stays disabled until a section is chosen. |
| awaiting_section | Guardar sección | Same fields as paid_without_section. The sentence is the one that says the account already exists. |

Guardar sección, Marcar contactado, Marcar pagado presencial, and Enviar mail de matrícula call the actions they call today. The receipt control still approves the receipt. It does not become a view-only link.

Volver un paso stays on every stage except registered. It still opens `ConfirmActionModal` before the revert.

## Surfaces (Web vs PWA)

Tier B. The screen already has a narrow tree. Both trees render `AdminRegistrationFunnelPanel`. Do not fork the layout.

- Web (`web-desktop`): the panel stays inside the Acciones modal in `AdminRegistrationTableRow`.
- Narrow (`web-mobile` / `pwa-mobile`): the panel stays inside `AdminRegistrationActionsSheet`. The block is full width. Ghost controls keep a 44px target.

## Tests

Update `AdminRegistrationFunnelPanel.test.tsx`.

- Registered shows the contacted action inside the step block and does not show back.
- Contacted shows the matrícula mail action inside the block. Mark paid is outside the block.
- Awaiting payment shows mark paid inside the block. The step sentence is still the awaiting-payment sentence.
- A section stage shows save section inside the block. The section select is outside the block.
- Edit, delete, and close render on every stage. They do not use the dark success fill.

## What this replaces

This spec replaces the Actions popup section of `docs/superpowers/specs/2026-11-10-registration-funnel-batch-design.md`. That section told the commit buttons to use the success fill. The commit button is now the light button inside the dark block.

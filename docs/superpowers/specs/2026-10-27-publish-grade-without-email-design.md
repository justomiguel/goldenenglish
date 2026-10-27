# Publish a grade without email

**Intent:** On the grading panel, add a button that saves the grade as published and does not send email.

**Done when:**

- The panel shows three actions: save draft, publish without email, publish and email guardians.
- Publish without email calls `upsertGradeAction` with `gradeStatus=published`.
- That path does not call `publishGradeWithNotification` or `sendGradePublishedParentEmails`.
- The roster marks the row published. Student progress and the family portal show the grade.
- Copy in `en.json`, `es.json`, and `pt.json` says the button does not send email.
- A component test clicks the silent button and asserts the no-email action.

**Out of scope:**

- Changing create-assessment. Creating an assessment still sends no email.
- WhatsApp, push, or a portal message.
- A checkbox on the email button. Two buttons stay separate.
- New tables, RLS, or an ADR. The write path already exists.

## Behavior

`AssessmentGradingEditor` today has two controls:

1. **Save draft** submits `upsertGradeAction` with `gradeStatus=draft`. No email.
2. **Publish and email guardians** calls `publishGradeWithNotification`. That publishes and emails every linked tutor.

Add a third control between them:

- Label from `dashboard.teacherAssessmentMatrix.publish`.
- Set `gradeStatus` to `published`, then call `upsertGradeAction` with the same form payload.
- On `{ ok: true }`, call `onSaved(enrollmentId, "published")` and `router.refresh()`.
- On failure, show the same error copy as the email button.
- Do not reuse the draft form `action`. The draft success effect always reports status `draft`.

`upsertGradeAction` already persists `published` and writes the section audit. It does not send email.

## Copy

The two publish buttons must say different things. Each button also shows a short second line.

| Key | es | en | pt |
| --- | --- | --- | --- |
| `publish` | Solo publicar la nota | Publish the grade only | Só publicar a nota |
| `publishHelp` | Visible en el portal. No envía correo. | Visible in the portal. No email is sent. | Visível no portal. Não envia e-mail. |
| `publishNotify` | Publicar y notificar por correo | Publish and email guardians | Publicar e notificar por e-mail |
| `publishNotifyHelp` | Visible en el portal. Envía un correo a cada tutor. | Visible in the portal. Each guardian gets an email. | Visível no portal. Cada responsável recebe um e-mail. |

Spanish stays neutral tuteo. Each button keeps a leading Lucide icon. The silent button uses a secondary style. The email button stays the filled primary style.

## Layers

- UI: `src/components/molecules/AssessmentGradingEditor.tsx`. Split the button row if the file would pass 250 lines.
- Dictionaries: `src/dictionaries/en.json`, `es.json`, `pt.json`.
- Tests: a self-contained test for `AssessmentGradingEditor`. Mock the two server actions.
- No migration. No changelog until the button ships. Staff will see it, so the changelog entry belongs in the implementation commit.

## Risks

- Staff may publish a first grade with no email. The grade is still visible in both portals. The label must say there is no email.
- A later edit with the silent button does not send a second email. That is the requested behavior.

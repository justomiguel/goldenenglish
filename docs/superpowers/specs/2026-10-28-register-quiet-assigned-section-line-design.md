# Register: quiet assigned-section line

**Intent:** When the public register form hides the section combo, still show one quiet line with the assigned section name. The family must see where they are signing up. Do not add a second combo or a second enrollment card.

**Done when:**

1. Public `/register` (no enrollment link): if the combo is hidden **and** a real section id is submitted, the details step shows one muted sentence with that section’s label (same label the combo would have used).
2. The hidden `preferred_section_id` stays. Submit is unchanged.
3. No line when there is no open section (undecided sentinel). No line when the combo is visible. No line in enrollment-link mode (the existing “Te estás inscribiendo en…” card stays the only section surface).
4. Copy lives in `en.json` / `es.json` / `pt.json`. Spanish is tuteo neutro.
5. Vitest covers show / hide / no-duplicate-with-link.

**Out of scope:**

- Changing picker visibility or the Inscripciones toggle.
- Showing schedule, seats, or a card on the public form.
- A section name on the DNI step (the combo is not there).
- Admin default-section picker.

## Surfaces (Web vs PWA)

- **Public register:** Tier A. Web and PWA share `RegisterForm` / `RegisterFormContactAndSections`. Same line on both. No new PWA tree.
- Enrollment-link card stays as today on both surfaces.

## Copy

- One key, e.g. `register.assignedSectionLine`: “Te inscribes en {section}.” / “You are registering for {section}.” / “Você se inscreve em {section}.”
- Render as a `role="note"` paragraph. No uppercase eyebrow. No icon box. No pills.

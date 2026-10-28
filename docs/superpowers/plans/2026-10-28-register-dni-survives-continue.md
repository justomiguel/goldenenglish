# Plan: register DNI survives Continue

Spec: `docs/superpowers/specs/2026-10-28-register-dni-survives-continue-design.md`

## Task 1 — Live DNI from the form

- Add `readRegisterDniFromForm(form, fallback)` (trim, live `FormData` wins).
- `continueRegistrationDni` reads that value, calls `setDni`, then lookup with the live string.
- Tests: helper + handler (empty React state, filled DOM).

## Task 2 — Draft across remount

- Add `registerDniDraft` sessionStorage helpers (key = locale + intent).
- Hook `useRegisterDniDraft` restores on mount, writes when `dni`/`step` change, clears on success/reset.
- `RegisterForm` uses the hook.

## Task 3 — Visible lock

- RegisterForm test: set the DNI input without `onChange`, press Continuar, details field shows that value, lookup gets it.
- Remount test: draft in sessionStorage restores document + details step.
- Changelog entry.

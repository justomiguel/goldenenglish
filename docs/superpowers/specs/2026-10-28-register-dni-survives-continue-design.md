# Register DNI survives Continue

**Intent:** On public `/register` (and the same `RegisterForm` on enrollment links and admin create-registration), the student document (RUT / DNI / passport) must stay filled after **Continuar**. The person must not retype it on the details step.

**Done when:**

1. After the person types a document and presses Continuar, the details-step DNI field shows the same value.
2. Continue reads the **live** input (`FormData` / DOM), then writes that value into React state, then runs lookup. Autofill that skipped `onChange` still keeps the document.
3. If `RegisterForm` remounts (server-action refresh after `lookupRegistrationStudentAction`), the typed document and the current step come back. Use tab-scoped `sessionStorage`. Clear the draft after a successful submit.
4. Vitest covers: value still visible after Continuar; lookup receives the live input value, not a stale empty string.

**Out of scope:**

- Event ticket registration (no Continuar after DNI).
- Login identifier.
- Changing lookup RPC or document normalization rules.

## Surfaces (Web vs PWA)

- **Tier A** public registration. Web and PWA both render shared `RegisterForm` (`RegisterClassicSurface`, tenant `Register*Surface`, `AdminRegistrationCreateButton`). There is no PWA fork of the DNI step.
- Fix the shared form and handlers. Do not add a second PWA tree.

## Why it drops today

- Step 1 and step 2 use two different inputs with the same `id="rg-dni"`. Continue unmounts step 1 and mounts step 2 from React state.
- Continue passes `dni` from state. Browser autofill can fill the box without `onChange`, so state stays `""`.
- Lookup is a Server Action. Next refreshes the route. A remount resets `useState` to empty.

## Approach

1. Helper: read `dni` from the form, trim, fall back to state.
2. On Continuar: write that value into state, then lookup.
3. Small client draft (document + step) in `sessionStorage`, keyed by locale + intent. Restore on mount. Clear on success / reset.
4. Test the visible value after Continuar. Do not only assert the field is editable.

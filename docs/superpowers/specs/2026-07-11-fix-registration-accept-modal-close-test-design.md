# Fix AdminRegistrationAcceptModal close test

**Intent:** Align `AdminRegistrationAcceptModal` Vitest with Modal’s ignore-spurious-`close` contract (tour-safe).

**Done when:** The failing case asserts user dismiss (e.g. Escape/`cancel`) or is removed; `npx vitest run src/__tests__/dashboard/AdminRegistrationAcceptModal.test.tsx` passes.

**Out of scope:** Changing `Modal.tsx` behavior.

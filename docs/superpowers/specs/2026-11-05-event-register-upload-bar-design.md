# Event register upload bar

**Intent:** The public event form hides the “Subiendo…” bar until the file upload reports a percent.

**Done when:** `EventRegisterFormFooter` renders `InlineUploadProgressBar` only when `uploadPercent` is a number. Idle and the enroll request after the upload do not show that bar. The file pickers keep their idle bars.

**Out of scope:** Changing the send gate, the receipt field idle bar, and the admin event editor modal.

## Surfaces (Web vs PWA)

Tier A. Desktop and PWA both render `EventRegisterForm` through `EventRegisterSurfaceEntry`. One footer change covers both trees.

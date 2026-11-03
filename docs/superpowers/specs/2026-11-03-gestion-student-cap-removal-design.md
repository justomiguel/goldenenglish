# Gestión — remove the published student cap

**Intent:** Gestión and Ecosistema stop publishing a student cap. The old line was 50 active students. The current line is 120. Neither number is enforced in the database.

**Done when:**

- The Gestión page does not show `capLine`.
- Pricing feature lists do not mention 120 or 50 students.
- The Ecosistema lead does not say Gestión has a 120-student limit.
- The compare row "Capacidad de alumnos" keeps the free-plan line for Presencia. Gestión and Ecosistema say the student list is included, with no number.
- `en.json`, `es.json`, and `pt.json` match. Spanish stays neutral tuteo.

**Out of scope:** A database quota. Mail quotas. Institute admin user lists. Prices.

## Surfaces (Web vs PWA)

Public CentroListo pages are Tier A. The same solution and pricing organisms render inside desktop chrome and PWA chrome. This change is copy and one paragraph. No second layout.

## Test

`PulsarPricingView` no longer expects "Hasta 120 alumnos activos." It still expects the free plan to say it has no students.

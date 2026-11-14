# Registration stat cards follow the cohort

## Intent

The four registration cards show totals for the cohort selected in the combo. The combo sits above those cards.

## Done when

- The cohort combo renders above Total, Pendientes, Contactadas, and Inscritas.
- Each card counts leads that belong to the selected cohort.
- Pendientes counts status `new`. Contactadas counts status `contacted`. Inscritas counts status `enrolled`. Total counts every lead in that cohort.
- Desktop and the PWA list share that combo. It is not repeated in the list toolbar.

## Out of scope

- Funnel arrow counts. Those already follow the cohort.
- Search text does not change the four cards.

## Surfaces (Web vs PWA)

Tier B. The cards and the combo live in the page chrome above both trees. The list toolbar on desktop and on the narrow screen no longer renders a second combo.

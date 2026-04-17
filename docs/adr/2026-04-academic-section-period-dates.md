# ADR: Fechas de periodo por sección académica

## Contexto

Las cohortes ya tenían `starts_on` / `ends_on`. Las secciones no guardaban su propia ventana operativa, lo que dificulta reglas futuras (visibilidad, informes, alineación con calendario de la cohorte).

## Decisión

Añadir en `academic_sections` las columnas **`starts_on`** y **`ends_on`** (tipo `DATE`, `NOT NULL`, `CHECK (starts_on <= ends_on)`). La aplicación valida que, cuando la cohorte tiene fechas definidas, el periodo de la sección quede **contenido** en ese intervalo.

## Alternativas descartadas

- **Solo cohorte**: insuficiente si una sección acorta el dictado o abre más tarde dentro del mismo ciclo.
- **Solo timestamps en app**: sin persistencia en BD no hay fuente única para consultas SQL ni políticas.

## Consecuencias

- Migración `034_academic_section_starts_ends.sql` con backfill desde la cohorte.
- Alta de sección y copia entre cohortes envían/ajustan fechas; edición en la ficha de sección (Overview).
- Tests en `validateSectionPeriodAgainstCohort` y `deriveSectionPeriodForCopy`.

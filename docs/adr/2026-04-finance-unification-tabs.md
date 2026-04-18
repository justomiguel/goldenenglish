# ADR: Unificación de Finanzas admin con tabs y matriz cohorte

Fecha: 2026-04-18
Estado: Aceptado

## Contexto

El sidebar admin tiene hoy **tres entradas** distintas en el grupo Finance:

- `/admin/payments` — cola legacy de revisión de comprobantes (`payments`).
- `/admin/finance/receipts` — cola de recibos del modelo nuevo (`billing_receipts`).
- `/admin/finance/collections` — tablero de cobranza por cohorte (KPIs por sección agregada) + drill-down por sección.

Cada una vive en su propia ruta, con cabecera, breadcrumb y nav propia. El staff
financiero tiene que saltar entre tres rutas para responder preguntas que en
realidad son del mismo dominio ("¿quién pagó? ¿quién no? ¿qué comprobantes me
falta revisar?").

Adicionalmente, **falta** una vista única que muestre, de un solo barrido, **todas
las secciones de la cohorte activa** con quién está al día y quién en mora — la
historia de usuario pide "como un Excel pero mejor estilizado". Hoy lo más cercano
es el tablero por cohorte, pero el detalle alumno × mes solo aparece tras entrar a
una sección concreta.

El ADR previo `2026-04-admin-section-collections-view.md` ya dejaba este trabajo
como follow-up explícito: *"Si un instituto crece a > 50 secciones por cohort,
migrar el tablero a RPC agregada (issue de seguimiento)"*.

## Decisión

### 1. Unificación de superficies en `/admin/finance` con tabs

Una sola entrada de sidebar (`Finanzas`) apunta a `/admin/finance` que organiza
el dominio en **cuatro tabs** (deep-linkables vía `?tab=`):

| Tab | Default? | Origen | Contenido |
|---|---|---|---|
| `overview` | ✅ | nuevo | Matriz cohorte completa: secciones × meses × alumnos. |
| `collections` | | hoy `/admin/finance/collections` | Tablero KPIs por sección + drill-down. |
| `receipts` | | hoy `/admin/finance/receipts` | Cola de comprobantes pendientes (`billing_receipts`). |
| `payments` | | hoy `/admin/payments` | Cola legacy de pagos pendientes. |

Las rutas viejas se mantienen como **redirects 308** a `/admin/finance?tab=...`
preservando `searchParams` relevantes (`cohort`, `year`). El detalle por sección
`/admin/finance/collections/[sectionId]` **no** se mueve: es drill-down, no tab.

Los grupos `Marketing` (cupones, promociones) y `Comms` no se tocan: son flujos
de captación / mensajería, no de cobranza operativa. Quedan como follow-up
opcional.

### 2. Matriz cohorte con RPC de datos crudos en bloque

La nueva vista `overview` necesita, para una cohorte y un año, el set completo
de datos para componer el grid. Hoy `loadAdminCohortCollectionsOverview` hace
**N+1**: una llamada a `loadAdminSectionCollectionsView` por sección (hasta 80),
y cada una internamente dispara 4-5 queries → ~400 round-trips en peor caso.

Decisión: una **RPC SQL** `admin_cohort_collections_bulk(p_cohort_id uuid, p_year int)`
que devuelve, en una sola pasada, el JSON con:

- `cohort` — id, nombre.
- `sections[]` — meta (id, nombre, archived_at, starts_on, ends_on, schedule_slots).
- `enrollments[]` — `{ section_id, student_id, created_at }` activos.
- `profiles[]` — `{ id, first_name, last_name, document_number }`.
- `payments[]` — del año, para los enrollments activos.
- `scholarships[]` — `student_scholarships` activas para esos alumnos.
- `plans[]` — `section_fee_plans` no archivados de esas secciones.

La RPC **no** computa estados ni montos esperados: devuelve datos crudos. La
composición de celdas (paid/pending/overdue, monto esperado, prorrateo, beca)
sigue ocurriendo en TS reusando `buildSectionCollectionsView` /
`buildStudentMonthlyPaymentsRow` / `resolveSectionPlanMonthlyAmount` — los
mismos reductores puros que cubren el resto del producto.

Esto cumple la regla `13-postgrest-pagination-bounded-queries`:
- 1 round-trip vs N+1.
- Datos acotados por cohorte (un solo instituto, decenas de secciones por diseño).
- Sin duplicar lógica de dominio en plpgsql (regla `03-architecture` + `complete-solutions-always`).

La RPC se declara `SECURITY DEFINER` y valida en su cuerpo que el caller tenga
rol admin/owner reusando el helper que ya usa `admin_hub_profile_counts_rpc`
(`030_admin_hub_profile_counts_rpc.sql`).

### 3. Matriz cliente — densidad y filtros

UI desktop-only (Tier B, `05-pwa-mobile-native`). Layout:

- Cabecera de filtros: cohorte (default activa), año, "solo morosos",
  búsqueda por alumno.
- Tabla con `<thead>` sticky: columna alumno + 12 columnas mes + columna total año.
- Filas agrupadas visualmente por sección: cabecera de sección con nombre,
  profesor, # alumnos, % al día, # morosos, semáforo de salud
  (`SectionCollectionsHealthBadge`).
- Celda mes reusa `SectionCollectionsMonthCell` para mantener un único lenguaje
  visual con la matriz por sección y la tira del alumno.
- Acciones: link a la sección (drill-down a la matriz por sección existente),
  export CSV/XLSX (multi-sección, follow-up), mensaje masivo a morosos
  seleccionados (reusa `SectionCollectionsBulkMessageModal`).

### 4. i18n

Nuevo namespace consolidado `admin.finance` con sub-claves:

- `title`, `lead`, `tabs.{overview,collections,receipts,payments}`.
- `overview.{title, lead, columns.*, filters.*, empty, totalsTitle, sectionMeta.*}`.

Las claves antiguas `admin.payments.*` y `admin.finance.collections.*` se
**conservan** porque el contenido de los tabs `payments` y `collections` reusa
los mismos componentes que las páginas viejas; los redirects no rompen ninguna
referencia. `dashboard.adminNav.financeReceipts`, `payments`, `financeCollections`
y sus tips se mantienen para no romper el shape del Dictionary; el sidebar deja
de usarlos pero el breadcrumb los puede seguir usando para etiquetar las URLs
viejas durante la transición.

Se agrega `dashboard.adminNav.{finance,tipFinance,groupFinance}` para la entrada
consolidada.

### 5. Analítica

- Nueva entry `route:admin/finance/overview` en `pathnameToEntity`
  (`src/lib/analytics/eventConstants.ts`).
- `trackPageView` y `click` por interacción de tab usando el patrón existente.
- Sin nuevo `event_type`: la navegación entre tabs es `click` sobre `entity`
  estable.

### 6. Tests

- `src/__tests__/lib/billing/buildCohortCollectionsMatrix.test.ts` — reductor
  puro (composición de filas alumno+sección con celdas de meses).
- `src/__tests__/lib/billing/loadAdminCohortCollectionsBulk.test.ts` — happy
  path con RPC mockeada; cohorte sin secciones; cohorte con sección sin
  alumnos.
- Smoke RTL para `CohortCollectionsMatrixClient` (filas por sección, filtro
  morosos, render del semáforo).

## Alternativas consideradas

- **Mantener tres rutas + crear sólo la matriz cohorte como cuarta**: descarta
  porque amplifica el problema de fragmentación que motiva la PR.
- **Mover cupones / promociones a Finanzas**: se descarta para esta PR para
  no inflar el alcance; pueden moverse después como cambio cosmético del nav
  sin tocar dominio.
- **RPC que devuelve estados computados (paid/overdue/expectedAmount por
  celda) en plpgsql**: descartada — duplicaría
  `resolveSectionPlanMonthlyAmount`, `prorateMonthlyFee`,
  `countSectionMonthlyClasses`, `resolveEffectiveSectionFeePlan` y la
  cobertura de beca por mes en SQL, con riesgo alto de divergencia y violando
  la separación de capas (`03-architecture`). El ADR
  `section-fee-plans-currency-and-proration` confirma que esa lógica es de
  aplicación.
- **Eliminar las rutas viejas en lugar de redirigirlas**: rompe enlaces
  guardados, breadcrumbs externos y deep-links. Redirect 308 mantiene
  compatibilidad y desaparece sin ruido cuando los caches se renueven.
- **Tabs como rutas separadas (`/admin/finance/overview`, etc.)**: equivalente
  funcional pero pierde el patrón de tab compartido con el resto del dashboard
  (`AcademicSectionShellTabs`); el `?tab=` deep-linkable es coherente con el
  resto del repo.

## Consecuencias

Positivas:

- Una sola entrada de sidebar para finanzas; menor carga cognitiva.
- Vista de un vistazo de toda la cohorte (matriz cohorte) — cierra la historia
  pedida.
- 1 round-trip vs N+1: matriz cohorte rinde mejor a escala.
- Sin duplicar dominio: la lógica monetaria sigue en TS puro.

Riesgos / follow-ups:

- La RPC nueva entra como contrato público hacia la app; cualquier cambio de
  shape requiere migración + bump de loader.
- La matriz cohorte puede llegar a renderizar miles de celdas (80 secciones ×
  20 alumnos × 12 meses ≈ 19 200 celdas). Si una métrica de Web Vitals
  empeora, virtualizar filas con `react-virtual` o paginar grupos colapsando
  secciones. No se introduce hoy para no inflar la PR (se anota como
  observable).
- Los redirects 308 conviven con las rutas nuevas; se pueden eliminar cuando
  el equipo confirme que no quedan deep-links externos.
- Mover cupones / promociones a Finanzas queda como follow-up de UX.

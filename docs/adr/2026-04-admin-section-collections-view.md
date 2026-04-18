# ADR: Vista admin de cobranza por secciones y meses

Fecha: 2026-04-18
Estado: Aceptado

## Contexto

El alumno ya tiene la "tira mensual" en `/dashboard/student/payments`
(reglas y tipos en `src/lib/billing/buildStudentMonthlyPaymentsRow.ts`,
`src/types/studentMonthlyPayments.ts`). El admin, en cambio, solo dispone de
`/dashboard/admin/payments` (lista plana de comprobantes pendientes) y del
hub académico para abrir una sección. No existe una vista institucional de
**cobranza por sección × mes** que permita ver morosidad de un vistazo,
exportar para contabilidad externa ni actuar en lote sobre los vencidos.

La historia de usuario pide:

1. Vista "espejo" de la tira del alumno con filtros por sección.
2. Indicadores visuales de salud financiera por grupo.
3. Exportación a CSV/Excel.
4. Selección masiva de "vencidos" para mensaje manual.

## Decisión

### 1. Alcance v1: tablero por cohort + matriz por sección

- Nueva pantalla `/dashboard/admin/finance/collections` con un **tablero por
  cohort** (lista de secciones del cohort actual) que muestra, por cada
  sección: cantidad de alumnos activos, total esperado del año, recaudado,
  pendiente, vencido, ratio de cobranza y un **semáforo de salud**.
- Click en una sección abre `/dashboard/admin/finance/collections/[sectionId]`
  con la **matriz alumno × 12 meses** (espejo de la tira del alumno),
  acotada al año en curso y a la sección elegida.
- El alcance "global paginado" queda fuera de v1 (justificado: la cobranza
  institucional típica se discute por sección/cohort; el tablero por cohort
  ya da la lectura agregada que pide la historia sin disparar una carga
  desbalanceada de PostgREST).

### 2. Datos: bounded por sección y year (regla `13-postgrest`)

- `loadAdminSectionCollectionsView(supabase, sectionId, year)` ejecuta como
  máximo cuatro queries acotadas:
  - `section_enrollments` activos de **esa** sección (decenas por sección por
    diseño de negocio del instituto).
  - `section_fee_plans` no archivados de **esa** sección (regla `48` y `54`).
  - `payments` filtrados por `section_id = ?` y `year = ?`.
  - `student_scholarships` por `student_id IN (...)` con `chunkedIn`.
- `loadAdminCohortCollectionsOverview(supabase, cohortId, year)` itera las
  secciones del cohort en paralelo (`Promise.all` con tope explícito) y
  reusa `loadAdminSectionCollectionsView`. Si un instituto creciera al
  punto de superar ~50 secciones por cohort, el siguiente paso será una
  **RPC SQL agregada** (`admin_section_collections_summary`) — anotado como
  follow-up; no se introduce en v1 para no inflar la PR.

### 3. Lógica pura reutilizada

- Las celdas alumno × mes salen de `buildStudentMonthlyPaymentsRow` (ya
  existente). Se introduce `buildSectionCollectionsView` que agrupa filas
  por sección, calcula KPIs (`paid`, `pendingReview`, `overdue`,
  `upcoming`, `expectedYear`, `collectionRatio`) y deriva un `health`
  con umbrales **declarados en una constante exportada y testeada**:

  | Salud | Condición |
  |-------|-----------|
  | `healthy` | `collectionRatio >= 0.85` y `overdueStudents == 0` |
  | `watch` | `collectionRatio >= 0.6` o `overdueStudents > 0` con `<30%` de los activos |
  | `critical` | `collectionRatio < 0.6` o `overdueStudents >= 30%` de los activos |

  Los umbrales se centralizan en `SECTION_COLLECTIONS_HEALTH_THRESHOLDS`
  para poder ajustarlos sin tocar la UI.

### 4. Exportación: CSV (UTF-8 + BOM) y XLSX

- Server action `exportSectionCollectionsAction(sectionId, year, format)`
  devuelve `{ filename, mimeType, base64 }` para que el cliente arme el
  `Blob`. Esto evita streaming en server actions (no soportado) y mantiene
  la frontera con Supabase dentro del servidor.
- CSV: cabecera `Alumno;Documento;<12 meses>;Esperado;Pagado;Pendiente;Vencido`
  con separador `;` (compatible con Excel ES por defecto), monto con coma
  decimal, BOM `\uFEFF` para que Excel respete UTF-8.
- XLSX: usa la dependencia `xlsx` ya presente en `package.json` (no se
  añade dependencia nueva). Hoja con la misma cabecera, formato numérico
  para columnas monetarias.
- Auditoría: `recordSystemAudit({ action: "collections_export", payload: { sectionId, year, format, rows } })`.

### 5. Mensajería masiva síncrona con tope duro

- Server action `sendBulkCollectionsMessageAction(sectionId, recipientIds, bodyHtml)`:
  - Zod: `recipientIds.length` entre 1 y 200; `bodyHtml` no vacío después
    de `stripHtmlToText`.
  - **Defensa en profundidad**: cada `recipientId` debe estar enrolado
    activo en `sectionId`; si alguno no, se descarta y se reporta
    `skipped`.
  - Bucle `Promise.allSettled` sobre `sendStaffMessageUseCase`
    (existente, regla `12`); devuelve `{ sent, failed: [{ id, code }] }`.
  - `recordSystemAudit({ action: "collections_bulk_message", payload: { sectionId, sent, failed } })`.
  - Sin emisión de `user_events` (es acción admin, no producto del alumno);
    los emails de portal salen por la cadena ya existente
    (`notifyPortalInboxForStudentOrParent`).

### 6. UX

- Tier B (admin) → desktop-only, sin árbol PWA (`05-pwa-mobile-native`).
- Componentes nuevos viven bajo `src/components/dashboard/admin/finance/`
  con un componente principal por archivo y < 250 LOC (`03-architecture`).
- Reusa `StudentMonthlyPaymentCell` para mantener un único lenguaje visual
  con la tira del alumno.
- Selección con checkbox por fila + acción rápida "Seleccionar vencidos".
- Modal de mensaje masivo reusa `RichTextEditor` y dispara la action de
  arriba; usa `LongJobLoader` no aplica (`< 2s` percibidos típicos para
  ≤200 destinatarios).

### 7. Copy e i18n

- Nueva sección `admin.finance.collections.*` en `src/dictionaries/en.json`
  y `src/dictionaries/es.json` (regla `09-i18n-copy`).
- Nuevo grupo de nav admin: `groupFinance > collections` con tip propio.

### 8. Tests

- `src/__tests__/lib/billing/buildSectionCollectionsView.test.ts` — pura.
- `src/__tests__/lib/billing/formatSectionCollectionsExport.test.ts` — CSV
  determinista; XLSX se valida por shape de la hoja generada por `xlsx`.
- `src/__tests__/lib/billing/loadAdminSectionCollectionsView.test.ts` con
  cliente Supabase mock.
- `src/__tests__/app/adminCollectionsActions.test.ts` — happy, validación,
  recipient no enrolado, auditoría disparada.
- Tests de componentes para matriz y modal de bulk.

## Alternativas consideradas

- **Vista global paginada por sección desde v1**: aporta poco frente al
  tablero por cohort y multiplica la superficie a testear. Diferida.
- **Mensajería masiva como long job (`LongJobActivityModal`)**: el patrón
  ya existe en el repo (`11-long-running-jobs-ui`) pero requiere endpoint
  de estado + KV; con el tope de 200 recipientes el envío síncrono cabe
  en el presupuesto percibido. Si más adelante se sube el tope, se migra
  al patrón long job sin romper el contrato (`{ sent, failed }`).
- **RPC SQL `admin_section_collections_summary` como única fuente del
  tablero**: más eficiente a escala pero introduce un contrato SQL
  adicional para v1; se reserva como follow-up explícito.

## Consecuencias

Positivas:

- Lectura institucional clara con semáforo y export reproducible.
- Reutiliza `buildStudentMonthlyPaymentsRow`, `sendStaffMessageUseCase`,
  `recordSystemAudit` — sin duplicar lógica de dominio.
- Mensajería masiva con auditoría y tope duro evita uso destructivo.

Riesgos / follow-ups:

- Si una sección crece a > ~150 alumnos, la matriz pesará en cliente; ya
  hay tests sobre el shape, se observará en producción.
- Si un instituto crece a > 50 secciones por cohort, migrar el tablero a
  RPC agregada (issue de seguimiento).
- El XLSX se sirve como base64 en la respuesta; archivos > 5 MB conviene
  servirlos por endpoint dedicado en el futuro (no aplica al volumen
  actual de una sección).

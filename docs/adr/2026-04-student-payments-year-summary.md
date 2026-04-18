# ADR: Resumen financiero anual del alumno (4 buckets + próximo vencimiento)

Fecha: 2026-04-18
Estado: Aceptado

## Contexto

La pantalla `/dashboard/student/payments` ahora muestra una matriz mensual por
sección (`StudentMonthlyPaymentsStrip`) con estados por celda
(`approved`, `pending`, `rejected`, `exempt`, `due`, `out-of-period`,
`no-plan`). Cada celda lleva además el monto **esperado** (después de beca) y,
cuando hay un comprobante cargado, el monto **registrado**.

Falta una vista consolidada que responda en un vistazo:

- ¿Cuánto pagué, cuánto está en revisión, cuánto está vencido y cuánto se
  viene en el año en curso?
- ¿Cuál es el **próximo vencimiento**?
- ¿Cuál es la **deuda total acumulada**?

El user story (Tutor/Alumno) pide específicamente:

1. Cálculo en tiempo real de la sumatoria de celdas por estado para el año en
   curso.
2. Visualización clara del “Próximo Vencimiento” y la “Deuda Total Acumulada”.
3. Casos de borde:
   - Descuentos/Becas → el total debe reflejar el **neto tras becas**.
   - Créditos a favor → si hay saldo a favor, restar de la “Deuda
     Pendiente”.

## Decisión

1. Introducir un módulo **puro** `src/lib/billing/buildStudentPaymentsYearSummary.ts`
   que recibe el `StudentMonthlyPaymentsView` ya construido (mismo objeto que
   alimenta el strip) y devuelve un agregado tipado:

   ```ts
   interface StudentPaymentsYearSummary {
     year: number;
     paid: number;          // approved + exempt (settled)
     pendingReview: number; // pending status (receipt awaiting admin review)
     overdue: number;       // in-period due/rejected before today's month
     upcoming: number;      // in-period due from today's month onward
     creditBalance: number; // overpayments on approved cells
     totalDebt: number;     // overdue + pendingReview + upcoming, minus credit
     nextDue: { year; month; sectionId; sectionName; amount } | null;
   }
   ```

2. Reglas de cálculo (todas en moneda neta, ya que los `expectedAmount` y
   `recordedAmount` que entrega `loadStudentMonthlyPaymentsView` están post-beca):
   - **Paid** suma `recordedAmount` para `approved`. Para `exempt` suma 0
     (la beca cubre el mes; no hubo flujo de dinero).
   - **PendingReview** suma `recordedAmount ?? expectedAmount` para `pending`.
   - **Overdue** suma `expectedAmount` para `due`/`rejected` cuyo
     `(year, month) < (todayYear, todayMonth)` y están dentro del período
     del plan.
   - **Upcoming** suma `expectedAmount` para `due` cuyo `(year, month) ≥
     (todayYear, todayMonth)` y están dentro del período del plan.
   - **CreditBalance** = sumatoria de `max(0, recordedAmount − expectedAmount)`
     en celdas `approved`. Es la **única** fuente de “saldo a favor” derivable
     hoy (no hay tabla `student_credits`); se documenta el alcance y el
     follow-up para futura tabla explícita.
   - **TotalDebt** = `max(0, overdue + pendingReview + upcoming − creditBalance)`.
   - **NextDue** = la celda `due`/`rejected` (in-period) más temprana
     cronológicamente entre todas las secciones; se devuelve sección y monto.

3. Renderizar un nuevo componente `StudentPaymentsYearSummary` (en
   `src/components/student/`) con cuatro chips/tarjetas para los cuatro
   buckets, una tarjeta destacada para “Deuda total” y una línea para
   “Próximo vencimiento” (mes/año + nombre de sección + monto). Cuando
   `creditBalance > 0`, se muestra el saldo a favor con su signo y se aclara
   que ya está descontado del total.

4. Ubicación: el componente se monta **encima** del `StudentMonthlyPaymentsStrip`
   en `StudentPaymentsEntry` (web y PWA), porque la lectura es: primero la
   foto consolidada, luego el detalle mes a mes.

5. Copy: nuevas claves bajo `dashboard.student.monthly.summary.*` en
   `src/dictionaries/{en,es}.json`.

## Alternativas consideradas

- **Calcular el resumen en el server component** y pasarlo separado del
  `StudentMonthlyPaymentsView`: añade una segunda fuente de verdad para los
  mismos datos. Descartada — el módulo puro recibe la `view` y mantiene
  consistencia.
- **Mostrar el resumen como tooltip / sticky lateral**: empeora la lectura
  móvil (Tier A). Descartada.
- **Usar el `payments` flat history como fuente** (`StudentPaymentsHistory`):
  no respeta el plan ni la beca; usaría montos brutos. Descartada.

## Consecuencias

Positivas:

- Una sola fuente: el mismo `StudentMonthlyPaymentsView` alimenta la matriz
  y el resumen. Cualquier mejora futura (saldos explícitos, intereses)
  cambia el cálculo en un único módulo puro testeable.
- Cumple los criterios de aceptación del user story (4 buckets, próximo
  vencimiento, deuda total, neto tras becas, créditos a favor).

Riesgos / follow-ups:

- **Saldo a favor explícito**: hoy se infiere de sobre-pagos en celdas
  aprobadas. Si en el futuro se introduce una tabla `student_credits`, hay
  que sumar esos créditos al `creditBalance` y mantener compat con
  sobre-pagos. Tracking en backlog.
- **Intereses por mora**: el bucket “Vencido” es el monto **nominal**
  esperado; no aplica recargo. Si luego se modela mora, debe entrar a
  `overdue` y a `totalDebt` por la misma vía.
- **Multi-año**: hoy el `view` arma 12 celdas para el año actual; el
  resumen es **anual** por diseño (acotado por el server component que
  pasa `todayYear/todayMonth`).
- **Analytics**: el resumen es solo lectura, no genera eventos nuevos
  (consistente con `08-analytics-observability.mdc` — los eventos siguen
  emitiéndose al subir comprobante en la pantalla).

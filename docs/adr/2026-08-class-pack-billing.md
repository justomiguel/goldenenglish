# ADR: Cobro por clases — bolsa mensual prepaga con precio no lineal

Fecha: 2026-08-07
Estado: Aceptado
Complementa: `2026-04-section-fee-plans-currency-and-proration.md`
Spec: `docs/superpowers/specs/2026-08-07-class-pack-billing-design.md`

## Contexto

Existen institutos que no cobran una cuota fija mensual: cobran según cuántas
clases toma el alumno, y **el precio no es lineal**. El paquete de 1 clase vale
X, el de 2 vale algo que no es 2X, y así. El modelo actual no puede expresarlo:

1. El precio es una propiedad de la **sección** (`section_fee_plans.monthly_fee`,
   un único número por sección y vigencia), y la cantidad de clases también
   (`academic_sections.schedule_slots`). Todos los alumnos de una sección pagan
   lo mismo y toman lo mismo. **No existe en el esquema una cantidad de clases
   por alumno.**
2. Lo que hoy parece cobro por clases no lo es. `monthly_fee_charge_mode =
   'prorate_by_classes'` calcula `monthly_fee × disponibles / total`, que es
   estrictamente lineal y existe para el alumno que entra a mitad de mes. La 154
   además hizo de `'full_month_fee'` el default de producto.
3. El ADR `2026-04-section-fee-plans-currency-and-proration.md` **rechazó
   explícitamente** el prorrateo por asistencia ("faltar no descuenta cuota;
   asistencia es otra discusión pedagógica"). Ese rechazo sigue siendo correcto
   **para la cuota mensual**. Este ADR no lo revierte: introduce un producto de
   facturación distinto, donde el consumo por asistencia no es un descuento sobre
   una cuota sino la definición misma de lo que se compró.

Requisitos adicionales dados por producto:

- La bolsa es **del alumno y cruza secciones** (un alumno puede estar en varias y
  va consumiendo).
- La bolsa es **estrictamente mensual**.
- Consumen clase los estados `present`, `late` y `absent`. **`excused` no
  consume**, y debe informarse para que el alumno pueda recuperar esa clase en
  otro momento, en otra sección o con otros profes.
- El instituto decide si usa cuota fija por sección o cobro por clases.

## Decisión

1. **Producto de facturación paralelo**, no un modo más de la cuota mensual.
   `payments` tiene índices únicos parciales por `(student_id, section_id, month,
   year)` y por `(student_id, month, year)` para filas legacy sin sección, y
   `payment_kind` no participa de ninguno de los dos. Un cargo del alumno sin
   sección no cabe ahí. Se sigue el precedente de `event_payments`: tabla de
   cargo propia, dejando `payments`, la grilla de 12 meses y los dos flujos de
   pasarela de cuotas intactos.

2. **Modo por sección, decidido por el instituto.** `site_settings.billing_model`
   guarda la elección del instituto y define qué UI ve el admin y qué default
   reciben las secciones nuevas. La columna nueva
   `academic_sections.billing_mode` (`'section_monthly_fee' | 'class_pack'`) es
   el punto de enforcement que lee el cálculo. Los dos modos **pueden convivir**
   en un instituto. Espeja lo que ya hizo la 154: la decisión de producto se
   expresó como default de columna más backfill, y la columna quedó como fuente
   de verdad en runtime.

3. **Columna nueva, no un tercer valor de `monthly_fee_charge_mode`.**
   `parseMonthlyFeeChargeMode` devuelve `'prorate_by_classes'` para cualquier
   valor desconocido. Agregar `'class_pack'` ahí haría que todo código que aún no
   conozca el modo cobre una cuota prorrateada en silencio. El parser nuevo es
   estricto: devuelve `null` ante lo desconocido y el llamador expone un error
   tipado. Además `resolveSectionPlanMonthlyAmount` gana un resultado
   `class_pack_section` para que ninguna ruta produzca un monto mensual para una
   sección que no se cobra por mes.

4. **Catálogo de precios a nivel instituto**, `class_pack_prices`, con filas
   `(class_count, amount, currency)` más ventana de vigencia con el mismo
   criterio que `section_fee_plans`. `amount` es el precio **total** del paquete,
   no unitario: ahí vive la no linealidad, sin fórmula ni interpolación. Un
   `class_count` sin fila es error tipado, no un cálculo inventado. No puede
   vivir por sección porque la bolsa cruza secciones: un alumno en dos secciones
   con tarifas distintas no tendría precio único.

5. **La bolsa es el cargo.** `student_class_packs` es mensual y lleva sus propias
   columnas de estado, recibo y pasarela. `class_count`, `amount` y `currency` se
   congelan al comprar (mismo criterio que `student_promotions`) para que una
   edición posterior del catálogo no reformule una compra saldada. **Sin índice
   único** por `(student_id, year, month)`: se permiten recargas en el mismo mes,
   y cada compra se cotiza por su propio tamaño.

6. **Solo `approved` y `exempt` otorgan créditos.** Un paquete `pending`
   (transferencia en revisión) no otorga nada; otorgar antes de confirmar el
   dinero convertiría la cola de revisión en clases gratis.

7. **El consumo es un libro mayor derivado de la asistencia**, no un contador.
   `class_credit_consumptions` con `UNIQUE (attendance_id)` y FK a
   `section_attendance` con `ON DELETE CASCADE`. La asistencia es editable y
   borrable: un contador se descuadra en la primera corrección y no se puede
   auditar, mientras que el libro mayor hace la corrección idempotente y el
   borrado autorreversible.

8. **El libro mayor lo mantiene un trigger** `AFTER INSERT OR UPDATE` sobre
   `section_attendance`, `SECURITY DEFINER`, y las tablas del libro mayor **no
   son escribibles** por `authenticated`. La asistencia se escribe desde varios
   caminos; el primero que no se instrumente rompería la facturación en silencio.
   El trigger **nunca falla por estado de facturación**: un profe tomando
   asistencia no puede recibir un error de billing, y el registro es el hecho
   académico de lo que pasó. Como consecuencia el **saldo puede quedar
   negativo**, y eso se expone como deuda de clases para que el staff la resuelva
   vendiendo una recarga.

9. **`excused` genera `class_recovery_credits`.** En este alcance solo se acumulan
   y se muestran. Agendar y gastar esas recuperaciones es un proyecto aparte:
   `section_attendance.enrollment_id` exige inscripción en la sección, y recuperar
   es justamente asistir a una sección donde el alumno no está inscripto; el
   commit de inscripción además valida solapamiento de horarios, así que no hay
   atajo con inscripciones fantasma.

10. **Sin descuentos sobre el paquete**, salvo `status = 'exempt'`. La no
    linealidad del catálogo ya es el descuento por volumen, y
    `section_enrollment_scholarships` está atada a la inscripción a una sección,
    así que no puede expresar una bolsa que cruza secciones.

11. **La matrícula no cambia**: las secciones por paquete siguen cobrando
    `academic_sections.enrollment_fee_amount` por el flujo actual.

12. **Cambiar una sección a modo paquete no hace backfill** del libro mayor: el
    trigger solo escribe para asistencia de secciones que ya están en ese modo.
    Backfillear inventaría cargos sobre meses ya saldados con cuota fija.

13. **Control de integridad obligatorio en el alcance**: un reporte de días de
    clase agendados sin registro de asistencia para secciones por paquete. Con
    este modelo, una clase dictada sin registro no descuenta nada y el instituto
    pierde plata sin enterarse. Es parte del proyecto, no un follow-up.

## Alternativas consideradas

- **Tabla de tramos colgando de `section_fee_plans`** (precio por sección):
  rechazada. Es el cambio más chico y reusaría la grilla mensual y `payments` tal
  cual, pero obliga a que la bolsa sea por sección, contradiciendo el requisito
  de que cruce secciones. Habría que rediseñar en cuanto un alumno esté en dos
  secciones, escenario que ya existe.
- **Tercer valor de `monthly_fee_charge_mode`**: rechazada por el default
  permisivo del parser (decisión 3). El fallo sería silencioso y financiero.
- **Reusar `payments` con `payment_kind = 'class_pack'`**: rechazada. Requiere
  tocar los dos índices únicos parciales y auditar todos los consumidores de
  `payments`, incluidos ambos flujos de pasarela y la matriz de cobranzas.
- **Contador de saldo en la bolsa, decrementado por la app**: rechazada.
  La asistencia se corrige y se borra; sin libro mayor no hay reversión ni
  auditoría, y cada camino de escritura de asistencia sería una oportunidad de
  descuadre.
- **Consumo escrito desde la aplicación en vez de un trigger**: rechazada por la
  cantidad de caminos que escriben asistencia. El trigger más la ausencia de
  grants de escritura hace el bypass imposible por construcción.
- **Billetera única sin corte mensual (saldo rodante)**: rechazada por producto —
  la bolsa es mensual. Las justificadas cubren el caso legítimo de "pagué y no
  la usé" sin volver el saldo perpetuo.
- **Catálogo con peso de créditos por sección** (una clase individual vale 2, una
  grupal 1): postergada, no rechazada. Es aditiva sobre este mismo diseño con
  default 1, y hoy nadie la pidió.
- **Bloquear la asistencia cuando el saldo llega a cero**: rechazada. Convierte un
  problema de cobranza en un problema académico y le da un error de facturación a
  un profe en el aula.

## Consecuencias

Positivas:

- El precio no lineal queda expresado como tabla pura, sin fórmulas que después
  nadie entiende.
- Las secciones con cuota fija no se tocan: `section_fee_plans`,
  `prorateMonthlyFee`, `monthly_fee_charge_mode` y la grilla de 12 meses quedan
  intactas, y los dos modos conviven.
- El consumo es auditable clase por clase y reversible ante correcciones de
  asistencia, sin intervención manual.
- El libro mayor no se puede evadir desde la aplicación.
- El saldo nunca se almacena, así que no hay clase de bug de saldo
  desincronizado.

Riesgos / follow-ups:

- **Dependencia operativa nueva**: la facturación pasa a depender de que los
  profes tomen asistencia. Mitigado por el reporte de la decisión 13, que es la
  alerta accionable exigida por `08-analytics-observability.mdc`.
- **Saldo negativo**: es una consecuencia aceptada de la decisión 8. Necesita
  visibilidad en finanzas para que no se acumule silenciosamente.
- **Pasivo creciente de recuperaciones**: hoy los créditos de recuperación no
  vencen y no se pueden gastar hasta el proyecto 2. Follow-up: definir
  vencimiento.
- **Porcentaje de asistencia académico**: `attendanceMonthPct` se calcula solo
  desde `section_attendance`. Una clase recuperada en otra sección no lo va a
  reparar hasta que el proyecto 2 lo decida explícitamente.
- **Tercer producto en las pasarelas**: Flow y MercadoPago pasan a tener tres
  tipos de cargo. Se reusan credenciales, la indirección de
  `payment_flow_checkout_refs` y la creación diferida de la 159, pero suma una
  tabla de finalize-records más.
- **Tests**: además de los puros, hace falta suite contra el stack local de
  Supabase para el trigger (alta, corrección `present ↔ excused`, borrado en
  cascada, sección en modo cuota fija sin filas, y que `authenticated` no pueda
  insertar en el libro mayor).
- **Analítica**: eventos de compra de paquete y auditoría (`recordSystemAudit`)
  para cambios del catálogo, creación manual de paquetes y exenciones.

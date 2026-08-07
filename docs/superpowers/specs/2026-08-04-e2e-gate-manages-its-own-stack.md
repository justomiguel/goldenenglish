# Mini-spec — El gate de e2e administra su propio stack

Fecha: 2026-08-04 · Estado: aprobado por el usuario en sesión

## Problema

El gate de precommit falla cerrado si el stack aislado de Supabase no está corriendo:

```
❌ Could not run psql: Is the e2e stack up?
```

Eso obliga a acordarse de `colima start` + `npm run e2e:stack:up` antes de commitear, y de
bajarlo después (la VM tiene ~8 GB asignados). Si te olvidás de bajarlo queda consumiendo
recursos indefinidamente; si te olvidás de subirlo, no podés commitear.

## Medición que habilita el diseño

El volumen de Docker sobrevive a `supabase stop`, así que un reinicio **no necesita**
`db reset` (que era la parte lenta, minutos). Verificado después de bajar todo y volver:

| Paso | Costo |
|------|-------|
| `colima start` | 19 s |
| `supabase start` (volumen existente) | 58 s |
| Reseed de fixtures (ya existía) | 1 s |

Y el estado se conservó intacto: 173 migraciones aplicadas, fixtures presentes, columnas de
la migración 171 presentes. Total en frío ~78 s, contra los ~5 min de un `e2e:stack:up`
completo.

## Intent

El gate levanta lo que falte, corre, y baja **solo lo que él levantó**. Si el stack ya
estaba arriba (porque estás iterando), no lo toca ni lo baja.

## Cambios en `scripts/run-e2e-precommit.mjs`

1. `ensureStack()` antes de leer `.env.local.e2e`:
   - Docker no responde → `colima start` (marca `startedColima`).
   - Contenedores de Supabase ausentes → `supabase start` (marca `startedSupabase`).
   - Falta `.env.local.e2e`, o la BD tiene migraciones pendientes respecto de
     `supabase/migrations/*.sql` → `npm run e2e:stack:up` completo (reset + seed + reescribe
     el env). Es el único caso que paga el costo alto, y es el correcto: el esquema quedó viejo.
2. Teardown al terminar, en todos los caminos de salida (éxito, fallo y señales): baja
   Supabase y/o Colima **únicamente** si este proceso los levantó.
3. Escapes: `E2E_STACK_KEEP=1` deja todo arriba (útil para varios commits seguidos);
   `E2E_SKIP_SEED=1` y `E2E_SKIP_BUILD=1` siguen como estaban.

## Done when

- [x] Con todo apagado, `npm run test:e2e:precommit` levanta, pasa y deja todo apagado.
- [x] Con el stack ya arriba, no lo baja al terminar.
- [x] Una migración nueva sin aplicar dispara el `e2e:stack:up` completo.
- [x] El teardown corre también cuando los tests fallan (`fail()` lo llama antes de salir).

## Resultado medido

Tres corridas reales, cada una con 94 passed / 4 skipped:

| Escenario | Qué hizo | Duración | Estado final |
|---|---|---|---|
| Stack ya arriba (lo levantó el usuario) | reusó todo, sin rebuild | 1m13s | lo dejó arriba ✓ |
| Todo apagado | `colima start` + `supabase start` | 2m12s | bajó ambos ✓ |
| Migración 999 pendiente | detectó, `e2e:stack:up` completo + rebuild | 4m23s | bajó ambos ✓ |

Nota del tercer caso: `e2e:stack:up` reescribe `.env.local.e2e`, que es input del build, así
que fuerza un rebuild de `.next-e2e`. Es el comportamiento fail-closed correcto y solo ocurre
cuando el esquema realmente quedó viejo.

## Out of scope

- Paralelizar Playwright (`workers: 1`): los specs comparten fixtures de una sola BD.
- Limpiar los usuarios huérfanos que acumulan los tests (`e2e-import-*`, `e2e-reg-*`).

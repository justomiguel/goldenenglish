# Mini-spec — E2E precommit: build de producción + fixtures idempotentes

Fecha: 2026-08-04 · Estado: aprobado por el usuario en sesión

## Problema 1 — la suite no es idempotente (bloqueante real)

Los specs mutan fixtures compartidas y no las restauran. `critical-parent-ward-email`
le cambia el email al alumno; después de una corrida completa la base queda así:

```
e2e-ward-msf3x3qs@example.test   ← era e2e-student@example.test
```

Como `auth.setup.ts` loguea a `e2e-student@example.test`, **la segunda corrida seguida
siempre falla** en el login del alumno, y los 17 proyectos quedan bloqueados detrás del
setup. Es decir: el gate solo podía pasar una vez por cada `e2e:stack:up` (5+ minutos).

`supabase/seeds/e2e/seed-admin.sql` ya está escrito para ser re-ejecutable (matchea por
email *o* DNI justamente para esto) y corre en **~1 segundo**. No se estaba usando entre
corridas.

## Problema 2 — el dev server compila rutas bajo demanda

`npm run test:e2e:precommit` está **100% bloqueado**, no flaky:

```
✘ 1 [setup] › e2e/auth.setup.ts:53:6 › authenticate roles (3.0m)
✘ 2 [setup] › e2e/auth.setup.ts:53:6 › authenticate roles (retry #1) (3.0m)
1 failed
97 did not run
E2E BASELINE exit=1 duracion=8m24s
```

Los 17 proyectos de Playwright dependen de `setup`, así que al caerse el setup no corre
ningún test. La causa es el `webServer` en modo dev (`next dev --webpack`), que compila
rutas bajo demanda:

```
○ Compiling /[locale]/dashboard/student ...
GET /es/dashboard/student 200 in 17.7s (next.js: 15.5s)
GET /es/dashboard         200 in 17.2s
POST /api/analytics/events 200 in 17.1s
⨯ Error: aborted { code: 'ECONNRESET' }
```

`auth.setup.ts` hace 3 logins secuenciales con `setup.setTimeout(180_000)`. A ~17 s por
primera visita de cada ruta, el presupuesto se agota antes de terminar.

Evidencia de que esto se viene parcheando en vez de resolverse: `e2e/helpers/gotoIsolated.ts`
("Cold `next dev --webpack` compiles often abort the first navigation", 3 reintentos),
el bucle de 3 intentos en `loginOnPage` y el comentario "Cold webpack compile can 500 once".

## Intent

Servir la app de e2e desde un **build de producción** (`next build` + `next start`) en vez
de `next dev`. Las rutas quedan precompiladas, así que desaparece el costo de compilación
on-demand que causa a la vez la lentitud y los `ERR_ABORTED`.

## Cambios

1. `scripts/run-e2e-precommit.mjs` — reaplica `seed-admin.sql` antes de Playwright, para que
   la suite sea idempotente. Escape: `E2E_SKIP_SEED=1`.
2. `scripts/run-e2e-precommit.mjs` — corre `next build` (con `GE_DEV_TARGET=e2e`, por lo que
   `next.config.ts` ya enruta a `distDir=.next-e2e`) antes de lanzar Playwright, y lo saltea
   cuando `.next-e2e` es más nuevo que todos los inputs del build. Escape: `E2E_SKIP_BUILD=1`.
3. `playwright.config.ts` — `webServer.command` pasa de `next dev --webpack` a `next start`.
4. `next.config.ts` — desactiva Serwist cuando `GE_DEV_TARGET=e2e`, para que el build de e2e
   no reescriba `public/sw.js` (el precommit hace `npm run build && git add public/sw.js`;
   un segundo build con otro env cambiaría el archivo ya stageado).

## Done when

- [x] `npm run test:e2e:precommit` termina con exit 0.
- [x] El `setup` deja de agotar su timeout de 3 min.
- [x] **Dos corridas seguidas** pasan sin `e2e:stack:up` en el medio.
- [x] Ejecución de Playwright bien por debajo del baseline de 8m24s.
- [x] `public/sw.js` no cambia por correr los e2e.

## Resultado medido

| | Antes | Después |
|---|---|---|
| Corrida 1 | 1 failed, 97 did not run (8m24s) | 94 passed, 4 skipped |
| Corrida 2 seguida | 1 failed, 97 did not run | 94 passed, 4 skipped |
| Playwright | nunca terminaba | ~1.7 min |
| Página más lenta | ~17 s (compilación) | < 1 s |

## Out of scope

- Subir `workers` / `fullyParallel`: los specs comparten fixtures de una sola BD sembrada
  (pagos, enroll), así que paralelizar es un cambio de aislamiento aparte.
- Sacar los e2e del precommit (regla `34-precommit-e2e.mdc`): solo si este arreglo no alcanza.
- Reescribir los reintentos de `gotoIsolated` / `loginOnPage`: quedan como red de seguridad.

# Cobertura Vitest — alcance y deuda

## Dos comandos

| Comando | Alcance instrumentado | Umbral |
|--------|------------------------|--------|
| **`npm run test:coverage`** (precommit / CI) | `src/lib/**`, `src/hooks/**`, `src/proxy.ts` | **≥90%** líneas, statements y ramas; funciones 89% |

El script **`npm run precommit`** (Husky) ejecuta además `eslint`, `scripts/precommit-verify.mjs` y **`npm run build`** antes de la cobertura.
| **`npm run test:coverage:full`** | Además `src/components/**` y `src/app/**` (sin `page`/`layout`/opengraph) | Sin fallo por umbral (0%); informe para subir el gate |

Variable de entorno: `VITEST_COVERAGE_FULL=1` (el script `test:coverage:full` la define).

## Exclusiones (solo shells RSC)

- `page.tsx`, `layout.tsx`, `opengraph-image.tsx`: entrypoints; la lógica vive en módulos importados, acciones y tests RTL.

**No** hay exclusiones por carpeta de producto (admin, dashboard, analytics, etc.): el árbol amplio se mide con `test:coverage:full` hasta que el porcentaje alcance el objetivo y el equipo pueda **unificar** el gate al 90% sobre el include completo.

## Objetivo

Llevar el informe de `test:coverage:full` por encima del 90% con pruebas reales; entonces se podrá eliminar el modo dual y exigir 90% sobre el `include` completo en un solo comando.

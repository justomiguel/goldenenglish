# ADR: Shell con sidebar lateral para el dashboard del alumno

## Contexto

Hoy `src/app/[locale]/dashboard/student/layout.tsx` tiene su navegación **embebida** como un `<header>` con `<nav>` horizontal de `Link`s y `flex-wrap`, mientras que admin y profesor evolucionaron a un patrón estable de **shell + sidebar lateral**:

- `src/components/dashboard/AdminDashboardShell.tsx` + `AdminSidebar` + `AdminMobileDrawer` + `AdminBreadcrumb` + `AdminChromeHeader`.
- `src/components/dashboard/TeacherDashboardShell.tsx` + `TeacherSidebar` + `TeacherMobileDrawer` + `TeacherBreadcrumb` + `TeacherChromeHeader`.

Esto produce **inconsistencia de chrome** entre roles, **menos pista visual de “dónde estoy”** (no hay breadcrumb ni grupos), nav que crece a lo ancho cada vez que se añade una sección, y duplicación de mark-up de header en el propio `layout.tsx` del alumno.

Reglas relevantes:

- **`01-design-system.mdc`** — tokens y agrupación visual coherente entre dashboards.
- **`03-architecture.mdc`** — un componente principal por archivo, ≤250 líneas, lógica visible separada del layout.
- **`05-pwa-mobile-native.mdc`** — alumno es **Tier A** (público end-user). Hoy ningún dashboard del repo tiene una segunda implementación PWA-native dedicada (admin/teacher viven con un solo shell que oculta sidebar en mobile y muestra drawer). Esta ADR **iguala** al alumno a ese patrón, **no** introduce todavía la rama PWA-native dedicada (ver consecuencias).
- **`09-i18n-copy.mdc`** — toda nueva copy va a `src/dictionaries/{en,es}.json`.

## Decisión

Crear un **shell propio del alumno** que reproduzca el patrón de profesor, con piezas paralelas en `src/components/dashboard/`:

1. `studentSidebarNavGroups.tsx` — función pura `buildStudentSidebarNavGroups()` que devuelve los grupos con `href`, `label`, `icon`, `tip`.
2. `StudentSidebarNavContent.tsx` (`'use client'`) — render del nav con marca de “activo” por `usePathname`, `variant: "desktop" | "mobile"`.
3. `StudentSidebar.tsx` — `<aside>` desktop que monta el nav.
4. `StudentChromeHeader.tsx` — header sticky con logo de marca, badge `Student`, `LanguageSwitcher`, `SignOutButton` y enlace `View website`.
5. `StudentMobileDrawer.tsx` (`'use client'`) — botón `Menu` + `<dialog>` modal con el mismo nav y footer (idioma, salir, volver al sitio).
6. `StudentBreadcrumb.tsx` (`'use client'`) — breadcrumb derivado de `usePathname` con segmentos legibles.
7. `StudentDashboardShell.tsx` — composición del shell que reciben `locale`, `dict`, `brand` y renderiza `children`.

Refactor de `src/app/[locale]/dashboard/student/layout.tsx`: queda **solo** con auth/role guard + `getDictionary` + `getBrandPublic` y delega chrome a `StudentDashboardShell`. Los `href` de las secciones (overview/calendar/payments/billing/messages/profile) y la URL del perfil siguen exactamente como hoy: `/{locale}/dashboard/student[...]` y `/{locale}/dashboard/profile`.

I18n: nuevas claves bajo `dashboard.studentNav` (labels, tips, agrupaciones, breadcrumb) y `dashboard.studentChrome` (header), en `en.json` y `es.json`. Las claves históricas `navHome`/`navCalendar`/`navPayments`/`navBilling`/`navMessages`/`navProfile`/`navAria` permanecen porque aún son consumidas por otros usos (`mobileNav`, etiquetas en pantallas internas), pero el shell pasa a usar las nuevas.

## Opciones consideradas

1. **Solo extraer un componente `StudentNav`** dentro del header actual (mínimo cambio). Descartado: no resuelve la inconsistencia con admin/teacher (sin sidebar lateral, sin breadcrumb, sin grupos). El `layout.tsx` seguiría con responsabilidades mezcladas.
2. **Hacer “Tier A puro” ahora** — implementar dos árboles separados (`StudentDashboardShellDesktop` + `StudentDashboardShellMobilePwa`) seleccionados por `useAppSurface()`. Descartado en esta PR: ningún dashboard del repo lo hace todavía; sería una refactorización mayor sin precedente que conviene tratar con la PWA shell del alumno completa, no solo el chrome del dashboard. Queda como follow-up con su propio ADR.
3. **Reutilizar `TeacherDashboardShell`** parametrizándolo por rol. Descartado: ya tiene su propio diccionario, breadcrumb y `adminNav` específicos; meter una tercera variante por flags rompe el modelo y pelea con `03-architecture` (un componente principal por archivo, sin booleans proliferantes).

## Consecuencias

Positivas:

- Chrome consistente entre admin/teacher/alumno; mejor orientación (sidebar + breadcrumb + grupos) y patrón fácil de extender al añadir secciones.
- `layout.tsx` del alumno queda fino (auth + delegación), alineado con `03-architecture`.
- Mismo `LanguageSwitcher` y `SignOutButton` en header → menos drift de UX.

Riesgos / follow-ups:

- **Sigue siendo Tier A sin árbol PWA dedicado**. Esta PR no rompe el comportamiento mobile del alumno (drawer + safe-area en clases del header), pero **no** resuelve `05-pwa-mobile-native` por completo. Próximo paso: ADR aparte para introducir `useAppSurface()` / `SurfaceMountGate` y un `StudentDashboardShellMobilePwa` cuando se aborde la experiencia PWA del alumno completa (incluyendo bottom-tab bar y safe-area).
- Tests: añadir `StudentDashboardShell.test.tsx` y `StudentSidebarNavContent.test.tsx` para fijar labels y `href`s; actualizar diccionarios mantiene `npm run test:coverage` en verde.
- Sin migración SQL, sin cambio de auth/RLS, sin nuevos contratos públicos.

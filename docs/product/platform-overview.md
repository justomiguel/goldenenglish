# Golden English Platform — Descripción de producto

Documento de referencia para sitio promocional, pitch comercial y alineación interna. Describe el **software** (plataforma educativa de Sistemas MV), no el copy de marketing de un instituto concreto (eso vive en `src/dictionaries/` y en el CMS de landing por tenant).

---

## Resumen ejecutivo

**Golden English Platform** es una plataforma educativa integral desarrollada por **Sistemas MV** para institutos de idiomas, centros de formación y academias que necesitan unificar sitio web, operación académica, cobranza y comunicación con familias en un solo sistema.

**Propuesta de valor (una línea):**  
Tu instituto con sitio profesional, portal para alumnos y familias, y back-office académico-financiero — multi-rol, multi-dispositivo y con la marca de cada institución.

---

## Problema que resuelve

Los centros educativos suelen repartir la operación entre planillas, WhatsApp, formularios sueltos, cobranza manual y un sitio desactualizado. Golden English Platform concentra **captación → matrícula → clases → pagos → comunicación → analítica** en una sola experiencia, con roles claros y trazabilidad para el equipo administrativo.

---

## Público objetivo

| Perfil | Qué obtiene |
|--------|-------------|
| **Directores y administración** | Visión institucional, usuarios, finanzas, CMS, analítica y auditoría |
| **Docentes** | Secciones, asistencia, calificaciones, calendario y mensajería |
| **Asistentes de aula** | Toma de asistencia en secciones asignadas |
| **Alumnos** | Tareas, evaluaciones, calendario, logros, pagos y mensajes |
| **Padres / tutores** | Seguimiento de hijos, progreso, pagos consolidados y comunicación |

---

## Módulos y features principales

### 1. Sitio web y marca propia

- Landing pública configurable: hero, historia, modalidades, niveles, certificaciones y CTA de inscripción.
- **CMS integrado**: plantillas de sitio, editor de copy (ES / EN / PT), imágenes por sección, tokens de diseño y temas activables.
- **Asistente de instalación** para nuevos institutos: cuenta admin, logo, favicon, contacto y parámetros operativos.
- **Multi-tenant**: mismo producto, distinta marca por despliegue (Golden English, Mozarthitos, Nago, Espacio Zenit, etc.).

Referencias técnicas: `docs/adr/2026-04-runtime-theming-and-landing-cms.md`, `docs/adr/2026-04-29-initial-site-setup-wizard.md`, `docs/runbooks/add-new-tenant.md`.

### 2. Captación e inscripciones

- Formulario público de inscripción con flujo de aprobación en admin.
- Preferencia de sección / nivel al registrarse.
- Cupones y promociones para campañas comerciales.
- Importación masiva de alumnos por CSV con feedback de jobs largos.

### 3. Gestión académica

- **Hub académico**: cohortes, secciones, horarios, matrículas y traslados entre secciones.
- **Asistencia y calificaciones** unificadas por sección.
- **Calendario maestro** institucional y calendario personal por rol.
- **Biblioteca de contenidos** y planificación por sección (tareas, evaluaciones formativas y sumativas).
- **Logros / badges** configurables para motivar al alumno.
- Alertas de **retención** (riesgo por faltas o bajo rendimiento).
- Cumpleaños visibles en el portal para fortalecer la comunidad educativa.

### 4. Finanzas y cobranza

- Planes de cuota por sección, grilla mensual y liquidación anual.
- Subida de comprobantes por familias; revisión y aprobación por staff.
- Vista unificada de deuda familiar (especialmente en móvil / PWA).
- Integración con pasarelas de pago (p. ej. Flow en Chile).
- Facturación, recibos y analítica financiera.

### 5. Comunicación

- Mensajería interna entre alumnos, padres, docentes y administración.
- Plantillas de email transaccional editables (inscripción, pagos, recuperación de contraseña, etc.).
- Recordatorios de clase vía WhatsApp.
- Feed **iCal** del calendario escolar para integrar con Google / Apple Calendar.

### 6. Portales por rol (web + móvil / PWA)

- Experiencias separadas y optimizadas para **escritorio** y **móvil / PWA** en flujos de alumno y familia.
- Dashboard docente independiente del panel admin (roles duales soportados).
- Perfiles, preferencias y cambio seguro de datos sensibles con re-autenticación y auditoría.

### 7. Seguridad, gobernanza y observabilidad

- Autenticación centralizada (Supabase Auth), roles y políticas RLS en base de datos.
- **Auditoría** de cambios críticos (académico, finanzas, identidad).
- **Analítica de uso** del sitio y embudos.
- Multi-idioma (español, inglés, portugués).
- SEO, accesibilidad y rendimiento como requisitos de producto.

---

## Diferenciadores

1. **Todo-en-uno** — No es solo un LMS ni solo un sitio: marketing + operación + portal familiar.
2. **White-label real** — Marca, colores, copy e imágenes por instituto sin fork de código.
3. **Pensado para familias** — Padres ven pagos, progreso y calendario de sus hijos en un solo lugar.
4. **Operación regional** — DNI, tutores, cuotas mensuales, convenios y flujos adaptados a institutos en Argentina / LATAM.
5. **Listo para escalar** — Multi-sitio, despliegues en Vercel, migraciones versionadas, seeds por tenant.

---

## Taglines sugeridos

- *De la inscripción al aula, en una sola plataforma.*
- *Tu instituto online, organizado y con la cara de tu marca.*
- *Académico, cobranza y comunicación — sin planillas ni apps sueltas.*

---

## Estructura sugerida para el sitio promocional

| Sección | Contenido |
|---------|-----------|
| **Hero** | “La plataforma que conecta tu instituto con alumnos y familias” |
| **Problema / solución** | Tres dolores típicos + tres beneficios concretos |
| **Módulos** | Sitio · Académico · Finanzas · Comunicación · Portales |
| **Por rol** | Tabs o bloques: Admin · Docente · Alumno · Padre |
| **Multi-marca** | Capturas o casos de distintos tenants |
| **Confianza** | Seguridad, auditoría, i18n, PWA, accesibilidad |
| **CTA** | Demo · contacto Sistemas MV · “Solicitar instalación” |

---

## Qué **no** es este documento

| Recurso | Ubicación | Uso |
|---------|-----------|-----|
| Copy de landing de un **instituto** (cursos, modalidades, historia) | `src/dictionaries/es.json` → `landing.*` | Sitio público del tenant |
| Editor de contenido del sitio | Admin → Contenido y temas (`/dashboard/admin/cms`) | Operadores del instituto |
| Decisiones técnicas | `docs/adr/` | Ingeniería y revisión de cambios |
| Alta de nuevo tenant | `docs/runbooks/add-new-tenant.md` | Operaciones e implementación |

---

## Crédito de plataforma

Copy canónico en producto (no duplicar en UI sin pasar por diccionarios si es visible al usuario):

- ES: *Plataforma educativa · Sistemas MV*
- EN: *Education platform · Sistemas MV*

Ver `src/dictionaries/es.json` → `siteSetup.platformCredit`.

---

## Mantenimiento

Actualizar este documento cuando se incorporen módulos visibles de producto (nuevos portales, integraciones, capacidades comerciales). Para cambios de arquitectura o contratos públicos, complementar con ADR en `docs/adr/` según `10-engineering-governance.mdc`.

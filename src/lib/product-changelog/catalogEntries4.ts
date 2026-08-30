import type { ProductChangelogEntry } from "@/lib/product-changelog/catalogTypes";
import { changelogT as t } from "@/lib/product-changelog/catalogTypes";

export const ENTRIES: readonly ProductChangelogEntry[] = [
  {
    id: "birthdays-assistant",
    date: "2026-05-07",
    area: "admin",
    title: t(
      "Cumpleaños, calendario y portal de asistentes",
      "Birthdays, calendar, and staff-assistant portal",
      "Aniversários, calendário e portal de assistentes",
    ),
    summary: t(
      "El calendario muestra cumpleaños. El personal asistente tiene su propio portal y puede ver asistencia global.",
      "The calendar shows birthdays. Staff assistants get their own portal and can open global attendance.",
      "O calendário mostra aniversários. O pessoal assistente tem o seu portal e pode ver a assiduidade global.",
    ),
  },
  {
    id: "multi-tenant-themes",
    date: "2026-05-02",
    area: "cms",
    title: t(
      "Temas por instituto: Mozarthitos, Nago y marca neutra",
      "Per-institute themes: Mozarthitos, Nago, and a neutral brand",
      "Temas por instituto: Mozarthitos, Nago e marca neutra",
    ),
    summary: t(
      "Cada instituto puede tener su tema, assets de marca y landing. Aparecieron Mozarthitos, Nago y una marca neutra de partida.",
      "Each institute can have its theme, brand assets, and landing. Mozarthitos, Nago, and a greenfield neutral brand shipped.",
      "Cada instituto pode ter o seu tema, assets de marca e landing. Chegaram Mozarthitos, Nago e uma marca neutra de partida.",
    ),
  },
  {
    id: "setup-wizard-dni",
    date: "2026-04-29",
    area: "admin",
    title: t(
      "Asistente de instalación y login por DNI",
      "First-run setup wizard and login by national ID",
      "Assistente de instalação e login por documento",
    ),
    summary: t(
      "Un instituto nuevo se configura con un asistente (marca y admin). También se puede entrar o recuperar la cuenta con DNI, más un catálogo de badges.",
      "A new institute is configured with a wizard (brand and admin). People can also sign in or recover with national ID, plus a badges catalog.",
      "Um instituto novo configura-se com um assistente (marca e admin). Também se entra ou recupera a conta com o documento, mais um catálogo de badges.",
    ),
  },
  {
    id: "audit-badges",
    date: "2026-04-27",
    area: "admin",
    title: t(
      "Auditoría de staff y logros de alumnos",
      "Staff audit log and student badges",
      "Auditoria de staff e conquistas dos alunos",
    ),
    summary: t(
      "Admin puede ver quién cambió datos sensibles. Los alumnos tienen un catálogo de logros gestionable.",
      "Admins can see who changed sensitive data. Students have a manageable badges catalog.",
      "A admin pode ver quem alterou dados sensíveis. Os alunos têm um catálogo de conquistas gerível.",
    ),
  },
  {
    id: "section-health-assessments",
    date: "2026-04-26",
    area: "academic",
    title: t(
      "Salud de la sección, pestañas y evaluaciones",
      "Section health, shell tabs, and assessments",
      "Saúde da turma, separadores e avaliações",
    ),
    summary: t(
      "Cada sección tiene pestañas (alumnos, salud, evaluaciones). Se ven gráficos de salud y un panel de assessments.",
      "Each section has tabs (students, health, assessments). Health charts and an assessments panel are available.",
      "Cada turma tem separadores (alunos, saúde, avaliações). Veem-se gráficos de saúde e um painel de assessments.",
    ),
  },
  {
    id: "learning-routes-email",
    date: "2026-04-25",
    area: "academic",
    title: t(
      "Rutas de aprendizaje, contenidos y editor de emails",
      "Learning routes, contents, and email-template editor",
      "Rotas de aprendizagem, conteúdos e editor de emails",
    ),
    summary: t(
      "Hay contenidos reutilizables, rutas globales y tareas para alumno/padre/docente. Los emails del producto se editan en un editor visual.",
      "Reusable contents, global learning routes, and student/parent/teacher tasks shipped. Product emails are edited in a visual editor.",
      "Há conteúdos reutilizáveis, rotas globais e tarefas para aluno/encarregado/docente. Os emails do produto editam-se num editor visual.",
    ),
  },
  {
    id: "scholarships-collections",
    date: "2026-04-25",
    area: "finance",
    title: t(
      "Becas, cobranza de cohorte y matrícula",
      "Scholarships, cohort collections, and enrollment fees",
      "Bolsas, cobrança de coorte e matrícula",
    ),
    summary: t(
      "Se pueden cargar becas y exenciones, ver cobranza por cohorte y gestionar la matrícula con su cola de comprobantes.",
      "Scholarships and exemptions can be applied, cohort collections reviewed, and enrollment fees managed with a receipt queue.",
      "Podem carregar-se bolsas e isenções, ver a cobrança por coorte e gerir a matrícula com a sua fila de comprovativos.",
    ),
  },
  {
    id: "password-fee-plans",
    date: "2026-04-18",
    area: "finance",
    title: t(
      "Planes de cuota, recuperar contraseña y dashboard del alumno",
      "Fee plans, password reset, and the student dashboard",
      "Planos de mensalidade, recuperar palavra-passe e dashboard do aluno",
    ),
    summary: t(
      "Cada sección tiene planes de cuota. Se puede recuperar la contraseña por email. El alumno tiene su propio dashboard y el tutor ve finanzas.",
      "Each section has fee plans. Passwords can be reset by email. Students get their own dashboard and tutors can see finances.",
      "Cada turma tem planos de mensalidade. Pode recuperar-se a palavra-passe por email. O aluno tem o seu dashboard e o encarregado vê as finanças.",
    ),
  },
  {
    id: "cms-academic-foundation",
    date: "2026-04-17",
    area: "cms",
    title: t(
      "Editor del landing y secciones académicas",
      "Landing editor and academic sections",
      "Editor do landing e turmas académicas",
    ),
    summary: t(
      "El sitio público se arma con bloques y tokens de diseño. Nacen las secciones académicas, asistencia, calendario y el portal de admin.",
      "The public site is built with blocks and design tokens. Academic sections, attendance, calendar, and the admin portal landed.",
      "O site público monta-se com blocos e tokens de design. Nascem as turmas académicas, assiduidade, calendário e o portal de admin.",
    ),
  },
  {
    id: "teacher-portal-retention",
    date: "2026-04-13",
    area: "academic",
    title: t(
      "Portal docente, facturación y alertas de retención",
      "Teacher portal, billing, and retention alerts",
      "Portal docente, faturação e alertas de retenção",
    ),
    summary: t(
      "Los docentes tienen su espacio. Admin ve un hub académico, facturación y alertas cuando un alumno corre riesgo de irse.",
      "Teachers have their own workspace. Admins get an academics hub, billing, and alerts when a student is at risk of leaving.",
      "Os docentes têm o seu espaço. A admin vê um hub académico, faturação e alertas quando um aluno corre risco de sair.",
    ),
  },
  {
    id: "messaging-registrations-analytics",
    date: "2026-04-12",
    area: "communications",
    title: t(
      "Mensajería, inscripciones web y analítica",
      "Messaging, web registrations, and analytics",
      "Mensagens, inscrições web e analítica",
    ),
    summary: t(
      "Llegan mensajes internos, el formulario público de inscripción, importación de usuarios y un tablero de tráfico.",
      "Internal messaging, the public registration form, user import jobs, and a traffic analytics board shipped.",
      "Chegam mensagens internas, o formulário público de inscrição, importação de utilizadores e um painel de tráfego.",
    ),
  },
  {
    id: "product-launch",
    date: "2026-04-10",
    area: "admin",
    title: t(
      "Nace el producto: dashboards por rol, landing y PWA",
      "The product launches: role dashboards, landing, and PWA",
      "Nasce o produto: dashboards por papel, landing e PWA",
    ),
    summary: t(
      "Primera versión usable: cada rol tiene su dashboard, hay landing, preview para WhatsApp e íconos de app.",
      "First usable release: each role has a dashboard, plus a landing, WhatsApp link preview, and app icons.",
      "Primeira versão utilizável: cada papel tem o seu dashboard, há landing, pré-visualização para WhatsApp e ícones da app.",
    ),
  },
];

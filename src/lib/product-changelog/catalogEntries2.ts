import type { ProductChangelogEntry } from "@/lib/product-changelog/catalogTypes";
import { changelogT as t } from "@/lib/product-changelog/catalogTypes";

export const ENTRIES: readonly ProductChangelogEntry[] = [
  {
    id: "parent-multi-section-pay",
    date: "2026-08-27",
    area: "parent",
    title: t(
      "Pago mensual de varias secciones y links para compartir",
      "Pay several sections at once and share enrollment links",
      "Pagamento mensal de várias turmas e links para partilhar",
    ),
    summary: t(
      "Un tutor puede pagar la mensualidad de más de una sección en un solo flujo, y compartir el link de inscripción de una sección.",
      "A guardian can pay monthly fees for more than one section in one flow, and share a section enrollment link.",
      "Um encarregado pode pagar a mensalidade de várias turmas num só fluxo e partilhar o link de inscrição da turma.",
    ),
  },
  {
    id: "existing-student-registration",
    date: "2026-08-25",
    area: "registrations",
    title: t(
      "Inscripción de alumnos existentes y checklist de primera clase",
      "Existing-student registration and first-class checklist",
      "Inscrição de alunos existentes e checklist da primeira aula",
    ),
    summary: t(
      "El formulario público reconoce alumnos que ya están en el instituto. Admin ve un checklist para la primera clase y puede controlar envíos de email.",
      "The public form recognizes students already in the institute. Admins get a first-class checklist and can gate email sends.",
      "O formulário público reconhece alunos que já estão no instituto. A admin vê um checklist da primeira aula e pode controlar envios de email.",
    ),
  },
  {
    id: "admin-ops-reskin",
    date: "2026-08-25",
    area: "admin",
    title: t(
      "Renovación visual de las pantallas operativas de admin",
      "Visual refresh of admin operations screens",
      "Renovação visual dos ecrãs operativos de admin",
    ),
    summary: t(
      "El día a día de admin (listados, hubs y flujos) quedó más fácil de escanear, con la misma información de siempre.",
      "Day-to-day admin lists, hubs, and flows are easier to scan, with the same information as before.",
      "O dia a dia de admin (listas, hubs e fluxos) ficou mais fácil de varrer, com a mesma informação de sempre.",
    ),
  },
  {
    id: "enrollment-links-tickets",
    date: "2026-08-09",
    area: "registrations",
    title: t(
      "Links de inscripción por sección, notas de cuidado y packs de tickets",
      "Section enrollment links, care notes, and event ticket packs",
      "Links de inscrição por turma, notas de cuidado e packs de bilhetes",
    ),
    summary: t(
      "Cada sección puede tener un link para inscribirse. Hay notas de cuidado del alumno y packs de tickets para eventos.",
      "Each section can have its own enrollment link. Student care notes and event ticket packs are available.",
      "Cada turma pode ter um link de inscrição. Há notas de cuidado do aluno e packs de bilhetes para eventos.",
    ),
  },
  {
    id: "guided-grading",
    date: "2026-08-07",
    area: "academic",
    title: t(
      "Camino guiado para cargar notas",
      "Guided path for entering grades",
      "Caminho guiado para lançar notas",
    ),
    summary: t(
      "Docentes y admin siguen un recorrido más claro para calificar. Los tutores eligen la sección al ver el progreso.",
      "Teachers and admins follow a clearer path when grading. Guardians pick a section when they open progress.",
      "Docentes e admin seguem um percurso mais claro para avaliar. Os encarregados escolhem a turma ao ver o progresso.",
    ),
  },
  {
    id: "parent-feedback-pwa",
    date: "2026-08-07",
    area: "parent",
    title: t(
      "Línea de tiempo de comentarios del docente y tirar para actualizar",
      "Teacher feedback timeline and pull-to-refresh",
      "Linha do tempo de comentários do docente e puxar para atualizar",
    ),
    summary: t(
      "El portal de familias muestra el historial de comentarios del docente. En el celular se actualiza tirando hacia abajo.",
      "The family portal shows a teacher-feedback timeline. On mobile, pull down to refresh.",
      "O portal das famílias mostra o histórico de comentários do docente. No telemóvel atualiza-se puxando para baixo.",
    ),
  },
  {
    id: "admin-menu-scan",
    date: "2026-08-07",
    area: "admin",
    title: t(
      "Menú de admin agrupado para encontrarlo más rápido",
      "Admin menu grouped so it can be scanned",
      "Menu de admin agrupado para encontrar mais depressa",
    ),
    summary: t(
      "Las destinos de admin se reagruparon y renombraron para que el menú se lea de un vistazo.",
      "Admin destinations were grouped and renamed so the menu can be scanned at a glance.",
      "Os destinos de admin foram agrupados e renomeados para o menu se ler de relance.",
    ),
  },
  {
    id: "section-rename",
    date: "2026-08-06",
    area: "academic",
    title: t(
      "Renombrar secciones desde el encabezado",
      "Rename sections from the header",
      "Mudar o nome das turmas a partir do cabeçalho",
    ),
    summary: t(
      "El nombre de una sección se edita en el mismo encabezado y queda alineado en configuración y listados.",
      "A section name can be edited in the header and stays aligned in settings and lists.",
      "O nome de uma turma edita-se no cabeçalho e fica alinhado na configuração e nas listas.",
    ),
  },
  {
    id: "landing-lead",
    date: "2026-08-07",
    area: "site",
    title: t(
      "La portada pública va al grano",
      "The public home leads with what people came for",
      "A página inicial pública vai ao essencial",
    ),
    summary: t(
      "El landing abre con lo que las familias buscan primero: clases, horarios e inscripción, no con un bloque genérico.",
      "The landing now opens with what families came for: classes, schedule, and sign-up, not a generic block.",
      "O landing abre com o que as famílias procuram primeiro: aulas, horários e inscrição, não um bloco genérico.",
    ),
  },
  {
    id: "liora-theme",
    date: "2026-08-06",
    area: "cms",
    title: t(
      "Tema Liora Studio para el sitio público",
      "Liora Studio marketing theme",
      "Tema Liora Studio para o site público",
    ),
    summary: t(
      "Hay un tema de marketing Liora Studio listo para el sitio y el tenant correspondiente.",
      "A Liora Studio marketing theme is wired for the public site and its tenant.",
      "Há um tema de marketing Liora Studio pronto para o site e o tenant correspondente.",
    ),
  },
  {
    id: "section-hub-pwa",
    date: "2026-07-25",
    area: "academic",
    title: t(
      "Hub de sección, tours para tutores e instalar la app",
      "Section hub, parent tours, and PWA install prompt",
      "Hub da turma, tours para encarregados e instalar a app",
    ),
    summary: t(
      "La sección tiene un hub más claro. Los tutores pueden seguir tours de ayuda y se les ofrece instalar la app en el teléfono.",
      "The section hub is clearer. Guardians can follow help tours and are offered to install the app on their phone.",
      "A turma tem um hub mais claro. Os encarregados podem seguir tours de ajuda e instalam a app no telemóvel.",
    ),
  },
  {
    id: "help-tours-excel",
    date: "2026-07-11",
    area: "admin",
    title: t(
      "Tours de ayuda, bandeja de mensajes y Excel de usuarios",
      "Help tours, messages inbox, and users Excel",
      "Tours de ajuda, caixa de mensagens e Excel de utilizadores",
    ),
    summary: t(
      "Admin puede recorrer tours de pantallas, revisar la bandeja de mensajes y exportar o importar usuarios en Excel.",
      "Admins can walk through screen tours, review the messages inbox, and export or import users in Excel.",
      "A admin pode percorrer tours de ecrãs, rever a caixa de mensagens e exportar ou importar utilizadores em Excel.",
    ),
  },
];

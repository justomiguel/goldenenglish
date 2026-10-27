import type { ProductChangelogEntry } from "@/lib/product-changelog/catalogTypes";
import { changelogT as t } from "@/lib/product-changelog/catalogTypes";

export const ENTRIES: readonly ProductChangelogEntry[] = [
  {
    id: "teacher-birthdays-view-as",
    date: "2026-10-27",
    area: "academic",
    title: t(
      "Los cumpleaños del docente aparecen al ver como",
      "Teacher birthdays show in view-as",
      "Os aniversários do professor aparecem ao ver como",
    ),
    summary: t(
      "Al ver el portal de un docente, el calendario muestra los cumpleaños de sus alumnos.",
      "When you view a teacher portal, the calendar shows that teacher's student birthdays.",
      "Ao ver o portal de um professor, o calendário mostra os aniversários dos alunos.",
    ),
  },
  {
    id: "admin-pwa-mobile-views",
    date: "2026-10-27",
    area: "admin",
    title: t(
      "Vistas móviles más limpias en secciones, directorios y cobros",
      "Cleaner mobile views in sections, directories, and collections",
      "Vistas móveis mais limpas em turmas, diretórios e cobranças",
    ),
    summary: t(
      "En el celular, la lista de alumnos de una sección usa tarjetas con estados traducidos y traslado directo, los directorios aprovechan todo el ancho y cobranza muestra los doce meses en dos columnas.",
      "On mobile, the section student list uses cards with translated statuses and direct transfers, directories use the full width, and collections show the twelve months in two columns.",
      "No celular, a lista de alunos de uma turma usa cartões com estados traduzidos e transferência direta, os diretórios aproveitam toda a largura e a cobrança mostra os doze meses em duas colunas.",
    ),
  },
  {
    id: "student-academic-exams",
    date: "2026-10-27",
    area: "academic",
    title: t(
      "El tab académico lista las evaluaciones",
      "The academic tab lists exams",
      "A aba acadêmica lista as avaliações",
    ),
    summary: t(
      "En el perfil de un alumno, el tab académico muestra cada evaluación de la clase. El nombre abre la corrección.",
      "On a student profile, the academic tab shows each class exam. The name opens the grading page.",
      "No perfil de um aluno, a aba acadêmica mostra cada avaliação da turma. O nome abre a correção.",
    ),
  },
  {
    id: "admin-home-extra-cards",
    date: "2026-10-27",
    area: "admin",
    title: t(
      "Cobros, eventos y pulso ocupan menos alto",
      "Collections, events, and pulse use less height",
      "Cobranças, eventos e pulso ocupam menos altura",
    ),
    summary: t(
      "En el inicio del admin, esas tres tarjetas quedan en una fila corta, como pagos.",
      "On the admin home, those three cards sit in a short row, like payments.",
      "No início do admin, esses três cartões ficam numa linha curta, como pagamentos.",
    ),
  },
  {
    id: "student-academic-notes",
    date: "2026-10-27",
    area: "academic",
    title: t(
      "El tab académico muestra comentarios y notas",
      "The academic tab shows feedback and grades",
      "A aba acadêmica mostra comentários e notas",
    ),
    summary: t(
      "En el perfil de un alumno, el tab académico lista los últimos comentarios del docente y las notas publicadas.",
      "On a student profile, the academic tab lists the latest teacher comments and published grades.",
      "No perfil de um aluno, a aba acadêmica lista os últimos comentários do professor e as notas publicadas.",
    ),
  },
  {
    id: "student-academic-courses",
    date: "2026-10-27",
    area: "academic",
    title: t(
      "El tab académico muestra cursos y profesores",
      "The academic tab shows courses and teachers",
      "A aba acadêmica mostra turmas e professores",
    ),
    summary: t(
      "En el perfil de un alumno, el tab académico lista cada curso con su profesor y sus asistentes. Ya no muestra el profesor asignado vacío.",
      "On a student profile, the academic tab lists each course with its teacher and assistants. It no longer shows an empty assigned teacher.",
      "No perfil de um aluno, a aba acadêmica lista cada turma com o professor e os assistentes. Já não mostra o professor designado vazio.",
    ),
  },
  {
    id: "person-name-opens-profile",
    date: "2026-10-27",
    area: "admin",
    title: t(
      "El nombre abre el perfil",
      "The name opens the profile",
      "O nome abre o perfil",
    ),
    summary: t(
      "En las listas de admin, el nombre de un alumno, padre u otro usuario abre su perfil.",
      "In admin lists, the name of a student, parent, or other user opens that profile.",
      "Nas listas de admin, o nome de um aluno, responsável ou outro usuário abre o perfil.",
    ),
  },
  {
    id: "section-area-opens-on-click",
    date: "2026-10-27",
    area: "academic",
    title: t(
      "Estudiantes abre al hacer clic",
      "Students opens on click",
      "Estudantes abre ao clicar",
    ),
    summary: t(
      "En una sección, Estudiantes y las otras áreas abren al instante. La página ya no se queda en el inicio.",
      "In a section, Students and the other areas open at once. The page no longer stays on the hub.",
      "Numa turma, Estudantes e as outras áreas abrem na hora. A página já não fica no início.",
    ),
  },
  {
    id: "admin-messages-list-only",
    date: "2026-10-27",
    area: "communications",
    title: t(
      "La lista de mensajes muestra solo los mensajes",
      "The message list shows only the messages",
      "A lista de mensagens mostra só as mensagens",
    ),
    summary: t(
      "En la lista ya no aparecen responder, borrar ni la barra de acciones. Esas acciones quedan en el mensaje abierto.",
      "The list no longer shows reply, delete, or the action bar. Those actions stay on the open message.",
      "Na lista já não aparecem responder, apagar nem a barra de ações. Essas ações ficam na mensagem aberta.",
    ),
  },
  {
    id: "admin-sidebar-messages",
    date: "2026-10-27",
    area: "admin",
    title: t(
      "Mensajes en el menú lateral",
      "Messages in the side menu",
      "Mensagens no menu lateral",
    ),
    summary: t(
      "El menú lateral de admin incluye Mensajes. El número muestra los mensajes recientes.",
      "The admin side menu includes Messages. The number shows recent messages.",
      "O menu lateral de admin inclui Mensagens. O número mostra as mensagens recentes.",
    ),
  },
  {
    id: "admin-home-work-cards",
    date: "2026-10-27",
    area: "admin",
    title: t(
      "Pagos, inscripciones y mensajes más bajos",
      "Shorter payments, registrations, and messages cards",
      "Pagamentos, inscrições e mensagens mais baixos",
    ),
    summary: t(
      "En el inicio, esas tres tarjetas ocupan menos alto. El enlace queda a la derecha.",
      "On the home screen, those three cards use less height. The link sits on the right.",
      "No início, esses três cartões ocupam menos altura. O link fica à direita.",
    ),
  },
  {
    id: "mobile-stat-cards",
    date: "2026-10-27",
    area: "admin",
    title: t(
      "Las cifras del celular entran en la pantalla",
      "Phone stats fit the screen",
      "Os números do celular cabem na tela",
    ),
    summary: t(
      "En el celular, las tarjetas de cifras quedan en una grilla compacta. Ya no hace falta deslizarlas de lado.",
      "On a phone, the stat cards sit in a compact grid. You do not slide them sideways.",
      "No celular, os cartões de números ficam numa grelha compacta. Já não é preciso deslizá-los para o lado.",
    ),
  },
  {
    id: "admin-directory-cards-age-sort",
    date: "2026-10-27",
    area: "admin",
    title: t(
      "Listas de personas más claras",
      "Clearer people lists",
      "Listas de pessoas mais claras",
    ),
    summary: t(
      "Filtrar y ordenar van separados. Puedes acumular criterios de orden y filtrar alumnos y padres por edad. Las marcas de cuota tienen una leyenda.",
      "Filter and sort are separate. You can stack sort criteria and filter students and parents by age. Fee marks have a legend.",
      "Filtrar e ordenar ficam separados. Você pode acumular critérios de ordem e filtrar alunos e pais por idade. As marcas da mensalidade têm uma legenda.",
    ),
  },
  {
    id: "pwa-view-as-bar",
    date: "2026-10-27",
    area: "admin",
    title: t(
      "La barra del celular muestra el logo y las alertas",
      "The phone bar shows the logo and alerts",
      "A barra do celular mostra o logo e os alertas",
    ),
    summary: t(
      "En el celular, la barra de admin lleva el logo chico y el icono de alertas. Elegir un perfil para ver queda en la pantalla ancha.",
      "On a phone, the admin bar shows a small logo and the alerts icon. Choosing a profile to view stays on a wide screen.",
      "No celular, a barra de admin leva o logo pequeno e o ícone de alertas. Escolher um perfil para ver fica na tela larga.",
    ),
  },
  {
    id: "admin-weekly-digest",
    date: "2026-10-27",
    area: "communications",
    title: t(
      "Reporte semanal para admins",
      "Weekly admin report",
      "Relatório semanal para admins",
    ),
    summary: t(
      "Cada lunes los admins reciben un correo con lo que espera revisión y las cifras de la semana cerrada.",
      "Each Monday, admins get a mail with waiting work and the closed week's numbers.",
      "Cada segunda, os admins recebem um e-mail com o que espera revisão e os números da semana fechada.",
    ),
  },
];

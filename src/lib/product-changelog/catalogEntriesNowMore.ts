import type { ProductChangelogEntry } from "@/lib/product-changelog/catalogTypes";
import { changelogT as t } from "@/lib/product-changelog/catalogTypes";

export const ENTRIES: readonly ProductChangelogEntry[] = [
  {
    id: "persistent-page-tabs",
    date: "2026-10-27",
    area: "portal",
    title: t(
      "Las pestañas se quedan donde las dejaste",
      "Tabs stay where you left them",
      "As abas ficam onde você as deixou",
    ),
    summary: t(
      "Si sales de una pantalla y vuelves, ves la misma pestaña. Un enlace con la pestaña en la dirección sigue abriendo esa pestaña.",
      "If you leave a screen and come back, you see the same tab. A link with the tab in the address still opens that tab.",
      "Se você sai de uma tela e volta, vê a mesma aba. Um link com a aba no endereço ainda abre essa aba.",
    ),
  },
  {
    id: "academic-profile-custom-fields",
    date: "2026-10-27",
    area: "academic",
    title: t(
      "Campos académicos propios del instituto",
      "Institute academic fields",
      "Campos acadêmicos do instituto",
    ),
    summary: t(
      "Puedes agregar campos en el estado académico del alumno, mostrarlos como columnas y filtrar u ordenar Alumnos. El docente de la sección también puede completarlos.",
      "You can add fields on a student's academic status, show them as columns, and filter or sort Students. The section teacher can fill them too.",
      "Você pode adicionar campos no status acadêmico do aluno, mostrá-los como colunas e filtrar ou ordenar Alunos. O professor da turma também pode preenchê-los.",
    ),
  },
  {
    id: "next-cohort-registration-and-student-history",
    date: "2026-10-27",
    area: "registrations",
    title: t(
      "Inscripciones web para el próximo año, autocompletado por documento e historial del alumno",
      "Next-year web registrations, document autofill, and student history",
      "Inscrições web para o próximo ano, preenchimento por documento e histórico do aluno",
    ),
    summary: t(
      "Puedes elegir qué cohorte recibe las inscripciones públicas o nuevas inscripciones, autocompletar los datos ingresando primero el documento sin bloquear la edición, y consultar la pestaña Historial en la ficha de cada alumno.",
      "You can select which cohort receives public or new registrations, autofill student and guardian fields from the document while keeping fields editable, and view the History tab on each student profile.",
      "Você pode escolher qual coorte recebe as inscrições públicas ou novas inscrições, preencher os dados pelo documento mantendo a edição aberta e consultar a aba Histórico na ficha de cada aluno.",
    ),
  },
  {
    id: "publish-grade-without-email",
    date: "2026-10-27",
    area: "academic",
    title: t(
      "Publicar una nota sin enviar correo",
      "Publish a grade without email",
      "Publicar uma nota sem enviar e-mail",
    ),
    summary: t(
      "Al calificar puedes publicar la nota solo en el portal, o publicarla y avisar a los tutores por correo.",
      "When you grade, you can publish the grade in the portal only, or publish it and email guardians.",
      "Ao avaliar, você pode publicar a nota só no portal, ou publicá-la e avisar os responsáveis por e-mail.",
    ),
  },
  {
    id: "admin-message-outcome",
    date: "2026-10-27",
    area: "communications",
    title: t(
      "Los mensajes muestran qué pasó y el menú cuenta los no leídos",
      "Messages show what happened, and the menu counts unread",
      "As mensagens mostram o que aconteceu e o menu conta as não lidas",
    ),
    summary: t(
      "En cada mensaje ves si se leyó, si se respondió y quién abrió WhatsApp o el correo. El número del menú cuenta solo los no leídos.",
      "Each message shows if it was read, if it was answered, and who opened WhatsApp or mail. The menu count includes unread messages only.",
      "Em cada mensagem você vê se foi lida, se foi respondida e quem abriu o WhatsApp ou o e-mail. O número do menu conta só as não lidas.",
    ),
  },
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
];

import type { ProductChangelogEntry } from "@/lib/product-changelog/catalogTypes";
import { changelogT as t } from "@/lib/product-changelog/catalogTypes";

export const ENTRIES: readonly ProductChangelogEntry[] = [
  {
    id: "student-task-from-progress",
    date: "2026-11-04",
    area: "academic",
    title: t(
      "El alumno abre su tarea desde el progreso",
      "The student opens a task from progress",
      "O aluno abre a tarefa a partir do progresso",
    ),
    summary: t(
      "En Progreso, abres tu tarea y entregas la respuesta.",
      "On Progress, you open your task and submit the answer.",
      "Em Progresso, você abre a tarefa e entrega a resposta.",
    ),
  },
  {
    id: "trial-class-saves",
    date: "2026-11-04",
    area: "admin",
    title: t(
      "La clase de prueba queda agendada",
      "The trial class stays booked",
      "A aula experimental fica agendada",
    ),
    summary: t(
      "La familia agenda la prueba y el inicio del admin cuenta esa visita de la semana.",
      "A family books the trial and the admin home counts that visit for the week.",
      "A família agenda a experimental e o início do admin conta essa visita da semana.",
    ),
  },
{
    id: "admin-home-ops-cards",
    date: "2026-11-04",
    area: "admin",
    title: t(
      "El inicio del admin muestra correos, entradas, inscripciones y la jornada",
      "The admin home shows mail, tickets, enrollments, and the day",
      "O início do admin mostra e-mails, ingressos, inscrições e o dia",
    ),
    summary: t(
      "Ves el tope de 5000 correos, las entradas, la cohorte, las clases de hoy, las pruebas, los cupos, la espera y los pagos de evento.",
      "You see the 5000 mail cap, tickets, the cohort, today's classes, trials, seats, the waitlist, and event payments.",
      "Você vê o limite de 5000 e-mails, os ingressos, a turma, as aulas de hoje, as experimentais, as vagas, a espera e os pagamentos do evento.",
    ),
  },
  {
    id: "centrolisto-account-profile",
    date: "2026-11-04",
    area: "site",
    title: t(
      "Tu cuenta de CentroListo guarda el nombre y la foto",
      "Your CentroListo account stores your name and photo",
      "Sua conta do CentroListo guarda o nome e a foto",
    ),
    summary: t(
      "La barra abre cada sección sin pestañas. En Tu cuenta cambias el nombre y la foto. Google se activa en Supabase.",
      "The rail opens each section without tabs. In Your account you change the name and the photo. Google is enabled in Supabase.",
      "A barra abre cada seção sem abas. Em Sua conta você muda o nome e a foto. O Google é ativado no Supabase.",
    ),
  },
  {
    id: "centrolisto-panel-sidebar",
    date: "2026-11-04",
    area: "site",
    title: t(
      "El panel de CentroListo abre al ingresar y tiene una barra lateral",
      "The CentroListo panel opens after sign-in and has a sidebar",
      "O painel do CentroListo abre ao entrar e tem uma barra lateral",
    ),
    summary: t(
      "El dueño llega a sus sitios y el personal a la flota. La barra abre las herramientas de la cuenta.",
      "An owner lands on their sites and staff land on the fleet. The rail opens the account tools.",
      "O dono chega aos seus sites e a equipe à frota. A barra abre as ferramentas da conta.",
    ),
  },
  {
    id: "lms-academy-slices",
    date: "2026-11-03",
    area: "academic",
    title: t(
      "El alumno sigue el curso, ve avisos y puede imprimir el certificado",
      "A student continues the course, sees notices, and can print the certificate",
      "O aluno segue o curso, vê avisos e pode imprimir o certificado",
    ),
    summary: t(
      "La lección muestra sus materiales. El profesor devuelve la tarea y la sección publica un aviso.",
      "The lesson shows its materials. The teacher returns the task and the section posts a notice.",
      "A aula mostra os materiais. O professor devolve a tarefa e a turma publica um aviso.",
    ),
  },
  {
    id: "generic-institute-landings",
    date: "2026-11-03",
    area: "site",
    title: t(
      "Cada plantilla de instituto tiene su propia portada",
      "Each institute template has its own homepage",
      "Cada modelo de instituto tem a sua própria página inicial",
    ),
    summary: t(
      "Deportes, jardín, colegio, música e idiomas muestran secciones distintas, con movimiento suave.",
      "Sports, kindergarten, school, music, and languages show different sections, with quiet motion.",
      "Esportes, jardim, colégio, música e idiomas mostram seções distintas, com movimento suave.",
    ),
  },
  {
    id: "gestion-no-student-cap",
    date: "2026-11-03",
    area: "site",
    title: t(
      "Gestión y Ecosistema no publican un tope de alumnos",
      "Operations and Ecosystem do not publish a student cap",
      "Gestão e Ecossistema não publicam um limite de alunos",
    ),
    summary: t(
      "La comparación dice que la lista de alumnos está incluida, sin un número.",
      "The comparison says the student list is included, with no number.",
      "A comparação diz que a lista de alunos está incluída, sem um número.",
    ),
  },
  {
    id: "section-daily-rooms",
    date: "2026-11-03",
    area: "academic",
    title: t(
      "Una sección de Ecosistema puede tener clase híbrida o remota",
      "An Ecosystem section can meet hybrid or remote",
      "Uma turma do Ecossistema pode ser híbrida ou remota",
    ),
    summary: t(
      "Cada horario tiene una sala privada. El profesor y los alumnos entran desde su panel.",
      "Each weekly slot has a private room. The teacher and students join from their dashboard.",
      "Cada horário tem uma sala privada. O professor e os alunos entram pelo painel.",
    ),
  },
  {
    id: "free-site-contact-form",
    date: "2026-11-03",
    area: "site",
    title: t(
      "El sitio gratis muestra contacto, mapa y un formulario",
      "A free site shows contact, a map, and a form",
      "O site grátis mostra contato, mapa e um formulário",
    ),
    summary: t(
      "Cada sitio gratis envía hasta 50 mensajes al correo de la cuenta de CentroListo.",
      "Each free site sends up to 50 messages to the CentroListo account email.",
      "Cada site grátis envia até 50 mensagens para o e-mail da conta do CentroListo.",
    ),
  },
  {
    id: "lms-course-catalog-hierarchy",
    date: "2026-11-02",
    area: "academic",
    title: t(
      "Los cursos se agrupan por categoría, hashtag y campos del instituto",
      "Courses group by category, hashtag, and institute fields",
      "Os cursos se agrupam por categoria, hashtag e campos do instituto",
    ),
    summary: t(
      "Puedes crear una ruta como conjuntos de cursos y asignarla a una sección.",
      "You can create a route as sets of courses and assign it to a section.",
      "Você pode criar uma rota como conjuntos de cursos e atribuí-la a uma turma.",
    ),
  },
  {
    id: "centrolisto-ga-measurement-id",
    date: "2026-11-02",
    area: "admin",
    title: t(
      "CentroListo guarda el ID de Google Analytics",
      "CentroListo stores the Google Analytics id",
      "O CentroListo guarda o ID do Google Analytics",
    ),
    summary: t(
      "En el panel puedes pegar el ID de medición. La web lo usa en la siguiente visita, sin un deploy.",
      "In the panel you can paste the measurement id. The site uses it on the next visit, without a deploy.",
      "No painel você pode colar o ID de medição. O site o usa na próxima visita, sem um deploy.",
    ),
  },
  {
    id: "centrolisto-country-prices",
    date: "2026-11-02",
    area: "site",
    title: t(
      "CentroListo muestra precios por país",
      "CentroListo shows prices by country",
      "O CentroListo mostra preços por país",
    ),
    summary: t(
      "En el sitio puedes elegir Chile, Argentina, Uruguay o Paraguay. Los precios cambian con ese país. Argentina y Uruguay usan voseo.",
      "On the site you can choose Chile, Argentina, Uruguay, or Paraguay. Prices follow that country. Argentina and Uruguay use voseo.",
      "No site você pode escolher Chile, Argentina, Uruguai ou Paraguai. Os preços seguem esse país. Argentina e Uruguai usam voseo.",
    ),
  },
  {
    id: "registration-inscriptions-cohort-sections",
    date: "2026-11-02",
    area: "admin",
    title: t(
      "Inscripciones asigna secciones de la cohorte web",
      "Registrations assign sections from the web cohort",
      "Inscrições atribuem seções da coorte web",
    ),
    summary: t(
      "Al asignar una sección ves solo las de la cohorte de inscripciones web. El botón nombra esa cohorte y abre sus secciones.",
      "When you assign a section you see only the web inscriptions cohort. The button names that cohort and opens its sections.",
      "Ao atribuir uma seção você vê só a coorte de inscrições web. O botão nomeia essa coorte e abre as seções dela.",
    ),
  },
  {
    id: "centrolisto-three-offers",
    date: "2026-10-30",
    area: "site",
    title: t(
      "CentroListo muestra tres soluciones y sus precios",
      "CentroListo shows three solutions and their prices",
      "O CentroListo mostra três soluções e seus preços",
    ),
    summary: t(
      "Presencia es gratis con una plantilla. Gestión y Ecosistema tienen mensualidad en Chile. El diseño exclusivo se cotiza.",
      "Presence is free with a template. Management and Ecosystem have a monthly fee in Chile. A custom design is quoted.",
      "Presença é grátis com um modelo. Gestão e Ecossistema têm mensalidade no Chile. O design exclusivo é orçado.",
    ),
  },
];

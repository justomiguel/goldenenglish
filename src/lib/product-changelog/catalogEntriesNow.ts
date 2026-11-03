import type { ProductChangelogEntry } from "@/lib/product-changelog/catalogTypes";
import { changelogT as t } from "@/lib/product-changelog/catalogTypes";

export const ENTRIES: readonly ProductChangelogEntry[] = [
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

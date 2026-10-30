import type { ProductChangelogEntry } from "@/lib/product-changelog/catalogTypes";
import { changelogT as t } from "@/lib/product-changelog/catalogTypes";

export const ENTRIES: readonly ProductChangelogEntry[] = [
  {
    id: "pulsar-institute-panel",
    date: "2026-10-30",
    area: "admin",
    title: t(
      "El panel muestra cada instituto con su logo",
      "The panel shows each institute with its logo",
      "O painel mostra cada instituto com seu logo",
    ),
    summary: t(
      "La lista trae el logo, las visitas y el estado de la base. En el instituto ves dominios, servicios conectados y las visitas de 14 días.",
      "The list shows the logo, visits, and database status. On an institute you see domains, connected services, and the 14-day visits.",
      "A lista traz o logo, as visitas e o estado da base. No instituto você vê domínios, serviços conectados e as visitas de 14 dias.",
    ),
  },
  {
    id: "pulsar-free-public-page",
    date: "2026-10-30",
    area: "site",
    title: t(
      "Una cuenta aprobada puede abrir su página pública",
      "An approved account can open its public page",
      "Uma conta aprovada pode abrir sua página pública",
    ),
    summary: t(
      "Después de la aprobación puedes crear hasta tres páginas con una plantilla, tu dominio y el aviso por correo.",
      "After approval you can create up to three pages with a template, your domain, and the email notice.",
      "Depois da aprovação você pode criar até três páginas com um modelo, seu domínio e o aviso por e-mail.",
    ),
  },
  {
    id: "packaged-courses",
    date: "2026-10-28",
    area: "academic",
    title: t(
      "Los cursos se arman y se pueden vender",
      "Courses can be built and sold",
      "Os cursos podem ser montados e vendidos",
    ),
    summary: t(
      "El admin arma un curso con clases del repositorio, lo asigna a una sección o a un alumno, y puede publicarlo en la tienda.",
      "An admin builds a course from repository lessons, assigns it to a section or a student, and can list it in the shop.",
      "O admin monta um curso com aulas do repositório, atribui a uma seção ou a um aluno, e pode publicar na loja.",
    ),
  },
  {
    id: "blog-hub-config-stats",
    date: "2026-10-28",
    area: "cms",
    title: t(
      "El blog separa notas públicas y notas para cuentas",
      "The blog separates public notes and account notes",
      "O blog separa notas públicas e notas para contas",
    ),
    summary: t(
      "El blog ahora separa notas públicas y notas para cuentas, y muestra comentarios y lectura en una pestaña.",
      "The blog now separates public notes and account notes, and shows comments and reading in a tab.",
      "O blog agora separa notas públicas e notas para contas, e mostra comentários e leitura numa aba.",
    ),
  },
  {
    id: "centrolisto-client-previews",
    date: "2026-10-28",
    area: "site",
    title: t(
      "Escuelas muestra el sitio de cada instituto",
      "Schools shows each institute site",
      "Escolas mostra o site de cada instituto",
    ),
    summary: t(
      "Cada escuela aparece con su logo y un enlace para conocer el sitio en vivo. Zenit y Golden también muestran su página en movimiento.",
      "Each school appears with its logo and a link to the live site. Zenit and Golden also show their page in motion.",
      "Cada escola aparece com seu logo e um link para o site ao vivo. Zenit e Golden também mostram a página em movimento.",
    ),
  },
  {
    id: "register-classic-reception",
    date: "2026-10-28",
    area: "registrations",
    title: t(
      "La inscripción de Golden se siente como el mostrador",
      "Golden registration now feels like the front desk",
      "A inscrição da Golden agora parece o balcão",
    ),
    summary: t(
      "En la computadora, las fotos y una frase quedan a un lado del formulario. En el teléfono ves solo el formulario.",
      "On a computer, the photos and one line sit beside the form. On a phone you only see the form.",
      "No computador, as fotos e uma frase ficam ao lado do formulário. No telefone você vê só o formulário.",
    ),
  },
  {
    id: "public-answer-paa",
    date: "2026-10-28",
    area: "site",
    title: t(
      "Las preguntas del sitio cubren más dudas de las familias",
      "The site questions cover more family doubts",
      "As perguntas do site cobrem mais dúvidas das famílias",
    ),
    summary: t(
      "La página de preguntas ahora responde si se puede empezar de cero, si la clase remota es en vivo, qué llevar el primer día y si hace falta uniforme.",
      "The questions page now answers if you can start from zero, if remote class is live, what to bring on day one, and if you need a uniform first.",
      "A página de perguntas agora responde se dá para começar do zero, se a aula remota é ao vivo, o que levar no primeiro dia e se precisa de uniforme.",
    ),
  },
  {
    id: "register-quiet-assigned-section",
    date: "2026-10-28",
    area: "registrations",
    title: t(
      "La inscripción muestra el grupo asignado",
      "Registration shows the assigned group",
      "A inscrição mostra o grupo atribuído",
    ),
    summary: t(
      "Si el formulario no muestra el listado de secciones, la familia ve el nombre del grupo en una línea.",
      "If the form hides the section list, the family still sees the group name on one line.",
      "Se o formulário não mostra a lista de seções, a família vê o nome do grupo em uma linha.",
    ),
  },
  {
    id: "register-dni-survives-continue",
    date: "2026-10-28",
    area: "registrations",
    title: t(
      "El documento se queda al continuar la inscripción",
      "The document stays when you continue registration",
      "O documento fica ao continuar a inscrição",
    ),
    summary: t(
      "Si escribes el DNI o RUT y aprietas Continuar, el número sigue visible en el paso siguiente.",
      "If you type the ID and press Continue, the number stays visible on the next step.",
      "Se você escreve o documento e aperta Continuar, o número continua visível no passo seguinte.",
    ),
  },
  {
    id: "register-hide-section-combo",
    date: "2026-10-28",
    area: "registrations",
    title: t(
      "La inscripción ya no muestra “No estoy seguro/a”",
      "Registration no longer shows “I am not sure”",
      "A inscrição já não mostra “Não tenho a certeza”",
    ),
    summary: t(
      "Si hay una sola sección con cupo, la familia no ve el listado. Para mostrar todas, activa Mostrar todas las secciones en Inscripciones.",
      "If only one section has a seat, families do not see the list. To list every open section, turn on Show all sections in Enrollments.",
      "Se só uma seção tem vaga, a família não vê a lista. Para mostrar todas, ative Mostrar todas as seções em Inscrições.",
    ),
  },
  {
    id: "public-answer-pages",
    date: "2026-10-28",
    area: "site",
    title: t(
      "Cada instituto tiene una página de preguntas",
      "Each institute has a questions page",
      "Cada instituto tem uma página de perguntas",
    ),
    summary: t(
      "En el pie del sitio público hay un enlace a respuestas cortas sobre edades, sedes y cómo inscribirse.",
      "The public site footer links to short answers about ages, sites, and how to enroll.",
      "No rodapé do site público há um link para respostas curtas sobre idades, sedes e como se inscrever.",
    ),
  },
  {
    id: "academic-fields-filter-sort-menus",
    date: "2026-10-28",
    area: "academic",
    title: t(
      "Los campos académicos entran en Filtrar y Ordenar",
      "Academic fields sit in Filter and Sort",
      "Os campos acadêmicos entram em Filtrar e Ordenar",
    ),
    summary: t(
      "En Alumnos, un campo académico propio aparece dentro de Filtrar y en el menú Ordenar.",
      "On Students, a custom academic field appears inside Filter and in the Sort menu.",
      "Em Alunos, um campo acadêmico próprio aparece dentro de Filtrar e no menu Ordenar.",
    ),
  },
  {
    id: "admin-mobile-menu",
    date: "2026-10-28",
    area: "admin",
    title: t(
      "El menú del celular es una pantalla propia",
      "The phone menu is its own screen",
      "O menu do celular é uma tela própria",
    ),
    summary: t(
      "El menú muestra el logo del instituto, tu nombre, un buscador y una grilla. Inicio, inscripciones, finanzas y alumnos siguen en la barra de abajo.",
      "The menu shows the institute logo, your name, a search field, and a grid. Home, registrations, finance, and students stay on the bottom bar.",
      "O menu mostra o logo do instituto, seu nome, uma busca e uma grade. Início, inscrições, finanças e alunos continuam na barra de baixo.",
    ),
  },
  {
    id: "centrolisto-platform-hosts",
    date: "2026-10-28",
    area: "site",
    title: t(
      "CentroListo.cl estrena identidad, explorador de 4 portales y catálogo de 12 módulos",
      "CentroListo.cl launches its brand, 4-portal explorer, and 12-module catalog",
      "CentroListo.cl estreia identidade, explorador de 4 portais e catálogo de 12 módulos",
    ),
    summary: t(
      "La plataforma responde en centrolisto.cl con nueva marca, explorador interactivo por rol, comparativa de mercado y los 12 módulos del sistema.",
      "The platform serves centrolisto.cl with a new brand, an interactive role explorer, a market comparison, and all 12 system modules.",
      "A plataforma responde em centrolisto.cl com nova marca, explorador interativo por perfil, comparativo de mercado e os 12 módulos do sistema.",
    ),
  },
  {
    id: "student-assessment-rubric-scale-1-to-10",
    date: "2026-10-27",
    area: "academic",
    title: t(
      "La rúbrica del examen va de 1 a 10",
      "Exam rubric scores run from 1 to 10",
      "A rubrica da prova vai de 1 a 10",
    ),
    summary: t(
      "Cada criterio del examen de cohorte usa una escala de 1 a 10. Las notas ya guardadas de 1 a 5 siguen válidas.",
      "Each cohort exam criterion uses a 1 to 10 scale. Saved scores from 1 to 5 stay valid.",
      "Cada critério da prova da turma usa uma escala de 1 a 10. Notas já salvas de 1 a 5 continuam válidas.",
    ),
  },
];

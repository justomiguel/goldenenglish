import type { ProductChangelogEntry } from "@/lib/product-changelog/catalogTypes";
import { changelogT as t } from "@/lib/product-changelog/catalogTypes";

export const ENTRIES: readonly ProductChangelogEntry[] = [
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
  {
    id: "admin-review-and-placement-email",
    date: "2026-10-27",
    area: "communications",
    title: t(
      "Aviso si un artículo espera publicación o una matrícula queda sin horario",
      "Mail when an article waits to publish or a paid enrollment has no schedule",
      "Aviso se um artigo espera publicação ou uma matrícula fica sem horário",
    ),
    summary: t(
      "Cada admin recibe un correo cuando un profesor manda un artículo a revisión y cuando una matrícula pagada queda sin cupo.",
      "Each admin gets a mail when a teacher sends an article for review and when a paid enrollment has no open seat.",
      "Cada admin recebe um e-mail quando um professor manda um artigo para revisão e quando uma matrícula paga fica sem vaga.",
    ),
  },
  {
    id: "event-selected-seats-minimap",
    date: "2026-10-27",
    area: "events",
    title: t(
      "Las butacas de un pago se ven en un mini mapa",
      "A payment's seats show on a mini map",
      "Os assentos de um pagamento aparecem num mini mapa",
    ),
    summary: t(
      "En el pago y en el asistente ves solo las butacas de esa compra, con el escenario y el pasillo.",
      "On the payment and the attendee you see only that purchase's seats, with the stage and the aisle.",
      "No pagamento e no participante você vê só os assentos dessa compra, com o palco e o corredor.",
    ),
  },
  {
    id: "event-minor-ticket-price",
    date: "2026-10-27",
    area: "events",
    title: t(
      "Entradas de menores con precio distinto",
      "Child tickets with a different price",
      "Ingressos de menores com preço diferente",
    ),
    summary: t(
      "El evento puede permitir menores. El total suma el precio de adulto y el precio de menor.",
      "An event can allow children. The total adds the adult price and the child price.",
      "O evento pode permitir menores. O total soma o preço de adulto e o preço de menor.",
    ),
  },
  {
    id: "event-unlimited-tickets",
    date: "2026-10-27",
    area: "events",
    title: t(
      "Una persona puede comprar varias entradas",
      "One person can buy several tickets",
      "Uma pessoa pode comprar vários ingressos",
    ),
    summary: t(
      "Ya no hay un máximo por persona. El total muestra la suma de todas las entradas.",
      "There is no per-person maximum. The total shows the sum of every ticket.",
      "Não há um máximo por pessoa. O total mostra a soma de todos os ingressos.",
    ),
  },
  {
    id: "event-payment-removes-attendees",
    date: "2026-10-27",
    area: "events",
    title: t(
      "Rechazar o eliminar un pago saca a esa compra",
      "Rejecting or deleting a payment removes that purchase",
      "Recusar ou excluir um pagamento tira essa compra",
    ),
    summary: t(
      "Las personas de esa compra salen de asistentes. Deshacer la aprobación las vuelve a pendiente de pago. El invitado dice que la pagó el titular.",
      "The people in that purchase leave the attendee list. Undoing approval sets them back to pending payment. The guest says the holder paid.",
      "As pessoas dessa compra saem dos participantes. Desfazer a aprovação volta-as a pagamento pendente. O convidado diz que o titular pagou.",
    ),
  },
  {
    id: "admin-purchase-payment-email",
    date: "2026-10-27",
    area: "communications",
    title: t(
      "Aviso a admins por compra de evento y por pago recibido",
      "Admin mail for an event purchase and for a received payment",
      "Aviso aos admins por compra de evento e por pagamento recebido",
    ),
    summary: t(
      "Cada admin recibe un correo al inscribirse a un evento, cuando un comprobante queda por aprobar y cuando un pago queda pagado.",
      "Each admin gets a mail for an event signup, a receipt waiting for approval, and a payment that becomes paid.",
      "Cada admin recebe um e-mail ao inscrever-se num evento, quando um comprovante fica por aprovar e quando um pagamento fica pago.",
    ),
  },
  {
    id: "event-discount-fixed-amount",
    date: "2026-10-27",
    area: "events",
    title: t(
      "Descuento por monto fijo en códigos de evento",
      "Fixed-amount discount on event codes",
      "Desconto de valor fixo nos códigos de evento",
    ),
    summary: t(
      "Un código resta un porcentaje o un monto fijo de las primeras entradas. El Excel de cada tipo incluye ejemplos.",
      "A code takes a percent or a fixed amount off the first tickets. Each Excel file includes examples.",
      "Um código tira um percentual ou um valor fixo dos primeiros ingressos. Cada Excel inclui exemplos.",
    ),
  },
  {
    id: "admin-messages-mobile-detail-and-links",
    date: "2026-10-26",
    area: "communications",
    title: t(
      "Lectura móvil más limpia y enlace directo al mensaje de contacto",
      "Cleaner mobile reading and direct link to contact messages",
      "Leitura móvel mais limpa e link direto para mensagens de contato",
    ),
    summary: t(
      "El detalle en el celular va directo al texto, el aviso por correo abre el mensaje recibido y la bandeja distingue los leídos sin responder.",
      "Phone detail goes straight to the text, the email notice opens the received message, and the inbox highlights read messages that still need a reply.",
      "O detalhe no celular vai direto ao texto, o aviso por e-mail abre a mensagem recebida e a caixa destaca as lidas sem resposta.",
    ),
  },
  {
    id: "event-seat-map",
    date: "2026-10-26",
    area: "events",
    title: t(
      "Mapa de asientos interactivo opcional por evento",
      "Optional interactive seat map per event",
      "Mapa de assentos interativo opcional por evento",
    ),
    summary: t(
      "Activa pisos de 1000×1000 con bloques numerados y reserva de butacas pendientes hasta aprobar o rechazar el pago.",
      "Enable 1000×1000 floors with numbered blocks and pending seat holds until staff approve or reject payment.",
      "Ative andares de 1000×1000 com blocos numerados e reserva de assentos pendentes até aprovar ou recusar o pagamento.",
    ),
  },
  {
    id: "event-dual-bank-transfer",
    date: "2026-10-26",
    area: "events",
    title: t(
      "Un evento puede cobrar en varias cuentas",
      "An event can collect into several accounts",
      "Um evento pode cobrar em várias contas",
    ),
    summary: t(
      "Elige la cuenta 1, la cuenta 2 y la cuenta de Finanzas. La opción de la persona define a cuál paga.",
      "Choose account 1, account 2, and the Finance account. The buyer's option sets which one they pay.",
      "Escolha a conta 1, a conta 2 e a conta de Finanças. A opção da pessoa define qual ela paga.",
    ),
  },
];

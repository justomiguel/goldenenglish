import type { ProductChangelogEntry } from "@/lib/product-changelog/catalogTypes";
import { changelogT as t } from "@/lib/product-changelog/catalogTypes";

export const ENTRIES: readonly ProductChangelogEntry[] = [
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
  {
    id: "page-error-support-code",
    date: "2026-10-25",
    area: "site",
    title: t(
      "Un error de página muestra un código de soporte",
      "A page error shows a support code",
      "Um erro de página mostra um código de suporte",
    ),
    summary: t(
      "Si una página falla, ves un código para buscar el mismo fallo en los logs.",
      "If a page fails, you see a code to find the same failure in the logs.",
      "Se uma página falha, você vê um código para achar a mesma falha nos logs.",
    ),
  },
  {
    id: "pulsar-control-plane",
    date: "2026-10-25",
    area: "admin",
    title: t(
      "Pulsar Lab administra los institutos desde su base",
      "Pulsar Lab manages institutes from its database",
      "Pulsar Lab administra os institutos a partir da sua base",
    ),
    summary: t(
      "El sitio de Pulsar lista los institutos, su estado y las visitas. Un instituto nuevo no exige un nuevo deploy.",
      "The Pulsar site lists institutes, their status, and visits. A new institute does not need a new deploy.",
      "O site da Pulsar lista os institutos, o estado e as visitas. Um instituto novo não exige um novo deploy.",
    ),
  },
  {
    id: "event-phone-cards",
    date: "2026-10-20",
    area: "events",
    title: t(
      "En el teléfono cada evento es una tarjeta",
      "On a phone each event is a card",
      "No celular cada evento é um cartão",
    ),
    summary: t(
      "Ves la fecha, el estado, el cupo y un botón Gestionar.",
      "You see the date, the status, the capacity, and a Manage button.",
      "Você vê a data, o status, a capacidade e um botão Gerenciar.",
    ),
  },
  {
    id: "admin-create-registration",
    date: "2026-10-20",
    area: "registrations",
    title: t(
      "Puedes cargar una inscripción desde el admin",
      "You can add a registration from admin",
      "Você pode criar uma inscrição no admin",
    ),
    summary: t(
      "El formulario pide los mismos campos que el público de este instituto. El nivel CEFR aparece solo donde el instituto lo usa.",
      "The form asks for the same fields as the public form of this institute. The CEFR level appears only where the institute uses it.",
      "O formulário pede os mesmos campos do formulário público deste instituto. O nível CEFR aparece só onde o instituto o usa.",
    ),
  },
  {
    id: "shop-product-slugs",
    date: "2026-10-20",
    area: "site",
    title: t(
      "La tienda y el pedido usan una dirección con nombre",
      "The shop and the order use an address with a name",
      "A loja e o pedido usam um endereço com nome",
    ),
    summary: t(
      "El producto y el pedido se abren con un nombre corto, no solo con un código.",
      "The product and the order open with a short name, not only with a code.",
      "O produto e o pedido abrem com um nome curto, não só com um código.",
    ),
  },
];

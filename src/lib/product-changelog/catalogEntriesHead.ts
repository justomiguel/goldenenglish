import type { ProductChangelogEntry } from "@/lib/product-changelog/catalogTypes";
import { changelogT as t } from "@/lib/product-changelog/catalogTypes";

export const ENTRIES: readonly ProductChangelogEntry[] = [
  {
    id: "registrations-config-tab",
    date: "2026-11-09",
    area: "registrations",
    title: t(
      "La configuración de inscripción está en Inscripciones web",
      "Registration settings live under Online registrations",
      "A configuração de inscrição fica em Inscrições online",
    ),
    summary: t(
      "Abre Configuración para el formulario público, la sección, los botones y la cohorte. Inscripciones sigue mostrando la cola.",
      "Open Configuration for the public form, the section, the buttons, and the cohort. Registrations still shows the queue.",
      "Abra Configuração para o formulário público, a seção, os botões e a coorte. Inscrições segue mostrando a fila.",
    ),
  },
  {
    id: "admin-event-page-session-redirect",
    date: "2026-11-09",
    area: "events",
    title: t(
      "Un evento sin sesión abre el login",
      "An event page without a session opens login",
      "Um evento sem sessão abre o login",
    ),
    summary: t(
      "Si la sesión venció al abrir un evento, entras al login.",
      "If your session expired on an event page, you go to login.",
      "Se a sessão venceu ao abrir um evento, você entra no login.",
    ),
  },
  {
    id: "admin-message-detail-opens",
    date: "2026-11-09",
    area: "communications",
    title: t(
      "El detalle de un mensaje vuelve a cargar",
      "A message detail loads again",
      "O detalhe de uma mensagem volta a carregar",
    ),
    summary: t(
      "Al abrir un mensaje, la bandeja se actualiza después y la página sigue en pantalla.",
      "When you open a message, the inbox refreshes afterward and the page stays on screen.",
      "Ao abrir uma mensagem, a caixa atualiza depois e a página segue na tela.",
    ),
  },
  {
    id: "event-sale-pulse",
    date: "2026-11-07",
    area: "events",
    title: t(
      "El evento muestra cómo viene la inscripción",
      "The event shows how enrollment is going",
      "O evento mostra como vai a inscrição",
    ),
    summary: t(
      "Al inicio de la ficha ves confirmadas, pagos pendientes y, si hay cupo, cuántos asientos libres quedan y qué porcentaje son.",
      "At the start of the event page you see confirmed seats, pending payments, and, when room remains, how many seats are free and what percent that is.",
      "No início da ficha você vê confirmadas, pagamentos pendentes e, se há lugar, quantos assentos livres ficam e que percentagem são.",
    ),
  },
  {
    id: "failure-code-on-screen",
    date: "2026-11-07",
    area: "registrations",
    title: t(
      "El aviso de error incluye el código para el reclamo",
      "The error notice includes the code for a claim",
      "O aviso de erro inclui o código para a reclamação",
    ),
    summary: t(
      "Si un pago, una compra o un ingreso fallan, el aviso dice la causa y un código que puedes citar.",
      "If a payment, a purchase, or an enrollment fails, the notice states the cause and a code you can quote.",
      "Se um pagamento, uma compra ou uma matrícula falha, o aviso diz a causa e um código que você pode citar.",
    ),
  },
  {
    id: "event-register-failure-detail",
    date: "2026-11-07",
    area: "events",
    title: t(
      "La inscripción al evento explica por qué no se envió",
      "Event registration explains why it did not send",
      "A inscrição do evento explica por que não foi enviada",
    ),
    summary: t(
      "Si el formulario falla, el aviso dice el motivo, como un correo inválido, un cupo agotado o un documento repetido.",
      "If the form fails, the notice states the reason, such as an invalid email, no seats left, or a repeated document.",
      "Se o formulário falha, o aviso diz o motivo, como um e-mail inválido, vagas esgotadas ou um documento repetido.",
    ),
  },
  {
    id: "nago-gallery-by-event",
    date: "2026-11-07",
    area: "site",
    title: t(
      "La galería de Nagô agrupa fotos y videos por evento",
      "The Nagô gallery groups photos and videos by event",
      "A galeria da Nagô agrupa fotos e vídeos por evento",
    ),
    summary: t(
      "Cada evento muestra tres fotos y, si hay videos, una franja aparte. También cambian la foto del mestre y las de acción.",
      "Each event shows three photos and, when videos exist, a separate strip. The mestre photo and the action photos change too.",
      "Cada evento mostra três fotos e, se há vídeos, uma faixa à parte. A foto do mestre e as de ação também mudam.",
    ),
  },
  {
    id: "mozarthitos-find-your-class",
    date: "2026-11-07",
    area: "registrations",
    title: t(
      "Mozarthitos guía a la familia hasta su clase",
      "Mozarthitos guides a family to its class",
      "Mozarthitos guia a família até a turma",
    ),
    summary: t(
      "Encuentra tu clase pregunta la edad y la modalidad, y deja esa elección en la inscripción.",
      "Find your class asks the age and the format, and keeps that choice on the registration.",
      "Encontra a sua turma pergunta a idade e a modalidade, e guarda essa escolha na inscrição.",
    ),
  },
  {
    id: "collections-paid-method-tooltip",
    date: "2026-11-07",
    area: "finance",
    title: t(
      "La matriz de cobranza muestra el medio de pago",
      "The collections matrix shows the payment method",
      "A matriz de cobrança mostra o meio de pagamento",
    ),
    summary: t(
      "Una cuota pagada muestra el medio y la fecha. La matrícula de la fila usa el mismo dato.",
      "A paid month shows the method and the date. The row enrollment fee uses the same fact.",
      "Uma mensalidade paga mostra o meio e a data. A matrícula da linha usa o mesmo dado.",
    ),
  },
  {
    id: "centrolisto-solution-columns",
    date: "2026-11-07",
    area: "site",
    title: t(
      "Presencia, Gestión y Ecosistema quedan en tres columnas",
      "Presence, Management, and Ecosystem sit in three columns",
      "Presença, Gestão e Ecossistema ficam em três colunas",
    ),
    summary: t(
      "En el home y en Precios las tres soluciones se comparan lado a lado. En el teléfono siguen en una columna.",
      "On the home and on Prices the three solutions sit side by side. On a phone they stay in one column.",
      "Na home e em Preços as três soluções ficam lado a lado. No telefone seguem em uma coluna.",
    ),
  },
  {
    id: "centrolisto-country-combo-panel",
    date: "2026-11-07",
    area: "site",
    title: t(
      "El país queda junto al logo y la sesión abre el panel",
      "The country sits by the logo and the session opens the panel",
      "O país fica junto do logo e a sessão abre o painel",
    ),
    summary: t(
      "El control muestra la bandera y el nombre. Con sesión, la acción principal dice Entrar al panel y salir es un ícono.",
      "The control shows the flag and the name. With a session, the main action says Enter the panel and sign-out is an icon.",
      "O controle mostra a bandeira e o nome. Com sessão, a ação principal diz Entrar no painel e sair é um ícone.",
    ),
  },
  {
    id: "centrolisto-home-single-cta",
    date: "2026-11-07",
    area: "site",
    title: t(
      "El home de CentroListo deja un solo botón",
      "The CentroListo home keeps one button",
      "A home do CentroListo fica com um botão",
    ),
    summary: t(
      "Crear mi página gratis es la acción del home. El país se elige con banderas y el menú marca la página actual.",
      "Create my free page is the home action. The country is chosen with flags, and the menu marks the current page.",
      "Criar minha página grátis é a ação da home. O país se escolhe com bandeiras e o menu marca a página atual.",
    ),
  },
  {
    id: "staff-cash-payments",
    date: "2026-11-06",
    area: "finance",
    title: t(
      "El equipo registra pagos en efectivo",
      "Staff can record cash payments",
      "A equipe registra pagamentos em dinheiro",
    ),
    summary: t(
      "Matrícula y mensualidad guardan el medio y la fecha. La familia ve cómo se pagó.",
      "Enrollment fee and monthly fee store the method and the date. The family sees how it was paid.",
      "A matrícula e a mensalidade guardam o meio e a data. A família vê como foi pago.",
    ),
  },
  {
    id: "register-section-assignment-mode",
    date: "2026-11-06",
    area: "registrations",
    title: t(
      "Inscripciones puede dejar la sección para el admin",
      "Registrations can leave the section for staff",
      "As inscrições podem deixar a seção para a equipe",
    ),
    summary: t(
      "En Ajustes eliges si el alumno elige la sección, si va la primera con cupo, o si la inscripción llega sin sección.",
      "In Settings, choose student choice, the first open section, or no section until accept.",
      "Em Ajustes você escolhe se o aluno escolhe a seção, se vai a primeira com vaga, ou se a inscrição chega sem seção.",
    ),
  },
];

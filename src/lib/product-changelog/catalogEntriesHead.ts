import type { ProductChangelogEntry } from "@/lib/product-changelog/catalogTypes";
import { changelogT as t } from "@/lib/product-changelog/catalogTypes";

export const ENTRIES: readonly ProductChangelogEntry[] = [
  {
    id: "matiss-landing-contact-form",
    date: "2026-11-10",
    area: "site",
    title: t(
      "Matiss recibe mensajes desde la landing",
      "Matiss receives messages from the landing",
      "A Matiss recebe mensagens pela landing",
    ),
    summary: t(
      "La landing y la página de contacto usan el formulario de mensajes, y la inscripción muestra una ilustración.",
      "The landing and the contact page use the message form, and registration shows an illustration.",
      "A landing e a página de contato usam o formulário de mensagens, e a inscrição mostra uma ilustração.",
    ),
  },
  {
    id: "matiss-landing-photos",
    date: "2026-11-10",
    area: "site",
    title: t(
      "La landing de Matiss usa ilustraciones de alumnas",
      "The Matiss landing uses student illustrations",
      "A landing da Matiss usa ilustrações de alunas",
    ),
    summary: t(
      "La portada, la galería y el buscador de edad muestran personajes ilustrados. Se pueden cambiar por fotos del estudio.",
      "The hero, the gallery, and the age finder show illustrated characters. They can be swapped for studio photos.",
      "A capa, a galeria e o buscador de idade mostram personagens ilustrados. Dá para trocá-los por fotos do estúdio.",
    ),
  },
  {
    id: "matiss-studio-landing",
    date: "2026-11-09",
    area: "site",
    title: t(
      "Matiss Studio tiene su propia landing",
      "Matiss Studio has its own landing",
      "Matiss Studio tem a própria landing",
    ),
    summary: t(
      "Muestra las sedes, los horarios del sábado y la clase de prueba. La plantilla solo aparece al crear el slug matiss.",
      "It shows the locations, the Saturday times, and the trial class. The template appears only when you create the matiss slug.",
      "Mostra as unidades, os horários de sábado e a aula experimental. O modelo aparece só ao criar o slug matiss.",
    ),
  },
  {
    id: "institute-backup-restore",
    date: "2026-11-09",
    area: "admin",
    title: t(
      "Puedes guardar y restaurar un instituto",
      "You can save and restore an institute",
      "Você pode guardar e restaurar um instituto",
    ),
    summary: t(
      "CentroListo descarga un archivo cifrado del instituto. Si el sitio se cierra, ese archivo lo crea de nuevo.",
      "CentroListo downloads an encrypted file of the institute. If the site is closed, that file creates it again.",
      "O CentroListo baixa um arquivo cifrado do instituto. Se o site fecha, esse arquivo cria o instituto de novo.",
    ),
  },
  {
    id: "exclusive-theme-picker",
    date: "2026-11-09",
    area: "cms",
    title: t(
      "Las plantillas exclusivas quedan en su instituto",
      "Exclusive templates stay with their institute",
      "Os modelos exclusivos ficam no instituto",
    ),
    summary: t(
      "El selector de estilo ya no muestra la plantilla de otro instituto.",
      "The style picker no longer shows another institute's template.",
      "O seletor de estilo não mostra mais o modelo de outro instituto.",
    ),
  },
  {
    id: "mozarthitos-family-guide",
    date: "2026-11-09",
    area: "site",
    title: t(
      "Las familias encuentran su clase en Mozarthitos",
      "Families find their class at Mozarthitos",
      "As famílias encontram a aula no Mozarthitos",
    ),
    summary: t(
      "Dos preguntas llevan a la clase presencial, a la clase en línea o al pack. La inscripción guarda esa elección.",
      "Two questions lead to the in-person class, the live class, or the pack. The registration stores that choice.",
      "Duas perguntas levam à aula presencial, à aula ao vivo ou ao pack. A inscrição guarda essa escolha.",
    ),
  },
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
      "El inicio tiene un botón amarillo, Vive la experiencia. Abre la guía y la guía termina en la preinscripción.",
      "The home has one yellow button, Live the experience. It opens the guide, and the guide ends on the pre-registration form.",
      "O início tem um botão amarelo, Viva a experiência. Abre o guia e o guia termina na pré-inscrição.",
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
];

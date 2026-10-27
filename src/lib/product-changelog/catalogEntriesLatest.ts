import type { ProductChangelogEntry } from "@/lib/product-changelog/catalogTypes";
import { changelogT as t } from "@/lib/product-changelog/catalogTypes";

export const ENTRIES: readonly ProductChangelogEntry[] = [
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
  {
    id: "event-code-uses-and-duplicate",
    date: "2026-10-20",
    area: "events",
    title: t(
      "Puedes ver quién usó un código y duplicar un evento",
      "You can see who used a code and duplicate an event",
      "Você pode ver quem usou um código e duplicar um evento",
    ),
    summary: t(
      "En Códigos ves el nombre, el correo y el pago de cada uso. Duplicar crea un borrador con el formulario y los correos, sin inscripciones.",
      "On Codes you see the name, email, and payment for each use. Duplicate creates a draft with the form and emails, and no registrations.",
      "Em Códigos você vê o nome, o e-mail e o pagamento de cada uso. Duplicar cria um rascunho com o formulário e os e-mails, sem inscrições.",
    ),
  },
  {
    id: "phone-message-composer",
    date: "2026-10-20",
    area: "communications",
    title: t(
      "En el teléfono el mensaje se escribe abajo",
      "On a phone you write the message at the bottom",
      "No celular a mensagem se escreve embaixo",
    ),
    summary: t(
      "El hilo queda en burbujas. El campo para escribir queda fijo, arriba de la barra.",
      "The thread uses bubbles. The write field stays fixed, above the bar.",
      "O fio fica em bolhas. O campo para escrever fica fixo, acima da barra.",
    ),
  },
  {
    id: "admin-mobile-shell",
    date: "2026-10-20",
    area: "admin",
    title: t(
      "El admin en el teléfono usa una barra inferior",
      "Admin on a phone uses a bottom bar",
      "O admin no celular usa uma barra inferior",
    ),
    summary: t(
      "Inicio, admisiones, finanzas, personas y más quedan al alcance del pulgar. Las listas dejan de ocupar toda la pantalla.",
      "Home, admissions, finance, people, and more sit in the thumb zone. Lists no longer fill the screen.",
      "Início, admissões, finanças, pessoas e mais ficam ao alcance do polegar. As listas deixam de ocupar a tela.",
    ),
  },
  {
    id: "public-share-links",
    date: "2026-10-20",
    area: "site",
    title: t(
      "Los links públicos explican la página",
      "Public links explain the page",
      "Os links públicos explicam a página",
    ),
    summary: t(
      "La dirección dice qué es y de dónde sale. WhatsApp usa la foto de esa página, luego la foto del inicio y, si no hay, el logo.",
      "The address says what the page is and where it comes from. WhatsApp uses that page photo, then the home photo, then the logo.",
      "O endereço diz o que é a página e de onde ela vem. O WhatsApp usa a foto dessa página, depois a foto do início e, se não houver, o logo.",
    ),
  },
  {
    id: "admin-home-layout",
    date: "2026-10-20",
    area: "admin",
    title: t(
      "Cada admin edita su inicio",
      "Each admin edits their home",
      "Cada admin edita o próprio início",
    ),
    summary: t(
      "Puedes mover las tarjetas del inicio, arrastrar el borde para cambiar el tamaño y guardar ese orden solo para ti.",
      "You can move the home cards, drag an edge to change the size, and save that order for yourself.",
      "Você pode mover os cartões do início, arrastar a borda para mudar o tamanho e salvar essa ordem só para você.",
    ),
  },
  {
    id: "parent-reply-to-sender",
    date: "2026-10-20",
    area: "parent",
    title: t(
      "El padre puede responder un mensaje recibido",
      "A parent can reply to a received message",
      "O responsável pode responder a uma mensagem recebida",
    ),
    summary: t(
      "Responder envía el texto solo a la persona que escribió ese mensaje.",
      "Reply sends the text only to the person who wrote that message.",
      "Responder envia o texto só para quem escreveu essa mensagem.",
    ),
  },
  {
    id: "editor-upload-progress",
    date: "2026-10-20",
    area: "admin",
    title: t(
      "La subida de imágenes en los editores muestra el avance",
      "Image uploads in editors show progress",
      "O envio de imagens nos editores mostra o progresso",
    ),
    summary: t(
      "Al subir una imagen o un archivo en un evento, en un contenido o en una foto de tienda, ves el porcentaje hasta que termina.",
      "When you upload an image or a file in an event, in content, or as a shop photo, you see the percent until it finishes.",
      "Ao enviar uma imagem ou um arquivo em um evento, em um conteúdo ou como foto da loja, você vê a porcentagem até terminar.",
    ),
  },
  {
    id: "event-discount-codes",
    date: "2026-10-20",
    area: "events",
    title: t(
      "Los eventos pueden tener códigos de descuento",
      "Events can have discount codes",
      "Os eventos podem ter códigos de desconto",
    ),
    summary: t(
      "Cargas códigos de a uno, con Excel o con el generador. La inscripción reserva un uso y el pago confirmado lo consume.",
      "Load codes one by one, from Excel, or with the generator. Registration reserves a use. An approved payment consumes that use.",
      "Você carrega códigos um a um, com Excel ou com o gerador. A inscrição reserva um uso e o pagamento aprovado o consome.",
    ),
  },
  {
    id: "event-list-creator",
    date: "2026-10-20",
    area: "events",
    title: t(
      "La lista de eventos muestra quién los creó",
      "The events list shows who created them",
      "A lista de eventos mostra quem os criou",
    ),
    summary: t(
      "En Eventos ves el nombre de la persona que creó cada evento.",
      "On Events you see the name of the person who created each event.",
      "Em Eventos você vê o nome de quem criou cada evento.",
    ),
  }
];

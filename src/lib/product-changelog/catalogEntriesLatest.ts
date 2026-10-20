import type { ProductChangelogEntry } from "@/lib/product-changelog/catalogTypes";
import { changelogT as t } from "@/lib/product-changelog/catalogTypes";

export const ENTRIES: readonly ProductChangelogEntry[] = [
  {
    id: "event-family-discount",
    date: "2026-10-19",
    area: "events",
    title: t(
      "La inscripción puede pedir un 10% de descuento familiar",
      "Registration can claim a 10% family discount",
      "A inscrição pode pedir 10% de desconto familiar",
    ),
    summary: t(
      "Quien se inscribe puede marcar que es familia del instituto y el cobro queda con 10% de descuento. En la lista de asistentes se ve quién lo pidió.",
      "Someone registering can mark that they are an institute family, and the charge is 10% lower. The attendee list shows who asked.",
      "Quem se inscreve pode marcar que é família do instituto e a cobrança fica com 10% de desconto. A lista de participantes mostra quem pediu.",
    ),
  },
  {
    id: "event-attendee-delete-notify",
    date: "2026-10-19",
    area: "events",
    title: t(
      "Se puede eliminar una inscripción y avisar el motivo",
      "A registration can be removed and the person emailed the reason",
      "Dá para eliminar uma inscrição e avisar o motivo",
    ),
    summary: t(
      "Al eliminar un asistente, incluso si pagó con Mercado Pago, puedes avisarle el motivo. El correo va marcado y se destilda solo para esa eliminación.",
      "When removing an attendee, including a Mercado Pago payment, you can email the reason. The notice starts checked and can be unchecked for that removal only.",
      "Ao eliminar um participante, mesmo com pagamento Mercado Pago, você pode avisar o motivo. O e-mail começa marcado e pode ser desmarcado só nessa exclusão.",
    ),
  },
  {
    id: "event-hide-disabled-mercadopago",
    date: "2026-10-19",
    area: "events",
    title: t(
      "La inscripción no ofrece Mercado Pago si está desactivado",
      "Registration hides Mercado Pago when it is off",
      "A inscrição não oferece Mercado Pago se estiver desativado",
    ),
    summary: t(
      "Si Mercado Pago o Flow no están activos, el formulario del evento no los muestra y un regreso fallido no queda en proceso.",
      "When Mercado Pago or Flow is off, the event form hides it and a failed return does not stay on processing.",
      "Se Mercado Pago ou Flow não estão ativos, o formulário do evento não os mostra e um retorno falho não fica em processamento.",
    ),
  },
  {
    id: "admin-mobile-first",
    date: "2026-10-17",
    area: "admin",
    title: t(
      "El panel de administración se puede usar desde el celular",
      "The admin panel works on a phone",
      "O painel de administração funciona no celular",
    ),
    summary: t(
      "Menús, tablas y planillas de asistencia y cobranzas se leen y se accionan en pantallas chicas, con botones más grandes.",
      "Menus, tables, and attendance or collections grids can be read and used on small screens, with larger buttons.",
      "Menus, tabelas e planilhas de presença e cobranças podem ser lidas e usadas em telas pequenas, com botões maiores.",
    ),
  },
  {
    id: "home-popup-flow-price-register",
    date: "2026-10-16",
    area: "events",
    title: t(
      "El aviso del inicio muestra el precio de cada flujo",
      "The home notice shows each flow price",
      "O aviso da página inicial mostra o preço de cada fluxo",
    ),
    summary: t(
      "Si el evento cobra por flujo, cada monto aparece en el aviso y el botón lleva al registro.",
      "When an event charges by flow, each amount shows in the notice and the button opens registration.",
      "Quando o evento cobra por fluxo, cada valor aparece no aviso e o botão abre a inscrição.",
    ),
  },
  {
    id: "event-description-image-saved",
    date: "2026-10-16",
    area: "events",
    title: t(
      "La imagen de la descripción se guarda sin otras traducciones",
      "Description images save without other translations",
      "A imagem da descrição é salva sem as outras traduções",
    ),
    summary: t(
      "Puedes guardar la foto de la descripción aunque inglés o portugués todavía no tengan título. La imagen queda en la página del evento.",
      "You can save a description photo even when English or Portuguese still have no title. The image stays on the event page.",
      "Você pode salvar a foto da descrição mesmo quando inglês ou português ainda não têm título. A imagem fica na página do evento.",
    ),
  },
  {
    id: "event-flow-prices-visible",
    date: "2026-10-16",
    area: "events",
    title: t(
      "El precio de cada flujo se ve al inscribirse",
      "Each flow price shows at registration",
      "O preço de cada fluxo aparece na inscrição",
    ),
    summary: t(
      "Si el evento cobra distinto por flujo, cada monto se ve en la tabla, en la página pública y al lado de la opción.",
      "When an event charges by flow, each amount shows in the table, on the public page, and beside the option.",
      "Quando o evento cobra diferente por fluxo, cada valor aparece na tabela, na página pública e ao lado da opção.",
    ),
  },
  {
    id: "email-image-upload-loader",
    date: "2026-10-14",
    area: "communications",
    title: t(
      "El correo muestra el avance al subir una imagen",
      "Email uploads show image progress",
      "O e-mail mostra o avanço ao enviar uma imagem",
    ),
    summary: t(
      "Al insertar una imagen aparece un indicador con el porcentaje hasta que termina la subida.",
      "Inserting an image shows a progress indicator until the upload finishes.",
      "Ao inserir uma imagem aparece um indicador com a porcentagem até o envio terminar.",
    ),
  },
  {
    id: "email-image-ten-megabytes",
    date: "2026-10-14",
    area: "communications",
    title: t(
      "Las imágenes del correo admiten 10 MB",
      "Email images allow 10 MB",
      "As imagens do e-mail aceitam 10 MB",
    ),
    summary: t(
      "El editor muestra el máximo de 10 MB antes de elegir la imagen.",
      "The editor shows the 10 MB maximum before you choose an image.",
      "O editor mostra o máximo de 10 MB antes de escolher a imagem.",
    ),
  },
  {
    id: "email-template-media",
    date: "2026-10-14",
    area: "communications",
    title: t(
      "Imagen y enlace de video en los correos",
      "Image and video link in emails",
      "Imagem e link de vídeo nos e-mails",
    ),
    summary: t(
      "El editor de correos inserta una imagen o un enlace de YouTube o Vimeo. El video no se reproduce dentro del mensaje.",
      "The email editor inserts an image or a YouTube or Vimeo link. The video does not play inside the message.",
      "O editor de e-mails insere uma imagem ou um link do YouTube ou do Vimeo. O vídeo não toca dentro da mensagem.",
    ),
  },
  {
    id: "event-email-templates",
    date: "2026-10-13",
    area: "events",
    title: t(
      "Correos del evento editables",
      "Editable event emails",
      "E-mails do evento editáveis",
    ),
    summary: t(
      "En Notificaciones se editan los correos de inscripción, pago y recordatorio. La inscripción recibida y el pago aprobado pueden tener un texto distinto por flujo.",
      "Notifications now edits registration, payment, and reminder emails. Registration received and payment approved can use different copy per flow.",
      "Em Notificações dá para editar os e-mails de inscrição, pagamento e lembrete. A inscrição recebida e o pagamento aprovado podem ter um texto diferente por fluxo.",
    ),
  },
  {
    id: "inscrito-neutral-spanish",
    date: "2026-10-13",
    area: "portal",
    title: t(
      "Inscrito, en lugar de inscripto",
      "Inscrito instead of inscripto",
      "Inscrito, em vez de inscripto",
    ),
    summary: t(
      "Las pantallas dicen inscrito e inscrita, la forma neutra en español.",
      "Screens now say inscrito and inscrita, the neutral Spanish form.",
      "As telas passaram a dizer inscrito e inscrita, a forma neutra em espanhol.",
    ),
  },
  {
    id: "neutral-spanish-copy",
    date: "2026-10-13",
    area: "portal",
    title: t(
      "Español neutro en la plataforma",
      "Neutral Spanish across the platform",
      "Espanhol neutro na plataforma",
    ),
    summary: t(
      "Los textos en español usan tuteo neutro, para que se entiendan igual en cualquier país.",
      "Spanish copy now uses neutral tú, so it reads the same in every country.",
      "Os textos em espanhol ficaram neutros, para se entenderem igual em qualquer país.",
    ),
  },
];

import type { ProductChangelogEntry } from "@/lib/product-changelog/catalogTypes";
import { changelogT as t } from "@/lib/product-changelog/catalogTypes";

export const ENTRIES: readonly ProductChangelogEntry[] = [
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
    id: "upload-bar-only-while-sending",
    date: "2026-11-05",
    area: "admin",
    title: t(
      "La barra de subida aparece solo mientras se envía el archivo",
      "The upload bar appears only while the file is sending",
      "A barra de envio aparece só enquanto o arquivo está sendo enviado",
    ),
    summary: t(
      "Cuando la lectura o el envío terminan, la barra se oculta.",
      "When the read or the send ends, the bar hides.",
      "Quando a leitura ou o envio termina, a barra some.",
    ),
  },
  {
    id: "admin-sidebar-unread-messages",
    date: "2026-11-05",
    area: "communications",
    title: t(
      "El menú cuenta solo los mensajes no leídos",
      "The menu counts unread messages only",
      "O menu conta só as mensagens não lidas",
    ),
    summary: t(
      "El número junto a Mensajes es el de la bandeja de entrada que todavía no abriste.",
      "The number next to Messages is the inbox mail you have not opened.",
      "O número junto a Mensagens é a caixa de entrada que você ainda não abriu.",
    ),
  },
  {
    id: "event-payment-discount-lines",
    date: "2026-11-05",
    area: "events",
    title: t(
      "El pago por aprobar detalla el cupón y el precio de menor",
      "A payment waiting for approval lists the coupon and the minor price",
      "O pagamento para aprovar detalha o cupom e o preço de menor",
    ),
    summary: t(
      "Debajo del total aparecen las líneas que vio la persona al inscribirse.",
      "The lines the person saw at registration appear under the total.",
      "As linhas que a pessoa viu na inscrição aparecem abaixo do total.",
    ),
  },
  {
    id: "event-payment-shown-total",
    date: "2026-11-05",
    area: "events",
    title: t(
      "El pago por aprobar muestra el total con descuento",
      "A payment waiting for approval shows the discounted total",
      "O pagamento para aprovar mostra o total com desconto",
    ),
    summary: t(
      "El monto coincide con el que vio la persona: cupón y precio de menor.",
      "The amount matches what the person saw: coupon and minor price.",
      "O valor coincide com o que a pessoa viu: cupom e preço de menor.",
    ),
  },
  {
    id: "email-month-resend-readout",
    date: "2026-11-05",
    area: "communications",
    title: t(
      "El tope mensual de correos se ve y no se edita",
      "The monthly mail cap is visible and cannot be edited",
      "O limite mensal de e-mails aparece e não se edita",
    ),
    summary: t(
      "El instituto ve el número. CentroListo lo ve al lado de cada instituto, según la clave de Resend.",
      "The institute sees the number. CentroListo sees it next to each institute, from the Resend key.",
      "O instituto vê o número. O CentroListo vê ao lado de cada instituto, pela chave da Resend.",
    ),
  },
  {
    id: "contact-form-message-export",
    date: "2026-11-05",
    area: "communications",
    title: t(
      "Puedes exportar los mensajes del formulario",
      "You can export contact-form messages",
      "Você pode exportar as mensagens do formulário",
    ),
    summary: t(
      "En Mensajes eliges los campos y descargas Excel o un PDF con la marca. Puedes incluir todos o los últimos 2000.",
      "In Messages you choose the fields and download Excel or a branded PDF. You can include all messages or the latest 2000.",
      "Em Mensagens você escolhe os campos e baixa Excel ou um PDF com a marca. Pode incluir todas ou as últimas 2000.",
    ),
  },
];

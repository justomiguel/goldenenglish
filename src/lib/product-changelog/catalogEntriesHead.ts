import type { ProductChangelogEntry } from "@/lib/product-changelog/catalogTypes";
import { changelogT as t } from "@/lib/product-changelog/catalogTypes";

export const ENTRIES: readonly ProductChangelogEntry[] = [
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

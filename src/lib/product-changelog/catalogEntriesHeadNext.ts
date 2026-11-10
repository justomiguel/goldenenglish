import type { ProductChangelogEntry } from "@/lib/product-changelog/catalogTypes";
import { changelogT as t } from "@/lib/product-changelog/catalogTypes";

export const ENTRIES: readonly ProductChangelogEntry[] = [
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
];

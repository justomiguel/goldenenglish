import type { ProductChangelogEntry } from "@/lib/product-changelog/catalogTypes";
import { changelogT as t } from "@/lib/product-changelog/catalogTypes";

export const ENTRIES: readonly ProductChangelogEntry[] = [
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

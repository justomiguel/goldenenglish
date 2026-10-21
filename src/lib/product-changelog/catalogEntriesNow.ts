import type { ProductChangelogEntry } from "@/lib/product-changelog/catalogTypes";
import { changelogT as t } from "@/lib/product-changelog/catalogTypes";

export const ENTRIES: readonly ProductChangelogEntry[] = [
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

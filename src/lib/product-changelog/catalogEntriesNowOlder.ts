import type { ProductChangelogEntry } from "@/lib/product-changelog/catalogTypes";
import { changelogT as t } from "@/lib/product-changelog/catalogTypes";

export const ENTRIES: readonly ProductChangelogEntry[] = [
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
  {
    id: "free-site-contact-form",
    date: "2026-11-03",
    area: "site",
    title: t(
      "El sitio gratis muestra contacto, mapa y un formulario",
      "A free site shows contact, a map, and a form",
      "O site grátis mostra contato, mapa e um formulário",
    ),
    summary: t(
      "Cada sitio gratis envía hasta 50 mensajes al correo de la cuenta de CentroListo.",
      "Each free site sends up to 50 messages to the CentroListo account email.",
      "Cada site grátis envia até 50 mensagens para o e-mail da conta do CentroListo.",
    ),
  },
  {
    id: "lms-course-catalog-hierarchy",
    date: "2026-11-02",
    area: "academic",
    title: t(
      "Los cursos se agrupan por categoría, hashtag y campos del instituto",
      "Courses group by category, hashtag, and institute fields",
      "Os cursos se agrupam por categoria, hashtag e campos do instituto",
    ),
    summary: t(
      "Puedes crear una ruta como conjuntos de cursos y asignarla a una sección.",
      "You can create a route as sets of courses and assign it to a section.",
      "Você pode criar uma rota como conjuntos de cursos e atribuí-la a uma turma.",
    ),
  },
];

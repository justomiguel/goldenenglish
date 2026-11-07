import type { ProductChangelogEntry } from "@/lib/product-changelog/catalogTypes";
import { changelogT as t } from "@/lib/product-changelog/catalogTypes";

export const ENTRIES: readonly ProductChangelogEntry[] = [
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

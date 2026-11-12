import { PAGE_VARIANTS } from "@/lib/design-variants/registry/page";

const hero = (title: string) => ({
  scene: "Sunday, 21:40",
  title,
  body: "A quiet room.",
  imageAlt: "Room",
  name: "North",
  heroSrc: "/generic/deportes/inicio.jpg",
});

const lines = (first: string) => [first, "09:00. Class starts", "10:00. Break"];

const bands = (sentence: string) => ({
  items: [
    { id: "historia", label: "Historia", sentence, src: "/generic/deportes/historia.jpg" },
    { id: "oferta", label: "Oferta", sentence, src: "/generic/deportes/oferta.jpg" },
  ],
});

const closeCopy = (title: string) => ({
  laterTitle: title,
  laterBody: "The desk reads it in the morning.",
  cta: "Enroll",
  scene: "Sunday",
  title,
  body: "A quiet room.",
  imageAlt: "Room",
  name: "North",
  rhythmA: "08:00. Doors",
  rhythmB: "09:00. Class",
  rhythmC: "10:00. Break",
  sections: { historia: "A room.", oferta: "Groups.", modalidades: "Hours.", niveles: "Steps.", certificaciones: "Paper." },
});

const formLabels = {
  formName: "Name",
  formEmail: "Email",
  formPhone: "Phone",
  formMessage: "Message",
  formSuccess: "Sent",
  formPreview: "Preview",
  formQuota: "Wait",
  formInvalid: "Check the fields",
  formPersist: "Try again",
  formUnavailable: "Unavailable",
};

const FIXTURES: Record<string, readonly unknown[]> = {
  "hero.bleed": [hero("Bleed title"), hero("Bleed other")],
  "hero.split": [hero("Split title"), hero("Split other")],
  "hero.masthead": [hero("Masthead title"), hero("Masthead other")],
  "hero.stage": [hero("Stage title"), hero("Stage other")],
  "hero.title": [hero("Title only"), hero("Title other")],
  "schedule.rows": [{ lines: lines("08:00. Doors open") }, { lines: lines("18:00. Evening") }],
  "schedule.rule": [{ lines: lines("08:00. Doors open") }, { lines: lines("18:00. Evening") }],
  "schedule.prospectus": [{ lines: lines("08:00. Doors open") }, { lines: lines("18:00. Evening") }],
  "schedule.recital": [{ lines: lines("08:00. Doors open") }, { lines: lines("18:00. Evening") }],
  "schedule.steps": [{ lines: lines("08:00. Doors open") }, { lines: lines("18:00. Evening") }],
  "band.alternate": [bands("A quiet sentence."), bands("Another sentence.")],
  "band.cluster": [bands("A quiet sentence."), bands("Another sentence.")],
  "band.ruled": [bands("A quiet sentence."), bands("Another sentence.")],
  "band.paper": [bands("A quiet sentence."), bands("Another sentence.")],
  "band.breaks": [bands("A quiet sentence."), bands("Another sentence.")],
  "close.paper": [{ copy: closeCopy("Write when you can"), locale: "en" }, { copy: closeCopy("Write later"), locale: "es" }],
  "close.quiet": [{ copy: closeCopy("Write when you can"), locale: "en" }, { copy: closeCopy("Write later"), locale: "es" }],
  "close.narrow": [{ copy: closeCopy("Write when you can"), locale: "en" }, { copy: closeCopy("Write later"), locale: "es" }],
  "close.stage": [{ copy: closeCopy("Write when you can"), locale: "en" }, { copy: closeCopy("Write later"), locale: "es" }],
  "close.under": [{ copy: closeCopy("Write when you can"), locale: "en" }, { copy: closeCopy("Write later"), locale: "es" }],
  "nav.generic": [
    { kind: "jardin", siteName: "North School", logoAlt: "North", cta: "Enroll", items: [{ id: "inicio", label: "Start" }] },
    { kind: "musica", siteName: "South School", logoAlt: "South", cta: "Listen", items: [{ id: "contacto", label: "Contact" }] },
  ],
  "footer.generic": [{ siteName: "North School" }, { siteName: "South School" }],
  "contact.form": [
    { locale: "en", submitLabel: "Send", labels: formLabels },
    { locale: "es", submitLabel: "Enviar", labels: formLabels },
  ],
  "contact.map": [
    { address: "Calle 1", title: "Map" },
    { address: "Calle 2", title: "Other map" },
  ],
};

for (const variant of PAGE_VARIANTS) {
  FIXTURES[variant.id] = [{}, {}];
}

export function variantFixture(id: string, index: number): unknown | null {
  const sets = FIXTURES[id];
  if (!sets || !Number.isInteger(index) || index < 0 || index >= sets.length) return null;
  return sets[index] ?? null;
}

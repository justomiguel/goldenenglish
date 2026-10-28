export const INSTITUTE_ANSWER_KIND_KEYS = [
  "classic",
  "mozarthitos",
  "espaciozenit",
  "nago",
  "mimundo",
  "liora",
] as const;

export type InstituteAnswerKindKey = (typeof INSTITUTE_ANSWER_KIND_KEYS)[number];

export interface InstituteAnswerItem {
  id: string;
  q: string;
  a: string;
}

/** Editorial and minimal share the classic English answers. */
export function instituteAnswerKindKey(templateKind: string): InstituteAnswerKindKey {
  if (
    templateKind === "mozarthitos" ||
    templateKind === "espaciozenit" ||
    templateKind === "nago" ||
    templateKind === "mimundo" ||
    templateKind === "liora"
  ) {
    return templateKind;
  }
  return "classic";
}

/** Drop setup placeholders so a public answer never prints sample contact data. */
export function isPublishablePublicContact(
  kind: "email" | "phone" | "address",
  value: string,
): boolean {
  const trimmed = value.trim();
  if (!trimmed) return false;
  if (kind === "phone") {
    const digits = trimmed.replace(/\D/g, "");
    if (!digits || /^0+$/.test(digits) || digits.includes("00000000")) return false;
  }
  if (kind === "email" && /tuestudio|example\.(com|cl|org)|tuemail/i.test(trimmed)) {
    return false;
  }
  if (
    kind === "address" &&
    /centro urbano|reemplaza con tu direcci|replace with your address|tu direcci[oó]n/i.test(
      trimmed,
    )
  ) {
    return false;
  }
  return true;
}

export function withPublishableContact(input: {
  items: readonly InstituteAnswerItem[];
  brand: string;
  contactQuestion: string;
  contactLine: string;
  contactEmailOnly: string;
  contactPhoneOnly: string;
  email: string;
  phone: string;
}): InstituteAnswerItem[] {
  const brand = input.brand.trim();
  const items = input.items.map((item) => ({
    id: item.id,
    q: item.q.replaceAll("{{brand}}", brand),
    a: item.a.replaceAll("{{brand}}", brand),
  }));
  const email = isPublishablePublicContact("email", input.email) ? input.email.trim() : "";
  const phone = isPublishablePublicContact("phone", input.phone) ? input.phone.trim() : "";
  if (!email && !phone) return items;
  const template =
    email && phone ? input.contactLine : email ? input.contactEmailOnly : input.contactPhoneOnly;
  const answer = template
    .replaceAll("{{brand}}", brand)
    .replaceAll("{{email}}", email)
    .replaceAll("{{phone}}", phone);
  return [...items, { id: "reach", q: input.contactQuestion, a: answer }];
}

export interface InstitutePlace {
  name: string;
  description: string;
}

export function buildInstituteAddress(streetAddress: string): Record<string, unknown> {
  return {
    "@type": "PostalAddress",
    streetAddress: streetAddress.trim(),
  };
}

export function lioraPlacesFromSedes(sedes: {
  providencia: { name: string; metro: string };
  maipu: { name: string; metro: string };
  sanMiguel: { name: string; metro: string };
}): InstitutePlace[] {
  return [
    { name: sedes.providencia.name, description: sedes.providencia.metro },
    { name: sedes.maipu.name, description: sedes.maipu.metro },
    { name: sedes.sanMiguel.name, description: sedes.sanMiguel.metro },
  ].filter((place) => place.name.trim().length > 0);
}

/** Liora lists three metro sites. Other institutes keep one address. */
export function buildInstituteDepartments(
  templateKind: string,
  places: readonly InstitutePlace[],
): Record<string, unknown>[] {
  if (templateKind !== "liora") return [];
  return places
    .map((place) => ({
      name: place.name.trim(),
      description: place.description.trim(),
    }))
    .filter((place) => place.name.length > 0)
    .map((place) => ({
      "@type": "Place",
      name: place.name,
      ...(place.description ? { description: place.description } : {}),
    }));
}

export function buildFaqPageJsonLd(
  items: readonly Pick<InstituteAnswerItem, "q" | "a">[],
): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((item) => ({
      "@type": "Question",
      name: item.q,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.a,
      },
    })),
  };
}

import { isGenericInstituteKind } from "@/lib/theme/genericInstituteTemplates";

export const INSTITUTE_ANSWER_KIND_KEYS = [
  "classic",
  "generic",
  "mozarthitos",
  "espaciozenit",
  "nago",
  "mimundo",
  "liora",
  "matiss",
] as const;

export type InstituteAnswerKindKey = (typeof INSTITUTE_ANSWER_KIND_KEYS)[number];

export interface InstituteAnswerItem {
  id: string;
  q: string;
  a: string;
}

/** Editorial and minimal share the classic English answers. Generic kinds share one set. */
export function instituteAnswerKindKey(templateKind: string): InstituteAnswerKindKey {
  if (isGenericInstituteKind(templateKind)) return "generic";
  if (
    templateKind === "mozarthitos" ||
    templateKind === "espaciozenit" ||
    templateKind === "nago" ||
    templateKind === "mimundo" ||
    templateKind === "liora" ||
    templateKind === "matiss"
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

function readPlace(value: unknown): InstitutePlace | null {
  if (!value || typeof value !== "object") return null;
  const row = value as { name?: unknown; description?: unknown };
  if (typeof row.name !== "string") return null;
  const name = row.name.trim();
  if (!name) return null;
  const description = typeof row.description === "string" ? row.description.trim() : "";
  return { name, description };
}

function placesFromAnswerSections(
  sections: readonly { props: unknown }[] | null | undefined,
): InstitutePlace[] {
  if (!sections) return [];
  const found: InstitutePlace[] = [];
  for (const section of sections) {
    const props = section.props;
    if (!props || typeof props !== "object") continue;
    const list = (props as { places?: unknown }).places;
    if (!Array.isArray(list)) continue;
    for (const item of list) {
      const place = readPlace(item);
      if (place) found.push(place);
    }
  }
  return found;
}

/** Places for JSON-LD. Answer-page props win. Otherwise one place from the contact address. */
export function placesForOrganization(input: {
  name: string;
  contactAddress: string;
  answerSections?: readonly { props: unknown }[] | null;
}): InstitutePlace[] {
  const fromAnswers = placesFromAnswerSections(input.answerSections);
  if (fromAnswers.length > 0) return fromAnswers;
  if (!isPublishablePublicContact("address", input.contactAddress)) return [];
  const description = input.contactAddress.trim();
  const name = input.name.trim() || description;
  return [{ name, description }];
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

/** One Place node per site. The address on the organization stays separate. */
export function buildInstituteDepartments(
  places: readonly InstitutePlace[],
): Record<string, unknown>[] {
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

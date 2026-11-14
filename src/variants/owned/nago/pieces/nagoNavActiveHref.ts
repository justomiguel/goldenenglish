const LANDING_SECTION_IDS = [
  "top",
  "clases",
  "horarios",
  "nago",
  "galeria",
  "contacto",
] as const;

export type NagoNavSectionId = (typeof LANDING_SECTION_IDS)[number];

export function resolveNagoNavActiveHref({
  locale,
  pathname,
  intersectingIds,
}: {
  locale: string;
  pathname: string;
  intersectingIds: readonly string[];
}): string {
  const prefix = `/${locale}`;
  if (pathname === `${prefix}/events` || pathname.startsWith(`${prefix}/events/`)) {
    return `${prefix}/events`;
  }
  if (pathname === `${prefix}/blog` || pathname.startsWith(`${prefix}/blog/`)) {
    return `${prefix}/blog`;
  }

  let active: NagoNavSectionId = "top";
  for (const id of LANDING_SECTION_IDS) {
    if (intersectingIds.includes(id)) active = id;
  }
  return `${prefix}#${active}`;
}

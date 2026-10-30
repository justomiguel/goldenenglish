const HIDEABLE = new Set(["historia", "oferta", "modalidades", "niveles", "certificaciones"]);

/** Sections listed in `app.landing.hidden`. Inicio stays visible. */
export function hiddenLandingSections(
  properties: Readonly<Record<string, string>> | null | undefined,
): ReadonlySet<string> {
  const raw = properties?.["app.landing.hidden"] ?? "";
  const hidden = new Set<string>();
  for (const part of raw.split(",")) {
    const section = part.trim();
    if (HIDEABLE.has(section)) hidden.add(section);
  }
  return hidden;
}

export function landingHiddenValue(hidden: readonly string[]): string {
  return hidden.filter((section) => HIDEABLE.has(section)).join(",");
}

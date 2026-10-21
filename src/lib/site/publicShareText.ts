const SHARE_DESCRIPTION_MAX = 180;

export function buildPublicShareTitle(what: string, academy: string): string {
  const name = what.trim();
  const brand = academy.trim();
  if (!name) return brand;
  if (!brand || name === brand) return name;
  return `${name} · ${brand}`;
}

/** One line, at most 180 characters, cut on a word when possible. */
export function clipShareDescription(value: string, max = SHARE_DESCRIPTION_MAX): string {
  const flat = value.replace(/\s+/g, " ").trim();
  if (flat.length <= max) return flat;
  const cut = flat.slice(0, max);
  const space = cut.lastIndexOf(" ");
  const clipped = space > 40 ? cut.slice(0, space) : cut;
  return clipped.trimEnd();
}

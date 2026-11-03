/** Turns a typed short address into a slug. Empty when no letter or digit remains. */
export function ownerSiteSlug(raw: string): string {
  const slug = raw
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 50)
    .replace(/-+$/g, "");
  return /^[a-z0-9](?:[a-z0-9-]{0,49})$/.test(slug) ? slug : "";
}

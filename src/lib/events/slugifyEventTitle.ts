const NON_ALNUM = /[^a-z0-9]+/g;
const DUP_DASH = /-+/g;
const EDGE_DASH = /^-|-$/g;

export function slugifyEventTitle(value: string): string {
  return value
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .trim()
    .replace(NON_ALNUM, "-")
    .replace(DUP_DASH, "-")
    .replace(EDGE_DASH, "");
}

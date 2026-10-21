import { slugifyPublicPathSegment } from "@/lib/site/slugifyPublicPathSegment";

export function cosmeticShareSlug(value: string, fallback: string): string {
  return slugifyPublicPathSegment(value) || fallback;
}

function joinPath(locale: string, segments: string[]): string {
  return `/${[locale, ...segments].join("/")}`;
}

export function buildBadgeSharePath(locale: string, title: string, token: string): string {
  return joinPath(locale, ["logro", cosmeticShareSlug(title, "logro"), token]);
}

export function buildQuestionnaireSharePath(locale: string, slug: string): string {
  return joinPath(locale, ["encuesta", slug]);
}

export function buildShopProductPath(locale: string, slug: string): string {
  return joinPath(locale, ["tienda", slug]);
}

export function buildShopOrderPath(locale: string, productTitle: string, token: string): string {
  return joinPath(locale, ["tienda", "pedido", cosmeticShareSlug(productTitle, "pedido"), token]);
}

export function buildMatriculaPayPath(locale: string, sectionLabel: string, token: string): string {
  return joinPath(locale, ["matricula", cosmeticShareSlug(sectionLabel, "pago"), token]);
}

export function buildBlogPreviewPath(locale: string, articleSlug: string, token: string): string {
  const slug = articleSlug.trim() || "articulo";
  return joinPath(locale, ["blog", "vista-previa", slug, token]);
}

export function buildEventPreviewPath(locale: string, eventTitleOrSlug: string): string {
  return joinPath(locale, ["events", "vista-previa", cosmeticShareSlug(eventTitleOrSlug, "evento")]);
}

export function parseCosmeticSecretSegments(
  parts: string[],
): { slug: string | null; secret: string } | null {
  if (parts.length === 1 && parts[0]) return { slug: null, secret: parts[0] };
  if (parts.length === 2 && parts[0] && parts[1]) return { slug: parts[0], secret: parts[1] };
  return null;
}

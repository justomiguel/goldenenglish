/** Marketing header and footer. Standalone CSS hides this class. */
export const PUBLIC_MARKETING_CHROME_CLASS = "public-marketing-chrome";

export type PublicExperienceVariant =
  | "default"
  | "mozarthitos"
  | "espaciozenit"
  | "nago"
  | "mimundo"
  | "liora";

const COURSES_ANCHOR: Record<string, string> = {
  classic: "niveles",
  editorial: "niveles",
  minimal: "niveles",
  mozarthitos: "cursos",
  espaciozenit: "disciplinas",
  nago: "clases",
  mimundo: "salas",
  liora: "clases",
};

const THEMED: ReadonlySet<string> = new Set([
  "mozarthitos",
  "espaciozenit",
  "nago",
  "mimundo",
  "liora",
]);

export function publicPwaCoursesHref(kind: string, locale: string): string {
  const anchor = COURSES_ANCHOR[kind] ?? "niveles";
  return `/${locale}#${anchor}`;
}

export function publicExperienceVariant(kind: string): PublicExperienceVariant {
  if (THEMED.has(kind)) return kind as PublicExperienceVariant;
  return "default";
}

export function publicExperienceThemeClass(variant: PublicExperienceVariant): string {
  if (variant === "mozarthitos") return "mz-landing";
  if (variant === "espaciozenit") return "ez-landing mz-landing";
  if (variant === "nago") return "nago-landing";
  if (variant === "mimundo") return "mimundo-landing";
  if (variant === "liora") return "liora-landing";
  return "";
}

export function publicExperienceLocaleVariant(
  variant: PublicExperienceVariant,
): "compact" | "compactDark" {
  if (variant === "nago" || variant === "espaciozenit") return "compactDark";
  return "compact";
}

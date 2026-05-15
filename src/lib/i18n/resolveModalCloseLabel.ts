import en from "@/dictionaries/en.json";
import es from "@/dictionaries/es.json";
import pt from "@/dictionaries/pt.json";

/**
 * Infers active dictionary locale from App Router paths like `/en/dashboard/...`.
 */
export function localeCodeFromPathname(
  pathname: string | null | undefined,
): "en" | "es" | "pt" {
  if (!pathname) return "es";
  const m = pathname.match(/^\/(en|es|pt)(?:\/|$)/);
  if (m?.[1] === "en") return "en";
  if (m?.[1] === "pt") return "pt";
  return "es";
}

/**
 * Label for the Modal header close control. Uses non-empty `closeLabel` when
 * provided; otherwise `common.modalClose` for the active locale.
 * Pass `closeLabel=""` only to suppress the header close (rare; prefer `disableClose`).
 */
export function resolveModalCloseLabel(
  closeLabel: string | undefined,
  pathname: string | null | undefined,
): string | null {
  if (closeLabel === "") return null;
  if (closeLabel !== undefined && closeLabel.trim().length > 0) {
    return closeLabel;
  }
  const code = localeCodeFromPathname(pathname);
  if (code === "en") return en.common.modalClose;
  if (code === "pt") return pt.common.modalClose;
  return es.common.modalClose;
}

/** Hint when modal body is scrollable (affordance + screen readers). */
export function resolveModalScrollMoreHint(pathname: string | null | undefined): string {
  const code = localeCodeFromPathname(pathname);
  if (code === "en") return en.common.modalScrollMore;
  if (code === "pt") return pt.common.modalScrollMore;
  return es.common.modalScrollMore;
}

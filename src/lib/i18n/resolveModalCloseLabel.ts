import en from "@/dictionaries/en.json";
import es from "@/dictionaries/es.json";

/**
 * Infers `en` | `es` from App Router paths like `/en/dashboard/...`.
 */
export function localeCodeFromPathname(pathname: string | null | undefined): "en" | "es" {
  if (!pathname) return "es";
  const m = pathname.match(/^\/(en|es)(?:\/|$)/);
  return m?.[1] === "en" ? "en" : "es";
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
  return localeCodeFromPathname(pathname) === "en"
    ? en.common.modalClose
    : es.common.modalClose;
}

/** Hint when modal body is scrollable (affordance + screen readers). */
export function resolveModalScrollMoreHint(pathname: string | null | undefined): string {
  return localeCodeFromPathname(pathname) === "en"
    ? en.common.modalScrollMore
    : es.common.modalScrollMore;
}

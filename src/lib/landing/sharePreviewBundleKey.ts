import type { SiteThemeKind } from "@/types/theming";

/** Bundled marketing assets under `public/images/<key>/logo/`. */
export type SharePreviewBundleKey =
  | "golden"
  | "mozarthitos"
  | "espaciozenit"
  | "nago";

/** Maps landing template kind → folder key for share preview logos. */
export function sharePreviewBundleKeyFromTemplateKind(
  kind: SiteThemeKind | string | null | undefined,
): SharePreviewBundleKey {
  if (kind === "mozarthitos") return "mozarthitos";
  if (kind === "espaciozenit") return "espaciozenit";
  if (kind === "nago") return "nago";
  return "golden";
}

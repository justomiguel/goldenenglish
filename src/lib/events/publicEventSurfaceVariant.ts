import { loadActiveTheme } from "@/lib/theme/loadActiveTheme";

export type PublicEventSurfaceVariant = "default" | "espaciozenit" | "nago";

export function resolvePublicEventSurfaceVariant(
  templateKind: string | undefined,
): PublicEventSurfaceVariant {
  if (templateKind === "espaciozenit") return "espaciozenit";
  if (templateKind === "nago") return "nago";
  return "default";
}

export function isDarkPublicEventSurface(
  variant: PublicEventSurfaceVariant,
): boolean {
  return variant === "espaciozenit" || variant === "nago";
}

export async function loadPublicEventSurfaceVariant(): Promise<PublicEventSurfaceVariant> {
  const snapshot = await loadActiveTheme();
  return resolvePublicEventSurfaceVariant(snapshot?.theme.templateKind);
}

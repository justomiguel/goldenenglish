import { loadActiveTheme } from "@/lib/theme/loadActiveTheme";

export type PublicEventSurfaceVariant = "default" | "espaciozenit";

export function resolvePublicEventSurfaceVariant(
  templateKind: string | undefined,
): PublicEventSurfaceVariant {
  return templateKind === "espaciozenit" ? "espaciozenit" : "default";
}

export async function loadPublicEventSurfaceVariant(): Promise<PublicEventSurfaceVariant> {
  const snapshot = await loadActiveTheme();
  return resolvePublicEventSurfaceVariant(snapshot?.theme.templateKind);
}

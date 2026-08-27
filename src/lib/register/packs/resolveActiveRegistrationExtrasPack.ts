import { extrasPackForTemplateKind, type RegistrationExtrasPackId } from "@/lib/register/packs/extrasPackForTemplateKind";
import { loadActiveTheme } from "@/lib/theme/loadActiveTheme";

export async function resolveActiveRegistrationExtrasPack(): Promise<RegistrationExtrasPackId | null> {
  const snapshot = await loadActiveTheme();
  return extrasPackForTemplateKind(snapshot?.theme.templateKind ?? "classic");
}

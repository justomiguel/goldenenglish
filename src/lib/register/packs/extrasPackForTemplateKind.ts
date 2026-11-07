export type RegistrationExtrasPackId = "nago" | "mozarthitos";

export function extrasPackForTemplateKind(kind: string): RegistrationExtrasPackId | null {
  if (kind === "nago") return "nago";
  if (kind === "mozarthitos") return "mozarthitos";
  return null;
}

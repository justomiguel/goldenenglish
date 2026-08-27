export type RegistrationExtrasPackId = "nago";

export function extrasPackForTemplateKind(kind: string): RegistrationExtrasPackId | null {
  return kind === "nago" ? "nago" : null;
}

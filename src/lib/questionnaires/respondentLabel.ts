export function questionnaireRespondentLabel(
  input: { userId: string | null; email: string | null; displayName: string | null },
  anonymousLabel: string,
): string {
  const name = String(input.displayName ?? "").trim();
  if (name) return name;
  const email = String(input.email ?? "").trim();
  if (email) return email;
  return anonymousLabel;
}

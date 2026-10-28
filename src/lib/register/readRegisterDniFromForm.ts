export function readRegisterDniFromForm(
  form: HTMLFormElement | null,
  fallback: string,
): string {
  const live = form ? String(new FormData(form).get("dni") ?? "").trim() : "";
  return live || fallback.trim();
}

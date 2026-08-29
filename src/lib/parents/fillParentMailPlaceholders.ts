function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function fillParentMailPlaceholders(
  template: string,
  names: { firstName: string; lastName: string },
): string {
  return template
    .replaceAll("{{nombre}}", escapeHtml(names.firstName))
    .replaceAll("{{apellido}}", escapeHtml(names.lastName));
}

/** Replaces `{{key}}` placeholders in admin tour copy (year, name, …). */
export function fillTourTemplate(template: string, vars: Record<string, string>): string {
  return template.replace(/\{\{\s*(\w+)\s*\}\}/g, (_, key: string) => vars[key] ?? "");
}

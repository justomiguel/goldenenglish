/** Replace `{{key}}` placeholders in a template string (email copy, etc.). */
export function fillTemplate(template: string, vars: Record<string, string>): string {
  let s = template;
  for (const [key, val] of Object.entries(vars)) {
    s = s.replaceAll(`{{${key}}}`, val);
  }
  return s;
}

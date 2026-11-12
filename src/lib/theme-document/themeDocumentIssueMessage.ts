export function themeDocumentIssueMessage(
  issues: Record<string, string> | undefined,
  code: string,
  extras?: { path?: string },
): string {
  const template = issues?.[code] ?? issues?.unknown ?? "Code: {code}";
  return template.replaceAll("{path}", extras?.path ?? "").replaceAll("{code}", code);
}

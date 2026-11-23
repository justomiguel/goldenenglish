export function openAiKeyFormError(code: string, errors: object): string {
  if (!(code in errors)) return code;
  const value = (errors as Record<string, unknown>)[code];
  return typeof value === "string" ? value : code;
}

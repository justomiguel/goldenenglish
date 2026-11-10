/** Sentence for a known staff code. An unknown code stays visible as itself. */
export function pulsarTenantFormErrorText(
  errorCode: string | null,
  errors: Record<string, string>,
): string | null {
  if (!errorCode) return null;
  return errors[errorCode] ?? errorCode;
}

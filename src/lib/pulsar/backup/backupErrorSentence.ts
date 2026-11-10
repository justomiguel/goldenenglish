/** Returns the sentence for a known code. An unknown code stays visible. */
export function backupErrorSentence(errors: Record<string, string>, code: string): string {
  if (Object.prototype.hasOwnProperty.call(errors, code) && errors[code]) return errors[code];
  return code;
}

export function eventShareFailureMessage(
  code: string,
  sentences: Record<string, string>,
): string {
  const sentence = sentences[code];
  if (sentence) return sentence;
  return code;
}

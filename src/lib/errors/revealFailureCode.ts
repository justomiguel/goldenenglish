/** Keep a stable code next to the sentence so a person can quote it. */
export function revealFailureCode(sentence: string, code: string | null | undefined): string {
  const text = sentence.trim();
  const token = code?.trim() ?? "";
  if (!token) return text;
  if (text.includes(token)) return text;
  return text ? `${text} (${token})` : token;
}

/** Pick the sentence for a code. Always show the code, including when the sentence is missing. */
export function explainCodedFailure(
  code: string | null | undefined,
  sentences: Partial<Record<string, string>> | undefined,
  fallback: string,
): string {
  const token = code?.trim() ?? "";
  const mapped = token ? sentences?.[token]?.trim() : "";
  return revealFailureCode(mapped || fallback, token);
}

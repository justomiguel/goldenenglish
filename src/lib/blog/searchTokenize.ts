const TOKEN_RE = /[^\p{L}\p{N}\s-]/gu;

export function tokenizeBlogSearchQuery(query: string): string[] {
  const cleaned = query
    .trim()
    .toLowerCase()
    .replace(TOKEN_RE, " ")
    .replace(/\s+/g, " ");

  if (!cleaned) return [];
  return cleaned
    .split(" ")
    .map((token) => token.trim())
    .filter((token) => token.length >= 2)
    .slice(0, 8);
}

export function buildSimpleTsQuery(query: string): string {
  const tokens = tokenizeBlogSearchQuery(query);
  if (tokens.length === 0) return "";
  return tokens.map((token) => `${token}:*`).join(" & ");
}

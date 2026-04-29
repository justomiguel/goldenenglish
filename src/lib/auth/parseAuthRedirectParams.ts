/**
 * Parses Supabase auth redirect params from query string and hash fragment (hash
 * loses precedence vs query — matches @supabase/auth-js parseParametersFromURL).
 */
export function parseAuthRedirectParams(href: string): Record<string, string> {
  const result: Record<string, string> = {};
  try {
    const url = new URL(href);
    if (url.hash?.startsWith("#")) {
      try {
        const hashSearchParams = new URLSearchParams(url.hash.slice(1));
        hashSearchParams.forEach((value, key) => {
          result[key] = value;
        });
      } catch {
        /* ignore */
      }
    }
    url.searchParams.forEach((value, key) => {
      result[key] = value;
    });
  } catch {
    /* ignore */
  }
  return result;
}

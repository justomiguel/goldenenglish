export const CENTROLISTO_MARKETS = ["cl", "ar", "uy", "py"] as const;

export type CentrolistoMarketCode = (typeof CENTROLISTO_MARKETS)[number];

export const CENTROLISTO_MARKET_QUERY = "pais";

export const CENTROLISTO_MARKET_COOKIE = "centrolisto_market";

const MARKET_SET = new Set<string>(CENTROLISTO_MARKETS);

export function isCentrolistoMarketCode(value: string): value is CentrolistoMarketCode {
  return MARKET_SET.has(value);
}

function firstValue(value: string | readonly string[] | null | undefined): string | null {
  if (Array.isArray(value)) return value[0]?.trim().toLowerCase() ?? null;
  if (typeof value !== "string") return null;
  const trimmed = value.trim().toLowerCase();
  return trimmed.length > 0 ? trimmed : null;
}

export function resolveCentrolistoMarket(input: {
  query?: string | readonly string[] | null;
  cookie?: string | null;
}): CentrolistoMarketCode {
  const query = firstValue(input.query);
  if (query && isCentrolistoMarketCode(query)) return query;
  const cookie = firstValue(input.cookie);
  if (cookie && isCentrolistoMarketCode(cookie)) return cookie;
  return "cl";
}

/** Keep `pais` on a marketing link when the visitor is outside Chile. */
export function withCentrolistoMarket(href: string, market: CentrolistoMarketCode): string {
  if (market === "cl") return href;
  const [path, query = ""] = href.split("?");
  const params = new URLSearchParams(query);
  params.set(CENTROLISTO_MARKET_QUERY, market);
  return `${path}?${params.toString()}`;
}

export function centrolistoMarketCookieAssignment(
  code: CentrolistoMarketCode,
  secure: boolean,
): string {
  const securePart = secure ? "; Secure" : "";
  return `${CENTROLISTO_MARKET_COOKIE}=${code}; Path=/; Max-Age=31536000; SameSite=Lax${securePart}`;
}

/** Writes the market cookie in the browser. Kept outside React so the assignment is allowed. */
export function writeCentrolistoMarketCookie(code: CentrolistoMarketCode): void {
  if (typeof document === "undefined") return;
  document.cookie = centrolistoMarketCookieAssignment(code, window.location.protocol === "https:");
}

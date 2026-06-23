/**
 * Pure check: is this an absolute URL a third party (e.g. Mercado Pago) can
 * actually reach to perform redirects/auto-return? Localhost, loopback, private
 * IPs, and *.local hosts are NOT publicly reachable. No Supabase/React imports.
 */

const PRIVATE_IPV4_PREFIXES = ["10.", "192.168.", "127."];

function isPrivateIpv4Host(host: string): boolean {
  if (PRIVATE_IPV4_PREFIXES.some((prefix) => host.startsWith(prefix))) return true;
  // 172.16.0.0 – 172.31.255.255
  const match = /^172\.(\d{1,3})\./.exec(host);
  if (match) {
    const second = Number(match[1]);
    return second >= 16 && second <= 31;
  }
  return false;
}

/** True when the URL host can be reached by external services (no localhost/private IPs). */
export function isPubliclyReachableUrl(raw: string): boolean {
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    return false;
  }

  if (url.protocol !== "http:" && url.protocol !== "https:") return false;

  const host = url.hostname.toLowerCase();
  if (host === "localhost" || host === "0.0.0.0" || host === "::1" || host === "[::1]") {
    return false;
  }
  if (host.endsWith(".local") || host.endsWith(".localhost")) return false;
  if (isPrivateIpv4Host(host)) return false;

  return true;
}

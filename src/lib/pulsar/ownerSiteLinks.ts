import { normalizeHost } from "@/lib/tenant/tenantRegistry";

const VERCEL_CNAME = "cname.vercel-dns.com";
const VERCEL_APEX_A = "76.76.21.21";
const APEX_SUFFIXES = new Set([
  "com.ar",
  "com.mx",
  "com.br",
  "com.co",
  "com.pe",
  "com.uy",
  "com.ec",
  "org.ar",
  "net.ar",
  "co.uk",
  "com.au",
]);

export function hostOnly(raw: string): string {
  return raw.trim().toLowerCase().replace(/^https?:\/\//, "").replace(/\/.*$/, "").replace(/:\d+$/, "");
}

export function customHostBesidePreview(
  hosts: readonly string[],
  previewHosts: readonly string[],
): string {
  const preview = new Set(previewHosts.map((host) => normalizeHost(host)));
  return hosts.map((host) => normalizeHost(host)).find((host) => host.length > 0 && !preview.has(host)) ?? "";
}

/** Apex domains use an A record. Any other host uses a CNAME on its first label. */
export function domainDnsRecord(host: string): { kind: "cname" | "a"; name: string; target: string } | null {
  const normalized = normalizeHost(hostOnly(host));
  const labels = normalized.split(".").filter((label) => label.length > 0);
  if (labels.length < 2) return null;
  const suffix = labels.slice(1).join(".");
  const apex = labels.length === 2 || (labels.length === 3 && APEX_SUFFIXES.has(suffix));
  if (apex) return { kind: "a", name: normalized, target: VERCEL_APEX_A };
  return { kind: "cname", name: labels[0] ?? normalized, target: VERCEL_CNAME };
}

export function previewSiteUrl(previewHosts: readonly string[]): string {
  const host = previewHosts.map((item) => normalizeHost(item)).find((item) => item.length > 0) ?? "";
  return host ? `https://${host}` : "";
}

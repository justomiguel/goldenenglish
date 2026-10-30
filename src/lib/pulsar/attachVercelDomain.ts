import { logServerWarn } from "@/lib/logging/serverActionLog";
import { normalizeHost } from "@/lib/tenant/tenantRegistry";

export interface VercelDomainAttach {
  token: string;
  projectId: string;
  teamId?: string | null;
  domain: string;
  fetchImpl?: typeof fetch;
}

/** Adds one host to the Vercel project. 409 means the domain is already there. */
export async function attachVercelProjectDomain(
  input: VercelDomainAttach,
): Promise<{ ok: true } | { ok: false; errorCode: string }> {
  const domain = input.domain.trim().toLowerCase();
  if (!domain || domain.includes("/") || domain.includes(" ")) {
    return { ok: false, errorCode: "invalid_domain" };
  }
  const team = input.teamId?.trim();
  const query = team ? `?teamId=${encodeURIComponent(team)}` : "";
  const url = `https://api.vercel.com/v10/projects/${encodeURIComponent(input.projectId)}/domains${query}`;
  const fetcher = input.fetchImpl ?? fetch;
  try {
    const response = await fetcher(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${input.token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ name: domain }),
    });
    if (response.ok || response.status === 409) return { ok: true };
    return { ok: false, errorCode: "vercel_domain_failed" };
  } catch {
    return { ok: false, errorCode: "vercel_domain_failed" };
  }
}

/** Removes one host from the Vercel project. 404 means it is already gone. */
export async function detachVercelProjectDomain(
  input: VercelDomainAttach,
): Promise<{ ok: true } | { ok: false; errorCode: string }> {
  const domain = input.domain.trim().toLowerCase();
  if (!input.token.trim() || !input.projectId.trim()) return { ok: true };
  if (!domain || domain.includes("/") || domain.includes(" ")) {
    return { ok: false, errorCode: "invalid_domain" };
  }
  const team = input.teamId?.trim();
  const query = team ? `?teamId=${encodeURIComponent(team)}` : "";
  const url = `https://api.vercel.com/v9/projects/${encodeURIComponent(input.projectId)}/domains/${encodeURIComponent(domain)}${query}`;
  const fetcher = input.fetchImpl ?? fetch;
  try {
    const response = await fetcher(url, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${input.token}` },
    });
    if (response.ok || response.status === 404) return { ok: true };
    return { ok: false, errorCode: "vercel_domain_failed" };
  } catch {
    return { ok: false, errorCode: "vercel_domain_failed" };
  }
}

/** Staff extra hosts go to Vercel when the token is set. Preview hosts stay local. */
export async function attachStaffExtraHosts(args: {
  slug: string;
  hosts: readonly string[];
  previewHosts: readonly string[];
}): Promise<{ ok: true; slug: string } | { ok: false; errorCode: string }> {
  const token = process.env.VERCEL_TOKEN?.trim() ?? "";
  const projectId = process.env.VERCEL_PROJECT_ID?.trim() ?? "";
  if (!token || !projectId) {
    logServerWarn("attachStaffExtraHosts:skipped", { slug: args.slug, reason: "vercel_unconfigured" });
    return { ok: true, slug: args.slug };
  }
  const preview = new Set(args.previewHosts.map((host) => normalizeHost(host)));
  for (const host of args.hosts) {
    if (preview.has(normalizeHost(host))) continue;
    const attached = await attachVercelProjectDomain({
      token,
      projectId,
      teamId: process.env.VERCEL_TEAM_ID,
      domain: host,
    });
    if (!attached.ok) return { ok: false, errorCode: attached.errorCode };
  }
  return { ok: true, slug: args.slug };
}

/** Names already attached to the Vercel project. One list call for the fleet. */
export async function listVercelProjectDomainNames(input: {
  token: string;
  projectId: string;
  teamId?: string | null;
  fetchImpl?: typeof fetch;
}): Promise<string[] | null> {
  const token = input.token.trim();
  const projectId = input.projectId.trim();
  if (!token || !projectId) return null;
  const team = input.teamId?.trim();
  const query = team ? `&teamId=${encodeURIComponent(team)}` : "";
  const url = `https://api.vercel.com/v9/projects/${encodeURIComponent(projectId)}/domains?limit=100${query}`;
  const fetcher = input.fetchImpl ?? fetch;
  try {
    const response = await fetcher(url, { headers: { Authorization: `Bearer ${token}` } });
    if (!response.ok) return null;
    const body = (await response.json()) as { domains?: { name?: string }[] };
    return (body.domains ?? [])
      .map((item) => (typeof item.name === "string" ? item.name : ""))
      .filter((name) => name.length > 0);
  } catch {
    return null;
  }
}

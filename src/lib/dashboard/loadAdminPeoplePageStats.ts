import type { SupabaseClient } from "@supabase/supabase-js";
import { logSupabaseClientError } from "@/lib/logging/serverActionLog";

export type AdminPeoplePageRole = "teacher" | "student" | "all";

export type AdminPeoplePageStats = {
  total: number;
  allAccounts: number;
  withPhone: number;
  newLast30Days: number;
};

function countOrZero(count: number | null): number {
  return typeof count === "number" && Number.isFinite(count) ? count : 0;
}

export function peopleSharePercent(part: number, total: number): number {
  if (total <= 0 || part <= 0) return 0;
  return Math.round((part / total) * 1000) / 10;
}

type CountQuery = {
  eq: (col: string, val: string) => CountQuery;
  not: (col: string, op: string, val: null) => CountQuery;
  neq: (col: string, val: string) => CountQuery;
  gte: (col: string, val: string) => CountQuery;
};

type CountResult = {
  count: number | null;
  error: Parameters<typeof logSupabaseClientError>[1];
};

function asCountQuery(query: unknown): CountQuery {
  return query as CountQuery;
}

function applyRole(query: CountQuery, role: AdminPeoplePageRole): Promise<CountResult> {
  return (role === "all" ? query : query.eq("role", role)) as unknown as Promise<CountResult>;
}

function profilesHeadCount(adminClient: SupabaseClient): CountQuery {
  return asCountQuery(adminClient.from("profiles").select("id", { count: "exact", head: true }));
}

export async function loadAdminPeoplePageStats(
  adminClient: SupabaseClient,
  role: AdminPeoplePageRole,
): Promise<AdminPeoplePageStats> {
  const since = new Date();
  since.setUTCDate(since.getUTCDate() - 30);
  const sinceIso = since.toISOString();

  const [totalRes, phoneRes, newRes, allRes] = await Promise.all([
    applyRole(profilesHeadCount(adminClient), role),
    applyRole(profilesHeadCount(adminClient).not("phone", "is", null).neq("phone", ""), role),
    applyRole(profilesHeadCount(adminClient).gte("created_at", sinceIso), role),
    applyRole(profilesHeadCount(adminClient), "all"),
  ]);

  if (totalRes.error) logSupabaseClientError("loadAdminPeoplePageStats:total", totalRes.error, { role });
  if (phoneRes.error) logSupabaseClientError("loadAdminPeoplePageStats:phone", phoneRes.error, { role });
  if (newRes.error) logSupabaseClientError("loadAdminPeoplePageStats:new", newRes.error, { role });
  if (allRes.error) logSupabaseClientError("loadAdminPeoplePageStats:all", allRes.error, { role });

  return {
    total: countOrZero(totalRes.count),
    allAccounts: countOrZero(allRes.count),
    withPhone: countOrZero(phoneRes.count),
    newLast30Days: countOrZero(newRes.count),
  };
}

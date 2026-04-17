import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

export type TrafficVisitorKind = "authenticated" | "guest" | "bot";

export interface TrafficKindBreakdown {
  paths: { pathname: string; cnt: number }[];
  agents: { user_agent: string; cnt: number }[];
}

type RawPathRow = { pathname: string; cnt: number | string };
type RawAgentRow = { user_agent: string; cnt: number | string };

const DEFAULT_PATH_LIMIT = 25;
const DEFAULT_AGENT_LIMIT = 15;

/**
 * Loads top pathnames and top User-Agent strings for one visitor kind.
 * Bounded by the RPC server-side (see migration 047) to keep payload small for the UI tabs.
 */
export async function loadAdminTrafficKindBreakdown(
  supabase: SupabaseClient,
  kind: TrafficVisitorKind,
  days: number,
  opts?: { pathLimit?: number; agentLimit?: number },
): Promise<TrafficKindBreakdown> {
  const pathLimit = opts?.pathLimit ?? DEFAULT_PATH_LIMIT;
  const agentLimit = opts?.agentLimit ?? DEFAULT_AGENT_LIMIT;

  const [pathsRes, agentsRes] = await Promise.all([
    supabase.rpc("admin_traffic_kind_path_breakdown", {
      p_kind: kind,
      p_days: days,
      p_limit: pathLimit,
    }),
    supabase.rpc("admin_traffic_kind_agent_breakdown", {
      p_kind: kind,
      p_days: days,
      p_limit: agentLimit,
    }),
  ]);

  const paths = ((pathsRes.data ?? []) as RawPathRow[]).map((r) => ({
    pathname: String(r.pathname ?? ""),
    cnt: Number(r.cnt ?? 0),
  }));
  const agents = ((agentsRes.data ?? []) as RawAgentRow[]).map((r) => ({
    user_agent: String(r.user_agent ?? ""),
    cnt: Number(r.cnt ?? 0),
  }));

  return { paths, agents };
}

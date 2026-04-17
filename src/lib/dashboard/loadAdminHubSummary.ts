import type { SupabaseClient } from "@supabase/supabase-js";

export interface AdminHubSummary {
  traffic: {
    totalHits: number;
    authenticatedHits: number;
    guestHits: number;
  };
  trafficWeekOverWeek: {
    thisWeek: number;
    lastWeek: number;
  };
  users: {
    total: number;
    byRole: { role: string; count: number }[];
  };
  payments: {
    pendingCount: number;
  };
  registrations: {
    newCount: number;
    totalCount: number;
  };
  studentsWithoutSection: number;
  messages: {
    recentCount: number;
    latestPreview: { fromName: string; preview: string; createdAt: string } | null;
  };
}

interface ProfileCountsRpc {
  total: number;
  by_role: { role: string; count: number }[];
  students_without_section: number;
}

/**
 * Fetches lightweight summary metrics for the admin hub overview.
 * Profile counts come from `admin_hub_profile_counts` RPC (single aggregate
 * query) instead of scanning the full profiles table.
 */
export async function loadAdminHubSummary(
  supabase: SupabaseClient,
  adminClient: SupabaseClient,
  adminUserId: string,
): Promise<AdminHubSummary> {
  const [
    trafficResult,
    weeklyResult,
    profileCountsResult,
    paymentsResult,
    registrationsNewResult,
    registrationsTotalResult,
    messagesResult,
  ] = await Promise.all([
    supabase.rpc("admin_traffic_summary", { p_days: 30 }),
    loadWeekOverWeek(supabase),
    adminClient.rpc("admin_hub_profile_counts"),
    supabase
      .from("payments")
      .select("id", { head: true, count: "exact" })
      .eq("status", "pending"),
    supabase
      .from("registrations")
      .select("id", { head: true, count: "exact" })
      .eq("status", "new"),
    supabase
      .from("registrations")
      .select("id", { head: true, count: "exact" }),
    loadMessagesSummary(supabase, adminUserId),
  ]);

  const tRow = Array.isArray(trafficResult.data) ? trafficResult.data[0] : null;

  const pc: ProfileCountsRpc = profileCountsResult.data ?? {
    total: 0,
    by_role: [],
    students_without_section: 0,
  };

  return {
    traffic: {
      totalHits: Number(tRow?.total_hits ?? 0),
      authenticatedHits: Number(tRow?.authenticated_hits ?? 0),
      guestHits: Number(tRow?.guest_hits ?? 0),
    },
    trafficWeekOverWeek: weeklyResult,
    users: {
      total: pc.total,
      byRole: pc.by_role.map((r) => ({ role: r.role, count: r.count })),
    },
    payments: {
      pendingCount: paymentsResult.count ?? 0,
    },
    registrations: {
      newCount: registrationsNewResult.count ?? 0,
      totalCount: registrationsTotalResult.count ?? 0,
    },
    studentsWithoutSection: pc.students_without_section,
    messages: messagesResult,
  };
}

async function loadWeekOverWeek(supabase: SupabaseClient) {
  const { data } = await supabase.rpc("admin_traffic_daily_stacked", { p_days: 14 });
  const rows = (Array.isArray(data) ? data : []) as {
    day: string;
    authenticated_hits: number | string;
    guest_hits: number | string;
    bot_hits: number | string;
  }[];

  const now = new Date();
  const sevenDaysAgo = new Date(now);
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const fourteenDaysAgo = new Date(now);
  fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);

  let thisWeek = 0;
  let lastWeek = 0;
  for (const r of rows) {
    const d = new Date(r.day);
    const total =
      Number(r.authenticated_hits ?? 0) +
      Number(r.guest_hits ?? 0) +
      Number(r.bot_hits ?? 0);
    if (d >= sevenDaysAgo) {
      thisWeek += total;
    } else if (d >= fourteenDaysAgo) {
      lastWeek += total;
    }
  }
  return { thisWeek, lastWeek };
}

function stripHtml(html: string, max = 100): string {
  const text = String(html)
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  return text.length > max ? `${text.slice(0, max)}…` : text;
}

async function loadMessagesSummary(
  supabase: SupabaseClient,
  adminUserId: string,
): Promise<AdminHubSummary["messages"]> {
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const { data: recentMsgs } = await supabase
    .from("portal_messages")
    .select("id, sender_id, body_html, created_at")
    .eq("recipient_id", adminUserId)
    .gte("created_at", sevenDaysAgo.toISOString())
    .order("created_at", { ascending: false })
    .limit(5);

  const list = recentMsgs ?? [];

  if (list.length === 0) {
    return { recentCount: 0, latestPreview: null };
  }

  const latest = list[0];
  const senderId = latest.sender_id as string;
  const { data: sender } = await supabase
    .from("profiles")
    .select("first_name, last_name")
    .eq("id", senderId)
    .single();

  const fromName = sender
    ? `${sender.first_name} ${sender.last_name}`.trim()
    : "—";

  return {
    recentCount: list.length,
    latestPreview: {
      fromName,
      preview: stripHtml(latest.body_html as string),
      createdAt: latest.created_at as string,
    },
  };
}

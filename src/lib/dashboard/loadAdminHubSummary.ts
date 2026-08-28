import type { SupabaseClient } from "@supabase/supabase-js";
import { formatProfileSnakeSurnameFirst } from "@/lib/profile/formatProfileDisplayName";
import { countRegistrationInboxBuckets } from "@/lib/register/countRegistrationInboxBuckets";
import {
  parseRegistrationIntakeState,
  snapshotTotalFromUnknown,
} from "@/lib/register/registrationIntake";
import {
  mapAdminTrafficDailyStacked,
  trafficWeekOverWeekFromDaily,
  type AdminTrafficDailyRow,
} from "@/lib/dashboard/mapAdminTrafficDailyStacked";

export interface AdminHubSummary {
  traffic: {
    totalHits: number;
    authenticatedHits: number;
    guestHits: number;
  };
  trafficDaily: AdminTrafficDailyRow[];
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
    awaitingFeeCount: number;
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
    dailyResult,
    profileCountsResult,
    paymentsResult,
    registrationsInboxResult,
    messagesResult,
  ] = await Promise.all([
    supabase.rpc("admin_traffic_summary", { p_days: 30 }),
    supabase.rpc("admin_traffic_daily_stacked", { p_days: 30 }),
    adminClient.rpc("admin_hub_profile_counts"),
    supabase
      .from("payments")
      .select("id", { head: true, count: "exact" })
      .eq("status", "pending"),
    supabase
      .from("registrations")
      .select("status, intake_state, fee_snapshot")
      .neq("status", "enrolled"),
    loadMessagesSummary(supabase, adminUserId),
  ]);

  const tRow = Array.isArray(trafficResult.data) ? trafficResult.data[0] : null;
  const trafficDaily = mapAdminTrafficDailyStacked(dailyResult.data);

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
    trafficDaily,
    trafficWeekOverWeek: trafficWeekOverWeekFromDaily(trafficDaily),
    users: {
      total: pc.total,
      byRole: pc.by_role.map((r) => ({ role: r.role, count: r.count })),
    },
    payments: {
      pendingCount: paymentsResult.count ?? 0,
    },
    registrations: countHubRegistrationBuckets(registrationsInboxResult.data),
    studentsWithoutSection: pc.students_without_section,
    messages: messagesResult,
  };
}

function countHubRegistrationBuckets(raw: unknown): AdminHubSummary["registrations"] {
  const rows = Array.isArray(raw)
    ? raw.map((row) => {
        const typed = row as {
          status?: unknown;
          intake_state?: unknown;
          fee_snapshot?: unknown;
        };
        return {
          status: String(typed.status ?? ""),
          intakeState: parseRegistrationIntakeState(typed.intake_state),
          snapshotTotal: snapshotTotalFromUnknown(typed.fee_snapshot),
        };
      })
    : [];
  const { urgentCount, awaitingFeeCount } = countRegistrationInboxBuckets(rows);
  return {
    newCount: urgentCount,
    awaitingFeeCount,
    totalCount: urgentCount + awaitingFeeCount,
  };
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

  const fromName = sender ? formatProfileSnakeSurnameFirst(sender, "—") : "—";

  return {
    recentCount: list.length,
    latestPreview: {
      fromName,
      preview: stripHtml(latest.body_html as string),
      createdAt: latest.created_at as string,
    },
  };
}

import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { loadCurrentCohort } from "@/lib/academics/currentCohort";
import { loadAdminCohortCollectionsOverview } from "@/lib/billing/loadAdminCohortCollectionsOverview";
import type { AdminHomeLayout, AdminHomeWidgetId } from "@/lib/dashboard/adminHomeLayout";
import { loadAdminPeoplePageStats } from "@/lib/dashboard/loadAdminPeoplePageStats";
import { logServerException, logSupabaseClientError } from "@/lib/logging/serverActionLog";
import { resolveProductChangelogCopy } from "@/lib/product-changelog/catalog";
import { loadProductChangelogEntries } from "@/lib/product-changelog/loadProductChangelog";
import {
  EMPTY_ADMIN_HOME_OPS,
  type AdminHomeOpsSnapshot,
} from "@/lib/dashboard/parseAdminHomeOpsSnapshot";
import { loadAdminHomeOpsSnapshot } from "@/lib/dashboard/loadAdminHomeOpsSnapshot";

const OPEN_SHOP = ["pending_payment", "paid", "ready_for_pickup"] as const;

export interface AdminHomeUpcomingEvent {
  id: string;
  slug: string;
  title: string;
  eventDate: string;
  capacity: number | null;
  seats: number;
}

export interface AdminHomeExtraWidgets {
  peoplePulse: { newLast30Days: number; neverEntered: number } | null;
  collections: {
    cohortName: string;
    paid: number;
    pendingReview: number;
    overdue: number;
  } | null;
  upcomingEvents: AdminHomeUpcomingEvent[];
  shopOpenCount: number | null;
  changelog: { id: string; title: string; summary: string }[];
  hasCurrentCohort: boolean;
  ops: AdminHomeOpsSnapshot;
}

function requested(layout: AdminHomeLayout, id: AdminHomeWidgetId): boolean {
  return layout.items.some((item) => item.id === id && !item.hidden);
}

const OPS_WIDGETS = [
  "emailQuota",
  "cohortEnrollments",
  "classesToday",
  "trialsThisWeek",
  "sectionSeats",
  "eventWaitlist",
  "eventPaymentsReview",
  "upcomingEvents",
] as const;

function showOps(layout: AdminHomeLayout): boolean {
  return OPS_WIDGETS.some((id) => requested(layout, id));
}

async function loadUpcomingEvents(
  supabase: SupabaseClient,
  today: string,
): Promise<AdminHomeUpcomingEvent[]> {
  const { data, error } = await supabase
    .from("events")
    .select("id, slug, title, event_date, capacity")
    .eq("status", "published")
    .is("archived_at", null)
    .gte("event_date", today)
    .order("event_date", { ascending: true })
    .limit(3);
  if (error) {
    logSupabaseClientError("adminHomeLayout.events", error, {});
    return [];
  }
  return (data ?? []).map((row) => ({
    id: String(row.id),
    slug: String(row.slug ?? ""),
    title: String(row.title ?? ""),
    eventDate: String(row.event_date ?? ""),
    capacity: typeof row.capacity === "number" ? row.capacity : null,
    seats: 0,
  }));
}

async function loadShopOpenCount(supabase: SupabaseClient): Promise<number | null> {
  const { count, error } = await supabase
    .from("shop_orders")
    .select("id", { count: "exact", head: true })
    .in("status", [...OPEN_SHOP]);
  if (error) {
    logSupabaseClientError("adminHomeLayout.shop", error, {});
    return null;
  }
  return count ?? 0;
}

export async function loadAdminHomeExtraWidgets(input: {
  supabase: SupabaseClient;
  admin: SupabaseClient;
  layout: AdminHomeLayout;
  shopEnabled: boolean;
  locale: string;
  now?: Date;
}): Promise<AdminHomeExtraWidgets> {
  try {
    return await loadAdminHomeExtraWidgetsInner(input);
  } catch (err) {
    logServerException("adminHome.extraWidgets", err);
    return {
      peoplePulse: null,
      collections: null,
      upcomingEvents: [],
      shopOpenCount: null,
      changelog: [],
      hasCurrentCohort: false,
      ops: EMPTY_ADMIN_HOME_OPS,
    };
  }
}

async function loadAdminHomeExtraWidgetsInner(input: {
  supabase: SupabaseClient;
  admin: SupabaseClient;
  layout: AdminHomeLayout;
  shopEnabled: boolean;
  locale: string;
  now?: Date;
}): Promise<AdminHomeExtraWidgets> {
  const now = input.now ?? new Date();
  const today = now.toISOString().slice(0, 10);
  const showPeople = requested(input.layout, "peoplePulse");
  const showCollections = requested(input.layout, "collections");
  const showEvents = requested(input.layout, "upcomingEvents");
  const showShop = input.shopEnabled && requested(input.layout, "shopOrders");
  const showChangelog = requested(input.layout, "changelog");
  const opsRequested = showOps(input.layout);

  const cohortPromise = showCollections ? loadCurrentCohort(input.supabase) : Promise.resolve(null);
  const [people, cohort, opsResult, shopOpenCount] = await Promise.all([
    showPeople ? loadAdminPeoplePageStats(input.admin, "student") : Promise.resolve(null),
    cohortPromise,
    opsRequested ? loadAdminHomeOpsSnapshot(input.supabase, now) : Promise.resolve(EMPTY_ADMIN_HOME_OPS),
    showShop ? loadShopOpenCount(input.supabase) : Promise.resolve(null),
  ]);
  const ops = opsResult ?? EMPTY_ADMIN_HOME_OPS;
  const events =
    opsResult && showEvents
      ? ops.events
      : showEvents
        ? await loadUpcomingEvents(input.supabase, today)
        : [];

  let collections: AdminHomeExtraWidgets["collections"] = null;
  if (showCollections && cohort) {
    const overview = await loadAdminCohortCollectionsOverview(input.supabase, cohort.id, {
      todayYear: now.getFullYear(),
      todayMonth: now.getMonth() + 1,
    });
    if (overview) {
      collections = {
        cohortName: overview.cohortName,
        paid: overview.totals.paid,
        pendingReview: overview.totals.pendingReview,
        overdue: overview.totals.overdue,
      };
    }
  }

  const loadedChangelog = showChangelog ? await loadProductChangelogEntries() : null;
  const changelog = loadedChangelog?.ok
    ? loadedChangelog.entries.slice(0, 3).map((entry) => ({
        id: entry.id,
        ...resolveProductChangelogCopy(entry, input.locale),
      }))
    : [];

  return {
    peoplePulse: people
      ? { newLast30Days: people.newLast30Days, neverEntered: people.neverEntered }
      : null,
    collections,
    upcomingEvents: events,
    shopOpenCount,
    changelog,
    hasCurrentCohort: Boolean(cohort),
    ops,
  };
}

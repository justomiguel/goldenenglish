import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { loadCurrentCohort } from "@/lib/academics/currentCohort";
import { loadAdminCohortCollectionsOverview } from "@/lib/billing/loadAdminCohortCollectionsOverview";
import type { AdminHomeLayout, AdminHomeWidgetId } from "@/lib/dashboard/adminHomeLayout";
import { loadAdminPeoplePageStats } from "@/lib/dashboard/loadAdminPeoplePageStats";
import { logSupabaseClientError } from "@/lib/logging/serverActionLog";
import { listProductChangelogEntries, resolveProductChangelogCopy } from "@/lib/product-changelog/catalog";

const OPEN_SHOP = ["pending_payment", "paid", "ready_for_pickup"] as const;

export interface AdminHomeUpcomingEvent {
  id: string;
  slug: string;
  title: string;
  eventDate: string;
  capacity: number | null;
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
}

function requested(layout: AdminHomeLayout, id: AdminHomeWidgetId): boolean {
  return layout.items.some((item) => item.id === id && !item.hidden);
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
  const now = input.now ?? new Date();
  const today = now.toISOString().slice(0, 10);
  const showPeople = requested(input.layout, "peoplePulse");
  const showCollections = requested(input.layout, "collections");
  const showEvents = requested(input.layout, "upcomingEvents");
  const showShop = input.shopEnabled && requested(input.layout, "shopOrders");
  const showChangelog = requested(input.layout, "changelog");

  const cohortPromise = showCollections ? loadCurrentCohort(input.supabase) : Promise.resolve(null);
  const [people, cohort, events, shopOpenCount] = await Promise.all([
    showPeople ? loadAdminPeoplePageStats(input.admin, "student") : Promise.resolve(null),
    cohortPromise,
    showEvents ? loadUpcomingEvents(input.supabase, today) : Promise.resolve([]),
    showShop ? loadShopOpenCount(input.supabase) : Promise.resolve(null),
  ]);

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

  const changelog = showChangelog
    ? listProductChangelogEntries()
        .slice(0, 3)
        .map((entry) => ({
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
  };
}

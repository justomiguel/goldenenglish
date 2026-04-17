import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { getBrandPublic } from "@/lib/brand/server";
import { logServerException, logSupabaseClientError } from "@/lib/logging/serverActionLog";
import { calendarFeedRoleFromProfileRole } from "@/lib/calendar/calendarFeedRole";
import { loadPortalCalendarPageData } from "@/lib/calendar/loadPortalCalendarPageData";
import { loadPortalSpecialCalendarEventsOverlapping } from "@/lib/calendar/loadPortalSpecialCalendarEvents";
import { composePortalCalendarPageEvents } from "@/lib/calendar/composePortalCalendarPageEvents";
import { formatPortalCalendarIcs } from "@/lib/calendar/formatPortalCalendarIcs";
import { filterSpecialCalendarRowsForViewer } from "@/lib/calendar/filterSpecialCalendarRowsForViewer";
import { applyPortalSpecialEventIcsPresentation } from "@/lib/calendar/portalSpecialEventIcsPresentation";
import { defaultLocale, getDictionary } from "@/lib/i18n/dictionaries";

const tokenSchema = z.string().uuid();

function defaultFeedWindow(): { viewStartIso: string; viewEndIso: string } {
  const now = new Date();
  const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  start.setUTCDate(start.getUTCDate() - 7);
  const end = new Date(start);
  end.setUTCDate(end.getUTCDate() + 365 + 7);
  const iso = (d: Date) => d.toISOString().slice(0, 10);
  return { viewStartIso: iso(start), viewEndIso: iso(end) };
}

export type IcsFeedBuildResult =
  | { ok: true; body: string }
  | { ok: false; status: 404 | 403 | 503; message?: string };

export async function buildIcsCalendarFeedResponse(tokenRaw: string): Promise<IcsFeedBuildResult> {
  const trimmed = tokenRaw.trim();
  const token = trimmed.endsWith(".ics") ? trimmed.slice(0, -4).trim() : trimmed;
  const parsed = tokenSchema.safeParse(token);
  if (!parsed.success) return { ok: false, status: 404 };

  let admin;
  try {
    admin = createAdminClient();
  } catch (err) {
    logServerException("buildIcsCalendarFeedResponse:noAdmin", err);
    return { ok: false, status: 503 };
  }

  const { data: profile, error: pErr } = await admin
    .from("profiles")
    .select("id, role, calendar_feed_token")
    .eq("calendar_feed_token", parsed.data)
    .maybeSingle();

  if (pErr) {
    logSupabaseClientError("buildIcsCalendarFeedResponse:profile", pErr, {});
    return { ok: false, status: 503 };
  }
  if (!profile) return { ok: false, status: 404 };

  const portalRole = calendarFeedRoleFromProfileRole(String(profile.role));
  if (!portalRole) return { ok: false, status: 403 };

  const { viewStartIso, viewEndIso } = defaultFeedWindow();
  const page = await loadPortalCalendarPageData(admin, {
    role: portalRole,
    userId: profile.id as string,
  });
  const specialRowsRaw = await loadPortalSpecialCalendarEventsOverlapping(admin, viewStartIso, viewEndIso);
  const specialRows = filterSpecialCalendarRowsForViewer(specialRowsRaw, {
    role: portalRole,
    userId: profile.id as string,
    viewerSectionIds: page.viewerSectionIds,
    viewerCohortIds: page.viewerCohortIds,
  });
  const composed = composePortalCalendarPageEvents(page.sections, page.exams, specialRows, viewStartIso, viewEndIso);
  const dict = await getDictionary(defaultLocale);
  const rows = applyPortalSpecialEventIcsPresentation(composed, dict.dashboard.portalCalendar.specialTypes);
  const brand = getBrandPublic();
  const body = formatPortalCalendarIcs(rows, { calName: brand.name, brandName: brand.name });
  return { ok: true, body };
}

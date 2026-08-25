import type { SupabaseClient } from "@supabase/supabase-js";
import { fetchPortalBirthdaysForViewer } from "@/lib/birthdays/fetchPortalBirthdaysForViewer";
import { instituteTwoWeekBirthdayRange } from "@/lib/birthdays/instituteTwoWeekBirthdayRange";
import { logSupabaseClientError } from "@/lib/logging/serverActionLog";
import {
  mapBirthdayRowsToDashboardCard,
  mergeBirthdayCardDetails,
  type UpcomingBirthdayCardRow,
} from "@/lib/birthdays/mapBirthdayRowsToDashboardCard";

function sectionNameFromJoin(value: unknown): string | null {
  if (!value) return null;
  const row = Array.isArray(value) ? value[0] : value;
  if (!row || typeof row !== "object" || !("name" in row)) return null;
  const name = String((row as { name?: unknown }).name ?? "").trim();
  return name || null;
}

async function loadBirthdayCardDetails(
  supabase: SupabaseClient,
  studentIds: string[],
): Promise<Map<string, { avatarUrl: string | null; sectionLabel: string | null }>> {
  const ids = [...new Set(studentIds.filter(Boolean))];
  const details = new Map<string, { avatarUrl: string | null; sectionLabel: string | null }>();
  if (ids.length === 0) return details;

  const [profilesResult, enrollmentsResult] = await Promise.all([
    supabase.from("profiles").select("id, avatar_url").in("id", ids),
    supabase
      .from("section_enrollments")
      .select("student_id, academic_sections(name)")
      .in("student_id", ids)
      .eq("status", "active"),
  ]);

  if (profilesResult.error) {
    logSupabaseClientError("loadDashboardBirthdaysCard:profiles", profilesResult.error, {
      scope: "birthdays",
    });
  }
  if (enrollmentsResult.error) {
    logSupabaseClientError("loadDashboardBirthdaysCard:enrollments", enrollmentsResult.error, {
      scope: "birthdays",
    });
  }

  for (const id of ids) {
    details.set(id, { avatarUrl: null, sectionLabel: null });
  }

  for (const row of (profilesResult.data ?? []) as Array<{ id: string; avatar_url: string | null }>) {
    const current = details.get(row.id) ?? { avatarUrl: null, sectionLabel: null };
    current.avatarUrl = row.avatar_url;
    details.set(row.id, current);
  }

  const sectionsByStudent = new Map<string, string[]>();
  for (const row of (enrollmentsResult.data ?? []) as Array<{
    student_id: string;
    academic_sections: unknown;
  }>) {
    const name = sectionNameFromJoin(row.academic_sections);
    if (!name) continue;
    const list = sectionsByStudent.get(row.student_id) ?? [];
    if (!list.includes(name)) list.push(name);
    sectionsByStudent.set(row.student_id, list);
  }

  for (const [studentId, names] of sectionsByStudent) {
    const current = details.get(studentId) ?? { avatarUrl: null, sectionLabel: null };
    current.sectionLabel = names.join(" · ");
    details.set(studentId, current);
  }

  return details;
}

export async function loadDashboardBirthdaysCard(
  supabase: SupabaseClient,
  viewerId: string,
): Promise<UpcomingBirthdayCardRow[]> {
  const { startIso, endIso } = instituteTwoWeekBirthdayRange();
  const rows = await fetchPortalBirthdaysForViewer(supabase, viewerId, startIso, endIso);
  const mapped = mapBirthdayRowsToDashboardCard(rows);
  const details = await loadBirthdayCardDetails(
    supabase,
    mapped.map((row) => row.studentId),
  );
  return mergeBirthdayCardDetails(mapped, details);
}

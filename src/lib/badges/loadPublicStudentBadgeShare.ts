import { createAnonReadOnlyClient } from "@/lib/supabase/anon";
import type { StudentBadgeCode } from "@/lib/badges/badgeCodes";
import { isStudentBadgeCode } from "@/lib/badges/badgeCodes";

export type PublicStudentBadgeShare = {
  badgeCode: StudentBadgeCode;
  earnedAt: string;
} | null;

/**
 * Resolves a share link token (safe for unauthenticated visitors / crawlers).
 */
export async function loadPublicStudentBadgeShareByToken(
  token: string,
): Promise<PublicStudentBadgeShare> {
  if (!/^[0-9a-f-]{36}$/i.test(token)) return null;
  const supabase = createAnonReadOnlyClient();
  if (!supabase) return null;
  const { data, error } = await supabase.rpc("get_public_student_badge_share", {
    p_token: token,
  });
  if (error) return null;
  const row = (Array.isArray(data) ? data[0] : data) as
    | { badge_code?: string; earned_at?: string }
    | null
    | undefined;
  if (!row?.badge_code || !row.earned_at) return null;
  if (!isStudentBadgeCode(row.badge_code)) return null;
  return { badgeCode: row.badge_code, earnedAt: String(row.earned_at) };
}

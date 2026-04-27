import { createAdminClient } from "@/lib/supabase/admin";
import { logServerException } from "@/lib/logging/serverActionLog";
import { sanitizeAnalyticsMetadata } from "@/lib/analytics/sanitizeMetadata";
import { AnalyticsEntity } from "@/lib/analytics/eventConstants";
import type { UserEventTypeName } from "@/lib/analytics/eventConstants";

/**
 * Inserts a user event for a student when a badge is earned. Uses the service
 * role so it works when the current session is staff (e.g. teacher marked attendance).
 */
export async function recordStudentBadgeEarnedEvent(input: {
  userId: string;
  badgeCode: string;
}): Promise<void> {
  try {
    const supabase = createAdminClient();
    const { error } = await supabase.from("user_events").insert({
      user_id: input.userId,
      event_type: "action" as UserEventTypeName,
      entity: AnalyticsEntity.studentBadges,
      metadata: sanitizeAnalyticsMetadata({ badge_code: input.badgeCode, kind: "earned" }),
    });
    if (error) {
      logServerException("recordStudentBadgeEarnedEvent", new Error(error.message), {
        badgeCode: input.badgeCode,
        code: error.code,
      });
    }
  } catch (e) {
    logServerException("recordStudentBadgeEarnedEvent", e, { badgeCode: input.badgeCode });
  }
}

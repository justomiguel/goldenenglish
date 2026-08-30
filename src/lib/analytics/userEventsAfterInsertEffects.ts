export type UserEventsAfterInsertEffects = {
  stampLastSessionStartAt: boolean;
  clearChurnNotifiedAt: boolean;
  awardMaterialEngagement: boolean;
};

const NONE: UserEventsAfterInsertEffects = {
  stampLastSessionStartAt: false,
  clearChurnNotifiedAt: false,
  awardMaterialEngagement: false,
};

/** Mirrors `public.user_events_after_insert` (migration 200). */
export function userEventsAfterInsertEffects(input: {
  role: string | null | undefined;
  eventType: string;
  entity: string;
}): UserEventsAfterInsertEffects {
  const role = input.role?.trim() || null;
  if (!role) return NONE;

  const isStudent = role === "student";
  const isSessionStart = input.eventType === "session_start";
  const isMaterialView =
    input.eventType === "page_view" && input.entity.startsWith("material:");

  return {
    stampLastSessionStartAt: isSessionStart,
    clearChurnNotifiedAt: isSessionStart && isStudent,
    awardMaterialEngagement: isMaterialView && isStudent,
  };
}

/** Candidate timestamp for the parent backfill in migration 200. */
export function parentLastSessionBackfillAt(input: {
  current: string | null;
  latestSessionStartAt: string | null;
  latestAnyEventAt: string | null;
}): string | null {
  const candidate = input.latestSessionStartAt ?? input.latestAnyEventAt;
  if (!candidate) return input.current;
  if (!input.current) return candidate;
  return candidate > input.current ? candidate : input.current;
}

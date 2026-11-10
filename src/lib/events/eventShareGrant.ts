export const EVENT_SHARE_STATUSES = [
  "pending",
  "approved",
  "pending_unshare",
  "rejected",
  "closed",
] as const;

export type EventShareStatus = (typeof EVENT_SHARE_STATUSES)[number];

export type EventShareCode =
  | "share_self"
  | "share_target_unknown"
  | "share_already_open"
  | "share_not_approved"
  | "share_forbidden"
  | "slug_taken"
  | "event_title_unavailable"
  | "share_store_failed";

const OPEN_STATUSES: ReadonlySet<EventShareStatus> = new Set([
  "pending",
  "approved",
  "pending_unshare",
]);

export function isOpenShareStatus(status: EventShareStatus): boolean {
  return OPEN_STATUSES.has(status);
}

export function decideShareRequest(input: {
  ownerSlug: string;
  guestSlug: string;
  enabledSlugs: readonly string[];
  openStatus: EventShareStatus | null;
}): { ok: true } | { ok: false; code: "share_self" | "share_target_unknown" | "share_already_open" } {
  if (input.guestSlug === input.ownerSlug) return { ok: false, code: "share_self" };
  if (!input.enabledSlugs.includes(input.guestSlug)) {
    return { ok: false, code: "share_target_unknown" };
  }
  if (input.openStatus && isOpenShareStatus(input.openStatus)) {
    return { ok: false, code: "share_already_open" };
  }
  return { ok: true };
}

export function decideUnshareRequest(
  status: EventShareStatus | null,
): { ok: true } | { ok: false; code: "share_not_approved" } {
  if (status === "approved") return { ok: true };
  return { ok: false, code: "share_not_approved" };
}

export function decideReview(input: {
  status: EventShareStatus;
  decision: "approve" | "reject";
}): { ok: true; next: EventShareStatus } | { ok: false; code: "share_not_approved" } {
  if (input.status === "pending") {
    return { ok: true, next: input.decision === "approve" ? "approved" : "rejected" };
  }
  if (input.status === "pending_unshare") {
    return { ok: true, next: input.decision === "approve" ? "closed" : "approved" };
  }
  return { ok: false, code: "share_not_approved" };
}

import { isbot } from "isbot";

export type TrafficVisitorKind = "authenticated" | "guest" | "bot";

/**
 * Bots first (even with a session), then signed-in humans, then guests.
 */
export function classifyTrafficVisitor(
  userAgent: string | null | undefined,
  userId: string | null | undefined,
): TrafficVisitorKind {
  const ua = typeof userAgent === "string" ? userAgent : "";
  if (isbot(ua)) return "bot";
  if (userId) return "authenticated";
  return "guest";
}

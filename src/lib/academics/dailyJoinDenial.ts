import type { CommercialPlan } from "@/lib/pulsar/commercialPlan";

export type DailyJoinDenialReason =
  | "plan"
  | "mode"
  | "credentials"
  | "room"
  | "window"
  | "person";

export function denyDailyJoin(input: {
  plan: CommercialPlan;
  mode: "in_person" | "hybrid" | "remote";
  hasCredentials: boolean;
  hasRoom: boolean;
  windowOpen: boolean;
  role: "teacher" | "student" | "assistant" | "other";
}): DailyJoinDenialReason | null {
  if (input.plan !== "ecosistema") {
    return "plan";
  }
  if (input.mode === "in_person") {
    return "mode";
  }
  if (!input.hasCredentials) {
    return "credentials";
  }
  if (!input.hasRoom) {
    return "room";
  }
  if (!input.windowOpen) {
    return "window";
  }
  if (input.role !== "teacher" && input.role !== "student") {
    return "person";
  }
  return null;
}

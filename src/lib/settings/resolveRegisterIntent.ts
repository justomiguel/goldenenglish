import type { PublicCtaMode } from "@/lib/settings/parsePublicCtaMode";

export type RegisterIntent = "reserve" | "trial";

export type ResolveRegisterIntentResult =
  | { kind: "ok"; intent: RegisterIntent }
  | { kind: "redirect"; to: RegisterIntent };

export function resolveRegisterIntent(input: {
  siteMode: PublicCtaMode;
  requested: string | null;
}): ResolveRegisterIntentResult {
  const requested =
    input.requested === "reserve" || input.requested === "trial"
      ? input.requested
      : null;

  if (input.requested != null && requested == null) {
    return { kind: "redirect", to: "reserve" };
  }

  if (input.siteMode === "reserve") {
    if (requested === "trial") return { kind: "redirect", to: "reserve" };
    return { kind: "ok", intent: "reserve" };
  }

  if (input.siteMode === "trial") {
    if (requested === "trial") return { kind: "ok", intent: "trial" };
    return { kind: "redirect", to: "trial" };
  }

  return { kind: "ok", intent: requested ?? "reserve" };
}

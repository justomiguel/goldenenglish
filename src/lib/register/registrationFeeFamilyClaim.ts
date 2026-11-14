export type RegistrationFeeFamilyClaim = "cash";

export function registrationFeeFamilyClaim(snapshot: unknown): RegistrationFeeFamilyClaim | null {
  if (!snapshot || typeof snapshot !== "object") return null;
  return (snapshot as { familyClaim?: unknown }).familyClaim === "cash" ? "cash" : null;
}

export function withRegistrationFeeCashClaim(snapshot: unknown): Record<string, unknown> {
  const base =
    snapshot && typeof snapshot === "object" ? { ...(snapshot as Record<string, unknown>) } : {};
  return { ...base, familyClaim: "cash" };
}

export type CommercialPlan = "pagina" | "gestion" | "ecosistema";

const PLANS: readonly CommercialPlan[] = ["pagina", "gestion", "ecosistema"];

export function parseCommercialPlan(value: unknown): CommercialPlan {
  if (typeof value === "string" && (PLANS as readonly string[]).includes(value)) {
    return value as CommercialPlan;
  }
  return "gestion";
}

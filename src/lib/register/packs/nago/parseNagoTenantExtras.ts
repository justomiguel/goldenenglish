import { buildNagoExtrasSchema } from "@/lib/register/packs/nago/schema";
import type { NagoTenantExtras } from "@/lib/register/packs/nago/types";

const stored = buildNagoExtrasSchema({ isMinor: false });

export function parseNagoTenantExtras(raw: unknown): NagoTenantExtras | null {
  const parsed = stored.safeParse(raw);
  return parsed.success ? parsed.data : null;
}

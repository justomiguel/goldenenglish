import { buildNagoExtrasSchema } from "@/variants/owned/nago/pieces/schema";
import type { NagoTenantExtras } from "@/variants/owned/nago/pieces/types";

const stored = buildNagoExtrasSchema({ isMinor: false });

export function parseNagoTenantExtras(raw: unknown): NagoTenantExtras | null {
  const parsed = stored.safeParse(raw);
  return parsed.success ? parsed.data : null;
}

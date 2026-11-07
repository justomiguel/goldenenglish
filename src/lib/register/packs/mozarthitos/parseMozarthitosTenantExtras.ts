import {
  mozarthitosExtrasSchema,
  type MozarthitosTenantExtras,
} from "@/lib/register/packs/mozarthitos/schema";

export function parseMozarthitosTenantExtras(raw: unknown): MozarthitosTenantExtras | null {
  const parsed = mozarthitosExtrasSchema.safeParse(raw);
  return parsed.success ? parsed.data : null;
}

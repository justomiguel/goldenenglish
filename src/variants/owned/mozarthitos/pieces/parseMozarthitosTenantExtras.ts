import {
  mozarthitosExtrasSchema,
  type MozarthitosTenantExtras,
} from "@/variants/owned/mozarthitos/pieces/schema";

export function parseMozarthitosTenantExtras(raw: unknown): MozarthitosTenantExtras | null {
  const parsed = mozarthitosExtrasSchema.safeParse(raw);
  return parsed.success ? parsed.data : null;
}

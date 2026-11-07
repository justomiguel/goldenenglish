import { MZ_GUIDE_FORM_FIELD, parseGuideToken } from "@/lib/landing/mozarthitos/guideToken";
import {
  MOZARTHITOS_EXTRAS_SCHEMA_VERSION,
  type MozarthitosTenantExtras,
} from "@/lib/register/packs/mozarthitos/schema";

export function readMozarthitosExtrasFromFormData(
  fd: FormData,
): MozarthitosTenantExtras | undefined {
  const guide = parseGuideToken(String(fd.get(MZ_GUIDE_FORM_FIELD) ?? "").trim());
  if (!guide) return undefined;
  return { pack: "mozarthitos", schemaVersion: MOZARTHITOS_EXTRAS_SCHEMA_VERSION, guide };
}

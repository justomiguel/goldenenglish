import { MZ_GUIDE_FORM_FIELD, parseGuideToken } from "@/variants/owned/mozarthitos/pieces/guideToken";
import {
  MOZARTHITOS_EXTRAS_SCHEMA_VERSION,
  type MozarthitosTenantExtras,
} from "@/variants/owned/mozarthitos/pieces/schema";

export function readMozarthitosExtrasFromFormData(
  fd: FormData,
): MozarthitosTenantExtras | undefined {
  const guide = parseGuideToken(String(fd.get(MZ_GUIDE_FORM_FIELD) ?? "").trim());
  if (!guide) return undefined;
  return { pack: "mozarthitos", schemaVersion: MOZARTHITOS_EXTRAS_SCHEMA_VERSION, guide };
}

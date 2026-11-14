import { logServerWarn } from "@/lib/logging/serverActionLog";
import { buildNagoExtrasSchema } from "@/variants/owned/nago/pieces/schema";
import { NAGO_PROTOCOL_VERSION } from "@/variants/owned/nago/pieces/protocolVersion";
import type { NagoTenantExtras } from "@/variants/owned/nago/pieces/types";
import { parseMozarthitosTenantExtras } from "@/variants/owned/mozarthitos/pieces/parseMozarthitosTenantExtras";
import type { MozarthitosTenantExtras } from "@/variants/owned/mozarthitos/pieces/schema";
import { resolveActiveRegistrationExtrasPack } from "@/lib/register/packs/resolveActiveRegistrationExtrasPack";

export type StampedTenantExtras =
  | NagoTenantExtras
  | MozarthitosTenantExtras
  | Record<string, never>;

function isEmptyExtras(raw: unknown): boolean {
  if (raw == null) return true;
  if (typeof raw !== "object" || Array.isArray(raw)) return false;
  return Object.keys(raw).length === 0;
}

export async function resolveAndStampTenantExtras(input: {
  raw: unknown;
  isMinor: boolean;
  nowIso: string;
}): Promise<{ ok: true; extras: StampedTenantExtras } | { ok: false }> {
  const pack = await resolveActiveRegistrationExtrasPack();
  if (pack === null) {
    return isEmptyExtras(input.raw) ? { ok: true, extras: {} } : { ok: false };
  }

  if (pack === "family_guide") {
    if (isEmptyExtras(input.raw)) return { ok: true, extras: {} };
    const guide = parseMozarthitosTenantExtras(input.raw);
    if (guide) return { ok: true, extras: guide };
    // The guide only tags the lead; a bad tag must not cost the family its registration.
    await logServerWarn("register.mozarthitosGuide", { reason: "invalid_guide" });
    return { ok: true, extras: {} };
  }

  const parsed = buildNagoExtrasSchema({ isMinor: input.isMinor }).safeParse(input.raw);
  if (!parsed.success) return { ok: false };

  return {
    ok: true,
    extras: {
      ...parsed.data,
      protocol: {
        ...parsed.data.protocol,
        version: NAGO_PROTOCOL_VERSION,
        acceptedAt: input.nowIso,
      },
    },
  };
}

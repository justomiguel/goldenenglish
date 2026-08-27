import { buildNagoExtrasSchema } from "@/lib/register/packs/nago/schema";
import { NAGO_PROTOCOL_VERSION } from "@/lib/register/packs/nago/protocolVersion";
import type { NagoTenantExtras } from "@/lib/register/packs/nago/types";
import { resolveActiveRegistrationExtrasPack } from "@/lib/register/packs/resolveActiveRegistrationExtrasPack";

export type StampedTenantExtras = NagoTenantExtras | Record<string, never>;

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

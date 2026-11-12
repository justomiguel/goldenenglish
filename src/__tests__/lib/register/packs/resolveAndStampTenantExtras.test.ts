import { describe, expect, it, vi, beforeEach } from "vitest";
import { validNagoExtras } from "@/__tests__/lib/register/packs/nagoExtrasFixture";

const mockResolvePack = vi.hoisted(() => vi.fn());
const mockWarn = vi.hoisted(() => vi.fn());

vi.mock("@/lib/register/packs/resolveActiveRegistrationExtrasPack", () => ({
  resolveActiveRegistrationExtrasPack: () => mockResolvePack(),
}));

vi.mock("@/lib/logging/serverActionLog", () => ({
  logServerWarn: (...args: unknown[]) => mockWarn(...args),
}));

import { resolveAndStampTenantExtras } from "@/lib/register/packs/resolveAndStampTenantExtras";

describe("resolveAndStampTenantExtras", () => {
  beforeEach(() => {
    mockResolvePack.mockReset();
    mockWarn.mockReset();
  });

  it("accepts a Mozarthitos lead without a guide", async () => {
    mockResolvePack.mockResolvedValue("family_guide");
    const r = await resolveAndStampTenantExtras({
      raw: undefined,
      isMinor: true,
      nowIso: "2026-11-07T15:00:00.000Z",
    });
    expect(r).toEqual({ ok: true, extras: {} });
  });

  it("stores a valid Mozarthitos guide", async () => {
    mockResolvePack.mockResolvedValue("family_guide");
    const raw = {
      pack: "mozarthitos",
      schemaVersion: 1,
      guide: { stage: "baby_mago", modality: "in_person", ageBand: "6m_2y" },
    };
    const r = await resolveAndStampTenantExtras({
      raw,
      isMinor: true,
      nowIso: "2026-11-07T15:00:00.000Z",
    });
    expect(r).toEqual({ ok: true, extras: raw });
  });

  it("drops an invalid Mozarthitos guide, keeps the lead, and warns", async () => {
    mockResolvePack.mockResolvedValue("family_guide");
    const r = await resolveAndStampTenantExtras({
      raw: { pack: "mozarthitos", schemaVersion: 1, guide: { stage: "dragon" } },
      isMinor: true,
      nowIso: "2026-11-07T15:00:00.000Z",
    });
    expect(r).toEqual({ ok: true, extras: {} });
    expect(mockWarn).toHaveBeenCalledWith("register.mozarthitosGuide", {
      reason: "invalid_guide",
    });
  });

  it("returns {} when the tenant has no pack and extras are empty", async () => {
    mockResolvePack.mockResolvedValue(null);
    const r = await resolveAndStampTenantExtras({
      raw: {},
      isMinor: false,
      nowIso: "2026-08-26T15:00:00.000Z",
    });
    expect(r).toEqual({ ok: true, extras: {} });
  });

  it("accepts omitted extras on a non-Nagô tenant", async () => {
    mockResolvePack.mockResolvedValue(null);
    const r = await resolveAndStampTenantExtras({
      raw: undefined,
      isMinor: false,
      nowIso: "2026-08-26T15:00:00.000Z",
    });
    expect(r).toEqual({ ok: true, extras: {} });
  });

  it("rejects Nagô extras on a non-Nagô tenant", async () => {
    mockResolvePack.mockResolvedValue(null);
    const r = await resolveAndStampTenantExtras({
      raw: validNagoExtras(),
      isMinor: false,
      nowIso: "2026-08-26T15:00:00.000Z",
    });
    expect(r).toEqual({ ok: false });
  });

  it("stamps acceptedAt on a valid Nagô payload", async () => {
    mockResolvePack.mockResolvedValue("martial_arts_uniform");
    const nowIso = "2026-08-26T15:00:00.000Z";
    const r = await resolveAndStampTenantExtras({
      raw: validNagoExtras(),
      isMinor: true,
      nowIso,
    });
    expect(r.ok).toBe(true);
    if (r.ok && "pack" in r.extras) {
      expect(r.extras.pack).toBe("nago");
      expect(r.extras.protocol.acceptedAt).toBe(nowIso);
      expect(r.extras.protocol.version).toBe("2026-08");
    }
  });

  it("fails when Nagô extras are missing", async () => {
    mockResolvePack.mockResolvedValue("martial_arts_uniform");
    const r = await resolveAndStampTenantExtras({
      raw: undefined,
      isMinor: false,
      nowIso: "2026-08-26T15:00:00.000Z",
    });
    expect(r).toEqual({ ok: false });
  });

  it("fails when the protocol version is stale", async () => {
    mockResolvePack.mockResolvedValue("martial_arts_uniform");
    const r = await resolveAndStampTenantExtras({
      raw: validNagoExtras({
        protocol: {
          version: "2025-01",
          acceptedAt: "pending",
          signerName: "Ana Pérez",
          signerDni: "11111111-1",
        },
      }),
      isMinor: true,
      nowIso: "2026-08-26T15:00:00.000Z",
    });
    expect(r).toEqual({ ok: false });
  });
});

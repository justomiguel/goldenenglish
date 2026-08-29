/** @vitest-environment node */
import { describe, expect, it, vi } from "vitest";
import { applyTrialFeeGatewayCapture } from "@/lib/register/applyTrialFeeGatewayCapture";

const REG = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";

function adminClient(row: Record<string, unknown> | null, updates: Record<string, unknown>[]) {
  return {
    from: vi.fn(() => ({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          maybeSingle: vi.fn().mockResolvedValue({ data: row, error: null }),
        }),
      }),
      update: vi.fn((patch: Record<string, unknown>) => {
        updates.push(patch);
        return { eq: vi.fn().mockResolvedValue({ error: null }) };
      }),
    })),
  };
}

describe("applyTrialFeeGatewayCapture", () => {
  it("sets trial_fee_captured and keeps a paidTotal without accepting the lead", async () => {
    const updates: Record<string, unknown>[] = [];
    const result = await applyTrialFeeGatewayCapture({
      admin: adminClient(
        {
          id: REG,
          intent: "trial",
          status: "new",
          trial_fee_captured: false,
          trial_fee_snapshot: { kind: "trial_fee", total: 15000, currency: "CLP" },
        },
        updates,
      ) as never,
      registrationId: REG,
      gatewayAmount: 15000,
      gatewayCurrency: "CLP",
    });
    expect(result).toEqual({ ok: true });
    expect(updates[0]).toMatchObject({ trial_fee_captured: true });
    expect((updates[0]?.trial_fee_snapshot as { paidTotal?: number }).paidTotal).toBe(15000);
    expect((updates[0]?.trial_fee_snapshot as { total?: number }).total).toBe(0);
  });

  it("returns false when select or update fails", async () => {
    const failingSelect = {
      from: vi.fn(() => ({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            maybeSingle: vi.fn().mockResolvedValue({ data: null, error: { message: "down" } }),
          }),
        }),
      })),
    };
    await expect(
      applyTrialFeeGatewayCapture({
        admin: failingSelect as never,
        registrationId: REG,
        gatewayAmount: 1,
        gatewayCurrency: "CLP",
      }),
    ).resolves.toEqual({ ok: false });

    const updates: Record<string, unknown>[] = [];
    const failingUpdate = {
      from: vi.fn(() => ({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            maybeSingle: vi.fn().mockResolvedValue({
              data: {
                id: REG,
                intent: "trial",
                status: "new",
                trial_fee_snapshot: { kind: "trial_fee_delta", total: 10, currency: "CLP" },
              },
              error: null,
            }),
          }),
        }),
        update: vi.fn((patch: Record<string, unknown>) => {
          updates.push(patch);
          return { eq: vi.fn().mockResolvedValue({ error: { message: "up" } }) };
        }),
      })),
    };
    await expect(
      applyTrialFeeGatewayCapture({
        admin: failingUpdate as never,
        registrationId: REG,
        gatewayAmount: 10,
        gatewayCurrency: "CLP",
      }),
    ).resolves.toEqual({ ok: false });
    expect((updates[0]?.trial_fee_snapshot as { kind?: string }).kind).toBe("trial_fee_delta");
  });

  it("skips missing, enrolled, and mismatched amounts", async () => {
    await expect(
      applyTrialFeeGatewayCapture({
        admin: adminClient(null, []) as never,
        registrationId: REG,
        gatewayAmount: 1,
        gatewayCurrency: "CLP",
      }),
    ).resolves.toEqual({ ok: true, skipped: "not_found" });
    await expect(
      applyTrialFeeGatewayCapture({
        admin: adminClient(
          { id: REG, intent: "trial", status: "enrolled", trial_fee_snapshot: { total: 1 } },
          [],
        ) as never,
        registrationId: REG,
        gatewayAmount: 1,
        gatewayCurrency: "CLP",
      }),
    ).resolves.toEqual({ ok: true, skipped: "already_enrolled" });
    await expect(
      applyTrialFeeGatewayCapture({
        admin: adminClient(
          { id: REG, intent: "trial", status: "new", trial_fee_snapshot: { total: 20, currency: "CLP" } },
          [],
        ) as never,
        registrationId: REG,
        gatewayAmount: 1,
        gatewayCurrency: "CLP",
      }),
    ).resolves.toEqual({ ok: true, skipped: "amount_mismatch" });
  });

  it("skips a reserve lead", async () => {
    const result = await applyTrialFeeGatewayCapture({
      admin: adminClient(
        { id: REG, intent: "reserve", status: "new", trial_fee_snapshot: { total: 1 } },
        [],
      ) as never,
      registrationId: REG,
      gatewayAmount: 1,
      gatewayCurrency: "CLP",
    });
    expect(result).toEqual({ ok: true, skipped: "not_found" });
  });
});

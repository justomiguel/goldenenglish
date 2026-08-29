/** @vitest-environment node */
import { describe, expect, it, vi } from "vitest";
import {
  loadTrialPayLeadByToken,
  requestedIdsFromTrialPayLead,
} from "@/lib/register/loadTrialPayLead";

vi.mock("@/lib/brand/legalAge", () => ({
  getLegalAgeMajorityFromSystem: () => 18,
}));

function admin(data: Record<string, unknown> | null, error: { message: string } | null = null) {
  return {
    from: vi.fn(() => ({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            maybeSingle: vi.fn().mockResolvedValue({ data, error }),
          }),
        }),
      }),
    })),
  };
}

describe("loadTrialPayLeadByToken", () => {
  it("returns null when the token is missing or the query fails", async () => {
    await expect(loadTrialPayLeadByToken(admin(null) as never, "tok")).resolves.toBeNull();
    await expect(
      loadTrialPayLeadByToken(admin(null, { message: "down" }) as never, "tok"),
    ).resolves.toBeNull();
  });

  it("maps snapshot defaults and family email for an adult", async () => {
    const lead = await loadTrialPayLeadByToken(
      admin({
        id: "lead-1",
        intent: "trial",
        status: "new",
        trial_fee_captured: true,
        trial_fee_snapshot: { kind: "trial_fee", total: 12, currency: "CLP" },
        preferred_section_id: "sec-1",
        additional_section_ids: ["sec-2", ""],
        first_name: " Ada ",
        last_name: " Lovelace ",
        email: "ada@test.com",
        tutor_email: null,
        birth_date: "2000-01-01",
      }) as never,
      "tok",
    );
    expect(lead).toMatchObject({
      id: "lead-1",
      trialFeeCaptured: true,
      snapshotTotal: 12,
      snapshotCurrency: "CLP",
      preferredSectionId: "sec-1",
      additionalSectionIds: ["sec-2"],
      firstName: "Ada",
      familyEmail: "ada@test.com",
    });
    expect(requestedIdsFromTrialPayLead(lead!)).toEqual(["sec-1", "sec-2"]);
  });

  it("uses tutor email for a minor and empty extras when the column is not an array", async () => {
    const lead = await loadTrialPayLeadByToken(
      admin({
        id: "lead-2",
        trial_fee_captured: false,
        preferred_section_id: null,
        additional_section_ids: "sec-2",
        first_name: null,
        last_name: null,
        email: "kid@test.com",
        tutor_email: "tutor@test.com",
        birth_date: "2020-01-01",
      }) as never,
      "tok",
    );
    expect(lead).toMatchObject({
      preferredSectionId: null,
      additionalSectionIds: [],
      snapshotKind: "trial_fee",
      snapshotTotal: 0,
      snapshotCurrency: "USD",
      familyEmail: "tutor@test.com",
    });
    expect(requestedIdsFromTrialPayLead(lead!)).toEqual([]);
  });
});

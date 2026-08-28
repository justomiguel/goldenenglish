/** @vitest-environment node */
import { describe, expect, it, vi } from "vitest";
import {
  markRegistrationRowsClosedSections,
  collectClosedRequestedSectionIds,
} from "@/lib/register/markRegistrationRowsClosedSections";

const A = "11111111-1111-4111-8111-111111111111";
const B = "22222222-2222-4222-8222-222222222222";

describe("markRegistrationRowsClosedSections", () => {
  it("flags a lead when any requested section is closed", () => {
    const rows = markRegistrationRowsClosedSections(
      [
        {
          preferred_section_id: A,
          additionalSectionIds: [B],
        },
        {
          preferred_section_id: B,
          additionalSectionIds: [],
        },
      ],
      new Set([A]),
    );
    expect(rows[0]?.requestedSectionFull).toBe(true);
    expect(rows[1]?.requestedSectionFull).toBe(false);
  });

  it("collects closed ids from the open-seat RPC", async () => {
    const rpc = vi
      .fn()
      .mockResolvedValueOnce({ data: true, error: null })
      .mockResolvedValueOnce({ data: false, error: null });
    const closed = await collectClosedRequestedSectionIds({ rpc }, [A, B]);
    expect(closed).toEqual(new Set([B]));
  });
});

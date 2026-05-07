import { describe, it, expect } from "vitest";
import { buildAdminInvitedProfileRow } from "@/lib/dashboard/upsertAdminInvitedProfile";

describe("buildAdminInvitedProfileRow", () => {
  it("maps birth_date to date or null", () => {
    expect(
      buildAdminInvitedProfileRow({
        userId: "u1",
        role: "student",
        first_name: "A",
        last_name: "B",
        dni_or_passport: null,
        phone: null,
        birth_date: "2010-05-01",
      }),
    ).toEqual(
      expect.objectContaining({
        id: "u1",
        role: "student",
        birth_date: "2010-05-01",
      }),
    );

    expect(
      buildAdminInvitedProfileRow({
        userId: "u1",
        role: "student",
        first_name: "A",
        last_name: "B",
        dni_or_passport: null,
        phone: null,
        birth_date: undefined,
      }).birth_date,
    ).toBeNull();
  });
});

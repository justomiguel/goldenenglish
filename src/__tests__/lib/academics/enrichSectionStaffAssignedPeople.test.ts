/** @vitest-environment node */
// REGRESSION CHECK: Assigned Teachers-tab cards need phone/DNI/avatar/email; email failures must omit email without dropping the person.
import { describe, expect, it, vi, beforeEach } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import { enrichSectionStaffAssignedPeople } from "@/lib/academics/enrichSectionStaffAssignedPeople";

vi.mock("@/lib/dashboard/resolveAvatarUrl", () => ({
  resolveAvatarDisplayUrl: vi.fn(async (_client: unknown, raw: string | null) =>
    raw ? `signed:${raw}` : null,
  ),
}));

describe("enrichSectionStaffAssignedPeople", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns lead then assistants with avatar, phone, DNI, and email", async () => {
    const profiles = [
      {
        id: "lead-1",
        first_name: "Justo",
        last_name: "Vargas",
        role: "teacher",
        phone: "+54911",
        dni_or_passport: "30111222",
        avatar_url: "avatars/lead.png",
      },
      {
        id: "asst-1",
        first_name: "Ana",
        last_name: "Lopez",
        role: "student",
        phone: null,
        dni_or_passport: "AA123",
        avatar_url: null,
      },
    ];

    const client = {
      from: () => ({
        select: () => ({
          in: (_col: string, ids: string[]) =>
            Promise.resolve({
              data: profiles.filter((p) => ids.includes(p.id)),
              error: null,
            }),
        }),
      }),
    } as unknown as SupabaseClient;

    const out = await enrichSectionStaffAssignedPeople(client, {
      leadTeacherId: "lead-1",
      assistants: [{ id: "asst-1", role: "student" }],
      resolveEmails: async () =>
        new Map([
          ["lead-1", "justo@example.com"],
          ["asst-1", "ana@example.com"],
        ]),
    });

    expect(out).toHaveLength(2);
    expect(out[0]).toMatchObject({
      id: "lead-1",
      kind: "lead",
      phone: "+54911",
      dniOrPassport: "30111222",
      email: "justo@example.com",
      avatarDisplayUrl: "signed:avatars/lead.png",
    });
    expect(out[0]!.label).toContain("Vargas");
    expect(out[1]).toMatchObject({
      id: "asst-1",
      kind: "assistant",
      role: "student",
      email: "ana@example.com",
      avatarDisplayUrl: null,
      dniOrPassport: "AA123",
    });
  });

  it("omits email when resolver returns null and still returns the person", async () => {
    const client = {
      from: () => ({
        select: () => ({
          in: () =>
            Promise.resolve({
              data: [
                {
                  id: "lead-1",
                  first_name: "A",
                  last_name: "B",
                  role: "teacher",
                  phone: "",
                  dni_or_passport: "",
                  avatar_url: null,
                },
              ],
              error: null,
            }),
        }),
      }),
    } as unknown as SupabaseClient;

    const out = await enrichSectionStaffAssignedPeople(client, {
      leadTeacherId: "lead-1",
      assistants: [],
      resolveEmails: async () => new Map([["lead-1", null]]),
    });

    expect(out).toHaveLength(1);
    expect(out[0]!.email).toBeNull();
  });
});

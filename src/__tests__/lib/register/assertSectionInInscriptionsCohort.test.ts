// REGRESSION CHECK: A web registration may move only inside the inscriptions cohort.
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";

vi.mock("@/lib/logging/serverActionLog", () => ({
  logServerWarn: vi.fn(),
}));

import { assertSectionInInscriptionsCohort } from "@/lib/register/assertSectionInInscriptionsCohort";

const WEB = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const OTHER = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";
const SECTION = "cccccccc-cccc-4ccc-8ccc-cccccccccccc";

function adminFor(sectionCohortId: string | null, setting: string | null) {
  return {
    from(table: string) {
      if (table === "academic_sections") {
        return {
          select: () => ({
            eq: () => ({
              is: () => ({
                maybeSingle: async () => ({
                  data: sectionCohortId ? { cohort_id: sectionCohortId } : null,
                  error: null,
                }),
              }),
            }),
          }),
        };
      }
      if (table === "site_settings") {
        return {
          select: () => ({
            eq: () => ({
              maybeSingle: async () => ({
                data: setting ? { value: setting } : null,
                error: null,
              }),
            }),
          }),
        };
      }
      return {
        select: () => ({
          is: () => ({
            order: async () => ({
              data: [
                { id: WEB, name: "Web", is_current: false },
                { id: OTHER, name: "Current", is_current: true },
              ],
              error: null,
            }),
          }),
        }),
      };
    },
  } as unknown as SupabaseClient;
}

describe("assertSectionInInscriptionsCohort", () => {
  beforeEach(() => vi.clearAllMocks());

  it("allows a section in the configured inscriptions cohort", async () => {
    const result = await assertSectionInInscriptionsCohort(adminFor(WEB, WEB), SECTION);
    expect(result).toEqual({ ok: true });
  });

  it("rejects a section from another cohort", async () => {
    const result = await assertSectionInInscriptionsCohort(adminFor(OTHER, WEB), SECTION);
    expect(result).toEqual({ ok: false, code: "section_cohort_mismatch" });
  });
});

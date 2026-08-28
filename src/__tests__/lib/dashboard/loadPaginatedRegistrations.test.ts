import { describe, expect, it, vi } from "vitest";
import { loadPaginatedRegistrations } from "@/lib/dashboard/loadPaginatedRegistrations";

/**
 * The loader awaits the count builder directly (no `.range()`), so the chain
 * stub has to be thenable the way a PostgREST builder is.
 */
function makeSupabase() {
  const calls = {
    select: [] as unknown[][],
    eq: [] as unknown[][],
    or: [] as unknown[][],
  };

  const chain: Record<string, unknown> = {
    select: vi.fn((...args: unknown[]) => {
      calls.select.push(args);
      return chain;
    }),
    neq: vi.fn(() => chain),
    or: vi.fn((...args: unknown[]) => {
      calls.or.push(args);
      return chain;
    }),
    eq: vi.fn((...args: unknown[]) => {
      calls.eq.push(args);
      return chain;
    }),
    order: vi.fn(() => chain),
    range: vi.fn(() =>
      Promise.resolve({
        data: [
          {
            id: "lead-1",
            first_name: "A",
            last_name: "B",
            dni: "1",
            email: "a@x.co",
            phone: null,
            birth_date: null,
            level_interest: null,
            status: "new",
            created_at: null,
            tutor_name: null,
            tutor_dni: null,
            tutor_email: null,
            tutor_phone: null,
            tutor_relationship: null,
            preferred_section_id: "11111111-1111-4111-8111-111111111111",
            additional_section_ids: ["22222222-2222-4222-8222-222222222222"],
            contacted_at: null,
            contacted_by: null,
            source_section_link_id: null,
          },
        ],
        error: null,
        count: 1,
      }),
    ),
    then: (resolve: (v: unknown) => unknown) =>
      resolve({ data: [], error: null, count: 0 }),
  };

  return {
    supabase: {
      from: vi.fn(() => chain),
      rpc: vi.fn().mockResolvedValue({ data: true, error: null }),
    } as never,
    calls,
  };
}

describe("loadPaginatedRegistrations", () => {
  it("selects the follow-up and preferred section columns", async () => {
    const { supabase, calls } = makeSupabase();

    await loadPaginatedRegistrations(supabase, {});

    const selected = String(calls.select[0]?.[0] ?? "");
    expect(selected).toContain("preferred_section_id");
    expect(selected).toContain("additional_section_ids");
    expect(selected).toContain("contacted_at");
    expect(selected).toContain("contacted_by");
  });

  it("filters by follow-up status when one is requested", async () => {
    const { supabase, calls } = makeSupabase();

    await loadPaginatedRegistrations(supabase, { status: "contacted" });

    expect(calls.eq).toContainEqual(["status", "contacted"]);
  });

  it("applies the contacted filter to the count query too, so paging stays honest", async () => {
    const { supabase, calls } = makeSupabase();

    await loadPaginatedRegistrations(supabase, { status: "contacted" });

    const statusFilters = calls.eq.filter((c) => c[0] === "status");
    expect(statusFilters).toHaveLength(2);
  });

  it("defaults to the urgent inbox without a status equality", async () => {
    const { supabase, calls } = makeSupabase();

    await loadPaginatedRegistrations(supabase, {});

    expect(calls.eq.filter((c) => c[0] === "status")).toHaveLength(0);
    expect(String(calls.or[0]?.[0] ?? "")).toContain("receipt_pending");
  });

  it("selects intake columns for the inbox actions", async () => {
    const { supabase, calls } = makeSupabase();
    await loadPaginatedRegistrations(supabase, {});
    const selected = String(calls.select[0]?.[0] ?? "");
    expect(selected).toContain("intake_state");
    expect(selected).toContain("fee_snapshot");
    expect(selected).toContain("enrollment_fee_receipt_path");
  });

  it("escapes wildcards in the search so a literal percent is not a wildcard", async () => {
    const { supabase, calls } = makeSupabase();

    await loadPaginatedRegistrations(supabase, { q: "50%" });

    expect(String(calls.or[0]?.[0] ?? "")).toContain("50\\%");
  });

  it("maps additional section ids onto the row model", async () => {
    const { supabase } = makeSupabase();
    const result = await loadPaginatedRegistrations(supabase, {});
    expect(result.rows[0]?.additionalSectionIds).toEqual([
      "22222222-2222-4222-8222-222222222222",
    ]);
    expect(result.rows[0]?.existingStudentId).toBeNull();
    expect(result.rows[0]?.requestedSectionFull).toBe(false);
  });

  it("filters preferred or additional section ids together", async () => {
    const { supabase, calls } = makeSupabase();
    const sectionId = "11111111-1111-4111-8111-111111111111";

    await loadPaginatedRegistrations(supabase, { sectionId });

    const sectionOr = calls.or.map((c) => String(c[0] ?? "")).find((s) =>
      s.includes("preferred_section_id"),
    );
    expect(sectionOr).toContain(`preferred_section_id.eq.${sectionId}`);
    expect(sectionOr).toContain(`additional_section_ids.cs.{${sectionId}}`);
  });
});

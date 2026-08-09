import { describe, it, expect, vi } from "vitest";
import { loadSectionBillingModes } from "@/lib/billing/loadSectionBillingModes";
import type { SupabaseClient } from "@supabase/supabase-js";

function clientReturning(result: {
  data?: { id: string; billing_mode: string | null }[] | null;
  error?: { code: string } | null;
}) {
  const inFn = vi.fn().mockResolvedValue({
    data: result.data ?? null,
    error: result.error ?? null,
  });
  const select = vi.fn().mockReturnValue({ in: inFn });
  const from = vi.fn().mockReturnValue({ select });
  return { supabase: { from } as unknown as SupabaseClient, from, select, inFn };
}

describe("loadSectionBillingModes", () => {
  it("maps each section id to its raw billing mode", async () => {
    const { supabase, from, select, inFn } = clientReturning({
      data: [
        { id: "a", billing_mode: "class_pack" },
        { id: "b", billing_mode: "section_monthly_fee" },
      ],
    });

    const modes = await loadSectionBillingModes(supabase, ["a", "b"]);

    expect(from).toHaveBeenCalledWith("academic_sections");
    expect(select).toHaveBeenCalledWith("id, billing_mode");
    expect(inFn).toHaveBeenCalledWith("id", ["a", "b"]);
    expect(modes.get("a")).toBe("class_pack");
    expect(modes.get("b")).toBe("section_monthly_fee");
  });

  // REGRESSION CHECK: migration 178 may not be applied yet on a given database. A missing column must
  // degrade to monthly-fee billing (the current behaviour), never blank out the payments view.
  it("returns an empty map when the column does not exist yet (42703)", async () => {
    const { supabase } = clientReturning({ error: { code: "42703" } });

    const modes = await loadSectionBillingModes(supabase, ["a"]);

    expect(modes.size).toBe(0);
  });

  it("returns an empty map on any other query error", async () => {
    const { supabase } = clientReturning({ error: { code: "42501" } });

    const modes = await loadSectionBillingModes(supabase, ["a"]);

    expect(modes.size).toBe(0);
  });

  // REGRESSION CHECK: this helper must never be the reason a collections screen throws. Any response
  // shape it does not recognise means "no known modes", i.e. monthly billing.
  it("returns an empty map when the response is not a list of rows", async () => {
    const { supabase } = clientReturning({
      data: { id: "a", billing_mode: "class_pack" } as never,
    });

    const modes = await loadSectionBillingModes(supabase, ["a"]);

    expect(modes.size).toBe(0);
  });

  it("does not query at all for an empty id list", async () => {
    const { supabase, from } = clientReturning({ data: [] });

    const modes = await loadSectionBillingModes(supabase, []);

    expect(from).not.toHaveBeenCalled();
    expect(modes.size).toBe(0);
  });

  it("deduplicates ids so a repeated section is asked for once", async () => {
    const { supabase, inFn } = clientReturning({ data: [] });

    await loadSectionBillingModes(supabase, ["a", "a", "b"]);

    expect(inFn).toHaveBeenCalledWith("id", ["a", "b"]);
  });
});

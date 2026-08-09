import { beforeEach, describe, expect, it, vi } from "vitest";
import { loadSectionEnrollmentLinkState } from "@/lib/academics/sectionEnrollmentLinkAdmin";

const EMPTY = { token: null, active: false, leadCount: 0 };

function makeSupabase(result: { data: unknown; error: unknown }) {
  const rpc = vi.fn().mockResolvedValue(result);
  const from = vi.fn(() => {
    throw new Error("the link table is unreachable over PostgREST; use the rpc");
  });
  return { client: { from, rpc } as never, rpc, from };
}

describe("loadSectionEnrollmentLinkState", () => {
  beforeEach(() => vi.clearAllMocks());

  it("reads the state through the security-definer rpc, never the table", async () => {
    const { client, rpc, from } = makeSupabase({
      data: [
        {
          token: "3f2504e0-4f89-41d3-9a0c-0305e82c3301",
          is_active: true,
          lead_count: 7,
        },
      ],
      error: null,
    });
    await expect(loadSectionEnrollmentLinkState(client, "sec-1")).resolves.toEqual({
      token: "3f2504e0-4f89-41d3-9a0c-0305e82c3301",
      active: true,
      leadCount: 7,
    });
    expect(rpc).toHaveBeenCalledWith("section_enrollment_link_state", {
      p_section_id: "sec-1",
    });
    expect(from).not.toHaveBeenCalled();
  });

  it("reports an empty state for a section that has no link yet", async () => {
    const { client } = makeSupabase({ data: [], error: null });
    await expect(loadSectionEnrollmentLinkState(client, "sec-1")).resolves.toEqual(
      EMPTY,
    );
  });

  it("reads a deactivated link without losing its token", async () => {
    const { client } = makeSupabase({
      data: [{ token: "tok-1", is_active: false, lead_count: 2 }],
      error: null,
    });
    await expect(loadSectionEnrollmentLinkState(client, "sec-1")).resolves.toEqual({
      token: "tok-1",
      active: false,
      leadCount: 2,
    });
  });

  it("coerces a bigint count serialised as a string", async () => {
    const { client } = makeSupabase({
      data: [{ token: "tok-1", is_active: true, lead_count: "4" }],
      error: null,
    });
    const state = await loadSectionEnrollmentLinkState(client, "sec-1");
    expect(state.leadCount).toBe(4);
  });

  // A caller who is not section staff also gets no rows. The two cases are
  // deliberately indistinguishable, so the loader must not try to tell them apart.
  it("reports an empty state when the rpc errors", async () => {
    const { client } = makeSupabase({ data: null, error: { message: "denied" } });
    const state = await loadSectionEnrollmentLinkState(client, "sec-1");
    expect(state).toEqual(EMPTY);
  });
});

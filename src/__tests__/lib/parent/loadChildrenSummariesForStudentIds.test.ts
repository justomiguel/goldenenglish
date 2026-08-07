import { describe, it, expect, vi } from "vitest";
import { loadChildrenSummariesForStudentIds } from "@/lib/parent/loadChildrenSummariesForStudentIds";

vi.mock("@/lib/messaging/loadParentLinkedTeacherIds", () => ({
  loadTeacherIdByStudentId: vi.fn().mockResolvedValue(new Map()),
}));

vi.mock("@/lib/supabase/chunkedIn", () => ({
  chunkedIn: vi.fn().mockResolvedValue([]),
}));

type AnyObj = Record<string, unknown>;

function buildSelectChain(resolved: AnyObj): AnyObj {
  const maybeSingle = vi.fn().mockResolvedValue({ data: null, error: null });
  const limit = vi.fn().mockReturnValue({ maybeSingle });
  const order = vi.fn().mockReturnValue({ limit });
  const eq2 = vi.fn().mockResolvedValue({ data: [], error: null });
  const eq1 = vi.fn().mockReturnValue({ eq: eq2, order, in: vi.fn().mockResolvedValue({ data: [], error: null }) });
  const inFn = vi.fn().mockResolvedValue(resolved);
  return { select: vi.fn().mockReturnValue({ in: inFn, eq: eq1 }) };
}

function makeSupabaseMock(
  profiles: { id: string; first_name: string; last_name: string }[],
) {
  return {
    from: vi.fn((table: string) => {
      if (table === "profiles") {
        return buildSelectChain({ data: profiles, error: null });
      }
      if (table === "section_enrollments") {
        const eq2 = vi.fn().mockResolvedValue({ data: [], error: null });
        const eq1 = vi.fn().mockReturnValue({ eq: eq2 });
        return { select: vi.fn().mockReturnValue({ eq: eq1 }) };
      }
      if (table === "enrollments") {
        const maybeSingle = vi.fn().mockResolvedValue({ data: null, error: null });
        const limit = vi.fn().mockReturnValue({ maybeSingle });
        const order = vi.fn().mockReturnValue({ limit });
        const eq1 = vi.fn().mockReturnValue({ order });
        return { select: vi.fn().mockReturnValue({ eq: eq1 }) };
      }
      return buildSelectChain({ data: [], error: null });
    }),
  };
}

describe("loadChildrenSummariesForStudentIds — deterministic order", () => {
  it("returns children sorted alphabetically by surname-first display name regardless of input order", async () => {
    // "Adams, Zara" < "Zhou, Alice" alphabetically
    const profiles = [
      { id: "id-z", first_name: "Zara", last_name: "Adams", next_exam_at: null, student_portal_next_event_at: null, student_portal_next_event_label: null },
      { id: "id-a", first_name: "Alice", last_name: "Zhou", next_exam_at: null, student_portal_next_event_at: null, student_portal_next_event_label: null },
    ];
    const supabase = makeSupabaseMock(profiles);

    const result = await loadChildrenSummariesForStudentIds(
      supabase as never,
      ["id-z", "id-a"],
    );

    expect(result).toHaveLength(2);
    expect(result[0].firstName).toBe("Zara");
    expect(result[1].firstName).toBe("Alice");
  });

  it("is stable when last names match — sorts by first name next", async () => {
    // "Martinez, Ana" < "Martinez, Bob"
    const profiles = [
      { id: "id-b", first_name: "Bob", last_name: "Martinez", next_exam_at: null, student_portal_next_event_at: null, student_portal_next_event_label: null },
      { id: "id-a", first_name: "Ana", last_name: "Martinez", next_exam_at: null, student_portal_next_event_at: null, student_portal_next_event_label: null },
    ];
    const supabase = makeSupabaseMock(profiles);

    const result = await loadChildrenSummariesForStudentIds(
      supabase as never,
      ["id-b", "id-a"],
    );

    expect(result).toHaveLength(2);
    expect(result[0].firstName).toBe("Ana");
    expect(result[1].firstName).toBe("Bob");
  });
});

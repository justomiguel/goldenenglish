// The feedback alias now points at the child's own feedback route instead of a
// Progress hub tab, and preserves both focus params like its sibling aliases.
import { describe, it, expect, vi, beforeEach } from "vitest";

const redirect = vi.fn();

vi.mock("next/navigation", () => ({
  redirect: (...args: unknown[]) => redirect(...args),
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), refresh: vi.fn() }),
  usePathname: () => "/en",
  useSearchParams: () => new URLSearchParams(),
}));

// Import after mock
import ParentFeedbackRedirectPage from "@/app/[locale]/dashboard/parent/feedback/page";
import ParentTasksRedirectPage from "@/app/[locale]/dashboard/parent/tasks/page";
import ParentBadgesRedirectPage from "@/app/[locale]/dashboard/parent/badges/page";
import ParentAssessmentsRedirectPage from "@/app/[locale]/dashboard/parent/assessments/page";

describe("parent legacy section aliases", () => {
  beforeEach(() => {
    redirect.mockClear();
  });

  it("sends feedback to the child feedback route with no focus params", async () => {
    await ParentFeedbackRedirectPage({
      params: Promise.resolve({ locale: "en" }),
      searchParams: Promise.resolve({}),
    });
    expect(redirect).toHaveBeenCalledOnce();
    expect(redirect.mock.calls[0][0]).toBe("/en/dashboard/parent/child/feedback");
  });

  it("carries the child and section through", async () => {
    await ParentFeedbackRedirectPage({
      params: Promise.resolve({ locale: "es" }),
      searchParams: Promise.resolve({ studentId: "abc123", sectionId: "sec-1" }),
    });
    expect(redirect.mock.calls[0][0]).toBe(
      "/es/dashboard/parent/child/feedback?studentId=abc123&sectionId=sec-1",
    );
  });

  it("keeps every section alias pointing at its own route", async () => {
    const cases: Array<[(args: never) => Promise<void>, string]> = [
      [ParentTasksRedirectPage as never, "/pt/dashboard/parent/child/tasks?studentId=xyz"],
      [ParentBadgesRedirectPage as never, "/pt/dashboard/parent/child/badges?studentId=xyz"],
      [
        ParentAssessmentsRedirectPage as never,
        "/pt/dashboard/parent/child/grades?studentId=xyz",
      ],
    ];
    for (const [page, expected] of cases) {
      redirect.mockClear();
      await (page as unknown as (args: {
        params: Promise<{ locale: string }>;
        searchParams: Promise<{ studentId?: string }>;
      }) => Promise<void>)({
        params: Promise.resolve({ locale: "pt" }),
        searchParams: Promise.resolve({ studentId: "xyz" }),
      });
      expect(redirect.mock.calls[0][0], expected).toBe(expected);
    }
  });
});

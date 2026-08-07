// Test group 6 — the feedback alias
// Spec 7, Test 6: /parent/feedback redirects to /progress?tab=feedback,
// mirroring the three existing aliases (tasks, assessments, badges).
// studentId is forwarded when provided.
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

describe("Parent feedback alias (Test 6)", () => {
  beforeEach(() => {
    redirect.mockClear();
  });

  it("redirects to /progress?tab=feedback with no studentId", async () => {
    await ParentFeedbackRedirectPage({
      params: Promise.resolve({ locale: "en" }),
      searchParams: Promise.resolve({}),
    });
    expect(redirect).toHaveBeenCalledOnce();
    const url = redirect.mock.calls[0][0] as string;
    expect(url).toContain("/en/dashboard/parent/progress");
    expect(url).toContain("tab=feedback");
    expect(url).not.toContain("studentId");
  });

  it("forwards studentId when provided", async () => {
    await ParentFeedbackRedirectPage({
      params: Promise.resolve({ locale: "es" }),
      searchParams: Promise.resolve({ studentId: "abc123" }),
    });
    expect(redirect).toHaveBeenCalledOnce();
    const url = redirect.mock.calls[0][0] as string;
    expect(url).toContain("/es/dashboard/parent/progress");
    expect(url).toContain("tab=feedback");
    expect(url).toContain("studentId=abc123");
  });

  it("mirrors the tasks alias structure exactly", async () => {
    // Both should: set tab param, forward studentId, redirect to /progress
    await ParentFeedbackRedirectPage({
      params: Promise.resolve({ locale: "pt" }),
      searchParams: Promise.resolve({ studentId: "xyz" }),
    });
    const feedbackUrl = redirect.mock.calls[0][0] as string;
    expect(feedbackUrl).toMatch(/\/pt\/dashboard\/parent\/progress\?/);
    expect(feedbackUrl).toContain("tab=feedback");
    expect(feedbackUrl).toContain("studentId=xyz");
  });
});

/** @vitest-environment node */
import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/site/publicUrl", () => ({
  getPublicSiteUrl: vi.fn(),
}));

import { POST } from "@/app/api/payments/flow/return-bridge/route";
import { getPublicSiteUrl } from "@/lib/site/publicUrl";

describe("POST /api/payments/flow/return-bridge", () => {
  beforeEach(() => {
    vi.mocked(getPublicSiteUrl).mockReturnValue(new URL("https://example.com"));
  });

  it("303-redirects to localized GET flow-return with token (Flow POST body)", async () => {
    const req = new Request(
      "https://example.com/api/payments/flow/return-bridge?locale=es&dashboard=student",
      {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: "token=abc123",
      },
    );
    const res = await POST(req);
    expect(res.status).toBe(303);
    expect(res.headers.get("location")).toBe(
      "https://example.com/es/dashboard/student/payments/flow-return?token=abc123",
    );
    const cc = res.headers.get("cache-control") ?? "";
    expect(cc).toMatch(/private/);
    expect(cc).not.toMatch(/\bpublic\b/);
  });

  it("uses parent dashboard when requested", async () => {
    const req = new Request(
      "https://example.com/api/payments/flow/return-bridge?locale=en&dashboard=parent",
      {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: "token=tok",
      },
    );
    const res = await POST(req);
    expect(res.headers.get("location")).toContain("/dashboard/parent/payments/flow-return");
  });

  it("returns 502 when public origin is missing", async () => {
    vi.mocked(getPublicSiteUrl).mockReturnValue(null);
    const req = new Request(
      "https://example.com/api/payments/flow/return-bridge?locale=en&dashboard=student",
      {
        method: "POST",
        body: "token=x",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
      },
    );
    const res = await POST(req);
    expect(res.status).toBe(502);
  });
});

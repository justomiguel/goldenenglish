import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

const updateSession = vi.fn();

vi.mock("@/lib/supabase/middleware", () => ({
  updateSession: (...args: unknown[]) => updateSession(...args),
}));

import { proxy, config } from "@/proxy";

describe("proxy", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    updateSession.mockResolvedValue(new Response(null, { status: 200 }));
  });

  it("redirects when pathname has no locale prefix to default locale (es)", async () => {
    const req = new NextRequest(new URL("http://localhost/foo"));
    const res = await proxy(req);
    expect(res.status).toBe(307);
    expect(res.headers.get("location")).toContain("/es/foo");
    expect(updateSession).not.toHaveBeenCalled();
  });

  it("uses default locale even when Accept-Language prefers English", async () => {
    const req = new NextRequest(new URL("http://localhost/x"), {
      headers: { "accept-language": "en-GB,en;q=0.9" },
    });
    const res = await proxy(req);
    expect(res.headers.get("location")).toContain("/es/x");
  });

  it("uses default locale when Accept-Language header is absent", async () => {
    const req = new NextRequest(new URL("http://localhost/no-header"), {
      headers: new Headers(),
    });
    const res = await proxy(req);
    expect(res.headers.get("location")).toContain("/es/");
  });

  it("uses default locale when Accept-Language is unsupported", async () => {
    const req = new NextRequest(new URL("http://localhost/y"), {
      headers: { "accept-language": "fr-FR,fr;q=0.9" },
    });
    const res = await proxy(req);
    expect(res.headers.get("location")).toContain("/es/y");
  });

  it("delegates to updateSession when locale is present", async () => {
    const req = new NextRequest(
      new URL("http://localhost/es/dashboard/student/payments"),
    );
    await proxy(req);
    expect(updateSession).toHaveBeenCalledTimes(1);
  });

  it("delegates to updateSession for login (session refresh on public auth pages)", async () => {
    const req = new NextRequest(new URL("http://localhost/es/login"));
    await proxy(req);
    expect(updateSession).toHaveBeenCalledTimes(1);
  });

  it("delegates to updateSession for /api without locale prefix (no redirect)", async () => {
    const req = new NextRequest(new URL("http://localhost/api/analytics/traffic-hit"));
    await proxy(req);
    expect(updateSession).toHaveBeenCalledTimes(1);
  });

  it("does not prefix manifest.webmanifest with locale (root app route)", async () => {
    const req = new NextRequest(new URL("http://localhost/manifest.webmanifest"));
    const res = await proxy(req);
    expect(updateSession).not.toHaveBeenCalled();
    expect(res.status).not.toBe(307);
  });

  it("redirects locale parent/dashboard path to dashboard parent", async () => {
    const req = new NextRequest(new URL("http://localhost/es/parent/dashboard"));
    const res = await proxy(req);
    expect(res.status).toBe(307);
    expect(res.headers.get("location")).toContain("/es/dashboard/parent");
    expect(updateSession).not.toHaveBeenCalled();
  });

  it("exports matcher config", () => {
    expect(config.matcher[0]).toContain("favicon_io");
  });
});

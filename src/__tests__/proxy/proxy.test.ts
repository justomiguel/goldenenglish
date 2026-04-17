import { describe, it, expect, vi, beforeEach } from "vitest";
import type { NextFetchEvent } from "next/server";
import { NextRequest, NextResponse } from "next/server";

const updateSession = vi.fn();
const scheduleTrafficPageHitFromMiddleware = vi.fn();

vi.mock("@/lib/supabase/middleware", () => ({
  updateSession: (...args: unknown[]) => updateSession(...args),
}));

vi.mock("@/lib/analytics/scheduleTrafficPageHitFromMiddleware", () => ({
  scheduleTrafficPageHitFromMiddleware: (...args: unknown[]) =>
    scheduleTrafficPageHitFromMiddleware(...args),
}));

import { proxy } from "@/proxy";
import { proxyPathMatcher } from "@/lib/middleware/proxyPathMatcher";
import { config as middlewareConfig } from "../../../middleware";

function stubEvent(): NextFetchEvent {
  return { waitUntil: vi.fn() } as unknown as NextFetchEvent;
}

describe("proxy", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    updateSession.mockResolvedValue({
      response: NextResponse.next(),
      userId: null,
    });
  });

  it("redirects when pathname has no locale prefix to default locale (es)", async () => {
    const req = new NextRequest(new URL("http://localhost/foo"));
    const res = await proxy(req, stubEvent());
    expect(res.status).toBe(307);
    expect(res.headers.get("location")).toContain("/es/foo");
    expect(updateSession).not.toHaveBeenCalled();
  });

  it("uses default locale even when Accept-Language prefers English", async () => {
    const req = new NextRequest(new URL("http://localhost/x"), {
      headers: { "accept-language": "en-GB,en;q=0.9" },
    });
    const res = await proxy(req, stubEvent());
    expect(res.headers.get("location")).toContain("/es/x");
  });

  it("uses default locale when Accept-Language header is absent", async () => {
    const req = new NextRequest(new URL("http://localhost/no-header"), {
      headers: new Headers(),
    });
    const res = await proxy(req, stubEvent());
    expect(res.headers.get("location")).toContain("/es/");
  });

  it("uses default locale when Accept-Language is unsupported", async () => {
    const req = new NextRequest(new URL("http://localhost/y"), {
      headers: { "accept-language": "fr-FR,fr;q=0.9" },
    });
    const res = await proxy(req, stubEvent());
    expect(res.headers.get("location")).toContain("/es/y");
  });

  it("delegates to updateSession when locale is present", async () => {
    const req = new NextRequest(
      new URL("http://localhost/es/dashboard/student/payments"),
    );
    await proxy(req, stubEvent());
    expect(updateSession).toHaveBeenCalledTimes(1);
    expect(scheduleTrafficPageHitFromMiddleware).toHaveBeenCalledTimes(1);
  });

  it("delegates to updateSession for login (session refresh on public auth pages)", async () => {
    const req = new NextRequest(new URL("http://localhost/es/login"));
    await proxy(req, stubEvent());
    expect(updateSession).toHaveBeenCalledTimes(1);
    expect(scheduleTrafficPageHitFromMiddleware).toHaveBeenCalledTimes(1);
  });

  it("delegates to updateSession for /api without locale prefix (no redirect)", async () => {
    const req = new NextRequest(new URL("http://localhost/api/analytics/traffic-hit"));
    await proxy(req, stubEvent());
    expect(updateSession).toHaveBeenCalledTimes(1);
    expect(scheduleTrafficPageHitFromMiddleware).not.toHaveBeenCalled();
  });

  it("does not prefix manifest.webmanifest with locale (root app route)", async () => {
    const req = new NextRequest(new URL("http://localhost/manifest.webmanifest"));
    const res = await proxy(req, stubEvent());
    expect(updateSession).not.toHaveBeenCalled();
    expect(res.status).not.toBe(307);
  });

  it("does not prefix sw.js with locale (PWA service worker)", async () => {
    const req = new NextRequest(new URL("http://localhost/sw.js"));
    const res = await proxy(req, stubEvent());
    expect(updateSession).not.toHaveBeenCalled();
    expect(res.status).not.toBe(307);
  });

  // REGRESSION CHECK: Dev asset endpoints like `/_next/webpack-hmr` must never pass
  // through locale redirects or rewrites, otherwise Turbopack can serve stale/missing CSS
  // and chunks until the dev server is restarted.
  it("does not prefix root Next.js dev asset endpoints with locale", async () => {
    const req = new NextRequest(new URL("http://localhost/_next/webpack-hmr"));
    const res = await proxy(req, stubEvent());
    expect(updateSession).not.toHaveBeenCalled();
    expect(scheduleTrafficPageHitFromMiddleware).not.toHaveBeenCalled();
    expect(res.status).not.toBe(307);
  });

  it("rewrites locale-prefixed Next.js chunks back to root _next", async () => {
    const req = new NextRequest(new URL("http://localhost/es/_next/static/chunks/app.js"));
    const res = await proxy(req, stubEvent());
    expect(updateSession).not.toHaveBeenCalled();
    expect(scheduleTrafficPageHitFromMiddleware).not.toHaveBeenCalled();
    expect(res.headers.get("x-middleware-rewrite")).toContain("/_next/static/chunks/app.js");
  });

  it("rewrites locale-prefixed public assets back to root path", async () => {
    const req = new NextRequest(new URL("http://localhost/es/favicon_io/android-chrome-192x192.png"));
    const res = await proxy(req, stubEvent());
    expect(updateSession).not.toHaveBeenCalled();
    expect(scheduleTrafficPageHitFromMiddleware).not.toHaveBeenCalled();
    expect(res.headers.get("x-middleware-rewrite")).toContain(
      "/favicon_io/android-chrome-192x192.png",
    );
  });

  // REGRESSION CHECK: Public geo assets must bypass locale redirects or the admin choropleth
  // fetch to `/geo/world.geojson` never resolves and the map stays permanently unloaded.
  it("does not prefix root geojson public assets with locale", async () => {
    const req = new NextRequest(new URL("http://localhost/geo/world.geojson"));
    const res = await proxy(req, stubEvent());
    expect(updateSession).not.toHaveBeenCalled();
    expect(scheduleTrafficPageHitFromMiddleware).not.toHaveBeenCalled();
    expect(res.status).not.toBe(307);
  });

  it("rewrites locale-prefixed geojson public assets back to root path", async () => {
    const req = new NextRequest(new URL("http://localhost/es/geo/world.geojson"));
    const res = await proxy(req, stubEvent());
    expect(updateSession).not.toHaveBeenCalled();
    expect(scheduleTrafficPageHitFromMiddleware).not.toHaveBeenCalled();
    expect(res.headers.get("x-middleware-rewrite")).toContain("/geo/world.geojson");
  });

  it("redirects locale parent/dashboard path to dashboard parent", async () => {
    const req = new NextRequest(new URL("http://localhost/es/parent/dashboard"));
    const res = await proxy(req, stubEvent());
    expect(res.status).toBe(307);
    expect(res.headers.get("location")).toContain("/es/dashboard/parent");
    expect(updateSession).not.toHaveBeenCalled();
  });

  it("keeps static asset exclusions in proxy path matcher", () => {
    expect(proxyPathMatcher).toContain("_next/");
    expect(proxyPathMatcher).toContain("favicon_io");
    expect(proxyPathMatcher).toContain("sw\\.js$");
    expect(proxyPathMatcher).toContain("geojson");
  });

  it("middleware config.matcher[0] matches proxyPathMatcher export (keep both in sync)", () => {
    expect(middlewareConfig.matcher[0]).toBe(proxyPathMatcher);
  });
});

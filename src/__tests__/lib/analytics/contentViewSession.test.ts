import { describe, expect, it, vi, beforeEach } from "vitest";
import { NextRequest, NextResponse } from "next/server";
import {
  GE_CONTENT_VIEW_SESSION_HEADER,
  VIEWER_SESSION_COOKIE,
  buildContentViewSessionKey,
  getContentViewViewerSessionId,
  resolveContentViewViewerSessionOnRequest,
  syncContentViewViewerSessionCookie,
} from "@/lib/analytics/server/contentViewSession";

const cookiesGet = vi.fn();
const headersGet = vi.fn();

vi.mock("next/headers", () => ({
  cookies: async () => ({
    get: (name: string) => cookiesGet(name),
  }),
  headers: async () => ({
    get: (name: string) => headersGet(name),
  }),
}));

describe("buildContentViewSessionKey", () => {
  it("includes locale, slug, and viewer session id", () => {
    expect(buildContentViewSessionKey("es", "concierto-primavera", "sid-abc")).toBe(
      "es:concierto-primavera:sid-abc",
    );
  });

  it("keeps distinct keys for different anonymous viewers on the same event", () => {
    const eventKey = "es:workshop";
    const keyA = buildContentViewSessionKey("es", "workshop", "viewer-a");
    const keyB = buildContentViewSessionKey("es", "workshop", "viewer-b");
    expect(keyA).not.toBe(keyB);
    expect(keyA.startsWith(`${eventKey}:`)).toBe(true);
  });
});

describe("resolveContentViewViewerSessionOnRequest", () => {
  it("reuses an existing viewer session cookie", () => {
    const request = new NextRequest(new URL("http://localhost/es/blog/foo"));
    request.cookies.set(VIEWER_SESSION_COOKIE, "existing-sid");

    expect(resolveContentViewViewerSessionOnRequest(request)).toBe("existing-sid");
    expect(request.headers.get(GE_CONTENT_VIEW_SESSION_HEADER)).toBeNull();
  });

  it("assigns a request header when the cookie is missing", () => {
    const request = new NextRequest(new URL("http://localhost/es/blog/foo"));

    const viewerSessionId = resolveContentViewViewerSessionOnRequest(request);

    expect(viewerSessionId).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
    );
    expect(request.headers.get(GE_CONTENT_VIEW_SESSION_HEADER)).toBe(viewerSessionId);
  });
});

describe("syncContentViewViewerSessionCookie", () => {
  it("sets the viewer session cookie on first visit", () => {
    const request = new NextRequest(new URL("http://localhost/es/blog/foo"));
    request.headers.set(GE_CONTENT_VIEW_SESSION_HEADER, "fresh-sid");
    const response = NextResponse.next();

    syncContentViewViewerSessionCookie(request, response);

    expect(response.cookies.get(VIEWER_SESSION_COOKIE)?.value).toBe("fresh-sid");
  });

  it("does not overwrite an existing viewer session cookie", () => {
    const request = new NextRequest(new URL("http://localhost/es/blog/foo"));
    request.cookies.set(VIEWER_SESSION_COOKIE, "existing-sid");
    request.headers.set(GE_CONTENT_VIEW_SESSION_HEADER, "fresh-sid");
    const response = NextResponse.next();

    syncContentViewViewerSessionCookie(request, response);

    expect(response.cookies.get(VIEWER_SESSION_COOKIE)).toBeUndefined();
  });
});

describe("getContentViewViewerSessionId", () => {
  beforeEach(() => {
    cookiesGet.mockReset();
    headersGet.mockReset();
  });

  it("prefers the cookie over the forwarded header", async () => {
    cookiesGet.mockReturnValue({ value: "cookie-sid" });
    headersGet.mockReturnValue("header-sid");

    await expect(getContentViewViewerSessionId()).resolves.toBe("cookie-sid");
  });

  it("falls back to the forwarded header on first visit", async () => {
    cookiesGet.mockReturnValue(undefined);
    headersGet.mockReturnValue("header-sid");

    await expect(getContentViewViewerSessionId()).resolves.toBe("header-sid");
  });
});

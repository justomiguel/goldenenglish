/** @vitest-environment node */
import { describe, it, expect, vi, beforeEach } from "vitest";

const buildMock = vi.fn();
vi.mock("@/lib/calendar/buildIcsCalendarFeedResponse", () => ({
  buildIcsCalendarFeedResponse: (token: string) => buildMock(token),
}));

import { GET } from "@/app/api/calendar/feed/[token]/route";

/**
 * REGRESSION CHECK: the feed served personalised calendar data (classes,
 * exams, special events filtered by user role/sections) but used to advertise
 * `Cache-Control: public, max-age=300`, which lets shared CDNs / proxies
 * store and replay it across clients (OWASP A02 — sensitive data exposure
 * via caches). It MUST advertise `private` and never `public`.
 */
describe("GET /api/calendar/feed/[token]", () => {
  beforeEach(() => {
    buildMock.mockReset();
  });

  function ctx(token: string) {
    return { params: Promise.resolve({ token }) };
  }

  it("returns 404 status from the builder when ok=false", async () => {
    buildMock.mockResolvedValue({ ok: false, status: 404 });
    const res = await GET(new Request("http://localhost/api/calendar/feed/abc.ics"), ctx("abc.ics"));
    expect(res.status).toBe(404);
  });

  it("returns the ICS body with Content-Type: text/calendar", async () => {
    buildMock.mockResolvedValue({ ok: true, body: "BEGIN:VCALENDAR\nEND:VCALENDAR" });
    const res = await GET(new Request("http://localhost/api/calendar/feed/abc.ics"), ctx("abc.ics"));
    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toContain("text/calendar");
    expect(await res.text()).toContain("BEGIN:VCALENDAR");
  });

  it("advertises Cache-Control as private (never public) for personalised data", async () => {
    buildMock.mockResolvedValue({ ok: true, body: "BEGIN:VCALENDAR\nEND:VCALENDAR" });
    const res = await GET(new Request("http://localhost/api/calendar/feed/abc.ics"), ctx("abc.ics"));
    const cc = res.headers.get("cache-control") ?? "";
    expect(cc).toMatch(/\bprivate\b/);
    expect(cc).not.toMatch(/\bpublic\b/);
  });
});

import { describe, expect, it, vi } from "vitest";
import { runAdminWeeklyDigest } from "@/lib/admin-digest/runAdminWeeklyDigest";
import { digestFixture } from "@/__tests__/lib/admin-digest/digestFixture";

const colors = {
  primary: "#103A5C",
  primaryLight: "#2A5B84",
  primaryDark: "#0A253D",
  foreground: "#FFFFFF",
  background: "#FAF9F6",
};

function deps(overrides: Partial<Parameters<typeof runAdminWeeklyDigest>[0]> = {}) {
  return {
    enabled: true,
    now: new Date("2026-10-26T12:00:00.000Z"),
    timeZone: "America/Argentina/Cordoba",
    origin: "https://example.test",
    instituteName: "Instituto",
    logoUrl: null,
    legalLine: "Instituto",
    colors,
    loadDigest: vi.fn(async () => ({ data: digestFixture(), error: null })),
    loadPriorPayload: vi.fn(async () => null),
    claimWeek: vi.fn(async () => [] as string[]),
    listAdmins: vi.fn(async () => [
      { id: "admin-1", email: "one@example.test" },
      { id: "admin-2", email: "two@example.test" },
    ]),
    sendMail: vi.fn(async () => true),
    markSent: vi.fn(async () => undefined),
    rasterize: vi.fn(async () => null),
    ...overrides,
  };
}

describe("runAdminWeeklyDigest", () => {
  it("does not read or send when the template gate is off", async () => {
    const harness = deps({ enabled: false });
    const result = await runAdminWeeklyDigest(harness);
    expect(result).toEqual({ ok: true, sent: 0 });
    expect(harness.loadDigest).not.toHaveBeenCalled();
    expect(harness.sendMail).not.toHaveBeenCalled();
  });

  it("does not send zeros when the aggregate fails", async () => {
    const harness = deps({ loadDigest: vi.fn(async () => ({ data: null, error: "db" })) });
    const result = await runAdminWeeklyDigest(harness);
    expect(result.ok).toBe(false);
    expect(harness.claimWeek).not.toHaveBeenCalled();
    expect(harness.sendMail).not.toHaveBeenCalled();
  });

  it("skips an admin already stored for this week", async () => {
    const harness = deps({ claimWeek: vi.fn(async () => ["admin-1"]) });
    const result = await runAdminWeeklyDigest(harness);
    expect(result).toEqual({ ok: true, sent: 1 });
    expect(harness.sendMail).toHaveBeenCalledTimes(1);
    expect(harness.sendMail).toHaveBeenCalledWith(expect.objectContaining({ to: "two@example.test" }));
    expect(harness.markSent).toHaveBeenCalledWith("2026-10-19", ["admin-1", "admin-2"]);
  });

  it("stops when the aggregate is not a digest", async () => {
    const harness = deps({ loadDigest: vi.fn(async () => ({ data: {}, error: null })) });
    const result = await runAdminWeeklyDigest(harness);
    expect(result).toEqual({ ok: false, code: "invalid", sent: 0 });
    expect(harness.claimWeek).not.toHaveBeenCalled();
  });

  it("stops when the week claim fails", async () => {
    const harness = deps({ claimWeek: vi.fn(async () => null) });
    const result = await runAdminWeeklyDigest(harness);
    expect(result).toEqual({ ok: false, code: "claim", sent: 0 });
    expect(harness.sendMail).not.toHaveBeenCalled();
  });

  it("reports a send failure and still attaches the chart images", async () => {
    const harness = deps({
      rasterize: vi.fn(async () => "abc"),
      sendMail: vi.fn(async (input: { to: string }) => input.to !== "two@example.test"),
    });
    const result = await runAdminWeeklyDigest(harness);
    expect(result).toEqual({ ok: false, code: "send", sent: 1 });
    expect(harness.markSent).toHaveBeenCalledWith("2026-10-19", ["admin-1"]);
    const sent = harness.sendMail.mock.calls[0]?.[0] as { html: string; attachments: { contentId: string }[] };
    expect(sent.html).toContain("cid:cobro");
    expect(sent.attachments.map((file) => file.contentId)).toEqual(["cobro", "parents", "weekday", "aula"]);
  });

  it("keeps the HTML numbers when chart images fail", async () => {
    const harness = deps();
    await runAdminWeeklyDigest(harness);
    const sent = harness.sendMail.mock.calls[0]?.[0] as { html: string };
    expect(sent.html).toContain("4 comprobantes sin revisar");
    expect(sent.html).toContain("62% de los padres inició sesión.");
    expect(sent.html).not.toContain("cid:");
  });
});

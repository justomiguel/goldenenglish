/** @vitest-environment node */
import { describe, expect, it, vi, beforeEach } from "vitest";

interface FakeRow {
  template_key: string;
  locale: string;
  subject: string;
  body_html: string;
  updated_at: string;
  updated_by: string | null;
}

let nextRow: FakeRow | null = null;
let nextError: { message?: string } | null = null;

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => ({
    from: () => ({
      select: () => ({
        eq: () => ({
          eq: () => ({
            maybeSingle: async () => ({ data: nextRow, error: nextError }),
          }),
        }),
      }),
    }),
  }),
}));

describe("loadEmailTemplate", () => {
  beforeEach(() => {
    nextRow = null;
    nextError = null;
  });

  it("returns the registry default when no DB override exists", async () => {
    const { loadEmailTemplate } = await import("@/lib/email/templates/loadEmailTemplate");
    const r = await loadEmailTemplate({
      key: "messaging.teacher_new",
      locale: "es",
      vars: { senderName: "Ann", messagePreview: "Hi", href: "https://x.test" },
    });
    expect(r).not.toBeNull();
    expect(r?.fromOverride).toBe(false);
    expect(r?.subject).toBe("Nuevo mensaje del portal");
    expect(r?.bodyHtml).toContain("<strong>Ann</strong>");
    expect(r?.bodyHtml).toContain("https://x.test");
  });

  it("uses the DB override when present and reports fromOverride=true", async () => {
    nextRow = {
      template_key: "messaging.teacher_new",
      locale: "es",
      subject: "Asunto custom de {{senderName}}",
      body_html: "<p>Body custom para {{senderName}}</p>",
      updated_at: "2026-04-01T00:00:00Z",
      updated_by: null,
    };
    const { loadEmailTemplate } = await import("@/lib/email/templates/loadEmailTemplate");
    const r = await loadEmailTemplate({
      key: "messaging.teacher_new",
      locale: "es",
      vars: { senderName: "Ann" },
    });
    expect(r?.fromOverride).toBe(true);
    expect(r?.subject).toBe("Asunto custom de Ann");
    expect(r?.bodyHtml).toBe("<p>Body custom para Ann</p>");
  });

  it("returns null when the template key is unknown", async () => {
    const { loadEmailTemplate } = await import("@/lib/email/templates/loadEmailTemplate");
    const r = await loadEmailTemplate({
      key: "does.not.exist",
      locale: "es",
    });
    expect(r).toBeNull();
  });

  it("falls back to the registry default when the DB query errors out", async () => {
    nextError = { message: "boom" };
    const { loadEmailTemplate } = await import("@/lib/email/templates/loadEmailTemplate");
    const r = await loadEmailTemplate({
      key: "messaging.teacher_new",
      locale: "en",
    });
    expect(r?.fromOverride).toBe(false);
    expect(r?.subject).toBe("New portal message");
  });
});

// REGRESSION CHECK: Email template editor mutations stay behind assertAdmin and validate input.
import { describe, it, expect, vi, beforeEach } from "vitest";
import { ADMIN_SESSION_FORBIDDEN, ADMIN_SESSION_UNAUTHORIZED } from "@/lib/dashboard/adminSessionErrors";

vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

const recordSystemAudit = vi.fn().mockResolvedValue({ ok: true });
vi.mock("@/lib/analytics/server/recordSystemAudit", () => ({
  recordSystemAudit: (...a: unknown[]) => recordSystemAudit(...a),
}));

const mockAssertAdmin = vi.fn();
vi.mock("@/lib/dashboard/assertAdmin", () => ({
  assertAdmin: () => mockAssertAdmin(),
}));

const upsertSingle = vi.fn();
const upsertSpy = vi.fn();
const deleteEq2 = vi.fn();

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => ({}),
}));

function buildSupabase() {
  return {
    from: () => ({
      upsert: (row: unknown, opts?: unknown) => {
        upsertSpy(row, opts);
        return {
          select: () => ({
            single: () => upsertSingle(),
          }),
        };
      },
      delete: () => ({
        eq: () => ({
          eq: () => deleteEq2(),
        }),
      }),
    }),
  };
}

describe("emailTemplateActions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAssertAdmin.mockResolvedValue({
      supabase: buildSupabase(),
      user: { id: "11111111-1111-4111-8111-111111111111" },
    });
    upsertSingle.mockResolvedValue({
      data: { updated_at: "2026-04-17T00:00:00Z" },
      error: null,
    });
    deleteEq2.mockResolvedValue({ error: null });
  });

  it("saveEmailTemplateAction rejects invalid input", async () => {
    const { saveEmailTemplateAction } = await import(
      "@/app/[locale]/dashboard/admin/communications/templates/actions"
    );
    const r = await saveEmailTemplateAction({ templateKey: "" });
    expect(r).toEqual({ ok: false, code: "invalid_input" });
  });

  it("saveEmailTemplateAction rejects unknown template key", async () => {
    const { saveEmailTemplateAction } = await import(
      "@/app/[locale]/dashboard/admin/communications/templates/actions"
    );
    const r = await saveEmailTemplateAction({
      locale: "es",
      templateKey: "does.not.exist",
      templateLocale: "es",
      subject: "x",
      bodyHtml: "<p>x</p>",
    });
    expect(r).toEqual({ ok: false, code: "unknown_template_key" });
  });

  it("saveEmailTemplateAction returns unauthorized when session is missing", async () => {
    mockAssertAdmin.mockRejectedValue(new Error(ADMIN_SESSION_UNAUTHORIZED));
    const { saveEmailTemplateAction } = await import(
      "@/app/[locale]/dashboard/admin/communications/templates/actions"
    );
    const r = await saveEmailTemplateAction({
      locale: "es",
      templateKey: "messaging.teacher_new",
      templateLocale: "es",
      subject: "Asunto",
      bodyHtml: "<p>Body</p>",
    });
    expect(r).toEqual({ ok: false, code: "unauthorized" });
  });

  it("saveEmailTemplateAction returns forbidden for non-admin", async () => {
    mockAssertAdmin.mockRejectedValue(new Error(ADMIN_SESSION_FORBIDDEN));
    const { saveEmailTemplateAction } = await import(
      "@/app/[locale]/dashboard/admin/communications/templates/actions"
    );
    const r = await saveEmailTemplateAction({
      locale: "es",
      templateKey: "messaging.teacher_new",
      templateLocale: "es",
      subject: "Asunto",
      bodyHtml: "<p>Body</p>",
    });
    expect(r).toEqual({ ok: false, code: "forbidden" });
  });

  it("saveEmailTemplateAction upserts the override and records audit", async () => {
    const { saveEmailTemplateAction } = await import(
      "@/app/[locale]/dashboard/admin/communications/templates/actions"
    );
    const r = await saveEmailTemplateAction({
      locale: "es",
      templateKey: "messaging.teacher_new",
      templateLocale: "es",
      subject: "Asunto custom",
      bodyHtml: "<p>Body custom</p>",
    });
    expect(r).toEqual({ ok: true, updatedAt: "2026-04-17T00:00:00Z" });
    expect(upsertSingle).toHaveBeenCalledTimes(1);
    expect(recordSystemAudit).toHaveBeenCalledWith(
      expect.objectContaining({
        action: "email_template_updated",
        resourceType: "email_template",
        resourceId: "messaging.teacher_new::es",
      }),
    );
  });

  it("saveEmailTemplateAction surfaces persist_failed when upsert errors", async () => {
    upsertSingle.mockResolvedValue({ data: null, error: { message: "boom" } });
    const { saveEmailTemplateAction } = await import(
      "@/app/[locale]/dashboard/admin/communications/templates/actions"
    );
    const r = await saveEmailTemplateAction({
      locale: "es",
      templateKey: "messaging.teacher_new",
      templateLocale: "es",
      subject: "Asunto",
      bodyHtml: "<p>Body</p>",
    });
    expect(r).toEqual({ ok: false, code: "persist_failed" });
  });

  it("resetEmailTemplateAction deletes the override and records audit", async () => {
    const { resetEmailTemplateAction } = await import(
      "@/app/[locale]/dashboard/admin/communications/templates/actions"
    );
    const r = await resetEmailTemplateAction({
      locale: "es",
      templateKey: "messaging.teacher_new",
      templateLocale: "es",
    });
    expect(r.ok).toBe(true);
    expect(deleteEq2).toHaveBeenCalledTimes(1);
    expect(recordSystemAudit).toHaveBeenCalledWith(
      expect.objectContaining({
        action: "email_template_reset",
        resourceType: "email_template",
        resourceId: "messaging.teacher_new::es",
      }),
    );
  });

  /**
   * REGRESSION CHECK: previously bodyHtml landed in the DB raw, allowing a
   * compromised admin (or template imported from elsewhere) to persist
   * stored XSS payloads that fanned out through every branded email send.
   */
  it("saveEmailTemplateAction sanitizes body_html before persisting", async () => {
    const { saveEmailTemplateAction } = await import(
      "@/app/[locale]/dashboard/admin/communications/templates/actions"
    );
    const r = await saveEmailTemplateAction({
      locale: "es",
      templateKey: "messaging.teacher_new",
      templateLocale: "es",
      subject: "Asunto",
      bodyHtml:
        '<p onclick="evil()">hi</p><script>alert(1)</script><a href="javascript:bad()">x</a>',
    });
    expect(r.ok).toBe(true);
    expect(upsertSpy).toHaveBeenCalledTimes(1);
    const persisted = upsertSpy.mock.calls[0][0] as { body_html: string };
    expect(persisted.body_html).not.toMatch(/<script/i);
    expect(persisted.body_html).not.toMatch(/onclick/i);
    expect(persisted.body_html).not.toMatch(/javascript:/i);
    expect(persisted.body_html).toContain("hi");
  });

  it("saveEmailTemplateAction rejects bodies that are entirely forbidden markup", async () => {
    const { saveEmailTemplateAction } = await import(
      "@/app/[locale]/dashboard/admin/communications/templates/actions"
    );
    const r = await saveEmailTemplateAction({
      locale: "es",
      templateKey: "messaging.teacher_new",
      templateLocale: "es",
      subject: "Asunto",
      bodyHtml: "<script>alert(1)</script>",
    });
    expect(r).toEqual({ ok: false, code: "invalid_input" });
    expect(upsertSpy).not.toHaveBeenCalled();
  });

  it("resetEmailTemplateAction rejects unknown key", async () => {
    const { resetEmailTemplateAction } = await import(
      "@/app/[locale]/dashboard/admin/communications/templates/actions"
    );
    const r = await resetEmailTemplateAction({
      locale: "es",
      templateKey: "does.not.exist",
      templateLocale: "es",
    });
    expect(r).toEqual({ ok: false, code: "unknown_template_key" });
  });
});

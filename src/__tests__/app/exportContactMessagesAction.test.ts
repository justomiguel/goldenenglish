// REGRESSION CHECK: Contact export stays behind the admin session and audits the scope.
import { beforeEach, describe, expect, it, vi } from "vitest";

const getUser = vi.hoisted(() => vi.fn());
const resolveIsAdminSession = vi.hoisted(() => vi.fn());
const loadContactMessagesForExport = vi.hoisted(() => vi.fn());
const loadReceiptBrandForRequest = vi.hoisted(() => vi.fn());
const loadEffectiveProperties = vi.hoisted(() => vi.fn());
const recordSystemAudit = vi.hoisted(() => vi.fn());
const buildContactMessagesPdfArtifact = vi.hoisted(() => vi.fn());

vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => ({ auth: { getUser } }),
}));
vi.mock("@/lib/auth/resolveIsAdminSession", () => ({ resolveIsAdminSession }));
vi.mock("@/lib/messaging/export/loadContactMessagesForExport", () => ({ loadContactMessagesForExport }));
vi.mock("@/lib/billing/loadReceiptBrandForRequest", () => ({ loadReceiptBrandForRequest }));
vi.mock("@/lib/theme/loadEffectiveProperties", () => ({ loadEffectiveProperties }));
vi.mock("@/lib/analytics/server/recordSystemAudit", () => ({ recordSystemAudit }));
vi.mock("@/lib/messaging/export/buildContactMessagesPdfArtifact", () => ({
  buildContactMessagesPdfArtifact,
}));

import { exportContactMessagesAction } from "@/app/[locale]/dashboard/admin/messages/exportContactMessagesAction";

const source = {
  id: "msg-1",
  createdAt: "2026-11-05T15:04:00.000Z",
  broadcastBatchId: "batch-1",
  displayName: "Ada Lovelace",
  replyEmail: "ada@example.com",
  bodyHtml: "<p><strong>Asunto</strong> Precios</p><hr /><p>Hola</p>",
};

beforeEach(() => {
  vi.clearAllMocks();
  getUser.mockResolvedValue({ data: { user: { id: "admin-1" } } });
  resolveIsAdminSession.mockResolvedValue(true);
  loadContactMessagesForExport.mockResolvedValue({ ok: true, rows: [source] });
  loadReceiptBrandForRequest.mockResolvedValue({
    name: "Instituto Norte",
    legalName: "Norte SpA",
    legalRegistry: "",
    logoUrl: "https://example.com/logo.png",
    primaryColor: "#103A5C",
  });
  loadEffectiveProperties.mockResolvedValue({ properties: {} });
  recordSystemAudit.mockResolvedValue({ ok: true });
  buildContactMessagesPdfArtifact.mockResolvedValue({
    filename: "contact-messages_2026-11-05.pdf",
    mimeType: "application/pdf",
    base64: "QQ==",
  });
});

describe("exportContactMessagesAction", () => {
  it("refuses a caller who is not an admin", async () => {
    resolveIsAdminSession.mockResolvedValue(false);
    const result = await exportContactMessagesAction({
      locale: "es",
      format: "xlsx",
      scope: "all",
      fields: ["email"],
    });
    expect(result.ok).toBe(false);
    expect(loadContactMessagesForExport).not.toHaveBeenCalled();
  });

  it("returns an excel file and audits the chosen fields", async () => {
    const result = await exportContactMessagesAction({
      locale: "es",
      format: "xlsx",
      scope: "latest_2000",
      fields: ["email", "sentAt"],
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.artifact.filename).toMatch(/^contact-messages_\d{4}-\d{2}-\d{2}\.xlsx$/);
    expect(result.artifact.base64.length).toBeGreaterThan(20);
    expect(recordSystemAudit).toHaveBeenCalledWith(
      expect.objectContaining({
        action: "admin_contact_messages_exported",
        resourceType: "portal_messages",
        payload: expect.objectContaining({
          format: "xlsx",
          scope: "latest_2000",
          fields: ["sentAt", "email"],
          rowCount: 1,
        }),
      }),
    );
  });

  it("returns the empty-list message when there are no contact messages", async () => {
    loadContactMessagesForExport.mockResolvedValue({ ok: true, rows: [] });
    const result = await exportContactMessagesAction({
      locale: "en",
      format: "pdf",
      scope: "all",
      fields: ["name"],
    });
    expect(result).toEqual({
      ok: false,
      message: "There are no contact-form messages to export.",
    });
    expect(recordSystemAudit).not.toHaveBeenCalled();
  });
});

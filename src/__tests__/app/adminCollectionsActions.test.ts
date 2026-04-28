import { describe, it, expect, vi, beforeEach } from "vitest";

const mockResolveIsAdmin = vi.fn();
const mockLoadView = vi.fn();
const mockBuildCsv = vi.fn();
const mockBuildXlsx = vi.fn();
const mockRecordAudit = vi.fn();
const mockSendStaff = vi.fn();
const mockGetEmailProvider = vi.fn();
const mockSanitize = vi.fn((html: string) => html);
const mockStrip = vi.fn((html: string) => html.replace(/<[^>]+>/g, ""));
const mockMapCode = vi.fn((code: string) => `mapped:${code}`);
const mockRevalidate = vi.fn();
const mockLogException = vi.fn();

let lastSelectStudents: string[] = [];

function makeSupabase(opts: {
  user?: { id: string } | null;
  enrolled?: { student_id: string }[];
  profile?: { first_name?: string; last_name?: string } | null;
}) {
  return {
    auth: {
      getUser: () =>
        Promise.resolve({ data: { user: opts.user ?? null }, error: null }),
    },
    from: vi.fn((table: string) => {
      if (table === "section_enrollments") {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                in: vi.fn((_col: string, ids: string[]) => {
                  lastSelectStudents = ids;
                  return Promise.resolve({
                    data: opts.enrolled ?? [],
                    error: null,
                  });
                }),
              }),
            }),
          }),
        };
      }
      if (table === "profiles") {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              maybeSingle: vi
                .fn()
                .mockResolvedValue({ data: opts.profile ?? null }),
            }),
          }),
        };
      }
      return { select: vi.fn() };
    }),
  };
}

vi.mock("@/lib/i18n/dictionaries", async () => {
  const en = await import("@/dictionaries/en.json");
  return { getDictionary: vi.fn().mockResolvedValue(en.default ?? en) };
});

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(),
}));

vi.mock("@/lib/auth/resolveIsAdminSession", () => ({
  resolveIsAdminSession: (...args: unknown[]) => mockResolveIsAdmin(...args),
}));

vi.mock("@/lib/analytics/server/recordSystemAudit", () => ({
  recordSystemAudit: (...args: unknown[]) => mockRecordAudit(...args),
}));

vi.mock("@/lib/email/getEmailProvider", () => ({
  getEmailProvider: () => mockGetEmailProvider(),
}));

vi.mock("@/lib/messaging/useCases/sendStaffMessage", () => ({
  sendStaffMessageUseCase: (...args: unknown[]) => mockSendStaff(...args),
}));

vi.mock("@/lib/messaging/sanitizeMessageHtml", () => ({
  sanitizeMessageHtml: (html: string) => mockSanitize(html),
}));

vi.mock("@/lib/messaging/stripHtml", () => ({
  stripHtmlToText: (html: string) => mockStrip(html),
}));

vi.mock("@/lib/messaging/mapMessagingUseCaseCode", () => ({
  mapMessagingUseCaseCode: (code: string) => mockMapCode(code),
}));

vi.mock("@/lib/billing/loadAdminSectionCollectionsView", () => ({
  loadAdminSectionCollectionsView: (...args: unknown[]) => mockLoadView(...args),
}));

vi.mock("@/lib/billing/formatSectionCollectionsExport", () => ({
  buildSectionCollectionsCsvArtifact: (...args: unknown[]) =>
    mockBuildCsv(...args),
  buildSectionCollectionsXlsxArtifact: (...args: unknown[]) =>
    mockBuildXlsx(...args),
}));

vi.mock("next/cache", () => ({
  revalidatePath: (path: string) => mockRevalidate(path),
}));

vi.mock("@/lib/logging/serverActionLog", () => ({
  logServerException: (...args: unknown[]) => mockLogException(...args),
}));

import {
  exportSectionCollectionsAction,
  sendBulkCollectionsMessageAction,
} from "@/app/[locale]/dashboard/admin/finance/collections/actions";
import { createClient } from "@/lib/supabase/server";

const VALID_UUID = "00000000-0000-4000-8000-000000000000";
const STUDENT_A = "11111111-1111-4111-8111-111111111111";
const STUDENT_B = "22222222-2222-4222-8222-222222222222";

beforeEach(() => {
  vi.clearAllMocks();
  lastSelectStudents = [];
  mockSanitize.mockImplementation((html: string) => html);
  mockStrip.mockImplementation((html: string) => html.replace(/<[^>]+>/g, ""));
});

describe("exportSectionCollectionsAction", () => {
  it("rejects invalid input", async () => {
    const r = await exportSectionCollectionsAction({
      locale: "en",
      sectionId: "not-a-uuid",
      year: 2026,
      format: "csv",
    });
    expect(r).toEqual({ ok: false, message: "validation" });
  });

  it("rejects unauthenticated users", async () => {
    (createClient as ReturnType<typeof vi.fn>).mockResolvedValue(
      makeSupabase({ user: null }),
    );
    const r = await exportSectionCollectionsAction({
      locale: "en",
      sectionId: VALID_UUID,
      year: 2026,
      format: "csv",
    });
    expect(r.ok).toBe(false);
  });

  it("rejects non-admin sessions", async () => {
    (createClient as ReturnType<typeof vi.fn>).mockResolvedValue(
      makeSupabase({ user: { id: "u1" } }),
    );
    mockResolveIsAdmin.mockResolvedValue(false);
    const r = await exportSectionCollectionsAction({
      locale: "en",
      sectionId: VALID_UUID,
      year: 2026,
      format: "csv",
    });
    expect(r.ok).toBe(false);
  });

  it("returns invalidId when section view is missing", async () => {
    (createClient as ReturnType<typeof vi.fn>).mockResolvedValue(
      makeSupabase({ user: { id: "u1" } }),
    );
    mockResolveIsAdmin.mockResolvedValue(true);
    mockLoadView.mockResolvedValue(null);
    const r = await exportSectionCollectionsAction({
      locale: "en",
      sectionId: VALID_UUID,
      year: 2026,
      format: "csv",
    });
    expect(r.ok).toBe(false);
  });

  it("builds csv artifact and records audit", async () => {
    (createClient as ReturnType<typeof vi.fn>).mockResolvedValue(
      makeSupabase({ user: { id: "u1" } }),
    );
    mockResolveIsAdmin.mockResolvedValue(true);
    mockLoadView.mockResolvedValue({
      sectionId: VALID_UUID,
      sectionName: "S1",
      year: 2026,
      todayMonth: 6,
      students: [{ id: STUDENT_A }],
      kpis: {},
    });
    const artifact = {
      filename: "x.csv",
      mimeType: "text/csv",
      base64: "aGk=",
    };
    mockBuildCsv.mockReturnValue(artifact);

    const r = await exportSectionCollectionsAction({
      locale: "en",
      sectionId: VALID_UUID,
      year: 2026,
      format: "csv",
    });
    expect(r).toEqual({ ok: true, artifact });
    expect(mockBuildCsv).toHaveBeenCalledTimes(1);
    expect(mockBuildXlsx).not.toHaveBeenCalled();
    expect(mockRecordAudit).toHaveBeenCalledWith(
      expect.objectContaining({
        action: "collections_export",
        resourceType: "academic_section",
        resourceId: VALID_UUID,
        payload: expect.objectContaining({ format: "csv", rows: 1 }),
      }),
    );
  });

  it("builds xlsx artifact when format is xlsx", async () => {
    (createClient as ReturnType<typeof vi.fn>).mockResolvedValue(
      makeSupabase({ user: { id: "u1" } }),
    );
    mockResolveIsAdmin.mockResolvedValue(true);
    mockLoadView.mockResolvedValue({
      sectionId: VALID_UUID,
      sectionName: "S1",
      year: 2026,
      todayMonth: 6,
      students: [],
      kpis: {},
    });
    const artifact = {
      filename: "x.xlsx",
      mimeType: "application/xlsx",
      base64: "aGk=",
    };
    mockBuildXlsx.mockReturnValue(artifact);
    const r = await exportSectionCollectionsAction({
      locale: "en",
      sectionId: VALID_UUID,
      year: 2026,
      format: "xlsx",
    });
    expect(r).toEqual({ ok: true, artifact });
    expect(mockBuildXlsx).toHaveBeenCalledTimes(1);
    expect(mockBuildCsv).not.toHaveBeenCalled();
  });
});

describe("sendBulkCollectionsMessageAction", () => {
  it("rejects invalid uuid recipients", async () => {
    const r = await sendBulkCollectionsMessageAction({
      locale: "en",
      sectionId: VALID_UUID,
      recipientIds: ["nope"],
      bodyHtml: "<p>hi</p>",
    });
    expect(r).toEqual({ ok: false, message: "validation" });
  });

  it("rejects empty body after sanitize/strip", async () => {
    mockStrip.mockReturnValue("");
    const r = await sendBulkCollectionsMessageAction({
      locale: "en",
      sectionId: VALID_UUID,
      recipientIds: [STUDENT_A],
      bodyHtml: "<p></p>",
    });
    expect(r.ok).toBe(false);
  });

  it("rejects unauthenticated users", async () => {
    (createClient as ReturnType<typeof vi.fn>).mockResolvedValue(
      makeSupabase({ user: null }),
    );
    const r = await sendBulkCollectionsMessageAction({
      locale: "en",
      sectionId: VALID_UUID,
      recipientIds: [STUDENT_A],
      bodyHtml: "<p>hi</p>",
    });
    expect(r.ok).toBe(false);
  });

  it("rejects non-admin sessions", async () => {
    (createClient as ReturnType<typeof vi.fn>).mockResolvedValue(
      makeSupabase({ user: { id: "u1" } }),
    );
    mockResolveIsAdmin.mockResolvedValue(false);
    const r = await sendBulkCollectionsMessageAction({
      locale: "en",
      sectionId: VALID_UUID,
      recipientIds: [STUDENT_A],
      bodyHtml: "<p>hi</p>",
    });
    expect(r.ok).toBe(false);
  });

  it("filters out students not actively enrolled and reports skipped", async () => {
    (createClient as ReturnType<typeof vi.fn>).mockResolvedValue(
      makeSupabase({
        user: { id: "u1" },
        enrolled: [{ student_id: STUDENT_A }],
        profile: { first_name: "Ada", last_name: "Lovelace" },
      }),
    );
    mockResolveIsAdmin.mockResolvedValue(true);
    mockSendStaff.mockResolvedValue({ ok: true });

    const r = await sendBulkCollectionsMessageAction({
      locale: "en",
      sectionId: VALID_UUID,
      recipientIds: [STUDENT_A, STUDENT_B],
      bodyHtml: "<p>hi</p>",
    });
    expect(r).toEqual({
      ok: true,
      sent: 1,
      skipped: [STUDENT_B],
      failed: [],
    });
    expect(mockSendStaff).toHaveBeenCalledTimes(1);
    expect(mockSendStaff).toHaveBeenCalledWith(
      expect.objectContaining({
        senderId: "u1",
        senderDisplayName: "Lovelace Ada",
        recipientId: STUDENT_A,
      }),
    );
    expect(lastSelectStudents).toEqual([STUDENT_A, STUDENT_B]);
    expect(mockRecordAudit).toHaveBeenCalledWith(
      expect.objectContaining({
        action: "collections_bulk_message",
        payload: { sent: 1, failed: 0, skipped: 1 },
      }),
    );
    expect(mockRevalidate).toHaveBeenCalled();
  });

  it("aggregates failed deliveries from settled rejections and use-case failures", async () => {
    (createClient as ReturnType<typeof vi.fn>).mockResolvedValue(
      makeSupabase({
        user: { id: "u1" },
        enrolled: [
          { student_id: STUDENT_A },
          { student_id: STUDENT_B },
        ],
        profile: null,
      }),
    );
    mockResolveIsAdmin.mockResolvedValue(true);
    mockSendStaff
      .mockResolvedValueOnce({ ok: false, message: "persistFailed" })
      .mockRejectedValueOnce(new Error("boom"));

    const r = await sendBulkCollectionsMessageAction({
      locale: "en",
      sectionId: VALID_UUID,
      recipientIds: [STUDENT_A, STUDENT_B],
      bodyHtml: "<p>hi</p>",
    });
    if (!r.ok) throw new Error("expected ok result");
    expect(r.sent).toBe(0);
    expect(r.failed).toEqual([
      { id: STUDENT_A, message: "mapped:persistFailed" },
      expect.objectContaining({ id: STUDENT_B }),
    ]);
    expect(mockLogException).toHaveBeenCalledTimes(1);
  });
});

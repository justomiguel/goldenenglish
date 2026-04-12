/** @vitest-environment node */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { AnalyticsEntity } from "@/lib/analytics/eventConstants";
import { recordUserEventServer } from "@/lib/analytics/server/recordUserEvent";
import { submitParentPaymentReceipt } from "@/app/[locale]/dashboard/parent/payments/actions";
import { dictEn } from "@/test/dictEn";
import {
  fd,
  mockCreateClient,
  supabaseFor,
} from "./parentPaymentsActions.shared";

vi.mock("@/lib/supabase/server", () => ({
  createClient: () => mockCreateClient(),
}));

vi.mock("@/lib/analytics/server/recordUserEvent", () => ({
  recordUserEventServer: vi.fn(() => Promise.resolve({ ok: true })),
}));

const pe = dictEn.actionErrors.payment;

describe("submitParentPaymentReceipt supabase", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns unauthorized without user", async () => {
    mockCreateClient.mockResolvedValue(
      supabaseFor({
        user: null,
        profileRole: null,
        link: false,
        pay: null,
      }),
    );
    expect(await submitParentPaymentReceipt(fd())).toEqual({
      ok: false,
      message: pe.unauthorized,
    });
  });

  it("returns forbidden for non-parent profile", async () => {
    mockCreateClient.mockResolvedValue(
      supabaseFor({
        user: { id: "p1" },
        profileRole: "student",
        link: false,
        pay: null,
      }),
    );
    expect(await submitParentPaymentReceipt(fd())).toEqual({
      ok: false,
      message: pe.forbidden,
    });
  });

  it("requires parent-student link", async () => {
    mockCreateClient.mockResolvedValue(
      supabaseFor({
        user: { id: "p1" },
        profileRole: "parent",
        link: false,
        pay: null,
      }),
    );
    expect(await submitParentPaymentReceipt(fd())).toEqual({
      ok: false,
      message: pe.studentNotLinked,
    });
  });

  it("handles missing payment row", async () => {
    mockCreateClient.mockResolvedValue(
      supabaseFor({
        user: { id: "p1" },
        profileRole: "parent",
        link: true,
        pay: null,
      }),
    );
    expect(await submitParentPaymentReceipt(fd())).toEqual({
      ok: false,
      message: pe.slotNotFound,
    });
  });

  it("treats payment query error like missing row", async () => {
    mockCreateClient.mockResolvedValue(
      supabaseFor({
        user: { id: "p1" },
        profileRole: "parent",
        link: true,
        pay: null,
        payErr: { message: "timeout" },
      }),
    );
    expect(await submitParentPaymentReceipt(fd())).toEqual({
      ok: false,
      message: pe.slotNotFound,
    });
  });

  it("rejects non-pending payment", async () => {
    mockCreateClient.mockResolvedValue(
      supabaseFor({
        user: { id: "p1" },
        profileRole: "parent",
        link: true,
        pay: { id: "pay1", status: "approved" },
      }),
    );
    expect(await submitParentPaymentReceipt(fd())).toEqual({
      ok: false,
      message: pe.alreadyProcessed,
    });
  });

  it("surfaces upload errors", async () => {
    mockCreateClient.mockResolvedValue(
      supabaseFor({
        user: { id: "p1" },
        profileRole: "parent",
        link: true,
        pay: { id: "pay1", status: "pending" },
        uploadErr: { message: "quota" },
      }),
    );
    expect(await submitParentPaymentReceipt(fd())).toEqual({
      ok: false,
      message: pe.uploadFailed,
    });
  });

  it("surfaces update errors", async () => {
    mockCreateClient.mockResolvedValue(
      supabaseFor({
        user: { id: "p1" },
        profileRole: "parent",
        link: true,
        pay: { id: "pay1", status: "pending" },
        updateErr: { message: "row conflict" },
      }),
    );
    expect(await submitParentPaymentReceipt(fd())).toEqual({
      ok: false,
      message: pe.uploadFailed,
    });
  });

  it("accepts webp and completes flow", async () => {
    mockCreateClient.mockResolvedValue(
      supabaseFor({
        user: { id: "p1" },
        profileRole: "parent",
        link: true,
        pay: { id: "pay1", status: "pending" },
      }),
    );
    const form = fd({
      file: new File([new Uint8Array([2])], "r.webp", {
        type: "image/webp",
      }),
    });
    expect(await submitParentPaymentReceipt(form)).toEqual({ ok: true });
    expect(recordUserEventServer).toHaveBeenCalledWith({
      userId: "p1",
      eventType: "action",
      entity: AnalyticsEntity.paymentReceiptSubmittedParent,
      metadata: { month: 3, year: 2025, receipt_kind: "image" },
    });
  });

  it("uses jpg extension for jpeg mime", async () => {
    mockCreateClient.mockResolvedValue(
      supabaseFor({
        user: { id: "p1" },
        profileRole: "parent",
        link: true,
        pay: { id: "pay1", status: "pending" },
      }),
    );
    const form = fd({
      file: new File([new Uint8Array([3])], "r.jpg", {
        type: "image/jpeg",
      }),
    });
    expect(await submitParentPaymentReceipt(form)).toEqual({ ok: true });
  });

  it("uses bin extension for non-png image types", async () => {
    mockCreateClient.mockResolvedValue(
      supabaseFor({
        user: { id: "p1" },
        profileRole: "parent",
        link: true,
        pay: { id: "pay1", status: "pending" },
      }),
    );
    const form = fd({
      file: new File([new Uint8Array([4])], "r.gif", {
        type: "image/gif",
      }),
    });
    expect(await submitParentPaymentReceipt(form)).toEqual({ ok: true });
  });

  it("maps image/png to png extension", async () => {
    mockCreateClient.mockResolvedValue(
      supabaseFor({
        user: { id: "p1" },
        profileRole: "parent",
        link: true,
        pay: { id: "pay1", status: "pending" },
      }),
    );
    const form = fd({
      file: new File([new Uint8Array([5])], "r.png", {
        type: "image/png",
      }),
    });
    expect(await submitParentPaymentReceipt(form)).toEqual({ ok: true });
  });

  it("maps image/jpg alias mime", async () => {
    mockCreateClient.mockResolvedValue(
      supabaseFor({
        user: { id: "p1" },
        profileRole: "parent",
        link: true,
        pay: { id: "pay1", status: "pending" },
      }),
    );
    const form = fd({
      file: new File([new Uint8Array([6])], "r.jpg", {
        type: "image/jpg",
      }),
    });
    expect(await submitParentPaymentReceipt(form)).toEqual({ ok: true });
  });
});

/** @vitest-environment node */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { AnalyticsEntity } from "@/lib/analytics/eventConstants";
import { recordUserEventServer } from "@/lib/analytics/server/recordUserEvent";
import { submitStudentPaymentReceipt } from "@/app/[locale]/dashboard/student/payments/actions";
import { dictEn } from "@/test/dictEn";
import {
  mockCreateClient,
  studentFd,
  studentSupabaseFor,
} from "./studentPaymentsActions.shared";

vi.mock("@/lib/supabase/server", () => ({
  createClient: () => mockCreateClient(),
}));

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

vi.mock("@/lib/analytics/server/recordUserEvent", () => ({
  recordUserEventServer: vi.fn(() => Promise.resolve({ ok: true })),
}));

const pe = dictEn.actionErrors.payment;

describe("submitStudentPaymentReceipt supabase", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns unauthorized without user", async () => {
    mockCreateClient.mockResolvedValue(
      studentSupabaseFor({
        user: null,
        profileRole: null,
        pay: null,
      }),
    );
    expect(await submitStudentPaymentReceipt(studentFd())).toEqual({
      ok: false,
      message: pe.unauthorized,
    });
  });

  it("returns forbidden for non-student profile", async () => {
    mockCreateClient.mockResolvedValue(
      studentSupabaseFor({
        user: { id: "s1" },
        profileRole: "parent",
        pay: null,
      }),
    );
    expect(await submitStudentPaymentReceipt(studentFd())).toEqual({
      ok: false,
      message: pe.forbidden,
    });
  });

  it("handles missing payment row", async () => {
    mockCreateClient.mockResolvedValue(
      studentSupabaseFor({
        user: { id: "s1" },
        profileRole: "student",
        pay: null,
      }),
    );
    expect(await submitStudentPaymentReceipt(studentFd())).toEqual({
      ok: false,
      message: pe.slotNotFound,
    });
  });

  it("treats payment query error like missing row", async () => {
    mockCreateClient.mockResolvedValue(
      studentSupabaseFor({
        user: { id: "s1" },
        profileRole: "student",
        pay: null,
        payErr: { message: "timeout" },
      }),
    );
    expect(await submitStudentPaymentReceipt(studentFd())).toEqual({
      ok: false,
      message: pe.slotNotFound,
    });
  });

  it("rejects non-pending payment", async () => {
    mockCreateClient.mockResolvedValue(
      studentSupabaseFor({
        user: { id: "s1" },
        profileRole: "student",
        pay: { id: "pay1", status: "approved" },
      }),
    );
    expect(await submitStudentPaymentReceipt(studentFd())).toEqual({
      ok: false,
      message: pe.alreadyProcessed,
    });
  });

  it("surfaces upload errors", async () => {
    mockCreateClient.mockResolvedValue(
      studentSupabaseFor({
        user: { id: "s1" },
        profileRole: "student",
        pay: { id: "pay1", status: "pending" },
        uploadErr: { message: "quota" },
      }),
    );
    expect(await submitStudentPaymentReceipt(studentFd())).toEqual({
      ok: false,
      message: pe.uploadFailed,
    });
  });

  it("surfaces update errors", async () => {
    mockCreateClient.mockResolvedValue(
      studentSupabaseFor({
        user: { id: "s1" },
        profileRole: "student",
        pay: { id: "pay1", status: "pending" },
        updateErr: { message: "row conflict" },
      }),
    );
    expect(await submitStudentPaymentReceipt(studentFd())).toEqual({
      ok: false,
      message: pe.uploadFailed,
    });
  });

  it("completes flow for student pending payment", async () => {
    mockCreateClient.mockResolvedValue(
      studentSupabaseFor({
        user: { id: "s1" },
        profileRole: "student",
        pay: { id: "pay1", status: "pending" },
      }),
    );
    expect(await submitStudentPaymentReceipt(studentFd())).toEqual({ ok: true });
    expect(recordUserEventServer).toHaveBeenCalledWith({
      userId: "s1",
      eventType: "action",
      entity: AnalyticsEntity.paymentReceiptSubmittedStudent,
      metadata: { month: 3, year: 2026, receipt_kind: "pdf" },
    });
  });
});

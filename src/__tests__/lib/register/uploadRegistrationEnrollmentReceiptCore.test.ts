/** @vitest-environment node */
import { beforeEach, describe, expect, it, vi } from "vitest";
import { Buffer } from "node:buffer";
import type { SupabaseClient } from "@supabase/supabase-js";

const mocks = vi.hoisted(() => ({
  sendBrandedEmail: vi.fn(),
  sendRegistrationAdminEmails: vi.fn(),
}));

vi.mock("@/lib/email/templates/sendBrandedEmail", () => ({
  sendBrandedEmail: mocks.sendBrandedEmail,
}));
vi.mock("@/lib/email/registrationIntakeEmails", () => ({
  sendRegistrationAdminEmails: mocks.sendRegistrationAdminEmails,
}));
vi.mock("@/lib/logging/serverActionLog", () => ({
  logServerActionInvariantViolation: vi.fn(),
  logSupabaseClientError: vi.fn(),
  logServerException: vi.fn(),
  logServerWarn: vi.fn(),
}));

import { uploadRegistrationEnrollmentReceiptCore } from "@/lib/register/uploadRegistrationEnrollmentReceiptCore";

const REG_ID = "aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee";

function lead(overrides: Record<string, unknown> = {}) {
  return {
    id: REG_ID,
    status: "new",
    intake_state: "awaiting_fee",
    fee_captured: false,
    fee_snapshot: { total: 80, currency: "CLP" },
    preferred_section_id: "sec-1",
    additional_section_ids: [],
    is_minor: false,
    student_email: "ana@example.com",
    tutor_email: null,
    first_name: "Ana",
    last_name: "Pérez",
    ...overrides,
  };
}

function mockAdmin(opts: {
  row?: Record<string, unknown> | null;
  seatOpen?: boolean;
  uploadError?: { message: string } | null;
  updateError?: { message: string } | null;
} = {}) {
  const uploaded: { bucket?: string; path?: string } = {};
  const updated: { values?: Record<string, unknown> } = {};
  const admin = {
    from: (table: string) => {
      if (table === "registrations") {
        return {
          select: () => ({
            eq: () => ({
              maybeSingle: async () => ({
                data: opts.row === undefined ? lead() : opts.row,
                error: null,
              }),
            }),
          }),
          update: (values: Record<string, unknown>) => {
            updated.values = values;
            return {
              eq: async () => ({ error: opts.updateError ?? null }),
            };
          },
        };
      }
      return {};
    },
    rpc: async (fn: string) => {
      if (fn === "registration_public_section_has_open_seat") {
        return { data: opts.seatOpen !== false, error: null };
      }
      return { data: null, error: { message: fn } };
    },
    storage: {
      from: (bucket: string) => ({
        upload: async (path: string) => {
          uploaded.bucket = bucket;
          uploaded.path = path;
          return { error: opts.uploadError ?? null };
        },
        remove: async () => ({ error: null }),
      }),
    },
    uploaded,
    updated,
  };
  return admin as unknown as SupabaseClient & typeof admin;
}

beforeEach(() => {
  vi.clearAllMocks();
  mocks.sendBrandedEmail.mockResolvedValue({ ok: true });
  mocks.sendRegistrationAdminEmails.mockResolvedValue(undefined);
});

describe("uploadRegistrationEnrollmentReceiptCore", () => {
  it("stores the receipt and marks the lead receipt_pending", async () => {
    const admin = mockAdmin();
    const result = await uploadRegistrationEnrollmentReceiptCore({
      admin,
      payToken: "tok",
      fileName: "comprobante.pdf",
      fileBytes: Buffer.from("%PDF-1.4"),
      fileMime: "application/pdf",
      locale: "es",
      sectionLabel: "A2 Mañana",
    });

    expect(result).toEqual({ ok: true });
    expect(admin.uploaded.bucket).toBe("payment-receipts");
    expect(admin.uploaded.path).toMatch(
      new RegExp(`^registration-enrollment/${REG_ID}/`),
    );
    expect(admin.updated.values).toMatchObject({
      intake_state: "receipt_pending",
      enrollment_fee_receipt_path: admin.uploaded.path,
    });
    expect(mocks.sendBrandedEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        to: "ana@example.com",
        templateKey: "billing.receipt_submitted_pending",
        vars: expect.objectContaining({ periodLabel: "Matrícula" }),
      }),
    );
    expect(mocks.sendRegistrationAdminEmails).toHaveBeenCalledWith(
      expect.objectContaining({ templateKey: "registration.admin_receipt_pending" }),
    );
  });

  it("rejects an invalid file before touching storage", async () => {
    const admin = mockAdmin();
    const result = await uploadRegistrationEnrollmentReceiptCore({
      admin,
      payToken: "tok",
      fileName: "notes.zip",
      fileBytes: Buffer.from("zip"),
      fileMime: "application/zip",
      locale: "es",
      sectionLabel: "A2",
    });
    expect(result).toEqual({ ok: false, code: "invalid_file" });
    expect(admin.uploaded.path).toBeUndefined();
  });

  it("returns section_full when the seat is gone", async () => {
    const result = await uploadRegistrationEnrollmentReceiptCore({
      admin: mockAdmin({ seatOpen: false }),
      payToken: "tok",
      fileName: "ok.pdf",
      fileBytes: Buffer.from("%PDF"),
      fileMime: "application/pdf",
      locale: "es",
      sectionLabel: "A2",
    });
    expect(result).toEqual({ ok: false, code: "section_full" });
  });
});

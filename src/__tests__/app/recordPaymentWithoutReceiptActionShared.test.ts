import { describe, expect, it } from "vitest";
import {
  messageForRecordPaymentCode,
  recordPaymentBulkSchema,
  recordPaymentSingleSchema,
  resolveRecordPaymentLocale,
  uniqueSortedMonths,
} from "@/app/[locale]/dashboard/admin/payments/recordPaymentWithoutReceiptActionShared";
import { dictEn } from "@/test/dictEn";

describe("recordPaymentWithoutReceiptActionShared", () => {
  it("parses single and bulk payloads", () => {
    const sid = "6ba7b810-9dad-11d1-80b4-00c04fd430c8";
    const sec = "6ba7b811-9dad-11d1-80b4-00c04fd430c8";
    expect(
      recordPaymentSingleSchema.safeParse({
        studentId: sid,
        sectionId: sec,
        year: 2026,
        month: 3,
        locale: "es",
      }).success,
    ).toBe(true);
    expect(
      recordPaymentBulkSchema.safeParse({
        studentId: sid,
        sectionId: sec,
        year: 2026,
        months: [3, 3, 4],
        locale: "en",
      }).success,
    ).toBe(true);
  });

  it("uniqueSortedMonths dedupes and sorts", () => {
    expect(uniqueSortedMonths([12, 1, 1, 3])).toEqual([1, 3, 12]);
    expect(uniqueSortedMonths([0, 13])).toEqual([]);
  });

  it("resolveRecordPaymentLocale defaults", () => {
    expect(resolveRecordPaymentLocale("es")).toBe("es");
    expect(resolveRecordPaymentLocale("xx")).toBeTruthy();
  });

  it("messageForRecordPaymentCode maps codes", () => {
    const d = dictEn.actionErrors.recordPaymentAdmin;
    expect(messageForRecordPaymentCode(d, "not_a_student")).toBe(d.notAStudent);
    expect(messageForRecordPaymentCode(d, "save_failed")).toBe(d.saveFailed);
  });
});

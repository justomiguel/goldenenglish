import { describe, expect, it } from "vitest";
import { adminWeeklyDigestSubject } from "@/lib/admin-digest/adminWeeklyDigestSubject";
import { digestFixture } from "@/__tests__/lib/admin-digest/digestFixture";

const copy = {
  receipts: (count: number) => `${count} comprobantes sin revisar`,
  messages: (count: number) => `${count} mensajes sin respuesta`,
  silent: (count: number) => `${count} familias en silencio`,
  parents: (percent: number) => `${percent}% de padres entraron`,
};

describe("adminWeeklyDigestSubject", () => {
  it("puts pending receipts first", () => {
    expect(adminWeeklyDigestSubject(digestFixture(), copy)).toBe("4 comprobantes sin revisar");
  });

  it("uses messages when no receipts are waiting", () => {
    expect(adminWeeklyDigestSubject(digestFixture({ pendingReceipts: 0 }), copy)).toBe(
      "2 mensajes sin respuesta",
    );
  });

  it("uses silent families when the inbox is clear", () => {
    expect(
      adminWeeklyDigestSubject(digestFixture({ pendingReceipts: 0, openParentMessages: 0 }), copy),
    ).toBe("11 familias en silencio");
  });

  it("uses the parent percent when nothing is waiting", () => {
    expect(
      adminWeeklyDigestSubject(
        digestFixture({ pendingReceipts: 0, openParentMessages: 0, silentFamilies: 0 }),
        copy,
      ),
    ).toBe("62% de padres entraron");
  });
});

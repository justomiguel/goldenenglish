/** @vitest-environment node */
import { describe, expect, it } from "vitest";
import { buildRegistrationEnrollmentReceiptPath } from "@/lib/register/buildRegistrationEnrollmentReceiptPath";

const REG_ID = "aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee";

describe("buildRegistrationEnrollmentReceiptPath", () => {
  it("stores the file under registration-enrollment/{id}/", () => {
    const path = buildRegistrationEnrollmentReceiptPath({
      registrationId: REG_ID,
      filename: "Comprobante Banco.pdf",
      mime: "application/pdf",
      now: 1_700_000_000_000,
    });
    expect(path.startsWith(`registration-enrollment/${REG_ID}/`)).toBe(true);
    expect(path.endsWith(".pdf")).toBe(true);
    expect(path).not.toContain(" ");
  });

  it("maps jpeg mime to a .jpg suffix", () => {
    const path = buildRegistrationEnrollmentReceiptPath({
      registrationId: REG_ID,
      filename: "foto",
      mime: "image/jpeg",
      now: 1,
    });
    expect(path.endsWith(".jpg")).toBe(true);
  });
});

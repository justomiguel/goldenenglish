/** @vitest-environment jsdom */
import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const uploadEventRegistrationFile = vi.fn();

vi.mock("@/lib/client/uploadEventRegistrationFile", () => ({
  uploadEventRegistrationFile: (...args: unknown[]) => uploadEventRegistrationFile(...args),
}));

import { useEventRegisterSubmit } from "@/hooks/useEventRegisterSubmit";

const labels = {
  error: "error",
  transferReceiptRequired: "required",
  transferReceiptUploadFailed: "upload-failed",
  receiptAttachFailed: "attach-failed",
  paymentStartFailed: "pay-failed",
  customFieldFileRequired: "file-required",
  customFieldFileTooLarge: "too-large",
  customFieldFileInvalidType: "bad-type",
  customFieldFileUploadFailed: "file-upload-failed",
  errors: {
    emailInvalid: "Correo inválido",
    duplicateDocument: "Documento repetido",
    network: "Sin conexión",
  },
};

function payload(file: File) {
  return {
    locale: "es",
    slug: "gala",
    firstName: "Ana",
    lastName: "Pérez",
    dni: "1",
    email: "ana@example.com",
    phone: "",
    birthDate: "",
    isMinor: false,
    tutor: {
      tutorFirstName: "",
      tutorLastName: "",
      tutorDniOrPassport: "",
      tutorEmail: "",
      tutorPhone: "",
      tutorRelationship: "",
    },
    fields: [],
    fieldValues: {},
    fieldFiles: {},
    isLocalResident: true,
    paymentMethod: "transfer" as const,
    allowedPaymentMethods: ["transfer" as const],
    showPaymentPicker: true,
    requiresTransferReceipt: true,
    receiptFile: file,
    familyDiscountClaimed: false,
  };
}

describe("useEventRegisterSubmit receipt", () => {
  beforeEach(() => {
    uploadEventRegistrationFile.mockReset();
    vi.stubGlobal("fetch", vi.fn());
  });

  it("does not enroll when the receipt upload fails", async () => {
    uploadEventRegistrationFile.mockResolvedValue({ ok: false, code: "http_413" });
    const { result } = renderHook(() => useEventRegisterSubmit({ labels }));
    const file = new File([new Uint8Array([1])], "pago.jpg", { type: "image/jpeg" });

    await act(async () => {
      await result.current.submit(payload(file));
    });

    expect(result.current.message).toBe("upload-failed");
    expect(result.current.successOpen).toBe(false);
    expect(fetch).not.toHaveBeenCalled();
  });

  it("shows the server reason instead of the generic sentence", async () => {
    vi.mocked(fetch).mockResolvedValue(
      new Response(JSON.stringify({ ok: false, code: "email_invalid" }), { status: 400 }),
    );
    const { result } = renderHook(() => useEventRegisterSubmit({ labels }));
    const file = new File([new Uint8Array([1])], "pago.jpg", { type: "image/jpeg" });

    await act(async () => {
      await result.current.submit({ ...payload(file), requiresTransferReceipt: false });
    });

    expect(result.current.message).toBe("Correo inválido");
    expect(result.current.successOpen).toBe(false);
  });

  it("does not open success when the enrollment row was rejected", async () => {
    vi.mocked(fetch).mockResolvedValue(
      new Response(
        JSON.stringify({
          ok: true,
          result: { attendeeId: null, resultCode: "duplicate_dni", seats: 0 },
        }),
        { status: 200 },
      ),
    );
    const { result } = renderHook(() => useEventRegisterSubmit({ labels }));
    const file = new File([new Uint8Array([1])], "pago.jpg", { type: "image/jpeg" });

    await act(async () => {
      await result.current.submit({ ...payload(file), requiresTransferReceipt: false });
    });

    expect(result.current.message).toBe("Documento repetido");
    expect(result.current.successOpen).toBe(false);
  });
});

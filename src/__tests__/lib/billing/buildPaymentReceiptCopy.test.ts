import { describe, expect, it } from "vitest";
import { buildPaymentReceiptCopy } from "@/lib/billing/buildPaymentReceiptCopy";
import type { Dictionary } from "@/types/i18n";

const monthlyFixture = {
  receipt: {
    documentTitle: "Comprobante",
    legalNotice: "Aviso legal",
    labels: {
      receiptNumber: "Nº",
      issuedAt: "Emitido",
      paidAt: "Pagado",
      method: "Medio",
      description: "Concepto",
      amount: "Total",
      period: "Período",
      student: "Alumno",
      payer: "Pagador",
      paidByTutor: "Tutor",
      section: "Sección",
      contact: "Contacto",
    },
    descriptionMonthly: "Cuota",
    descriptionEnrollment: "Matrícula",
    methodFlow: "Flow",
    methodUpload: "Comprobante",
    downloadPdf: "PDF",
    loadError: "Error al cargar",
  },
} as Dictionary["dashboard"]["student"]["monthly"];

describe("buildPaymentReceiptCopy", () => {
  it("maps receipt dict into model input copy and method labels", () => {
    const out = buildPaymentReceiptCopy(monthlyFixture);
    expect(out.copy.documentTitle).toBe("Comprobante");
    expect(out.copy.description.monthlyFee).toBe("Cuota");
    expect(out.copy.description.enrollmentFee).toBe("Matrícula");
    expect(out.copy.labels.receiptNumber).toBe("Nº");
    expect(out.flowMethodLabel).toBe("Flow");
    expect(out.uploadMethodLabel).toBe("Comprobante");
    expect(out.downloadLabel).toBe("PDF");
    expect(out.loadErrorMessage).toBe("Error al cargar");
  });
});

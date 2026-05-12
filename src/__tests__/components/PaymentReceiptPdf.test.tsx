import { describe, it, expect } from "vitest";
import { createElement, type ComponentProps, type ReactElement } from "react";
import { renderToBuffer, Document } from "@react-pdf/renderer";
import { PaymentReceiptPdf } from "@/components/payments/receipt/PaymentReceiptPdf";
import type { PaymentReceiptModel } from "@/lib/billing/buildPaymentReceiptModel";

function fixture(over: Partial<PaymentReceiptModel> = {}): PaymentReceiptModel {
  return {
    documentTitle: "Comprobante",
    legalNotice: "Aviso.",
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
    tenant: {
      name: "T",
      legalName: "TLegal",
      legalRegistry: "RUT",
      logoUrl: "https://example.com/logo.png",
      address: "Addr",
      email: "e@x.com",
      phone: "+1",
      primaryColor: "#112233",
    },
    receipt: {
      number: "R-1",
      issuedAtIso: "2026-05-11T12:00:00.000Z",
      issuedAtFormatted: "11 may 2026",
      paidAtIso: "2026-05-10T20:00:00.000Z",
      paidAtFormatted: "10 may 2026",
      methodLabel: "Flow",
    },
    payment: {
      description: "Cuota",
      periodLabel: "Mayo 2026",
      sectionLabel: "A1",
      amountFormatted: "$1.000",
      currency: "CLP",
    },
    payer: { fullName: "Payer", email: "p@x.com", paidByTutor: true },
    student: { fullName: "Student" },
    ...over,
  };
}

describe("PaymentReceiptPdf", () => {
  it("renderToBuffer yields a PDF header", async () => {
    const doc = createElement(PaymentReceiptPdf, { receipt: fixture() }) as ReactElement<
      ComponentProps<typeof Document>
    >;
    const buf = await renderToBuffer(doc);
    expect(buf.length).toBeGreaterThan(200);
    expect(Buffer.from(buf).subarray(0, 4).toString()).toBe("%PDF");
  });

  it("renders without optional tenant logo and registry", async () => {
    const doc = createElement(PaymentReceiptPdf, {
      receipt: fixture({
        tenant: {
          ...fixture().tenant,
          logoUrl: null,
          legalRegistry: null,
        },
      }),
    }) as ReactElement<ComponentProps<typeof Document>>;
    const buf = await renderToBuffer(doc);
    expect(buf.byteLength).toBeGreaterThan(100);
  });
});

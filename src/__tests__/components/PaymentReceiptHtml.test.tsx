import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { PaymentReceiptHtml } from "@/components/payments/receipt/PaymentReceiptHtml";
import type { PaymentReceiptModel } from "@/lib/billing/buildPaymentReceiptModel";

function fixtureModel(over: Partial<PaymentReceiptModel> = {}): PaymentReceiptModel {
  return {
    documentTitle: "Comprobante de pago",
    legalNotice: "Comprobante interno.",
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
      paidByTutor: "Pagado por tutor",
      section: "Sección",
      contact: "Contacto",
    },
    tenant: {
      name: "Mozarthitos",
      legalName: "Primera Academia en Chile",
      legalRegistry: "Reg. 1234",
      logoUrl: "https://example.com/logo.png",
      address: "Av. Demo 123",
      email: "info@example.com",
      phone: "+56 9 1234",
      primaryColor: "#A31A22",
    },
    receipt: {
      number: "MES-2026-05-00000001",
      issuedAtIso: "2026-05-11T12:00:00.000Z",
      issuedAtFormatted: "11 de mayo de 2026",
      paidAtIso: "2026-05-10T20:30:00.000Z",
      paidAtFormatted: "10 de mayo de 2026",
      methodLabel: "Pago online (Flow)",
    },
    payment: {
      description: "Cuota mensual",
      periodLabel: "mayo de 2026",
      sectionLabel: "Inglés A1",
      amountFormatted: "$12.500",
      currency: "CLP",
    },
    payer: {
      fullName: "Pérez Ana",
      email: "ana@example.com",
      paidByTutor: true,
    },
    student: {
      fullName: "Pérez Tomás",
    },
    ...over,
  };
}

describe("PaymentReceiptHtml", () => {
  it("renders tenant identity, amount and download link", () => {
    render(
      <PaymentReceiptHtml
        receipt={fixtureModel()}
        downloadHref="/api/payments/abc/receipt.pdf?locale=es"
        downloadLabel="Descargar PDF"
      />,
    );

    expect(screen.getByText("Primera Academia en Chile")).toBeInTheDocument();
    expect(screen.getByText("MES-2026-05-00000001")).toBeInTheDocument();
    expect(screen.getByText("$12.500")).toBeInTheDocument();
    expect(screen.getByText("Pago online (Flow)")).toBeInTheDocument();
    expect(screen.getByText("Pérez Tomás")).toBeInTheDocument();
    expect(screen.getByText("Pagado por tutor")).toBeInTheDocument();

    const link = screen.getByRole("link", { name: /descargar pdf/i });
    expect(link).toHaveAttribute("href", "/api/payments/abc/receipt.pdf?locale=es");
  });

  it("hides period and section blocks when not provided", () => {
    render(
      <PaymentReceiptHtml
        receipt={fixtureModel({
          payment: {
            ...fixtureModel().payment,
            periodLabel: null,
            sectionLabel: null,
          },
        })}
        downloadHref="/x"
        downloadLabel="Descargar"
      />,
    );
    expect(screen.queryByText("Período")).toBeNull();
    expect(screen.queryByText("Sección")).toBeNull();
  });
});

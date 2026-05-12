import { describe, expect, it } from "vitest";
import {
  buildPaymentReceiptModel,
  type BuildPaymentReceiptModelInput,
} from "@/lib/billing/buildPaymentReceiptModel";

const NOW = new Date("2026-05-11T12:00:00Z");

function fixtureInput(overrides: Partial<BuildPaymentReceiptModelInput> = {}): BuildPaymentReceiptModelInput {
  return {
    locale: "es",
    now: NOW,
    brand: {
      name: "Mozarthitos",
      legalName: "Primera Academia en Chile",
      legalRegistry: "Reg. 1234",
      logoUrl: "https://example.com/logo.png",
      contactAddress: "Av. Demo 123",
      contactEmail: "info@example.com",
      contactPhone: "+56 9 1234 5678",
      primaryColor: "#A31A22",
    },
    payment: {
      id: "00000000-0000-0000-0000-000000000001",
      paymentKind: "monthly",
      amount: 12500,
      currency: "CLP",
      paidAt: "2026-05-10T20:30:00Z",
      month: 5,
      year: 2026,
      sectionLabel: "Inglés A1",
      methodLabel: "Pago online (Flow)",
      receiptNumber: "MES-2026-05-00000001",
    },
    payer: {
      fullName: "Pérez Ana",
      email: "ana@example.com",
      paidByTutor: true,
    },
    student: {
      fullName: "Pérez Tomás",
    },
    copy: {
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
      description: {
        monthlyFee: "Cuota mensual",
        enrollmentFee: "Matrícula",
      },
    },
    ...overrides,
  };
}

describe("buildPaymentReceiptModel", () => {
  it("renders monthly receipt with localized period and currency", () => {
    const m = buildPaymentReceiptModel(fixtureInput());
    expect(m.documentTitle).toBe("Comprobante de pago");
    expect(m.tenant.legalName).toBe("Primera Academia en Chile");
    expect(m.tenant.primaryColor).toBe("#A31A22");
    expect(m.payment.description).toBe("Cuota mensual");
    expect(m.payment.periodLabel).toBeDefined();
    expect(m.payment.periodLabel?.toLowerCase()).toContain("mayo");
    expect(m.payment.amountFormatted).toMatch(/12[.,]500/);
    expect(m.payment.amountFormatted.toUpperCase()).toMatch(/CLP|\$/);
    expect(m.receipt.number).toBe("MES-2026-05-00000001");
  });

  it("uses enrollment description when payment_kind is enrollment and hides period", () => {
    const m = buildPaymentReceiptModel(
      fixtureInput({
        payment: {
          ...fixtureInput().payment,
          paymentKind: "enrollment",
          month: null,
          year: null,
        },
      }),
    );
    expect(m.payment.description).toBe("Matrícula");
    expect(m.payment.periodLabel).toBeNull();
  });

  it("falls back to `now` when paidAt is unparseable", () => {
    const m = buildPaymentReceiptModel(
      fixtureInput({
        payment: {
          ...fixtureInput().payment,
          paidAt: "not-a-date",
        },
      }),
    );
    expect(m.receipt.paidAtIso).toBe(NOW.toISOString());
  });

  it("formats USD amount with the active locale", () => {
    const m = buildPaymentReceiptModel(
      fixtureInput({
        locale: "en",
        payment: {
          ...fixtureInput().payment,
          currency: "USD",
          amount: 25,
        },
      }),
    );
    expect(m.payment.amountFormatted).toMatch(/\$25\.00/);
  });

  it("preserves payerFullName as-is even with extra whitespace", () => {
    const m = buildPaymentReceiptModel(
      fixtureInput({
        payer: { ...fixtureInput().payer, fullName: "  " },
      }),
    );
    expect(m.payer.fullName).toBe("—");
  });
});

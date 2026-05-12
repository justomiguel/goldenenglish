/**
 * Pure shaping for "comprobante de pago" (informal payment proof, not an SII boleta / AFIP invoice).
 *
 * Inputs come from the loader (auth + DB) and the brand layer (`getBrandPublic()` already merges
 * `system.properties` with site_themes overrides per tenant). Output is consumed by both the HTML
 * surface on the flow-return page and the `@react-pdf/renderer` document.
 *
 * No React / Supabase imports here — keeps the receipt rules trivially unit-testable.
 */
import { formatProfileNameSurnameFirst } from "@/lib/profile/formatProfileDisplayName";

export type PaymentReceiptKind = "monthly" | "enrollment";

export interface PaymentReceiptInputBrand {
  name: string;
  legalName: string;
  legalRegistry: string;
  logoUrl: string;
  contactAddress: string;
  contactEmail: string;
  contactPhone: string;
  /** Primary brand color (hex) used as the emphasis tone in the PDF (HTML reads CSS vars). */
  primaryColor: string;
}

export interface PaymentReceiptInputPayment {
  id: string;
  paymentKind: PaymentReceiptKind;
  amount: number;
  currency: string;
  /** ISO date string when the payment was finalized — Flow `paymentData.date`, manual approval, etc. */
  paidAt: string;
  /** Coverage period for monthly fees (1-12, year). Ignored for enrollment. */
  month: number | null;
  year: number | null;
  sectionLabel: string | null;
  methodLabel: string;
  /**
   * Human-readable receipt number:
   *   - Flow: the `MES-YYYY-MM-SEQ` reference reserved at checkout.
   *   - Manual upload / admin-approved: short prefix of `payments.id`.
   */
  receiptNumber: string;
}

export interface PaymentReceiptInputPayer {
  fullName: string;
  email: string | null;
  /** True when the receipt was paid by a parent/tutor on behalf of a student. */
  paidByTutor: boolean;
}

export interface PaymentReceiptInputStudent {
  fullName: string;
}

export interface PaymentReceiptInputCopy {
  /** "Receipt", "Comprobante de pago" — page heading. */
  documentTitle: string;
  /** "Internal proof — not a tax invoice." legal disclaimer. */
  legalNotice: string;
  labels: {
    receiptNumber: string;
    issuedAt: string;
    paidAt: string;
    method: string;
    description: string;
    amount: string;
    period: string;
    student: string;
    payer: string;
    paidByTutor: string;
    section: string;
    contact: string;
  };
  description: {
    monthlyFee: string;
    enrollmentFee: string;
  };
}

export interface BuildPaymentReceiptModelInput {
  locale: string;
  /** Wall clock when the receipt was rendered (used as "issuedAt"). */
  now: Date;
  brand: PaymentReceiptInputBrand;
  payment: PaymentReceiptInputPayment;
  payer: PaymentReceiptInputPayer;
  student: PaymentReceiptInputStudent;
  copy: PaymentReceiptInputCopy;
}

export interface PaymentReceiptModel {
  documentTitle: string;
  legalNotice: string;
  labels: PaymentReceiptInputCopy["labels"];
  tenant: {
    name: string;
    legalName: string;
    legalRegistry: string;
    logoUrl: string;
    address: string;
    email: string;
    phone: string;
    primaryColor: string;
  };
  receipt: {
    number: string;
    issuedAtIso: string;
    issuedAtFormatted: string;
    paidAtIso: string;
    paidAtFormatted: string;
    methodLabel: string;
  };
  payment: {
    description: string;
    periodLabel: string | null;
    sectionLabel: string | null;
    amountFormatted: string;
    currency: string;
  };
  payer: {
    fullName: string;
    email: string | null;
    paidByTutor: boolean;
  };
  student: {
    fullName: string;
  };
}

export function buildPaymentReceiptModel(input: BuildPaymentReceiptModelInput): PaymentReceiptModel {
  const { locale, now, brand, payment, payer, student, copy } = input;

  const description = payment.paymentKind === "enrollment" ? copy.description.enrollmentFee : copy.description.monthlyFee;

  const periodLabel =
    payment.month != null && payment.year != null
      ? formatPeriodLabel(locale, payment.month, payment.year)
      : null;

  const issuedAt = now;
  const paidAt = parseIsoOrFallback(payment.paidAt, now);

  const dateFmt = new Intl.DateTimeFormat(locale, { dateStyle: "long" });
  const amountFmt = new Intl.NumberFormat(locale, {
    style: "currency",
    currency: payment.currency,
    maximumFractionDigits: 2,
  });

  return {
    documentTitle: copy.documentTitle,
    legalNotice: copy.legalNotice,
    labels: copy.labels,
    tenant: {
      name: brand.name,
      legalName: brand.legalName,
      legalRegistry: brand.legalRegistry,
      logoUrl: brand.logoUrl,
      address: brand.contactAddress,
      email: brand.contactEmail,
      phone: brand.contactPhone,
      primaryColor: brand.primaryColor,
    },
    receipt: {
      number: payment.receiptNumber,
      issuedAtIso: issuedAt.toISOString(),
      issuedAtFormatted: dateFmt.format(issuedAt),
      paidAtIso: paidAt.toISOString(),
      paidAtFormatted: dateFmt.format(paidAt),
      methodLabel: payment.methodLabel,
    },
    payment: {
      description,
      periodLabel,
      sectionLabel: payment.sectionLabel,
      amountFormatted: amountFmt.format(payment.amount),
      currency: payment.currency,
    },
    payer: {
      fullName: payer.fullName.trim() || "—",
      email: payer.email,
      paidByTutor: payer.paidByTutor,
    },
    student: {
      fullName: student.fullName.trim() || "—",
    },
  };
}

function formatPeriodLabel(locale: string, month: number, year: number): string {
  const ref = new Date(Date.UTC(year, month - 1, 1));
  const monthFmt = new Intl.DateTimeFormat(locale, { month: "long", year: "numeric", timeZone: "UTC" });
  return monthFmt.format(ref);
}

function parseIsoOrFallback(iso: string, fallback: Date): Date {
  const t = Date.parse(iso);
  return Number.isFinite(t) ? new Date(t) : fallback;
}

/** Re-export so layouts don't need a separate import for the friendly payer-name helper. */
export { formatProfileNameSurnameFirst };

import type { Dictionary } from "@/types/i18n";
import type { PaymentReceiptInputCopy } from "@/lib/billing/buildPaymentReceiptModel";

type ReceiptDict = Dictionary["dashboard"]["student"]["monthly"]["receipt"];

export interface PaymentReceiptCopy {
  copy: PaymentReceiptInputCopy;
  flowMethodLabel: string;
  mercadoPagoMethodLabel: string;
  uploadMethodLabel: string;
  downloadLabel: string;
  loadErrorMessage: string;
}

export function buildPaymentReceiptCopy(monthlyDict: { receipt: ReceiptDict }): PaymentReceiptCopy {
  const r = monthlyDict.receipt;
  return {
    copy: {
      documentTitle: r.documentTitle,
      legalNotice: r.legalNotice,
      labels: { ...r.labels },
      description: {
        monthlyFee: r.descriptionMonthly,
        enrollmentFee: r.descriptionEnrollment,
      },
    },
    flowMethodLabel: r.methodFlow,
    mercadoPagoMethodLabel: r.methodMercadoPago,
    uploadMethodLabel: r.methodUpload,
    downloadLabel: r.downloadPdf,
    loadErrorMessage: r.loadError,
  };
}

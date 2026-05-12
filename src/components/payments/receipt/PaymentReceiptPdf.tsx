import { Document, Image, Page, StyleSheet, Text, View } from "@react-pdf/renderer";
import type { PaymentReceiptModel } from "@/lib/billing/buildPaymentReceiptModel";

/**
 * PDF rendering of `PaymentReceiptModel`. Built with `@react-pdf/renderer` (server-side, no
 * headless browser); fonts default to Helvetica which `@react-pdf/renderer` ships natively.
 *
 * Tenant tokens reach the PDF via `tenant.primaryColor` (used as the emphasis hue). All other
 * surfaces use neutral grayscale to keep PDFs legible regardless of brand palette.
 */

const NEUTRAL = {
  border: "#E5E7EB",
  text: "#111827",
  muted: "#6B7280",
  surfaceMuted: "#F3F4F6",
};

const styles = StyleSheet.create({
  page: {
    padding: 32,
    fontSize: 10,
    color: NEUTRAL.text,
    fontFamily: "Helvetica",
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingBottom: 12,
    borderBottomColor: NEUTRAL.border,
    borderBottomWidth: 1,
  },
  brandBlock: { flexDirection: "row", flex: 1, paddingRight: 12 },
  logo: { width: 48, height: 48, marginRight: 10, objectFit: "contain" },
  brandText: { flexDirection: "column", flex: 1 },
  tenantName: { fontSize: 9, color: NEUTRAL.muted, textTransform: "uppercase", letterSpacing: 0.5 },
  legalName: { fontSize: 14, fontWeight: 700, marginTop: 2 },
  legalRegistry: { fontSize: 9, color: NEUTRAL.muted, marginTop: 2 },

  receiptHeader: { alignItems: "flex-end" },
  documentTitle: { fontSize: 13, fontWeight: 700 },
  receiptMeta: { fontSize: 9, color: NEUTRAL.muted, marginTop: 4 },

  fieldsGrid: { flexDirection: "row", flexWrap: "wrap", marginTop: 16 },
  field: { width: "50%", paddingRight: 12, paddingTop: 8 },
  fieldLabel: { fontSize: 8, color: NEUTRAL.muted, textTransform: "uppercase", letterSpacing: 0.4 },
  fieldValue: { fontSize: 11, marginTop: 2, fontWeight: 500 },
  fieldHint: { fontSize: 8, color: NEUTRAL.muted, marginTop: 1 },

  totalBox: {
    marginTop: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: NEUTRAL.surfaceMuted,
    borderColor: NEUTRAL.border,
    borderWidth: 1,
    borderRadius: 4,
    padding: 12,
  },
  totalLabel: { fontSize: 10, color: NEUTRAL.muted },
  totalValue: { fontSize: 18, fontWeight: 700 },

  footerRow: {
    marginTop: 16,
    paddingTop: 8,
    borderTopColor: NEUTRAL.border,
    borderTopWidth: 1,
  },
  footerLine: { fontSize: 9, color: NEUTRAL.muted },
  legalNotice: { fontSize: 8, color: NEUTRAL.muted, marginTop: 8, fontStyle: "italic" },
});

export interface PaymentReceiptPdfProps {
  receipt: PaymentReceiptModel;
}

export function PaymentReceiptPdf({ receipt }: PaymentReceiptPdfProps) {
  const { tenant, labels, payment, payer, student, receipt: r } = receipt;
  return (
    <Document title={`${receipt.documentTitle} ${r.number}`}>
      <Page size="A4" style={styles.page}>
        <View style={styles.headerRow}>
          <View style={styles.brandBlock}>
            {tenant.logoUrl ? (
              // react-pdf Image is not a DOM <img>; no alt prop in ImageProps.
              /* eslint-disable-next-line jsx-a11y/alt-text */
              <Image src={tenant.logoUrl} style={styles.logo} />
            ) : null}
            <View style={styles.brandText}>
              <Text style={styles.tenantName}>{tenant.name}</Text>
              <Text style={styles.legalName}>{tenant.legalName}</Text>
              {tenant.legalRegistry ? <Text style={styles.legalRegistry}>{tenant.legalRegistry}</Text> : null}
            </View>
          </View>
          <View style={styles.receiptHeader}>
            <Text style={[styles.documentTitle, { color: tenant.primaryColor }]}>{receipt.documentTitle}</Text>
            <Text style={styles.receiptMeta}>
              {labels.receiptNumber}: {r.number}
            </Text>
            <Text style={styles.receiptMeta}>
              {labels.issuedAt}: {r.issuedAtFormatted}
            </Text>
          </View>
        </View>

        <View style={styles.fieldsGrid}>
          <PdfField label={labels.student} value={student.fullName} />
          <PdfField
            label={payer.paidByTutor ? labels.paidByTutor : labels.payer}
            value={payer.fullName}
            hint={payer.email ?? undefined}
          />
          <PdfField label={labels.description} value={payment.description} />
          {payment.periodLabel ? <PdfField label={labels.period} value={payment.periodLabel} /> : null}
          {payment.sectionLabel ? <PdfField label={labels.section} value={payment.sectionLabel} /> : null}
          <PdfField label={labels.method} value={r.methodLabel} />
          <PdfField label={labels.paidAt} value={r.paidAtFormatted} />
        </View>

        <View style={styles.totalBox}>
          <Text style={styles.totalLabel}>{labels.amount}</Text>
          <Text style={[styles.totalValue, { color: tenant.primaryColor }]}>{payment.amountFormatted}</Text>
        </View>

        <View style={styles.footerRow}>
          <Text style={styles.footerLine}>
            {tenant.address ? `${tenant.address} · ` : ""}
            {tenant.email}
            {tenant.phone ? ` · ${tenant.phone}` : ""}
          </Text>
          <Text style={styles.legalNotice}>{receipt.legalNotice}</Text>
        </View>
      </Page>
    </Document>
  );
}

function PdfField({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <Text style={styles.fieldValue}>{value}</Text>
      {hint ? <Text style={styles.fieldHint}>{hint}</Text> : null}
    </View>
  );
}

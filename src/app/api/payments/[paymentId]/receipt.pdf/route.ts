import "server-only";
import { NextResponse } from "next/server";
import { Document, renderToBuffer } from "@react-pdf/renderer";
import { createElement, type ComponentProps, type ReactElement } from "react";
import { createClient } from "@/lib/supabase/server";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { buildPaymentReceiptCopy } from "@/lib/billing/buildPaymentReceiptCopy";
import { buildPaymentReceiptModel } from "@/lib/billing/buildPaymentReceiptModel";
import { loadPaymentForReceipt } from "@/lib/billing/loadPaymentForReceipt";
import { loadReceiptBrandForRequest } from "@/lib/billing/loadReceiptBrandForRequest";
import { logServerWarn } from "@/lib/logging/serverActionLog";
import { PaymentReceiptPdf } from "@/components/payments/receipt/PaymentReceiptPdf";
import type { Locale } from "@/types/i18n";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

interface RouteContext {
  params: Promise<{ paymentId: string }>;
}

/**
 * `GET /api/payments/<paymentId>/receipt.pdf?locale=es`
 *
 * Streams the payment receipt as `application/pdf`. Authorization runs entirely through the
 * **session** Supabase client (RLS gates which user can SELECT this row); the admin client is
 * only used afterwards to denormalize section / parent / Flow ref. Cache-Control is `private`
 * because the body is personalized (regla `17-trust-boundary-handlers`).
 */
export async function GET(req: Request, { params }: RouteContext): Promise<Response> {
  const { paymentId } = await params;
  if (!UUID_RE.test(paymentId)) {
    return new Response("invalid payment id", { status: 404 });
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return new Response("unauthorized", { status: 401 });
  }

  const url = new URL(req.url);
  const localeParam = url.searchParams.get("locale");
  const locale: Locale = localeParam === "en" ? "en" : "es";

  const dict = await getDictionary(locale);
  const monthly = dict.dashboard.student.monthly;
  const copy = buildPaymentReceiptCopy(monthly);

  const loaded = await loadPaymentForReceipt({
    supabase,
    paymentId,
    flowMethodLabel: copy.flowMethodLabel,
    mercadoPagoMethodLabel: copy.mercadoPagoMethodLabel,
    uploadMethodLabel: copy.uploadMethodLabel,
  });

  if (!loaded.ok) {
    logServerWarn("paymentReceiptPdf:reject", {
      reason: loaded.reason,
      payment_id_prefix: paymentId.slice(0, 8),
    });
    const status = loaded.reason === "not_paid" ? 409 : 404;
    return new Response(loaded.reason, { status });
  }

  const brand = await loadReceiptBrandForRequest();

  const model = buildPaymentReceiptModel({
    locale,
    now: new Date(),
    brand,
    payment: loaded.payment,
    payer: loaded.payer,
    student: loaded.student,
    copy: copy.copy,
  });

  let pdfBuffer: Buffer;
  try {
    const doc = createElement(PaymentReceiptPdf, { receipt: model }) as ReactElement<
      ComponentProps<typeof Document>
    >;
    pdfBuffer = await renderToBuffer(doc);
  } catch (err) {
    logServerWarn("paymentReceiptPdf:render_failed", {
      payment_id_prefix: paymentId.slice(0, 8),
      message: err instanceof Error ? err.message.slice(0, 200) : "unknown",
    });
    return new Response("render_failed", { status: 500 });
  }

  const fileName = `receipt-${model.receipt.number}.pdf`;
  return new NextResponse(new Uint8Array(pdfBuffer), {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${fileName}"`,
      "Cache-Control": "private, no-store, max-age=0",
      "X-Content-Type-Options": "nosniff",
    },
  });
}

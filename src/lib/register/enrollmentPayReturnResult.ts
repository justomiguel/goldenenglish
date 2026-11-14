export type EnrollmentPayReturnResult = "paid" | "rejected" | "pending" | "error" | (string & {});

const REJECTED = new Set(["flow_not_paid", "mp_not_approved", "amount_mismatch"]);

export function enrollmentPayReturnResult(input: {
  called: boolean;
  ok?: boolean;
  skipped?: string;
  returnStatus?: string;
}): EnrollmentPayReturnResult {
  const status = (input.returnStatus ?? "").trim().toLowerCase();
  if (input.called && input.ok && (!input.skipped || input.skipped === "already_enrolled")) {
    return "paid";
  }
  if (status === "pending" || status === "in_process") return "pending";
  if (!input.called) {
    if (status === "rejected" || status === "failure" || status === "null") return "rejected";
    return "error";
  }
  if (!input.ok) return "error";
  if (REJECTED.has(input.skipped ?? "")) return "rejected";
  return input.skipped || "error";
}

export function enrollmentPayReturnPath(input: {
  locale: string;
  slug: string;
  payToken: string;
  result: string;
}): string {
  const locale = input.locale === "en" || input.locale === "pt" ? input.locale : "es";
  const slug = encodeURIComponent(input.slug.trim() || "pago");
  const token = encodeURIComponent(input.payToken.trim());
  const params = new URLSearchParams({ result: input.result });
  return `/${locale}/matricula/${slug}/${token}?${params.toString()}`;
}

import { REGISTRATION_FUNNEL_STAGES, type RegistrationFunnelStage } from "@/lib/register/registrationFunnelStage";

export const REGISTRATION_INBOX_FILTERS = REGISTRATION_FUNNEL_STAGES;

export type RegistrationInboxFilter = RegistrationFunnelStage;

type FunnelQuery = {
  eq: (column: string, value: string | boolean) => FunnelQuery;
  neq: (column: string, value: string) => FunnelQuery;
  or: (filters: string) => FunnelQuery;
};

export function parseRegistrationInboxFilter(
  raw: string | undefined,
  legacyStatus?: string,
): RegistrationInboxFilter {
  if (legacyStatus === "contacted" && (!raw || raw === "contacted")) return "contacted";
  if (REGISTRATION_INBOX_FILTERS.includes(raw as RegistrationInboxFilter)) {
    return raw as RegistrationInboxFilter;
  }
  return "registered";
}

function feeMatch(chargingSectionIds: readonly string[]): string {
  const parts = ["fee_snapshot->>total.gt.0"];
  if (chargingSectionIds.length > 0) {
    const list = chargingSectionIds.join(",");
    parts.push(`preferred_section_id.in.(${list})`);
    parts.push(`additional_section_ids.ov.{${list}}`);
  }
  return parts.join(",");
}

function unpaid(query: FunnelQuery): FunnelQuery {
  return query.or("fee_captured.is.null,fee_captured.eq.false");
}

export function applyRegistrationFunnelFilter<T>(
  query: T,
  stage: RegistrationInboxFilter,
  chargingSectionIds: readonly string[],
): T {
  const builder = query as unknown as FunnelQuery;
  const fees = feeMatch(chargingSectionIds);
  let next = builder;
  if (stage === "registered") {
    next = unpaid(
      builder
        .eq("status", "new")
        .or("enrollment_fee_mail_sent_at.is.null")
        .neq("intake_state", "receipt_pending"),
    );
  } else if (stage === "contacted") {
    next = unpaid(
      builder
        .eq("status", "contacted")
        .or(fees)
        .or("enrollment_fee_mail_sent_at.is.null")
        .neq("intake_state", "receipt_pending"),
    );
  } else if (stage === "awaiting_payment") {
    next = unpaid(
      builder.or(fees).or("enrollment_fee_mail_sent_at.not.is.null,intake_state.eq.receipt_pending"),
    );
  } else if (stage === "paid_without_section") {
    next = builder.eq("fee_captured", true);
  } else if (stage === "enrolled_in_section") {
    next = builder.eq("status", "enrolled");
  } else {
    const noSnapshot = "fee_snapshot->>total.is.null,fee_snapshot->>total.eq.0";
    next = builder.eq("status", "contacted").or(noSnapshot);
    if (chargingSectionIds.length > 0) {
      const list = chargingSectionIds.join(",");
      next = next.or(`preferred_section_id.is.null,preferred_section_id.not.in.(${list})`);
    }
  }
  return next as unknown as T;
}

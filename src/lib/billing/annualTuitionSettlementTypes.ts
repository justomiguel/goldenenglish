export type AnnualTuitionSettlementErrorCode =
  | "enrollment_not_found"
  | "overlap"
  | "allocation_failed"
  | "payment_preflight_failed"
  | "settlement_insert_failed"
  | "fee_update_failed";

export type AnnualTuitionSettlementApplyResult =
  | {
      ok: true;
      settlementId: string;
      baselineListTotal: number;
      impliedDiscountAmount: number;
    }
  | { ok: false; code: AnnualTuitionSettlementErrorCode; message?: string };

export type AnnualTuitionSettlementPreviewResult =
  | {
      ok: true;
      billableMonthCount: number;
      baselineListTotal: number;
      impliedDiscountAmount: number;
      currency: string;
      monthsPreview: Array<{ month: number; listAmount: number; allocatedAmount: number }>;
      enrollmentFeeList: number;
      includesEnrollmentFee: boolean;
    }
  | { ok: false; code: AnnualTuitionSettlementErrorCode; message?: string };

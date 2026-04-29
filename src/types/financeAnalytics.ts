export interface FinanceMonthlyTrendPoint {
  month: number;
  expected: number;
  collected: number;
  pending: number;
  overdue: number;
  upcoming: number;
  ratio: number;
}

export interface FinanceReceiptProcessingStats {
  avgDaysMonthly: number | null;
  avgDaysInvoice: number | null;
  approvalRate: number;
  rejectionRate: number;
  totalResolved: number;
  totalPending: number;
  rejectionBreakdown: Record<string, number>;
  pendingAgeBuckets: { label: string; count: number }[];
}

export interface FinanceProjection {
  projectedYearEnd: number;
  expectedYearEnd: number;
  gap: number;
  gapPercent: number;
  monthsRemaining: number;
  avgMonthlyCollection: number;
}

export interface FinanceSectionRanked {
  sectionId: string;
  sectionName: string;
  health: "healthy" | "watch" | "critical";
  collectionRatio: number;
  deltaFromAvg: number;
  overdueStudents: number;
  overdueAmount: number;
  totalStudents: number;
}

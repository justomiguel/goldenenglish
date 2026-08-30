export type DirectoryBillingMark = "yes" | "no" | "na";

export function directoryMonthlyStatus(input: {
  monthlyApplies: boolean;
  overdue: boolean;
}): DirectoryBillingMark {
  if (!input.monthlyApplies) return "na";
  return input.overdue ? "no" : "yes";
}

export function enrollmentFeeChargeState(input: {
  amount: number;
  exempt: boolean;
  lastEnrollmentPaidAt: string | null;
  receiptStatus: string | null;
}): { charged: boolean; paid: boolean } {
  const charged = Number.isFinite(input.amount) && input.amount > 0 && !input.exempt;
  if (!charged) return { charged: false, paid: false };
  const markedPaid = Boolean(input.lastEnrollmentPaidAt && input.lastEnrollmentPaidAt.trim());
  const paid = markedPaid || input.receiptStatus === "approved";
  return { charged: true, paid };
}

export function directoryEnrollmentFeeStatus(
  charges: Array<{ charged: boolean; paid: boolean }>,
): DirectoryBillingMark {
  const charged = charges.filter((c) => c.charged);
  if (charged.length === 0) return "na";
  return charged.some((c) => !c.paid) ? "no" : "yes";
}

export function rollupDirectoryBillingMarks(
  marks: DirectoryBillingMark[],
): DirectoryBillingMark {
  if (marks.some((m) => m === "no")) return "no";
  if (marks.some((m) => m === "yes")) return "yes";
  return "na";
}

export function latestEnrollmentAt(
  timestamps: Array<string | null | undefined>,
): string | null {
  let latest: string | null = null;
  let latestMs = Number.NEGATIVE_INFINITY;
  for (const raw of timestamps) {
    const iso = raw?.trim();
    if (!iso) continue;
    const ms = new Date(iso).getTime();
    if (!Number.isFinite(ms)) continue;
    if (ms > latestMs) {
      latestMs = ms;
      latest = iso;
    }
  }
  return latest;
}

export function directoryBillingMarkSortRank(mark: DirectoryBillingMark): number {
  if (mark === "no") return 0;
  if (mark === "na") return 1;
  return 2;
}

export type DirectoryStudentBillingFlags = {
  monthlyStatus: DirectoryBillingMark;
  enrollmentFeeStatus: DirectoryBillingMark;
  lastEnrollmentAt: string | null;
};

const MONTHLY_APPLICABLE_CELL_STATUSES = new Set([
  "due",
  "approved",
  "pending",
  "rejected",
  "exempt",
]);

export function monthlyAppliesFromPaymentCells(
  cells: Array<{ status: string }>,
): boolean {
  return cells.some((cell) => MONTHLY_APPLICABLE_CELL_STATUSES.has(cell.status));
}

export function directoryFlagsFromEnrollmentFacts(input: {
  studentIds: string[];
  enrollments: Array<{
    studentId: string;
    createdAt: string | null;
    amount: number;
    exempt: boolean;
    lastEnrollmentPaidAt: string | null;
    receiptStatus: string | null;
  }>;
  monthlyByStudent?: Map<string, { applies: boolean; overdue: boolean }>;
}): Map<string, DirectoryStudentBillingFlags> {
  const enrollmentsByStudent = new Map<string, typeof input.enrollments>();
  for (const enrollment of input.enrollments) {
    const list = enrollmentsByStudent.get(enrollment.studentId) ?? [];
    list.push(enrollment);
    enrollmentsByStudent.set(enrollment.studentId, list);
  }
  const out = new Map<string, DirectoryStudentBillingFlags>();
  for (const studentId of input.studentIds) {
    const list = enrollmentsByStudent.get(studentId) ?? [];
    const monthly = input.monthlyByStudent?.get(studentId);
    out.set(studentId, {
      monthlyStatus: directoryMonthlyStatus({
        monthlyApplies: monthly?.applies ?? false,
        overdue: monthly?.overdue ?? false,
      }),
      enrollmentFeeStatus: directoryEnrollmentFeeStatus(
        list.map((enrollment) => enrollmentFeeChargeState(enrollment)),
      ),
      lastEnrollmentAt: latestEnrollmentAt(list.map((enrollment) => enrollment.createdAt)),
    });
  }
  return out;
}

export function directoryBillingRowFields(
  flags: DirectoryStudentBillingFlags | undefined,
): DirectoryStudentBillingFlags {
  return {
    monthlyStatus: flags?.monthlyStatus ?? "na",
    enrollmentFeeStatus: flags?.enrollmentFeeStatus ?? "na",
    lastEnrollmentAt: flags?.lastEnrollmentAt ?? null,
  };
}

export function rollupParentBillingFlags(
  childFlags: DirectoryStudentBillingFlags[],
): DirectoryStudentBillingFlags {
  return {
    monthlyStatus: rollupDirectoryBillingMarks(childFlags.map((f) => f.monthlyStatus)),
    enrollmentFeeStatus: rollupDirectoryBillingMarks(
      childFlags.map((f) => f.enrollmentFeeStatus),
    ),
    lastEnrollmentAt: latestEnrollmentAt(childFlags.map((f) => f.lastEnrollmentAt)),
  };
}

export function formatDirectoryLastEnrollment(
  iso: string | null | undefined,
  locale: string,
  emptyValue: string,
): string {
  if (!iso) return emptyValue;
  const ms = new Date(iso).getTime();
  if (!Number.isFinite(ms)) return emptyValue;
  return new Date(iso).toLocaleDateString(locale);
}

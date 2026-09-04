import type { RegistrationFeeLine } from "@/lib/register/registrationFeeSnapshot";

export type JoinPackageTuitionLine = {
  sectionId: string;
  sectionName: string;
  year: number;
  month: number;
  amount: number;
};

export type ParsedJoinPackageSnapshot = {
  kind: "join_package" | "legacy";
  mode: "once_for_all" | "per_section";
  currency: string;
  total: number;
  enrollment: { lines: RegistrationFeeLine[] };
  tuition: JoinPackageTuitionLine[];
  trialCreditApplied: number;
  joinMonths: Record<string, { year: number; month: number }>;
};

function asLine(raw: unknown): RegistrationFeeLine | null {
  if (!raw || typeof raw !== "object") return null;
  const row = raw as Record<string, unknown>;
  const sectionId = String(row.sectionId ?? "").trim();
  if (!sectionId) return null;
  const amount = Number(row.amount);
  return {
    sectionId,
    sectionName: String(row.sectionName ?? ""),
    amount: Number.isFinite(amount) ? amount : 0,
  };
}

function asTuition(raw: unknown): JoinPackageTuitionLine | null {
  if (!raw || typeof raw !== "object") return null;
  const row = raw as Record<string, unknown>;
  const sectionId = String(row.sectionId ?? "").trim();
  const year = Number(row.year);
  const month = Number(row.month);
  if (!sectionId || !Number.isInteger(year) || month < 1 || month > 12) return null;
  const amount = Number(row.amount);
  return {
    sectionId,
    sectionName: String(row.sectionName ?? ""),
    year,
    month,
    amount: Number.isFinite(amount) ? amount : 0,
  };
}

export function parseJoinPackageSnapshot(raw: unknown): ParsedJoinPackageSnapshot {
  const row = raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};
  const lines = Array.isArray(row.lines) ? row.lines.map(asLine).filter(Boolean) : [];
  const enrollmentRaw =
    row.enrollment && typeof row.enrollment === "object"
      ? (row.enrollment as { lines?: unknown }).lines
      : null;
  const enrollmentLines = Array.isArray(enrollmentRaw)
    ? enrollmentRaw.map(asLine).filter(Boolean)
    : lines;
  const tuition = Array.isArray(row.tuition)
    ? row.tuition.map(asTuition).filter(Boolean)
    : [];
  const joinMonths: Record<string, { year: number; month: number }> = {};
  for (const line of tuition as JoinPackageTuitionLine[]) {
    joinMonths[line.sectionId] = { year: line.year, month: line.month };
  }
  const total = Number(row.total);
  return {
    kind: row.kind === "join_package" ? "join_package" : "legacy",
    mode: row.mode === "once_for_all" ? "once_for_all" : "per_section",
    currency: String(row.currency ?? "USD"),
    total: Number.isFinite(total) ? total : 0,
    enrollment: { lines: enrollmentLines as RegistrationFeeLine[] },
    tuition: tuition as JoinPackageTuitionLine[],
    trialCreditApplied: Math.max(0, Number(row.trialCreditApplied) || 0),
    joinMonths,
  };
}

import type { Dictionary } from "@/types/i18n";

const REASON_ORDER = ["absences", "low_average"] as const;

type RetentionDict = Pick<
  Dictionary["dashboard"]["adminRetention"],
  "reasonAbsences" | "reasonLowAverage"
>;

export interface AdminRetentionReasonsListProps {
  reasons: readonly ("absences" | "low_average")[];
  dict: RetentionDict;
}

export function AdminRetentionReasonsList({ reasons, dict }: AdminRetentionReasonsListProps) {
  return (
    <ul className="list-inside list-disc text-xs">
      {REASON_ORDER.filter((code) => reasons.includes(code)).map((code) => (
        <li key={code}>{code === "absences" ? dict.reasonAbsences : dict.reasonLowAverage}</li>
      ))}
    </ul>
  );
}

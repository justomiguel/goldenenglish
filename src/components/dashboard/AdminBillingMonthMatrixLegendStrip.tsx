import { Check, CircleDot, Clock, FileText, X } from "lucide-react";
import type { ReactNode } from "react";
import { sectionCollectionsMonthCellClasses } from "@/lib/billing/sectionCollectionsMonthCellClasses";
import { SECTION_COLLECTIONS_MONTH_STATUS_ICONS } from "@/lib/billing/sectionCollectionsMonthStatusIcons";

const IconNoPlan = SECTION_COLLECTIONS_MONTH_STATUS_ICONS["no-plan"];
const IconOutOfPeriod = SECTION_COLLECTIONS_MONTH_STATUS_ICONS["out-of-period"];

export interface AdminBillingMonthMatrixLegendStripProps {
  /** Points to the matrix legend paragraph (`aria-labelledby`). */
  labelledById: string;
  labels: {
    statusPaid: string;
    statusPending: string;
    statusRejected: string;
    statusExempt: string;
    statusUnpaid: string;
    statusOverdue: string;
    statusNoPlan: string;
    statusOutOfPeriod: string;
    scholarshipSample: string;
  };
}

/**
 * Same Tailwind chip styles as Finance collections (`sectionCollectionsMonthCellClasses`).
 */
export function AdminBillingMonthMatrixLegendStrip({
  labelledById,
  labels,
}: AdminBillingMonthMatrixLegendStripProps) {
  const items: {
    key: string;
    classes: string;
    label: string;
    inner: ReactNode;
  }[] = [
    {
      key: "paid",
      classes: sectionCollectionsMonthCellClasses("approved", false, false),
      label: labels.statusPaid,
      inner: <Check className="h-3.5 w-3.5" aria-hidden />,
    },
    {
      key: "pending",
      classes: sectionCollectionsMonthCellClasses("pending", false, false),
      label: labels.statusPending,
      inner: <Clock className="h-3.5 w-3.5" aria-hidden />,
    },
    {
      key: "rejected",
      classes: sectionCollectionsMonthCellClasses("rejected", false, false),
      label: labels.statusRejected,
      inner: <X className="h-3.5 w-3.5" aria-hidden />,
    },
    {
      key: "exempt",
      classes: sectionCollectionsMonthCellClasses("exempt", false, false),
      label: labels.statusExempt,
      inner: <FileText className="h-3.5 w-3.5" aria-hidden />,
    },
    {
      key: "due",
      classes: sectionCollectionsMonthCellClasses("due", false, false),
      label: labels.statusUnpaid,
      inner: <CircleDot className="h-3.5 w-3.5" aria-hidden />,
    },
    {
      key: "overdue",
      classes: sectionCollectionsMonthCellClasses("due", true, false),
      label: labels.statusOverdue,
      inner: <CircleDot className="h-3.5 w-3.5" aria-hidden />,
    },
    {
      key: "no-plan",
      classes: sectionCollectionsMonthCellClasses("no-plan", false, false),
      label: labels.statusNoPlan,
      inner: <IconNoPlan className="h-3.5 w-3.5" aria-hidden />,
    },
    {
      key: "out-of-period",
      classes: sectionCollectionsMonthCellClasses("out-of-period", false, false),
      label: labels.statusOutOfPeriod,
      inner: <IconOutOfPeriod className="h-3.5 w-3.5" aria-hidden />,
    },
    {
      key: "sch",
      classes: sectionCollectionsMonthCellClasses("approved", false, true),
      label: labels.scholarshipSample,
      inner: (
        <>
          <span className="leading-none">50%</span>
          <Check className="mt-0.5 h-2.5 w-2.5" aria-hidden />
        </>
      ),
    },
  ];

  return (
    <ul
      className="flex flex-wrap gap-x-3 gap-y-2 border border-[var(--color-border)]/70 bg-[var(--color-muted)]/20 px-3 py-2 text-[10px] text-[var(--color-muted-foreground)]"
      aria-labelledby={labelledById}
    >
      {items.map(({ key, classes, label, inner }) => (
        <li key={key} className="inline-flex items-center gap-1.5">
          <span
            className={`box-border inline-flex h-8 min-w-[34px] shrink-0 flex-col items-center justify-center rounded border text-[10px] font-semibold leading-none ${classes}`}
            aria-hidden
          >
            {inner}
          </span>
          <span className="max-w-[10rem] leading-tight">{label}</span>
        </li>
      ))}
    </ul>
  );
}

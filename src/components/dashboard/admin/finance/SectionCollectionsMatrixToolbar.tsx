import type { Dictionary } from "@/types/i18n";
import { AdminBillingMatrixLegendModal } from "@/components/dashboard/AdminBillingMatrixLegendModal";
import { SectionCollectionsExportButtons } from "./SectionCollectionsExportButtons";
import { SectionCollectionsBulkScholarshipTrigger } from "./SectionCollectionsBulkScholarshipTrigger";
import { SectionCollectionsStudentActionBar } from "./SectionCollectionsStudentActionBar";
import { financeCollectionsMatrixLegendLabels } from "./collectionsMatrixLegendLabels";

type CollectionsDict = Dictionary["admin"]["finance"]["collections"];

export interface SectionCollectionsMatrixToolbarProps {
  dict: CollectionsDict;
  billingLabels: Dictionary["admin"]["billing"];
  locale: string;
  sectionId: string;
  year: number;
  studentCount: number;
  recipientIds: string[];
  overdueIds: string[];
  selectionCount: number;
  overdueNotice: string | null;
  cellActionNotice: string | null;
  overdueBusy: boolean;
  referenceMonthlyAmount: number | null;
  referenceMonthlyCurrency: string | null;
  onSelectOverdue: () => void;
  onClearSelection: () => void;
  onOpenMessageModal: () => void;
  onSendOverdueReminders: () => void;
  onBulkScholarshipNotice?: (msg: string | null) => void;
}

export function SectionCollectionsMatrixToolbar({
  dict,
  billingLabels,
  locale,
  sectionId,
  year,
  studentCount,
  recipientIds,
  overdueIds,
  selectionCount,
  overdueNotice,
  cellActionNotice,
  overdueBusy,
  referenceMonthlyAmount,
  referenceMonthlyCurrency,
  onSelectOverdue,
  onClearSelection,
  onOpenMessageModal,
  onSendOverdueReminders,
  onBulkScholarshipNotice,
}: SectionCollectionsMatrixToolbarProps) {
  const setScholarNotice = onBulkScholarshipNotice ?? (() => {});

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2">
      <div className="flex flex-col gap-2">
        {overdueNotice || cellActionNotice ? (
          <p className="text-sm text-[var(--color-muted-foreground)]" role="status">
            {overdueNotice ?? cellActionNotice}
          </p>
        ) : null}
        <div className="flex flex-wrap items-center gap-2">
          <SectionCollectionsBulkScholarshipTrigger
            locale={locale as import("@/types/i18n").Locale}
            sectionId={sectionId}
            year={year}
            studentCount={studentCount}
            selectedStudentIds={recipientIds}
            dict={dict}
            billingLabels={billingLabels}
            referenceMonthlyAmount={referenceMonthlyAmount}
            referenceMonthlyCurrency={referenceMonthlyCurrency}
            onNotice={setScholarNotice}
          />
          <button
            type="button"
            onClick={onSelectOverdue}
            disabled={overdueIds.length === 0}
            className="inline-flex min-h-[36px] items-center gap-1 rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-1.5 text-sm font-medium text-[var(--color-foreground)] transition hover:bg-[var(--color-muted)]/40 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {dict.matrix.selectOverdue}
          </button>
          {selectionCount > 0 ? (
            <SectionCollectionsStudentActionBar
              selectionCount={selectionCount}
              onClear={onClearSelection}
              onOpenMessageModal={onOpenMessageModal}
              onSendOverdueReminders={onSendOverdueReminders}
              overdueBusy={overdueBusy}
              dict={dict}
            />
          ) : null}
        </div>
      </div>
      <div className="flex shrink-0 flex-wrap items-center gap-2">
        <AdminBillingMatrixLegendModal labels={financeCollectionsMatrixLegendLabels(dict)} />
        <SectionCollectionsExportButtons locale={locale} sectionId={sectionId} year={year} dict={dict} />
      </div>
    </div>
  );
}

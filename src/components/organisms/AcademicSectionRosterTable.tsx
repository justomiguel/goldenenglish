"use client";

import { useMemo, useState, type ReactNode } from "react";
import { usePersistentPageTab } from "@/hooks/usePersistentPageTab";
import { AlertTriangle } from "lucide-react";
import type { Dictionary } from "@/types/i18n";
import { ScheduleConflictResolutionModal } from "@/components/molecules/ScheduleConflictResolutionModal";
import { AcademicSectionRosterCards } from "@/components/organisms/AcademicSectionRosterCards";
import {
  AcademicSectionRosterMoveControls,
  formatEnrollmentStatusLabel,
} from "@/components/organisms/AcademicSectionRosterMoveControls";
import {
  AcademicSectionRosterToolbar,
  type SectionRosterTabKey,
} from "@/components/organisms/AcademicSectionRosterToolbar";
import { SortableColumnHeader } from "@/components/molecules/SortableColumnHeader";
import { AdminUserNameLink } from "@/components/molecules/AdminUserNameLink";
import { StudentCareBadge } from "@/components/molecules/StudentCareBadge";
import type { UniversalSortDir } from "@/types/universalListView";
import {
  sortSectionRosterRows,
  type SectionRosterSortKey,
} from "@/lib/academics/sortSectionRosterRows";
import type { SectionRosterRow } from "@/types/sectionRoster";
import { useAcademicSectionRosterMoves } from "@/hooks/useAcademicSectionRosterMoves";
import { useAppSurface } from "@/hooks/useAppSurface";

export type { SectionRosterRow };

function rowInTab(tab: SectionRosterTabKey, status: string) {
  if (tab === "active") return status === "active" || status === "completed";
  if (tab === "dropped") return status === "dropped";
  return status === "transferred";
}

export interface AcademicSectionRosterTableProps {
  locale: string;
  sectionId: string;
  rows: SectionRosterRow[];
  moveTargets: { id: string; label: string }[];
  dict: Dictionary["dashboard"]["academicSectionPage"];
  conflictDict: Dictionary["dashboard"]["academics"]["conflictModal"];
  errors: Dictionary["dashboard"]["academics"]["errors"];
  /** Student profile id → guardian has pending payments */
  debtByStudentId?: Record<string, boolean>;
  /** Primary actions aligned with the roster title (e.g. enroll CTA). */
  headerActions?: ReactNode;
  /** When true, omits outer card chrome and duplicate title (used inside area block). */
  embedded?: boolean;
}

export function AcademicSectionRosterTable({
  locale,
  sectionId,
  rows,
  moveTargets,
  dict,
  conflictDict,
  errors,
  debtByStudentId = {},
  headerActions,
  embedded = false,
}: AcademicSectionRosterTableProps) {
  const narrow = useAppSurface() !== "web-desktop";
  const { value: tab, setValue: setTab } = usePersistentPageTab<SectionRosterTabKey>({
    allowed: ["active", "dropped", "transferred"],
    fallback: "active",
    param: "roster",
  });
  const [rosterSortKey, setRosterSortKey] = useState<SectionRosterSortKey>("label");
  const [rosterSortDir, setRosterSortDir] = useState<UniversalSortDir>("asc");

  const {
    picks,
    setPicks,
    capacityOverride,
    setCapacityOverride,
    msg,
    busy,
    modalOpen,
    setModalOpen,
    conflicts,
    targetSlots,
    targetLabel,
    moveCtx,
    setMoveCtx,
    runMove,
    confirmConflictMove,
  } = useAcademicSectionRosterMoves(locale, sectionId, rows, moveTargets, dict, errors);

  const counts = useMemo(
    () => ({
      active: rows.filter((r) => rowInTab("active", r.status)).length,
      dropped: rows.filter((r) => rowInTab("dropped", r.status)).length,
      transferred: rows.filter((r) => rowInTab("transferred", r.status)).length,
    }),
    [rows],
  );
  const filtered = useMemo(() => rows.filter((r) => rowInTab(tab, r.status)), [rows, tab]);
  const rosterSortLabels = dict.rosterTableSort;
  const sortedFiltered = useMemo(
    () => sortSectionRosterRows(filtered, rosterSortKey, rosterSortDir),
    [filtered, rosterSortKey, rosterSortDir],
  );
  const canMoveInTab = tab === "active" && moveTargets.length > 0;

  const onRosterToggleSort = (columnId: string) => {
    const id = columnId as SectionRosterSortKey;
    if (rosterSortKey !== id) {
      setRosterSortKey(id);
      setRosterSortDir("asc");
      return;
    }
    setRosterSortDir((d) => (d === "asc" ? "desc" : "asc"));
  };

  const moveProps = {
    picks,
    setPicks,
    moveTargets,
    busy,
    movingStudentId: moveCtx?.studentId ?? null,
    moveTitle: dict.moveTitle,
    moveSelect: dict.moveSelect,
    moveRun: dict.moveRun,
    onMove: runMove,
  };

  const tableBody = (
    <>
      {!embedded ? (
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-base font-semibold text-[var(--color-primary)]">{dict.rosterTitle}</h2>
        </div>
      ) : null}
      <AcademicSectionRosterToolbar
        dict={dict}
        tab={tab}
        onTab={setTab}
        counts={counts}
        headerActions={headerActions}
        showCapacityOverride={canMoveInTab && sortedFiltered.length > 0}
        capacityOverride={capacityOverride}
        onCapacityOverride={setCapacityOverride}
        busy={busy}
        msg={msg}
      />
      {narrow ? (
        <AcademicSectionRosterCards
          locale={locale}
          rows={sortedFiltered}
          dict={dict}
          debtByStudentId={debtByStudentId}
          canMove={canMoveInTab}
          {...moveProps}
        />
      ) : (
        <div className="mt-3 overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-[var(--color-border)] text-xs uppercase text-[var(--color-muted-foreground)]">
              <tr>
                <th className="py-2 pr-3" scope="col" aria-sort={rosterSortKey === "label" ? (rosterSortDir === "asc" ? "ascending" : "descending") : "none"}>
                  <SortableColumnHeader columnId="label" label={dict.colStudent} sortKey={rosterSortKey} sortDir={rosterSortDir} onToggleSort={onRosterToggleSort} sortLabels={rosterSortLabels} />
                </th>
                <th className="py-2 pr-3" scope="col" aria-sort={rosterSortKey === "status" ? (rosterSortDir === "asc" ? "ascending" : "descending") : "none"}>
                  <SortableColumnHeader columnId="status" label={dict.colStatus} sortKey={rosterSortKey} sortDir={rosterSortDir} onToggleSort={onRosterToggleSort} sortLabels={rosterSortLabels} />
                </th>
                <th className="py-2" scope="col">
                  <span className="font-semibold text-[var(--color-muted-foreground)]">{dict.colActions}</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {sortedFiltered.length === 0 ? (
                <tr>
                  <td colSpan={3} className="py-4 text-[var(--color-muted-foreground)]">{dict.emptyTab}</td>
                </tr>
              ) : (
                sortedFiltered.map((r) => (
                  <tr key={r.enrollmentId} className="border-t border-[var(--color-border)]">
                    <td className="py-2.5 pr-3 font-medium text-[var(--color-foreground)]">
                      <span className="inline-flex items-center gap-1.5">
                        <AdminUserNameLink locale={locale} userId={r.studentId} name={r.label} />
                        {debtByStudentId[r.studentId] ? (
                          <span className="inline-flex shrink-0 rounded-full border border-[var(--color-error)] p-0.5 text-[var(--color-error)]" title={dict.debtBadge} aria-label={dict.debtBadge}>
                            <AlertTriangle className="h-3.5 w-3.5" aria-hidden />
                          </span>
                        ) : null}
                        {r.hasCareNotes ? <StudentCareBadge label={dict.careBadge} /> : null}
                      </span>
                    </td>
                    <td className="py-2.5 pr-3 text-[var(--color-muted-foreground)]">
                      {formatEnrollmentStatusLabel(r.status, dict.lifecycle.enrollmentStatus)}
                    </td>
                    <td className="py-2.5">
                      {canMoveInTab ? (
                        <AcademicSectionRosterMoveControls studentId={r.studentId} fullWidth={false} {...moveProps} />
                      ) : (
                        <span className="text-[var(--color-muted-foreground)]">—</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
      <ScheduleConflictResolutionModal
        open={modalOpen && Boolean(conflicts?.length)}
        onClose={() => {
          setModalOpen(false);
          setMoveCtx(null);
        }}
        locale={locale}
        dict={conflictDict}
        conflicts={conflicts ?? []}
        targetSlots={targetSlots}
        targetSectionLabel={targetLabel}
        onConfirmDrop={confirmConflictMove}
        isPending={busy}
      />
    </>
  );

  if (embedded) return tableBody;
  return (
    <section className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-background)] p-4 shadow-[var(--shadow-soft)]">
      {tableBody}
    </section>
  );
}

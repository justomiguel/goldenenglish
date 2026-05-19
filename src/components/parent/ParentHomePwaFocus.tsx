"use client";

import { useMemo } from "react";
import type { ParentChildSummary } from "@/lib/parent/loadParentChildrenSummaries";
import type { ParentHomePillarSnapshot } from "@/lib/parent/buildParentHomePillarSnapshot";
import {
  buildParentHomeChildAttendanceRows,
  buildParentHomeChildPaymentRows,
} from "@/lib/parent/buildParentHomeChildPillarRows";
import type { Dictionary } from "@/types/i18n";
import { ParentChildSwitcher } from "@/components/parent/ParentChildSwitcher";
import { ParentHomeStatusGrid } from "@/components/parent/ParentHomeStatusGrid";
import { formatProfileNameSurnameFirst } from "@/lib/profile/formatProfileDisplayName";

export interface ParentHomePwaFocusProps {
  locale: string;
  greeting: string;
  firstName: string | null;
  summaries: ParentChildSummary[];
  selectedStudentId?: string;
  pillars: ParentHomePillarSnapshot;
  attendanceByStudent: Record<string, number>;
  overdueByStudent: Record<string, boolean>;
  labels: Dictionary["dashboard"]["parent"];
}

export function ParentHomePwaFocus({
  locale,
  greeting,
  firstName,
  summaries,
  selectedStudentId,
  pillars,
  attendanceByStudent,
  overdueByStudent,
  labels,
}: ParentHomePwaFocusProps) {
  const inbox = labels.homeInbox;
  const multipleChildren = summaries.length > 1;
  const selected =
    summaries.find((summary) => summary.studentId === selectedStudentId) ?? summaries[0];
  const headline = firstName ? `${greeting}, ${firstName}` : greeting;
  const childName = selected
    ? formatProfileNameSurnameFirst(selected.firstName, selected.lastName)
    : null;

  const { attendanceChildRows, paymentChildRows } = useMemo(() => {
    if (!multipleChildren) {
      return { attendanceChildRows: undefined, paymentChildRows: undefined };
    }
    const childPillarLabels = {
      attendanceOkDetail: inbox.attendanceOkDetail,
      attendanceAttentionDetail: inbox.attendanceAttentionDetail,
      attendanceUnknownDetail: inbox.attendanceUnknownDetail,
      paymentsOkDetail: inbox.paymentsOkDetail,
      paymentsAttentionDetail: inbox.paymentsAttentionOverdue,
    };
    return {
      attendanceChildRows: buildParentHomeChildAttendanceRows(
        summaries,
        attendanceByStudent,
        childPillarLabels,
      ),
      paymentChildRows: buildParentHomeChildPaymentRows(
        summaries,
        overdueByStudent,
        childPillarLabels,
      ),
    };
  }, [multipleChildren, summaries, attendanceByStudent, overdueByStudent, inbox]);

  return (
    <div className="space-y-5">
      <header>
        <h1 className="font-display text-xl font-bold text-[var(--color-foreground)]">{headline}</h1>
        {multipleChildren ? (
          <p className="mt-1 text-sm text-[var(--color-muted-foreground)]">{inbox.pwaFamilyContext}</p>
        ) : childName ? (
          <p className="mt-1 text-sm text-[var(--color-muted-foreground)]">
            {inbox.pwaChildContext.replace("{child}", childName)}
          </p>
        ) : null}
      </header>

      {multipleChildren ? null : (
        <ParentChildSwitcher
          locale={locale}
          summaries={summaries}
          selectedStudentId={selected?.studentId}
          ariaLabel={labels.selectChild}
        />
      )}

      <ParentHomeStatusGrid
        locale={locale}
        pillars={pillars}
        labels={inbox}
        variant="pwa"
        attendanceChildRows={attendanceChildRows}
        paymentChildRows={paymentChildRows}
      />
    </div>
  );
}


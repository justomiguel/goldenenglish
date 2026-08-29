"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/atoms/Button";
import { markTrialSeatAttendanceAction } from "@/app/[locale]/dashboard/teacher/sections/trialSeatAttendanceActions";
import type { TrialVisitorRow } from "@/lib/register/loadTrialVisitorsForSection";
import type { Dictionary } from "@/types/i18n";

type Labels = Dictionary["dashboard"]["teacherSectionAttendance"]["trialVisitors"];

function statusLabel(status: TrialVisitorRow["status"], labels: Labels): string {
  if (status === "attended") return labels.attended;
  if (status === "absent") return labels.absent;
  return labels.booked;
}

export function TrialClassVisitorsPanel({
  locale,
  sectionId,
  visitors,
  labels,
}: {
  locale: string;
  sectionId: string;
  visitors: TrialVisitorRow[];
  labels: Labels;
}) {
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [rows, setRows] = useState(visitors);

  if (rows.length === 0) return null;

  function mark(seatId: string, mark: "present" | "absent") {
    setError(null);
    start(async () => {
      const result = await markTrialSeatAttendanceAction({
        locale,
        seatId,
        mark,
        sectionId,
      });
      if (!result.ok) {
        setError(labels.markError);
        return;
      }
      setRows((prev) =>
        prev.map((row) =>
          row.seatId === seatId
            ? { ...row, status: mark === "present" ? "attended" : "absent" }
            : row,
        ),
      );
    });
  }

  return (
    <section className="space-y-3 rounded-[var(--layout-border-radius)] border border-[var(--color-border)] p-4">
      <div>
        <h3 className="text-sm font-semibold text-[var(--color-foreground)]">{labels.title}</h3>
        <p className="text-xs text-[var(--color-muted-foreground)]">{labels.lead}</p>
      </div>
      <ul className="space-y-2">
        {rows.map((row) => (
          <li
            key={row.seatId}
            className="flex flex-col gap-2 rounded-[var(--layout-border-radius)] border border-[var(--color-border)]/70 px-3 py-2 sm:flex-row sm:items-center sm:justify-between"
          >
            <div className="min-w-0">
              <p className="text-sm font-medium">
                {row.studentName}{" "}
                <span className="text-xs font-normal text-[var(--color-muted-foreground)]">
                  {labels.badge}
                </span>
              </p>
              <p className="text-xs text-[var(--color-muted-foreground)]">
                {row.scheduledOn} · {row.startTime}–{row.endTime} · {statusLabel(row.status, labels)}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {row.status !== "attended" ? (
                <Button
                  type="button"
                  size="sm"
                  disabled={pending}
                  onClick={() => mark(row.seatId, "present")}
                >
                  {labels.present}
                </Button>
              ) : null}
              {row.status === "booked" ? (
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  disabled={pending}
                  onClick={() => mark(row.seatId, "absent")}
                >
                  {labels.absent}
                </Button>
              ) : null}
            </div>
          </li>
        ))}
      </ul>
      {error ? (
        <p role="alert" className="text-sm text-[var(--color-destructive)]">
          {error}
        </p>
      ) : null}
    </section>
  );
}

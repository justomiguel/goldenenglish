"use client";

import { ArrowRight, GraduationCap, History, UserCog, UsersRound } from "lucide-react";
import type { Dictionary } from "@/types/i18n";
import type { AdminUserDetailVM } from "@/lib/dashboard/adminUserDetailVM";

type UserLabels = Dictionary["admin"]["users"];

export interface AdminUserHistoryPanelProps {
  detail: AdminUserDetailVM;
  labels: UserLabels;
}

function statusBadgeLabel(status: string, labels: UserLabels): string {
  if (status === "active") return labels.detailHistoryEnrollmentStatusActive;
  if (status === "transferred") return labels.detailHistoryEnrollmentStatusTransferred;
  if (status === "dropped") return labels.detailHistoryEnrollmentStatusDropped;
  return status;
}

function kindBadgeLabel(
  kind: "profile" | "tutor" | "enrollment",
  labels: UserLabels,
): string {
  if (kind === "tutor") return labels.detailHistoryKindTutor;
  if (kind === "enrollment") return labels.detailHistoryKindEnrollment;
  return labels.detailHistoryKindProfile;
}

export function AdminUserHistoryPanel({
  detail,
  labels,
}: AdminUserHistoryPanelProps) {
  const cohorts = detail.studentHistory?.cohorts ?? [];
  const auditEvents = detail.studentHistory?.auditEvents ?? [];

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-background)] p-4 shadow-[var(--shadow-soft)] sm:p-5">
        <div className="border-b border-[var(--color-border)] pb-3">
          <h2 className="flex items-center gap-2 font-display text-base font-semibold text-[var(--color-primary)] sm:text-lg">
            <GraduationCap className="h-5 w-5 shrink-0" aria-hidden />
            {labels.detailHistoryCohortsTitle}
          </h2>
          <p className="mt-1 text-xs sm:text-sm text-[var(--color-muted-foreground)]">
            {labels.detailHistoryCohortsLead}
          </p>
        </div>

        {cohorts.length === 0 ? (
          <p className="mt-4 text-sm text-[var(--color-muted-foreground)]">
            {labels.detailHistoryCohortsEmpty}
          </p>
        ) : (
          <ul className="mt-4 divide-y divide-[var(--color-border)]">
            {cohorts.map((item) => (
              <li
                key={item.enrollmentId}
                className="flex flex-wrap items-center justify-between gap-3 py-3 first:pt-0 last:pb-0"
              >
                <div className="space-y-0.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-semibold text-[var(--color-foreground)]">
                      {item.cohortName} — {item.sectionName}
                    </span>
                    {item.cohortIsCurrent ? (
                      <span className="rounded-full bg-[var(--color-primary)]/15 px-2 py-0.5 text-xs font-semibold text-[var(--color-primary)]">
                        {labels.detailHistoryCohortCurrentBadge}
                      </span>
                    ) : null}
                  </div>
                  <p className="text-xs text-[var(--color-muted-foreground)]">
                    {item.teacherName} · {item.enrolledAtDisplay}
                  </p>
                </div>
                <span
                  className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                    item.status === "active"
                      ? "bg-[var(--color-primary)] text-[var(--color-primary-foreground)]"
                      : "bg-[var(--color-muted)] text-[var(--color-muted-foreground)]"
                  }`}
                >
                  {statusBadgeLabel(item.status, labels)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-background)] p-4 shadow-[var(--shadow-soft)] sm:p-5">
        <div className="border-b border-[var(--color-border)] pb-3">
          <h2 className="flex items-center gap-2 font-display text-base font-semibold text-[var(--color-primary)] sm:text-lg">
            <History className="h-5 w-5 shrink-0" aria-hidden />
            {labels.detailHistoryAuditTitle}
          </h2>
          <p className="mt-1 text-xs sm:text-sm text-[var(--color-muted-foreground)]">
            {labels.detailHistoryAuditLead}
          </p>
        </div>

        {auditEvents.length === 0 ? (
          <p className="mt-4 text-sm text-[var(--color-muted-foreground)]">
            {labels.detailHistoryAuditEmpty}
          </p>
        ) : (
          <ol className="mt-4 space-y-3">
            {auditEvents.map((ev) => (
              <li
                key={ev.id}
                className="rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-surface)] p-3.5"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    {ev.kind === "tutor" ? (
                      <UsersRound className="h-4 w-4 shrink-0 text-[var(--color-primary)]" aria-hidden />
                    ) : ev.kind === "enrollment" ? (
                      <GraduationCap className="h-4 w-4 shrink-0 text-[var(--color-primary)]" aria-hidden />
                    ) : (
                      <UserCog className="h-4 w-4 shrink-0 text-[var(--color-primary)]" aria-hidden />
                    )}
                    <span className="rounded-full bg-[var(--color-muted)] px-2.5 py-0.5 text-xs font-semibold text-[var(--color-foreground)]">
                      {kindBadgeLabel(ev.kind, labels)}
                    </span>
                    <span className="text-sm font-medium text-[var(--color-foreground)]">
                      {ev.summary || ev.action}
                    </span>
                  </div>
                  <div className="text-xs text-[var(--color-muted-foreground)]">
                    {ev.createdAtDisplay} ·{" "}
                    {labels.detailHistoryAuditActor.replace("{actor}", ev.actorName)}
                  </div>
                </div>

                {ev.changes.length > 0 ? (
                  <dl className="mt-2.5 space-y-1.5 rounded-md bg-[var(--color-muted)]/35 p-2.5 text-xs">
                    {ev.changes.map((chg) => (
                      <div key={chg.field} className="flex flex-wrap items-center gap-1.5">
                        <dt className="font-semibold text-[var(--color-foreground)]">
                          {chg.field}:
                        </dt>
                        <dd className="flex flex-wrap items-center gap-1.5 text-[var(--color-muted-foreground)]">
                          <span>
                            {labels.detailHistoryAuditBefore}:{" "}
                            <strong className="font-medium text-[var(--color-foreground)]">
                              {chg.before}
                            </strong>
                          </span>
                          <ArrowRight className="h-3.5 w-3.5 shrink-0" aria-hidden />
                          <span>
                            {labels.detailHistoryAuditAfter}:{" "}
                            <strong className="font-medium text-[var(--color-foreground)]">
                              {chg.after}
                            </strong>
                          </span>
                        </dd>
                      </div>
                    ))}
                  </dl>
                ) : null}
              </li>
            ))}
          </ol>
        )}
      </section>
    </div>
  );
}

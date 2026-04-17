import Link from "next/link";
import { AlertTriangle, CalendarClock, ClipboardList, Inbox, MessageSquare, BarChart3 } from "lucide-react";
import { DashboardGreetingHero } from "@/components/molecules/DashboardGreetingHero";
import { buildDashboardGreeting } from "@/lib/dashboard/buildDashboardGreeting";
import { teacherSectionAvgTone } from "@/lib/teacher/teacherSectionAvgTone";
import type { Dictionary } from "@/types/i18n";
import type { TeacherDashboardModel } from "@/types/teacherDashboard";

export interface TeacherDashboardHomeProps {
  locale: string;
  dict: Dictionary;
  model: TeacherDashboardModel;
  firstName?: string | null;
}

export function TeacherDashboardHome({ locale, dict, model, firstName = null }: TeacherDashboardHomeProps) {
  const h = dict.dashboard.teacher.home;
  const base = `/${locale}/dashboard/teacher`;
  const { greeting, fullDateLine } = buildDashboardGreeting(locale, dict);

  return (
    <div className="space-y-8">
      <DashboardGreetingHero
        kicker={h.kicker}
        greeting={greeting}
        firstName={firstName}
        fullDateLine={fullDateLine}
        lead={dict.dashboard.teacher.lead}
      />

      <section aria-label={h.metricsAria} className="grid gap-4 sm:grid-cols-2">
        <KpiTile
          tone={model.retentionOpenCount > 0 ? "warning" : "neutral"}
          icon={<AlertTriangle aria-hidden className="h-5 w-5" />}
          title={h.retentionTitle}
          value={model.retentionOpenCount}
          hint={h.retentionHint}
        />
        <KpiTile
          tone={model.familyMessageAttentionCount > 0 ? "accent" : "neutral"}
          icon={<MessageSquare aria-hidden className="h-5 w-5" />}
          title={h.messagesTitle}
          value={model.familyMessageAttentionCount}
          hint={h.messagesHint}
          cta={{ href: `${base}/messages`, label: h.messagesCta, icon: <Inbox aria-hidden className="h-4 w-4" /> }}
        />
      </section>

      <section aria-labelledby="teacher-today-h" className="space-y-3">
        <div className="flex items-center gap-2">
          <CalendarClock aria-hidden className="h-5 w-5 text-[var(--color-secondary)]" />
          <h2 id="teacher-today-h" className="text-lg font-semibold text-[var(--color-foreground)]">
            {h.todayTitle}
          </h2>
        </div>
        <p className="text-xs text-[var(--color-muted-foreground)]">{h.todayUtcNote}</p>
        {model.todayClasses.length === 0 ? (
          <p className="rounded-[var(--layout-border-radius)] border border-dashed border-[var(--color-border)] bg-[var(--color-background)] px-4 py-6 text-center text-sm text-[var(--color-muted-foreground)]">
            {h.todayEmpty}
          </p>
        ) : (
          <ul className="space-y-2">
            {model.todayClasses.map((row) => (
              <li
                key={`${row.sectionId}-${row.startTime}-${row.endTime}`}
                className="flex flex-col gap-3 rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3 shadow-[var(--shadow-soft)] sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="flex items-center gap-3">
                  <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-[color-mix(in_oklch,var(--color-accent)_22%,transparent)] text-xs font-semibold text-[var(--color-secondary)]">
                    {row.startTime.slice(0, 5)}
                  </span>
                  <div>
                    <p className="font-medium text-[var(--color-foreground)]">{row.label}</p>
                    <p className="text-sm text-[var(--color-muted-foreground)]">
                      {row.startTime}–{row.endTime}
                    </p>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Link
                    href={`${base}/sections/${row.sectionId}/attendance`}
                    className="inline-flex min-h-[44px] shrink-0 items-center justify-center rounded-[var(--layout-border-radius)] bg-[var(--color-primary)] px-4 text-sm font-semibold text-[var(--color-primary-foreground)] shadow-[var(--shadow-soft)]"
                  >
                    {h.takeAttendanceCta}
                  </Link>
                  <Link
                    href={`${base}/sections/${row.sectionId}/assessments`}
                    className="inline-flex min-h-[44px] shrink-0 items-center justify-center gap-1.5 rounded-[var(--layout-border-radius)] border border-[var(--color-primary)] px-4 text-sm font-semibold text-[var(--color-primary)]"
                  >
                    <ClipboardList aria-hidden className="h-4 w-4" />
                    {h.openAssessmentsCta}
                  </Link>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section aria-labelledby="teacher-grades-h" className="space-y-3">
        <div className="flex items-center gap-2">
          <BarChart3 aria-hidden className="h-5 w-5 text-[var(--color-secondary)]" />
          <h2 id="teacher-grades-h" className="text-lg font-semibold text-[var(--color-foreground)]">
            {h.gradesTitle}
          </h2>
        </div>
        <p className="text-xs text-[var(--color-muted-foreground)]">{h.gradesHint}</p>
        {model.sectionGrades.length === 0 ? (
          <p className="rounded-[var(--layout-border-radius)] border border-dashed border-[var(--color-border)] bg-[var(--color-background)] px-4 py-6 text-center text-sm text-[var(--color-muted-foreground)]">
            {h.gradesEmpty}
          </p>
        ) : (
          <div className="overflow-hidden rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-surface)] shadow-[var(--shadow-soft)]">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-[color-mix(in_oklch,var(--color-muted)_60%,transparent)]">
                <tr>
                  <th className="px-3 py-2 font-semibold text-[var(--color-foreground)]">{h.gradesColSection}</th>
                  <th className="px-3 py-2 font-semibold text-[var(--color-foreground)]">{h.gradesColAvg}</th>
                  <th className="px-3 py-2 font-semibold text-[var(--color-foreground)]">{h.gradesColLink}</th>
                </tr>
              </thead>
              <tbody>
                {model.sectionGrades.map((row) => {
                  const tone = teacherSectionAvgTone(row.avgScore);
                  return (
                    <tr key={row.sectionId} className="border-t border-[var(--color-border)]">
                      <td className="px-3 py-2 text-[var(--color-foreground)]">{row.label}</td>
                      <td className="px-3 py-2 tabular-nums text-[var(--color-foreground)]">
                        <span className="inline-flex items-center gap-2">
                          <ToneDot tone={tone} />
                          {row.avgScore == null ? h.gradesNoData : String(row.avgScore)}
                        </span>
                      </td>
                      <td className="px-3 py-2">
                        <div className="flex flex-wrap gap-3">
                          <Link
                            href={`${base}/sections/${row.sectionId}`}
                            className="font-medium text-[var(--color-primary)] underline"
                          >
                            {h.gradesOpenSection}
                          </Link>
                          <Link
                            href={`${base}/sections/${row.sectionId}/assessments`}
                            className="font-medium text-[var(--color-primary)] underline"
                          >
                            {h.gradesOpenAssessments}
                          </Link>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

type Tone = "neutral" | "accent" | "warning" | "ok" | "danger";

function ToneDot({ tone }: { tone: Tone }) {
  const color =
    tone === "ok"
      ? "var(--color-success, #2f9d6f)"
      : tone === "warning"
        ? "var(--color-accent)"
        : tone === "danger"
          ? "var(--color-error)"
          : "color-mix(in oklch, var(--color-muted-foreground) 60%, transparent)";
  return <span aria-hidden className="inline-block h-2.5 w-2.5 rounded-full" style={{ background: color }} />;
}

function KpiTile({
  tone,
  icon,
  title,
  value,
  hint,
  cta,
}: {
  tone: Tone;
  icon: React.ReactNode;
  title: string;
  value: number;
  hint: string;
  cta?: { href: string; label: string; icon: React.ReactNode };
}) {
  const ring =
    tone === "warning"
      ? "border-[var(--color-error)] bg-[color-mix(in_oklch,var(--color-error)_8%,var(--color-surface))]"
      : tone === "accent"
        ? "border-[var(--color-accent)] bg-[color-mix(in_oklch,var(--color-accent)_10%,var(--color-surface))]"
        : "border-[var(--color-border)] bg-[var(--color-surface)]";
  return (
    <div className={`rounded-[var(--layout-border-radius)] border p-4 shadow-[var(--shadow-soft)] ${ring}`}>
      <div className="flex items-center gap-2 text-[var(--color-secondary)]">
        {icon}
        <h2 className="text-sm font-semibold text-[var(--color-foreground)]">{title}</h2>
      </div>
      <p className="mt-2 text-3xl font-bold tabular-nums text-[var(--color-primary)]">{value}</p>
      <p className="mt-1 text-xs text-[var(--color-muted-foreground)]">{hint}</p>
      {cta ? (
        <Link
          href={cta.href}
          className="mt-3 inline-flex min-h-[44px] items-center gap-1.5 text-sm font-semibold text-[var(--color-primary)] underline"
        >
          {cta.icon}
          {cta.label}
        </Link>
      ) : null}
    </div>
  );
}

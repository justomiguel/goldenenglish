"use client";

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { RechartsSizedFrame } from "@/components/molecules/RechartsSizedFrame";
import type { FinanceReceiptProcessingStats } from "@/types/financeAnalytics";
import type { Dictionary } from "@/types/i18n";

type ProcDict = Dictionary["admin"]["finance"]["insights"]["processing"];

export interface FinanceReceiptProcessingCardProps {
  stats: FinanceReceiptProcessingStats | null;
  labels: ProcDict;
}

const REASON_KEYS: Record<string, keyof ProcDict> = {
  image_blurry: "reasonImageBlurry",
  amount_mismatch: "reasonAmountMismatch",
  wrong_account: "reasonWrongAccount",
  other: "reasonOther",
};

const AGING_COLORS = [
  "var(--color-muted-foreground)",
  "var(--color-accent)",
  "var(--color-error)",
];

export function FinanceReceiptProcessingCard({
  stats,
  labels,
}: FinanceReceiptProcessingCardProps) {
  if (!stats || stats.totalResolved === 0) {
    return (
      <section className="rounded-[var(--layout-border-radius)] border border-dashed border-[var(--color-border)] bg-[var(--color-surface)] p-6 text-center text-sm text-[var(--color-muted-foreground)]">
        {labels.noData}
      </section>
    );
  }

  const donutData = [
    { name: labels.approvalRate, value: Math.round(stats.approvalRate * 100) },
    { name: labels.rejectionReasons, value: Math.round(stats.rejectionRate * 100) },
  ];
  const donutColors = ["var(--color-primary)", "var(--color-error)"];

  const rejectionEntries = Object.entries(stats.rejectionBreakdown);

  return (
    <section className="space-y-5">
      <div className="rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
        <h3 className="font-semibold text-[var(--color-primary)]">
          {labels.title}
        </h3>
        <p className="text-sm text-[var(--color-muted-foreground)]">
          {labels.hint}
        </p>

        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatTile
            label={labels.avgDaysMonthly}
            value={stats.avgDaysMonthly != null ? `${stats.avgDaysMonthly}d` : "—"}
          />
          <StatTile
            label={labels.avgDaysInvoice}
            value={stats.avgDaysInvoice != null ? `${stats.avgDaysInvoice}d` : "—"}
          />
          <StatTile
            label={labels.totalProcessed}
            value={String(stats.totalResolved)}
          />
          <StatTile
            label={labels.pendingCount}
            value={String(stats.totalPending)}
            highlight={stats.totalPending > 0}
          />
        </div>

        <div className="mt-5 grid items-start gap-5 md:grid-cols-2">
          <div>
            <p className="mb-2 text-xs font-medium uppercase tracking-wider text-[var(--color-muted-foreground)]">
              {labels.approvalRate}
            </p>
            <RechartsSizedFrame height={180} className="w-full min-w-0">
              {(w, h) => (
                <ResponsiveContainer width={w} height={h} minWidth={0}>
                  <PieChart>
                    <Pie
                      data={donutData}
                      dataKey="value"
                      innerRadius="55%"
                      outerRadius="80%"
                      paddingAngle={2}
                      isAnimationActive={false}
                    >
                      {donutData.map((_, i) => (
                        <Cell key={i} fill={donutColors[i]} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value) =>
                        `${
                          typeof value === "number" && Number.isFinite(value)
                            ? value
                            : Number(value ?? NaN)
                        }%`
                      }
                    />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </RechartsSizedFrame>
            <p className="mt-1 text-center text-2xl font-bold tabular-nums text-[var(--color-primary)]">
              {Math.round(stats.approvalRate * 100)}%
            </p>
          </div>

          {rejectionEntries.length > 0 && (
            <div>
              <p className="mb-2 text-xs font-medium uppercase tracking-wider text-[var(--color-muted-foreground)]">
                {labels.rejectionReasons}
              </p>
              <ul className="space-y-2">
                {rejectionEntries.map(([reason, count]) => {
                  const key = REASON_KEYS[reason];
                  const label = key ? labels[key] : reason;
                  const maxCount = Math.max(
                    ...rejectionEntries.map(([, c]) => c),
                  );
                  const pct = maxCount > 0 ? (count / maxCount) * 100 : 0;
                  return (
                    <li key={reason} className="space-y-0.5">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-[var(--color-foreground)]">
                          {label}
                        </span>
                        <span className="tabular-nums text-[var(--color-muted-foreground)]">
                          {count}
                        </span>
                      </div>
                      <div className="h-1.5 rounded-full bg-[var(--color-muted)]">
                        <div
                          className="h-full rounded-full bg-[var(--color-error)]/60 transition-all"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
        </div>
      </div>

      {stats.totalPending > 0 && (
        <div className="rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
          <p className="mb-3 text-xs font-medium uppercase tracking-wider text-[var(--color-muted-foreground)]">
            {labels.pendingCount}
          </p>
          <div className="flex items-end gap-3">
            {stats.pendingAgeBuckets.map((b, i) => (
              <div key={b.label} className="flex-1 text-center">
                <div
                  className="mx-auto mb-1 w-full max-w-[3rem] rounded-t"
                  style={{
                    height: `${Math.max(8, (b.count / stats.totalPending) * 80)}px`,
                    backgroundColor: AGING_COLORS[i],
                  }}
                />
                <p className="text-lg font-bold tabular-nums text-[var(--color-foreground)]">
                  {b.count}
                </p>
                <p className="text-xs text-[var(--color-muted-foreground)]">
                  {b.label}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}

function StatTile({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div
      className={`rounded-[var(--layout-border-radius)] border p-3 text-center ${
        highlight
          ? "border-[var(--color-error)]/30 bg-[var(--color-error)]/5"
          : "border-[var(--color-border)] bg-[var(--color-muted)]/20"
      }`}
    >
      <p className="text-xs text-[var(--color-muted-foreground)]">{label}</p>
      <p
        className={`mt-0.5 text-xl font-bold tabular-nums ${
          highlight
            ? "text-[var(--color-error)]"
            : "text-[var(--color-foreground)]"
        }`}
      >
        {value}
      </p>
    </div>
  );
}

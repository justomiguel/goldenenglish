"use client";

import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { RechartsSizedFrame } from "@/components/molecules/RechartsSizedFrame";
import type { QuestionResultBlock } from "@/lib/questionnaires/aggregateResults";
import type { Dictionary } from "@/types/i18n";

type Labels = Dictionary["admin"]["questionnaires"];

function barLabel(label: string, labels: Labels): string {
  if (label === "yes") return labels.yes;
  if (label === "no") return labels.no;
  return label;
}

export function QuestionnaireResultsCharts({
  blocks,
  responseCount,
  labels,
}: {
  blocks: QuestionResultBlock[];
  responseCount: number;
  labels: Labels;
}) {
  return (
    <div className="space-y-6">
      {blocks.map((block) => (
        <article
          key={block.questionId}
          className="rounded-2xl border border-[var(--color-border)] p-4"
        >
          <h3 className="font-semibold">{block.prompt}</h3>
          <p className="mb-3 text-xs text-[var(--color-muted-foreground)]">
            {labels.answeredOf
              .replace("{answered}", String(block.answeredCount))
              .replace("{total}", String(responseCount))
              .replace("{pct}", String(block.percent))}
          </p>
          {block.kind === "bars" ? (
            <BarBlock bars={block.bars.map((b) => ({ ...b, label: barLabel(b.label, labels) }))} />
          ) : null}
          {block.kind === "stats" ? (
            <p className="text-sm">
              {labels.average}: {block.average.toFixed(1)} · {labels.min}: {block.min} · {labels.max}:{" "}
              {block.max}
            </p>
          ) : null}
          {block.kind === "list" ? (
            <ul className="max-h-56 space-y-1 overflow-auto text-sm">
              {block.values.slice(0, 20).map((value, index) => (
                <li key={`${block.questionId}-${index}`}>{value}</li>
              ))}
            </ul>
          ) : null}
        </article>
      ))}
    </div>
  );
}

function BarBlock({ bars }: { bars: Array<{ label: string; count: number }> }) {
  return (
    <RechartsSizedFrame height={Math.max(180, bars.length * 36 + 40)} className="w-full min-w-0">
      {(width, height) => (
        <ResponsiveContainer width={width} height={height}>
          <BarChart data={bars} layout="vertical" margin={{ left: 16, right: 16 }}>
            <XAxis type="number" allowDecimals={false} />
            <YAxis type="category" dataKey="label" width={88} />
            <Tooltip />
            <Bar dataKey="count" fill="var(--color-primary)" radius={6} />
          </BarChart>
        </ResponsiveContainer>
      )}
    </RechartsSizedFrame>
  );
}

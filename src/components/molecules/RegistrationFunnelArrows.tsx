"use client";

import { useLayoutEffect, useRef, useState } from "react";
import type { RegistrationInboxCounts } from "@/lib/register/countRegistrationInboxFilters";
import type { RegistrationInboxFilter } from "@/lib/register/registrationInboxFilter";
import type { Dictionary } from "@/types/i18n";

type FunnelLabels = Dictionary["admin"]["registrations"]["funnel"];
type Box = { w: number; h: number };

const JOIN = 14;
const END = 36;

const PAST_FILL = [
  "bg-[color-mix(in_srgb,var(--color-primary)_44%,var(--color-background))] text-[var(--color-foreground)] hover:bg-[color-mix(in_srgb,var(--color-primary)_52%,var(--color-background))]",
  "bg-[color-mix(in_srgb,var(--color-primary)_34%,var(--color-background))] text-[var(--color-foreground)] hover:bg-[color-mix(in_srgb,var(--color-primary)_42%,var(--color-background))]",
  "bg-[color-mix(in_srgb,var(--color-primary)_26%,var(--color-background))] text-[var(--color-foreground)] hover:bg-[color-mix(in_srgb,var(--color-primary)_34%,var(--color-background))]",
  "bg-[color-mix(in_srgb,var(--color-primary)_20%,var(--color-background))] text-[var(--color-foreground)] hover:bg-[color-mix(in_srgb,var(--color-primary)_28%,var(--color-background))]",
];

const NEXT_FILL = [
  "bg-[color-mix(in_srgb,var(--color-primary)_14%,var(--color-background))] text-[var(--color-foreground)] hover:bg-[color-mix(in_srgb,var(--color-primary)_20%,var(--color-background))]",
  "bg-[color-mix(in_srgb,var(--color-primary)_9%,var(--color-background))] text-[var(--color-foreground)] hover:bg-[color-mix(in_srgb,var(--color-primary)_14%,var(--color-background))]",
  "bg-[color-mix(in_srgb,var(--color-primary)_6%,var(--color-background))] text-[var(--color-foreground)] hover:bg-[color-mix(in_srgb,var(--color-primary)_10%,var(--color-background))]",
  "bg-[color-mix(in_srgb,var(--color-primary)_4%,var(--color-background))] text-[var(--color-foreground)] hover:bg-[color-mix(in_srgb,var(--color-primary)_8%,var(--color-background))]",
];

function clipPath(index: number, last: number): string {
  const shoulder = index === last ? `calc(100% - ${END}px)` : `calc(100% - ${JOIN}px)`;
  const nose = "100% 50%";
  if (index === 0) return `polygon(0 0, ${shoulder} 0, ${nose}, ${shoulder} 100%, 0 100%)`;
  return `polygon(0 0, ${shoulder} 0, ${nose}, ${shoulder} 100%, 0 100%, ${JOIN}px 50%)`;
}

function strokePath(index: number, last: number, w: number, h: number): string {
  const tip = index === last ? END : JOIN;
  const top = 0.5;
  const bottom = Math.max(top, h - 0.5);
  const mid = h / 2;
  const shoulder = Math.max(0, w - tip);
  const left = index === 0 ? 0.5 : 0;
  const lines = [
    `M ${left} ${top} L ${shoulder} ${top}`,
    `M ${shoulder} ${bottom} L ${left} ${bottom}`,
  ];
  if (index === 0) lines.push(`M 0.5 ${top} L 0.5 ${bottom}`);
  else lines.push(`M 0 ${top} L ${JOIN} ${mid} L 0 ${bottom}`);
  if (index === last) lines.push(`M ${shoulder} ${top} L ${Math.max(shoulder, w - 0.5)} ${mid} L ${shoulder} ${bottom}`);
  return lines.join(" ");
}

function idleClass(index: number, activeIndex: number): string {
  const slot = Math.min(Math.abs(index - activeIndex), 4) - 1;
  const row = index < activeIndex ? PAST_FILL : NEXT_FILL;
  return row[slot] ?? row[0] ?? "";
}

function tpl(template: string, count: number): string {
  return template.replace(/\{\{count\}\}/g, String(count));
}

function sameBoxes(prev: Box[], next: Box[]): boolean {
  return prev.length === next.length && prev.every((box, i) => box.w === next[i]?.w && box.h === next[i]?.h);
}

export function RegistrationFunnelArrows({
  labels,
  groupLabel,
  inboxFilter,
  inboxCounts,
  onInboxFilterChange,
}: {
  labels: FunnelLabels;
  groupLabel: string;
  inboxFilter: RegistrationInboxFilter | undefined;
  inboxCounts: RegistrationInboxCounts;
  onInboxFilterChange: (next: RegistrationInboxFilter) => void;
}) {
  const groupRef = useRef<HTMLDivElement>(null);
  const [sizes, setSizes] = useState<Box[]>([]);
  const stages = [
    { value: "registered" as const, label: labels.registered, count: inboxCounts.registered },
    { value: "contacted" as const, label: labels.contacted, count: inboxCounts.contacted },
    { value: "awaiting_payment" as const, label: labels.awaitingPayment, count: inboxCounts.awaiting_payment },
    { value: "paid_without_section" as const, label: labels.paidWithoutSection, count: inboxCounts.paid_without_section },
    { value: "awaiting_section" as const, label: labels.awaitingSection, count: inboxCounts.awaiting_section },
    { value: "enrolled_in_section" as const, label: labels.enrolledInSection, count: inboxCounts.enrolled_in_section },
  ];
  const last = stages.length - 1;
  const activeIndex = Math.max(
    0,
    stages.findIndex((stage) => stage.value === (inboxFilter ?? "registered")),
  );

  useLayoutEffect(() => {
    const group = groupRef.current;
    if (!group) return;
    const measure = () => {
      const next = [...group.querySelectorAll<HTMLElement>("[data-funnel-seg]")].map((el) => ({
        w: el.clientWidth,
        h: el.clientHeight,
      }));
      setSizes((prev) => (sameBoxes(prev, next) ? prev : next));
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(group);
    for (const el of group.querySelectorAll<HTMLElement>("[data-funnel-seg]")) observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={groupRef} className="flex w-full items-stretch overflow-x-auto p-1" role="group" aria-label={groupLabel}>
      {stages.map((stage, index) => {
        const active = index === activeIndex;
        const path = clipPath(index, last);
        const box = sizes[index];
        return (
          <span
            key={stage.value}
            data-funnel-seg=""
            className={`relative min-h-11 min-w-max flex-1 ${active ? "z-10" : ""}`}
            style={{ marginLeft: index === 0 ? 0 : -JOIN }}
          >
            <button
              type="button"
              aria-pressed={active}
              onClick={() => onInboxFilterChange(stage.value)}
              style={{ clipPath: path }}
              className={`relative inline-flex h-full min-h-11 w-full flex-1 items-center whitespace-nowrap px-5 text-xs font-medium md:text-sm ${
                index === 0 ? "pl-3" : "pl-6"
              } ${index === last ? "pr-10" : "pr-6"} ${
                active
                  ? "bg-[var(--color-primary)] font-semibold text-[var(--color-primary-foreground)] hover:bg-[var(--color-primary-dark)]"
                  : idleClass(index, activeIndex)
              }`}
            >
              {tpl(stage.label, stage.count)}
            </button>
            <svg
              aria-hidden
              data-funnel-stroke=""
              className="pointer-events-none absolute inset-0"
              width={box?.w ?? 0}
              height={box?.h ?? 0}
            >
              {box && box.w > 0 && box.h > 0 ? (
                <path
                  d={strokePath(index, last, box.w, box.h)}
                  fill="none"
                  stroke="black"
                  strokeWidth="1"
                  strokeLinecap="square"
                  strokeLinejoin="miter"
                />
              ) : null}
            </svg>
          </span>
        );
      })}
    </div>
  );
}

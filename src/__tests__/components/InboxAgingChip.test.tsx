import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { dictEn } from "@/test/dictEn";
import { InboxAgingChip } from "@/components/dashboard/admin/finance/InboxAgingChip";
import { computeInboxAgingVisual } from "@/lib/billing/inboxAgingVisual";

const inboxDict = dictEn.admin.finance.inbox;

describe("computeInboxAgingVisual", () => {
  const now = new Date("2026-04-28T12:00:00Z").getTime();

  it("returns hours label for items less than 24 hours old", () => {
    const uploadedAt = new Date("2026-04-28T06:00:00Z").toISOString();
    const v = computeInboxAgingVisual(uploadedAt, now, inboxDict);
    expect(v.hours).toBe(6);
    expect(v.label).toBe("6h");
  });

  it("returns days label for items 24+ hours old", () => {
    const uploadedAt = new Date("2026-04-26T12:00:00Z").toISOString();
    expect(computeInboxAgingVisual(uploadedAt, now, inboxDict).label).toBe("2d");
  });

  it("maps warning color for 24-72 hour range", () => {
    const uploadedAt = new Date("2026-04-26T00:00:00Z").toISOString();
    expect(computeInboxAgingVisual(uploadedAt, now, inboxDict).colorClasses).toContain(
      "warning",
    );
  });

  it("maps error color for older than 72 hours", () => {
    const uploadedAt = new Date("2026-04-24T00:00:00Z").toISOString();
    expect(computeInboxAgingVisual(uploadedAt, now, inboxDict).colorClasses).toContain(
      "error",
    );
  });

  it("maps neutral color under 24 hours", () => {
    const uploadedAt = new Date("2026-04-28T02:00:00Z").toISOString();
    const c = computeInboxAgingVisual(uploadedAt, now, inboxDict).colorClasses;
    expect(c).toContain("muted");
    expect(c).not.toContain("warning");
    expect(c).not.toContain("error");
  });
});

describe("InboxAgingChip", () => {
  const clockNow = new Date("2026-04-28T12:00:00Z").getTime();

  it("renders hours label with clockNowMs", () => {
    const uploadedAt = new Date("2026-04-28T06:00:00Z").toISOString();
    render(
      <InboxAgingChip uploadedAt={uploadedAt} dict={inboxDict} clockNowMs={clockNow} />,
    );
    expect(screen.getByText("6h")).toBeInTheDocument();
  });

  it("renders chip with same classes as pure helper", () => {
    const uploadedAt = new Date("2026-04-26T00:00:00Z").toISOString();
    const v = computeInboxAgingVisual(uploadedAt, clockNow, inboxDict);
    render(
      <InboxAgingChip uploadedAt={uploadedAt} dict={inboxDict} clockNowMs={clockNow} />,
    );
    const chip = screen.getByText(v.label);
    expect(chip.className).toBe(
      `inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold tabular-nums ${v.colorClasses}`,
    );
  });
});

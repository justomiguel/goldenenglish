import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { RegistrationListToolbar } from "@/components/molecules/RegistrationListToolbar";
import { dictEn } from "@/test/dictEn";

vi.mock("@/app/[locale]/dashboard/admin/registrations/exportRegistrationsAction", () => ({
  exportRegistrationsAction: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: vi.fn() }),
  usePathname: () => "/en/dashboard/admin/registrations",
  useSearchParams: () => new URLSearchParams("q=ana"),
}));

describe("RegistrationListToolbar", () => {
  it("uses a wide search field and a primary export, not secondary chips", () => {
    render(
      <RegistrationListToolbar
        labels={dictEn.admin.registrations}
        query=""
        onQueryChange={() => {}}
        totalCount={4}
        filteredCount={4}
        inboxFilter="registered"
        inboxCounts={{
          registered: 2,
          contacted: 1,
          awaiting_payment: 0,
          paid_without_section: 0,
          awaiting_section: 0,
          enrolled_in_section: 0,
        }}
        onInboxFilterChange={() => {}}
        locale="en"
      />,
    );

    const search = screen.getByLabelText(dictEn.admin.registrations.filterLabel);
    expect(search.className).toContain("w-full");
    expect(search.className).not.toContain("max-w-xl");

    const exportBtn = screen.getByRole("button", {
      name: dictEn.admin.registrations.exportButton,
    });
    expect(exportBtn.className).toContain("--color-primary");
    expect(exportBtn.className).not.toContain("--color-secondary");

    const actions = screen.getByRole("button", { name: "Pre-enrolled (2)" });
    expect(actions).toHaveAttribute("aria-pressed", "true");
    expect(actions.className).toContain("--color-primary");
    expect(actions.className).not.toContain("--color-secondary");
    expect(actions.className).not.toContain("rounded-full");
    const group = screen.getByRole("group", { name: dictEn.admin.registrations.status });
    expect(group.className).toContain("w-full");
    expect(group.querySelector(".rounded-full")).toBeNull();
    const contacted = screen.getByRole("button", { name: "Registered, contacted (1)" });
    const waiting = screen.getByRole("button", { name: "Contacted, waiting for payment (0)" });
    expect(contacted.className).toContain("flex-1");
    expect(contacted.className).not.toContain("bg-[var(--color-muted)]");
    expect(waiting.className).not.toContain("bg-[var(--color-muted)]");
    expect(waiting.className).not.toContain("hover:opacity");
    expect(contacted.className).not.toBe(waiting.className);
    const tip = screen.getByRole("button", { name: "Enrolled in a section (0)" });
    expect(tip.parentElement?.querySelector("[data-funnel-stroke]")).not.toBeNull();
    expect(tip.getAttribute("style")).toContain("calc(100% - 36px)");
  });

  it("paints passed stages darker than the stages still ahead", () => {
    render(
      <RegistrationListToolbar
        labels={dictEn.admin.registrations}
        query=""
        onQueryChange={() => {}}
        totalCount={4}
        filteredCount={4}
        inboxFilter="awaiting_payment"
        inboxCounts={{
          registered: 2,
          contacted: 1,
          awaiting_payment: 0,
          paid_without_section: 0,
          awaiting_section: 0,
          enrolled_in_section: 0,
        }}
        onInboxFilterChange={() => {}}
        locale="en"
      />,
    );

    const passed = screen.getByRole("button", { name: "Pre-enrolled (2)" });
    const ahead = screen.getByRole("button", { name: "Matrícula paid, no section (0)" });
    expect(passed.className).toContain("_34%");
    expect(ahead.className).toContain("_14%");
  });

  it("shows the cohort select and hides the batch bar on the enrolled arrow", () => {
    render(
      <RegistrationListToolbar
        labels={dictEn.admin.registrations}
        query=""
        onQueryChange={() => {}}
        totalCount={1}
        filteredCount={1}
        inboxFilter="enrolled_in_section"
        inboxCounts={{
          registered: 0,
          contacted: 0,
          awaiting_payment: 0,
          paid_without_section: 0,
          awaiting_section: 0,
          enrolled_in_section: 1,
        }}
        onInboxFilterChange={() => {}}
        locale="en"
        cohorts={[{ id: "c1", name: "2026" }]}
        selectedCohortId="c1"
        selection={{
          pageIds: ["a"],
          selectedIds: ["a"],
          allMarked: true,
          someMarked: false,
          toggle: () => {},
          togglePage: () => {},
          clear: () => {},
        }}
      />,
    );

    expect(screen.getByRole("combobox")).toHaveValue("c1");
    expect(screen.getByRole("option", { name: "2026" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: dictEn.admin.registrations.funnel.selectPage })).toBeNull();
  });
});

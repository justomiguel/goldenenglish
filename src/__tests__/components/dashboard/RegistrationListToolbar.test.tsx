import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { RegistrationListToolbar } from "@/components/molecules/RegistrationListToolbar";
import { dictEn } from "@/test/dictEn";

vi.mock("@/app/[locale]/dashboard/admin/registrations/exportRegistrationsAction", () => ({
  exportRegistrationsAction: vi.fn(),
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
        inboxFilter="urgent"
        inboxCounts={{
          urgent: 2,
          awaiting_fee: 1,
          receipt_pending: 0,
          needs_section: 0,
          section_full: 0,
          contacted: 1,
          trial: 0,
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

    const actions = screen.getByRole("button", { name: /Actions/ });
    expect(actions).toHaveAttribute("aria-pressed", "true");
    expect(actions.className).toContain("--color-primary");
    expect(actions.className).not.toContain("--color-secondary");
  });
});

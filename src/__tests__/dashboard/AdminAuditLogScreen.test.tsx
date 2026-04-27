import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { dictEn } from "@/test/dictEn";
import { AdminAuditLogScreen } from "@/components/organisms/AdminAuditLogScreen";
import type { AdminAuditRow } from "@/types/audit";

const replace = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace }),
  usePathname: () => "/en/dashboard/admin/audit",
  useSearchParams: () => new URLSearchParams(),
}));

const rows: AdminAuditRow[] = [
  {
    id: "audit-1",
    actorId: "actor-1",
    actorName: "Ada Admin",
    actorRole: "admin",
    domain: "finance",
    action: "approve",
    resourceType: "payment",
    resourceId: "payment-1",
    summary: "Approved payment",
    beforeValues: { status: "pending" },
    afterValues: { status: "approved" },
    diff: { status: { before: "pending", after: "approved" } },
    metadata: { amount: 100 },
    correlationId: null,
    createdAt: "2026-04-26T20:00:00Z",
  },
];

describe("AdminAuditLogScreen", () => {
  it("renders audit rows and opens the details modal", async () => {
    render(
      <AdminAuditLogScreen
        rows={rows}
        totalCount={1}
        page={1}
        pageSize={25}
        searchQuery=""
        domainFilter="all"
        actionFilter=""
        resourceTypeFilter=""
        dateFrom=""
        dateTo=""
        actorIdFilter=""
        sortKey="created_at"
        sortDir="desc"
        locale="en"
        labels={dictEn.admin.audit}
        tableLabels={dictEn.admin.table}
      />,
    );

    expect(screen.getByText("Ada Admin")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: dictEn.admin.audit.openDetails }));
    const dialog = await screen.findByRole("dialog");
    expect(within(dialog).getByText(dictEn.admin.audit.detailsTitle)).toBeInTheDocument();
    expect(within(dialog).getAllByText(/approved/).length).toBeGreaterThan(0);
  });

  it("updates URL params from filters", () => {
    render(
      <AdminAuditLogScreen
        rows={rows}
        totalCount={1}
        page={1}
        pageSize={25}
        searchQuery=""
        domainFilter="all"
        actionFilter=""
        resourceTypeFilter=""
        dateFrom=""
        dateTo=""
        actorIdFilter=""
        sortKey="created_at"
        sortDir="desc"
        locale="en"
        labels={dictEn.admin.audit}
        tableLabels={dictEn.admin.table}
      />,
    );

    fireEvent.change(screen.getByLabelText(dictEn.admin.audit.filterLabel), {
      target: { value: "payment" },
    });
    expect(replace).toHaveBeenCalled();
  });
});

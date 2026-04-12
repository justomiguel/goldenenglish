import { describe, it, expect, vi } from "vitest";
import { createRef } from "react";
import { render, screen } from "@testing-library/react";
import { dictEn } from "@/test/dictEn";
import { AdminUsersDataTable } from "@/components/dashboard/AdminUsersDataTable";

describe("AdminUsersDataTable", () => {
  it("renders empty message when there are no rows", () => {
    const selectAllRef = createRef<HTMLInputElement>();
    render(
      <AdminUsersDataTable
        locale="en"
        toolbar={null}
        labels={dictEn.admin.users}
        tableLabels={dictEn.admin.table}
        rows={[]}
        currentUserId="11111111-1111-1111-1111-111111111111"
        sortKey="email"
        sortDir="asc"
        onToggleSort={vi.fn()}
        selectedIds={new Set()}
        onToggleRow={vi.fn()}
        selectAllRef={selectAllRef}
        allVisibleSelected={false}
        onToggleSelectAllVisible={vi.fn()}
        deletableVisibleCount={0}
        busy={false}
        onRequestDeleteOne={vi.fn()}
        emptyMessage="No matches"
        listEmpty
        pagination={{
          page: 1,
          pageSize: 25,
          totalCount: 0,
          onPageChange: vi.fn(),
        }}
      />,
    );
    expect(screen.getByText("No matches")).toBeInTheDocument();
  });
});

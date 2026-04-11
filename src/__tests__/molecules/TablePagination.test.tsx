import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { TablePagination } from "@/components/molecules/TablePagination";
import { dictEn } from "@/test/dictEn";

describe("TablePagination", () => {
  it("calls onPageChange for prev and next", async () => {
    const user = userEvent.setup();
    const onPageChange = vi.fn();
    const L = dictEn.admin.table;
    render(
      <TablePagination
        page={2}
        pageSize={10}
        totalCount={25}
        onPageChange={onPageChange}
        labels={{
          prev: L.paginationPrev,
          next: L.paginationNext,
          summary: L.paginationSummary,
        }}
      />,
    );
    await user.click(screen.getByRole("button", { name: L.paginationPrev }));
    expect(onPageChange).toHaveBeenCalledWith(1);
    await user.click(screen.getByRole("button", { name: L.paginationNext }));
    expect(onPageChange).toHaveBeenCalledWith(3);
  });

  it("disables prev on first page", () => {
    const L = dictEn.admin.table;
    render(
      <TablePagination
        page={1}
        pageSize={10}
        totalCount={5}
        onPageChange={() => {}}
        labels={{
          prev: L.paginationPrev,
          next: L.paginationNext,
          summary: L.paginationSummary,
        }}
      />,
    );
    expect(screen.getByRole("button", { name: L.paginationPrev })).toBeDisabled();
  });
});

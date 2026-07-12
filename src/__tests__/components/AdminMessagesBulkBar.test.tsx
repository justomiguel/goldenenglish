import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AdminMessagesBulkBar } from "@/components/dashboard/AdminMessagesBulkBar";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: vi.fn(), replace: vi.fn() }),
  usePathname: () => "/en/dashboard/admin/messages",
}));

const labels = {
  bulkSelectAll: "Select all",
  bulkSelectAllTitle: "Select every",
  bulkClearSelection: "Clear selection",
  bulkClearSelectionTitle: "Clear",
  bulkSelectedCount: "{{count}} selected",
  bulkMarkRead: "Mark as read",
  bulkMarkReadTitle: "Mark read",
  bulkMarkUnread: "Mark as unread",
  bulkMarkUnreadTitle: "Mark unread",
  bulkDelete: "Delete",
  bulkDeleteTitle: "Delete selected",
  bulkDeleteConfirmTitle: "Delete selected?",
  bulkDeleteConfirmDescription: "Remove {{count}}",
  bulkDeleteConfirm: "Delete permanently",
  bulkActionError: "Could not update",
  bulkDeleteNotFound: "Not found",
  bulkTooMany: "Too many",
  deletePortalMessageCancel: "Cancel",
} as never;

describe("AdminMessagesBulkBar", () => {
  it("shows select-all when the folder has rows", () => {
    render(
      <AdminMessagesBulkBar
        labels={labels}
        selectedCount={0}
        allVisibleSelected={false}
        visibleCount={3}
        busy={false}
        errorCode={null}
        showReadActions
        onSelectAll={vi.fn()}
        onClear={vi.fn()}
        onMarkRead={vi.fn()}
        onMarkUnread={vi.fn()}
        onDelete={vi.fn()}
      />,
    );
    expect(screen.getByRole("button", { name: "Select all" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Mark as read" })).not.toBeInTheDocument();
  });

  it("shows read and delete actions when selection is non-empty", async () => {
    const user = userEvent.setup();
    const onMarkRead = vi.fn();
    render(
      <AdminMessagesBulkBar
        labels={labels}
        selectedCount={2}
        allVisibleSelected={false}
        visibleCount={3}
        busy={false}
        errorCode={null}
        showReadActions
        onSelectAll={vi.fn()}
        onClear={vi.fn()}
        onMarkRead={onMarkRead}
        onMarkUnread={vi.fn()}
        onDelete={vi.fn()}
      />,
    );
    expect(screen.getByText("2 selected")).toBeInTheDocument();
    expect(screen.getByRole("toolbar", { name: "2 selected" })).toHaveAttribute(
      "data-sticky",
      "true",
    );
    await user.click(screen.getByRole("button", { name: "Mark as read" }));
    expect(onMarkRead).toHaveBeenCalled();
    expect(screen.getByRole("button", { name: "Delete" })).toBeInTheDocument();
  });

  it("hides read actions on sent folder", () => {
    render(
      <AdminMessagesBulkBar
        labels={labels}
        selectedCount={1}
        allVisibleSelected={false}
        visibleCount={2}
        busy={false}
        errorCode={null}
        showReadActions={false}
        onSelectAll={vi.fn()}
        onClear={vi.fn()}
        onMarkRead={vi.fn()}
        onMarkUnread={vi.fn()}
        onDelete={vi.fn()}
      />,
    );
    expect(screen.queryByRole("button", { name: "Mark as read" })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Delete" })).toBeInTheDocument();
  });
});

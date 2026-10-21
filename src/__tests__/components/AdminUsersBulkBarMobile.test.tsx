import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AdminUsersBulkBarMobile } from "@/components/pwa/molecules/AdminUsersBulkBarMobile";
import { dictEn } from "@/test/dictEn";

const labels = dictEn.admin.users;

describe("AdminUsersBulkBarMobile", () => {
  it("stays hidden when nothing is selected", () => {
    const { container } = render(
      <AdminUsersBulkBarMobile labels={labels} selectedCount={0} onDeleteSelected={() => {}} />,
    );
    expect(container).toBeEmptyDOMElement();
  });

  it("deletes the selection and sends mail", async () => {
    const user = userEvent.setup();
    const onDeleteSelected = vi.fn();
    const onBulkMail = vi.fn();
    render(
      <AdminUsersBulkBarMobile
        labels={labels}
        selectedCount={2}
        onDeleteSelected={onDeleteSelected}
        onBulkMail={onBulkMail}
        bulkMailLabel="Send email"
      />,
    );

    expect(screen.getByText(labels.mobileSelectedCount.replace("{{count}}", "2"))).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Send email" }));
    await user.click(screen.getByRole("button", { name: labels.deleteSelected }));
    expect(onBulkMail).toHaveBeenCalledOnce();
    expect(onDeleteSelected).toHaveBeenCalledOnce();
  });
});

import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { dictEn } from "@/test/dictEn";
import { AdminRegistrationJoinBillingFields } from "@/components/dashboard/AdminRegistrationJoinBillingFields";

const labels = dictEn.admin.registrations.joinBilling;

describe("AdminRegistrationJoinBillingFields", () => {
  it("does not pre-select a disposition", () => {
    render(
      <AdminRegistrationJoinBillingFields
        locale="en"
        namePrefix="join"
        value={null}
        onChange={vi.fn()}
        labels={labels}
      />,
    );
    expect(screen.getByRole("radio", { name: labels.current })).not.toBeChecked();
    expect(screen.getByRole("radio", { name: labels.behind })).not.toBeChecked();
  });

  it("reveals scholarship percent and scope when beca is chosen", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <AdminRegistrationJoinBillingFields
        locale="en"
        namePrefix="join"
        value={null}
        onChange={onChange}
        labels={labels}
      />,
    );
    await user.click(screen.getByRole("radio", { name: labels.scholarship }));
    expect(onChange).toHaveBeenCalledWith({
      kind: "scholarship",
      percent: 100,
      scope: "join_month",
    });
  });
});

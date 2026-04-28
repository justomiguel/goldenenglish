/** @vitest-environment jsdom */
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AdminUserDetailTutorLinkedRow } from "@/components/molecules/AdminUserDetailTutorLinkedRow";

describe("AdminUserDetailTutorLinkedRow", () => {
  it("renders unlink control when editable and notifies request", async () => {
    const user = userEvent.setup();
    const onRequestUnlink = vi.fn();
    render(
      <AdminUserDetailTutorLinkedRow
        tutor={{
          tutorId: "t1",
          displayName: "Pérez Ana",
          emailDisplay: "a@example.com",
        }}
        editable
        rowBusy={false}
        unlinkLabel="Quitar vínculo"
        unlinkAriaLabel="Quitar vínculo: Pérez Ana"
        onRequestUnlink={onRequestUnlink}
      />,
    );
    expect(screen.getByText("Pérez Ana")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Quitar vínculo: Pérez Ana" }));
    expect(onRequestUnlink).toHaveBeenCalledTimes(1);
  });

  it("hides unlink when not editable", () => {
    render(
      <AdminUserDetailTutorLinkedRow
        tutor={{ tutorId: "t1", displayName: "X", emailDisplay: "y@z.com" }}
        editable={false}
        rowBusy={false}
        unlinkLabel="Remove"
        unlinkAriaLabel="Remove X"
        onRequestUnlink={vi.fn()}
      />,
    );
    expect(screen.queryByRole("button", { name: "Remove X" })).not.toBeInTheDocument();
  });
});

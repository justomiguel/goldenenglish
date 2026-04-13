import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { LongJobActivityModal } from "@/components/molecules/LongJobActivityModal";

describe("LongJobActivityModal", () => {
  it("renders lines and close when not running", () => {
    const onOpenChange = vi.fn();
    render(
      <LongJobActivityModal
        open
        onOpenChange={onOpenChange}
        titleId="t1"
        title="Progress"
        introLine="Intro"
        primaryLine="All done"
        secondaryLine={null}
        explainBody="Explain"
        logTitle="Log"
        lines={["Step one", "Step two"]}
        emptyLogLine="—"
        isRunning={false}
        closeLabel="Close"
      />,
    );
    expect(screen.getByText("Step one")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Close" })).toBeEnabled();
  });

  it("renders cancel action while running", async () => {
    const user = userEvent.setup();
    const onCancel = vi.fn();
    render(
      <LongJobActivityModal
        open
        onOpenChange={vi.fn()}
        titleId="t1"
        title="Progress"
        introLine="Intro"
        primaryLine="Running"
        secondaryLine="2/5"
        explainBody="Explain"
        logTitle="Log"
        lines={["Step one"]}
        emptyLogLine="—"
        isRunning
        onCancel={onCancel}
        cancelLabel="Stop import"
        closeLabel="Close"
      />,
    );
    await user.click(screen.getByRole("button", { name: "Stop import" }));
    expect(onCancel).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole("button", { name: "Close" })).toBeNull();
  });
});

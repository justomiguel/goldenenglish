import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
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
});

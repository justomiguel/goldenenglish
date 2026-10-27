import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { AdminEventDualTransferFields } from "@/components/dashboard/admin/events/AdminEventDualTransferFields";
import { createDefaultEventBankTransferSourcesConfig } from "@/lib/events/eventBankTransferSources";
import en from "@/dictionaries/en.json";

describe("AdminEventDualTransferFields", () => {
  it("shows the mode choices after the toggle is on and hides the institute account when no global details exist", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    const config = createDefaultEventBankTransferSourcesConfig();
    const { rerender } = render(
      <AdminEventDualTransferFields
        config={config}
        labels={en.admin.events.pricing.dualTransfer}
        onChange={onChange}
      />,
    );

    expect(screen.queryByText(en.admin.events.pricing.dualTransfer.includeLabel)).toBeNull();
    await user.click(
      screen.getByRole("checkbox", { name: en.admin.events.pricing.dualTransfer.enabledLabel }),
    );
    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({
        enabled: true,
        mode: "choose",
        included: ["source_1", "source_2"],
      }),
    );

    rerender(
      <AdminEventDualTransferFields
        config={{ ...config, enabled: true }}
        globalInstructions={null}
        labels={en.admin.events.pricing.dualTransfer}
        onChange={onChange}
      />,
    );
    expect(
      screen.queryByRole("checkbox", {
        name: en.admin.events.pricing.dualTransfer.includeGlobal,
      }),
    ).toBeNull();
  });

  it("shows the institute account option and finance text when global instructions exist", () => {
    const config = createDefaultEventBankTransferSourcesConfig();
    render(
      <AdminEventDualTransferFields
        config={{ ...config, enabled: true, included: ["global"] }}
        globalInstructions="CBU 999"
        labels={en.admin.events.pricing.dualTransfer}
        onChange={vi.fn()}
      />,
    );

    expect(
      screen.getByRole("checkbox", {
        name: en.admin.events.pricing.dualTransfer.includeGlobal,
      }),
    ).toBeInTheDocument();
    expect(screen.getByText("CBU 999")).toBeTruthy();
    expect(screen.queryByText(en.admin.events.pricing.dualTransfer.modeChoose)).toBeNull();
  });
});

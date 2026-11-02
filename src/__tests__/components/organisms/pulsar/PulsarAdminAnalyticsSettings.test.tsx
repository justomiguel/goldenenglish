import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import es from "@/dictionaries/es.json";
import { PulsarAdminAnalyticsSettings } from "@/components/organisms/pulsar/PulsarAdminAnalyticsSettings";

const saveMock = vi.hoisted(() => vi.fn());
const refreshMock = vi.hoisted(() => vi.fn());

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: refreshMock }),
}));

vi.mock("@/app/[locale]/admin/ownerReviewAction", () => ({
  saveCentrolistoGaSettingsAction: (...args: unknown[]) => saveMock(...args),
}));

// REGRESSION CHECK: Saving the measurement id must go through the admin action and refresh the panel.

describe("PulsarAdminAnalyticsSettings", () => {
  beforeEach(() => {
    saveMock.mockReset();
    refreshMock.mockReset();
  });

  it("saves the measurement id from the field", async () => {
    saveMock.mockResolvedValue({ ok: true, measurementId: "G-NEW123" });
    const user = userEvent.setup();
    render(
      <PulsarAdminAnalyticsSettings
        locale="es"
        measurementId="G-OLD123"
        copy={es.pulsar.admin.analytics}
      />,
    );
    const field = screen.getByLabelText(es.pulsar.admin.analytics.measurementId);
    await user.clear(field);
    await user.type(field, "G-NEW123");
    await user.click(screen.getByRole("button", { name: es.pulsar.admin.analytics.save }));
    expect(saveMock).toHaveBeenCalledWith({ locale: "es", measurementId: "G-NEW123" });
    expect(await screen.findByText(es.pulsar.admin.analytics.saved)).toBeInTheDocument();
    expect(refreshMock).toHaveBeenCalled();
  });

  it("shows the invalid id message", async () => {
    saveMock.mockResolvedValue({ ok: false, errorCode: "invalid_input" });
    const user = userEvent.setup();
    render(
      <PulsarAdminAnalyticsSettings
        locale="es"
        measurementId=""
        copy={es.pulsar.admin.analytics}
      />,
    );
    await user.click(screen.getByRole("button", { name: es.pulsar.admin.analytics.save }));
    expect(await screen.findByText(es.pulsar.admin.analytics.invalid)).toBeInTheDocument();
  });
});

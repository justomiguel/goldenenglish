import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import es from "@/dictionaries/es.json";
import type { Dictionary } from "@/types/i18n";
import type { PulsarTenantRecord } from "@/lib/pulsar/pulsarTenantMapper";
import type { TenantTelemetrySnapshot } from "@/lib/pulsar/loadPulsarFleetTelemetry";

const {
  refreshMock,
  pushMock,
  saveMock,
  saveHostsMock,
  toggleMock,
  testConnMock,
} = vi.hoisted(() => ({
  refreshMock: vi.fn(),
  pushMock: vi.fn(),
  saveMock: vi.fn(),
  saveHostsMock: vi.fn(),
  toggleMock: vi.fn(),
  testConnMock: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    refresh: refreshMock,
    push: pushMock,
  }),
}));

vi.mock("@/app/[locale]/admin/actions", () => ({
  savePulsarTenantAction: (...args: unknown[]) => saveMock(...args),
  savePulsarPlatformHostsAction: (...args: unknown[]) => saveHostsMock(...args),
  togglePulsarTenantEnabledAction: (...args: unknown[]) => toggleMock(...args),
  testPulsarTenantConnectionAction: (...args: unknown[]) => testConnMock(...args),
  signOutPulsarStaffAction: vi.fn(),
}));

import { PulsarAdminFleetScreen } from "@/components/organisms/pulsar/PulsarAdminFleetScreen";
import { PulsarAdminTenantForm } from "@/components/organisms/pulsar/PulsarAdminTenantForm";

const dict = es as unknown as Dictionary;

const SAMPLE_TENANT: PulsarTenantRecord = {
  slug: "nago",
  displayName: "Capoeira Nagô Chile",
  isEnabled: true,
  updatedAt: "2026-10-25T12:00:00Z",
  hosts: ["capoeiranago.cl", "www.capoeiranago.cl"],
  supabaseUrl: "https://nago.supabase.co",
  supabaseAnonKey: "anon-nago",
  supabaseServiceRoleKey: "srv-nago",
  databaseUrl: null,
  brandThemeSlug: "nago",
  mailTenant: "capoeiranago.cl",
  resendFromEmail: "info@capoeiranago.cl",
  resendApiKey: "re_123",
  publicUrl: "https://www.capoeiranago.cl",
  paymentGatewaySecretEncryptionKey: null,
  whatsappAccessToken: null,
  whatsappPhoneNumberId: null,
  whatsappClassReminderTemplateName: null,
  vapidPublicKey: null,
  vapidPrivateKey: null,
  vapidContactEmail: null,
  googleMapsApiKey: null,
  googleMapsMapId: null,
  kvRestApiUrl: null,
  kvRestApiToken: null,
  debugLogin: false,
  skipInitialSiteSetup: false,
};

const TELEMETRY: Record<string, TenantTelemetrySnapshot> = {
  nago: {
    slug: "nago",
    status: "online",
    latencyMs: 42,
    visits7d: 128,
    visits30d: 540,
    lastHitAt: "2026-10-25T15:30:00Z",
    errorCode: null,
  },
};

describe("Pulsar admin screens", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders fleet overview metrics, status badge, and refreshes after toggling a tenant", async () => {
    toggleMock.mockResolvedValue({ ok: true });
    const user = userEvent.setup();

    render(
      <PulsarAdminFleetScreen
        locale="es"
        dict={dict}
        staffEmail="admin@pulsarlab.cl"
        sessionMode="pulsar-db"
        tenants={[SAMPLE_TENANT]}
        telemetryBySlug={TELEMETRY}
      />,
    );

    expect(screen.getByText("Capoeira Nagô Chile")).toBeInTheDocument();
    expect(screen.getByText(dict.pulsar.admin.table.statusOnline)).toBeInTheDocument();
    expect(screen.getAllByText("128").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("540").length).toBeGreaterThanOrEqual(1);

    await user.click(
      screen.getByRole("button", { name: dict.pulsar.admin.table.disableAction }),
    );

    await waitFor(() => {
      expect(toggleMock).toHaveBeenCalledWith({
        locale: "es",
        slug: "nago",
        isEnabled: false,
      });
      expect(refreshMock).toHaveBeenCalled();
    });
  });

  it("tests connection and saves a tenant in PulsarAdminTenantForm", async () => {
    testConnMock.mockResolvedValue({ ok: true, latencyMs: 35, errorCode: null });
    saveMock.mockResolvedValue({ ok: true, slug: "nago" });
    const user = userEvent.setup();

    render(
      <PulsarAdminTenantForm
        locale="es"
        dict={dict}
        initialTenant={SAMPLE_TENANT}
      />,
    );

    await user.click(
      screen.getByRole("button", { name: dict.pulsar.admin.form.testConnectionCta }),
    );

    await waitFor(() => {
      expect(testConnMock).toHaveBeenCalledWith({
        supabaseUrl: "https://nago.supabase.co",
        supabaseServiceRoleKey: "srv-nago",
      });
      expect(screen.getByText(/35 ms/)).toBeInTheDocument();
    });

    await user.click(
      screen.getByRole("button", { name: dict.pulsar.admin.form.saveCta }),
    );

    await waitFor(() => {
      expect(saveMock).toHaveBeenCalled();
      expect(refreshMock).toHaveBeenCalled();
    });
  });

  // REGRESSION CHECK: Staff can edit and save Pulsar platform domains from the fleet screen without redeploying.
  it("edits and saves Pulsar platform domains in PulsarAdminFleetScreen", async () => {
    saveHostsMock.mockResolvedValue({
      ok: true,
      hosts: ["pulsarlab.cl", "nuevo.pulsarlab.cl"],
    });
    const user = userEvent.setup();

    render(
      <PulsarAdminFleetScreen
        locale="es"
        dict={dict}
        staffEmail="admin@pulsarlab.cl"
        sessionMode="pulsar-db"
        tenants={[SAMPLE_TENANT]}
        telemetryBySlug={TELEMETRY}
        platformHosts={["pulsarlab.cl", "www.pulsarlab.cl"]}
      />,
    );

    const input = screen.getByLabelText(dict.pulsar.admin.platformHosts.inputLabel);
    await user.clear(input);
    await user.type(input, "pulsarlab.cl, nuevo.pulsarlab.cl");

    await user.click(
      screen.getByRole("button", { name: dict.pulsar.admin.platformHosts.saveCta }),
    );

    await waitFor(() => {
      expect(saveHostsMock).toHaveBeenCalledWith({
        locale: "es",
        rawHosts: "pulsarlab.cl, nuevo.pulsarlab.cl",
      });
      expect(refreshMock).toHaveBeenCalled();
    });
  });
});

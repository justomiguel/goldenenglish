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
    replace: vi.fn(),
  }),
  usePathname: () => "/es/admin",
  useSearchParams: () => new URLSearchParams(),
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
import { PulsarAdminTenantSummary } from "@/components/organisms/pulsar/PulsarAdminTenantSummary";
import { buildFleetSiteReview } from "@/lib/pulsar/fleetSiteReview";

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
    logoUrl: null,
  },
};

describe("Pulsar admin screens", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    sessionStorage.clear();
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
    expect(screen.getByText(dict.pulsar.admin.table.fleetChartTitle)).toBeInTheDocument();
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

  it("shows the database, migration, domain, and owner on the institute page", () => {
    const review = buildFleetSiteReview({
      dataMode: "shared_schema",
      postgresSchema: "tenant_nago",
      hosts: ["nago.pulsarlab.cl", "capoeiranago.cl"],
      slug: "nago",
      platformHosts: ["pulsarlab.cl"],
      migrationHead: "233_generic_institute_theme_seeds.sql",
      ledgerVersions: ["232_generic_institute_theme_kinds.sql"],
      markerVersion: null,
      vercelNames: [],
      vercelConfigured: true,
      ownerEmail: "owner@example.com",
      ownerUsed: 1,
    });
    render(
      <PulsarAdminTenantSummary
        locale="es"
        name="Capoeira Nagô Chile"
        slug="nago"
        enabled
        hosts={["nago.pulsarlab.cl", "capoeiranago.cl"]}
        snap={{ ...TELEMETRY.nago, logoUrl: "https://nago.cl/logo.png" }}
        review={review}
        series={[
          { day: "2026-10-29", visits: 3 },
          { day: "2026-10-30", visits: 5 },
        ]}
        copy={dict.pulsar.admin.table}
        themeHref="/es/admin/tenants/nago/theme"
        themeLabel={dict.pulsar.admin.form.themeCta}
        openHref="https://www.capoeiranago.cl"
        openLabel={dict.pulsar.admin.table.openPublicSite}
        partners={["flow", "whatsapp", "supabase"]}
        mailSent={12}
        mailQuota={50}
      />,
    );
    expect(document.querySelector("img")?.getAttribute("src")).toBe("https://nago.cl/logo.png");
    expect(screen.getByText(dict.pulsar.admin.table.partnerFlow)).toBeInTheDocument();
    expect(screen.getByText(dict.pulsar.admin.table.partnerWhatsapp)).toBeInTheDocument();
    expect(screen.queryByText(dict.pulsar.admin.table.partnerMercadoPago)).not.toBeInTheDocument();
    expect(document.querySelector('img[src="/pulsar/partners/flow.svg"]')).toBeTruthy();
    expect(screen.getByText(dict.pulsar.admin.table.dataModeShared)).toBeInTheDocument();
    expect(screen.getByText(dict.pulsar.admin.table.migrationBehind)).toBeInTheDocument();
    expect(screen.getByText("owner@example.com")).toBeInTheDocument();
    expect(screen.getByText("1 de 3")).toBeInTheDocument();
    expect(screen.getByText(dict.pulsar.admin.table.pulsarMail)).toBeInTheDocument();
    expect(screen.getByText("12 de 50")).toBeInTheDocument();
    expect(screen.getByText(dict.pulsar.admin.table.chartTitle)).toBeInTheDocument();
    expect(screen.getByText(dict.pulsar.admin.table.vercelMissing)).toBeInTheDocument();
  });

  it("does not ask for payment encryption or KV on create or edit", () => {
    const { unmount } = render(
      <PulsarAdminTenantForm locale="es" dict={dict} />,
    );
    expect(
      screen.queryByRole("heading", { name: dict.pulsar.admin.form.sectionPaymentsKv }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByLabelText(dict.pulsar.admin.form.fields.paymentGatewaySecretEncryptionKey),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByLabelText(dict.pulsar.admin.form.fields.kvRestApiUrl),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByLabelText(dict.pulsar.admin.form.fields.kvRestApiToken),
    ).not.toBeInTheDocument();
    unmount();

    render(
      <PulsarAdminTenantForm locale="es" dict={dict} initialTenant={SAMPLE_TENANT} />,
    );
    expect(
      screen.queryByRole("heading", { name: dict.pulsar.admin.form.sectionPaymentsKv }),
    ).not.toBeInTheDocument();
  });

  it("opens a new tenant with defaults and builds the preview host from the slug", async () => {
    const user = userEvent.setup();
    render(
      <PulsarAdminTenantForm locale="es" dict={dict} pulsarHosts={["centrolisto.cl"]} />,
    );
    expect(screen.getByLabelText(dict.pulsar.admin.form.dataModeShared)).toBeChecked();
    expect(screen.getByLabelText(dict.pulsar.admin.form.fields.pulsarMailQuota)).toHaveValue(50);
    expect(screen.getAllByText(dict.pulsar.admin.form.requiredMark).length).toBeGreaterThan(0);
    expect(screen.getByText(dict.pulsar.admin.form.previewHostEmpty)).toBeInTheDocument();
    await user.type(screen.getByLabelText(dict.pulsar.admin.form.fields.slug), "nago");
    expect(screen.getByText("nago.centrolisto.cl")).toBeInTheDocument();
    const later = screen.getByText(dict.pulsar.admin.form.laterTitle).closest("details");
    expect(later).toHaveProperty("open", false);
  });

  it("shows the migration file while a shared schema save runs", async () => {
    let finish: (value: { ok: true; slug: string }) => void = () => {};
    saveMock.mockImplementation(
      () =>
        new Promise((resolve) => {
          finish = resolve;
        }),
    );
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        text: async () => "",
        json: async () => ({
          status: "running",
          current: 12,
          total: 200,
          message: "migration",
          fileName: "194_registration_enrollment_fee_checkout.sql",
          activity: [
            { code: "migration", meta: { file: "194_registration_enrollment_fee_checkout.sql" } },
          ],
        }),
      }),
    );
    const user = userEvent.setup();
    render(
      <PulsarAdminTenantForm locale="es" dict={dict} pulsarHosts={["centrolisto.cl"]} />,
    );
    await user.type(screen.getByLabelText(dict.pulsar.admin.form.fields.slug), "test");
    await user.type(screen.getByLabelText(dict.pulsar.admin.form.fields.displayName), "Instituto Test");
    await user.click(screen.getByRole("button", { name: dict.pulsar.admin.form.saveCta }));
    expect(
      await screen.findByRole("heading", { name: dict.pulsar.admin.form.provision.title }),
    ).toBeInTheDocument();
    expect(
      await screen.findAllByText("Aplicando 194_registration_enrollment_fee_checkout.sql"),
    ).not.toHaveLength(0);
    finish({ ok: true, slug: "test" });
    await waitFor(() => expect(pushMock).toHaveBeenCalled());
    vi.unstubAllGlobals();
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

  it("shows the mail status and an approved account on their tabs", async () => {
    const user = userEvent.setup();
    render(
      <PulsarAdminFleetScreen
        locale="es"
        dict={dict}
        staffEmail="admin@pulsarlab.cl"
        sessionMode="pulsar-db"
        tenants={[SAMPLE_TENANT]}
        telemetryBySlug={TELEMETRY}
        owners={[{ userId: "00000000-0000-0000-0000-000000000001", email: "owner@example.com", status: "approved" }]}
        mailSettings={{ fromEmail: "hola@example.com", notifyEmail: "admin@example.com", hasApiKey: true, last: null }}
      />,
    );

    expect(screen.queryByText(dict.pulsar.admin.eyebrow)).not.toBeInTheDocument();
    await user.click(screen.getByRole("tab", { name: dict.pulsar.admin.tabMail }));
    expect(screen.getByText(dict.pulsar.admin.mail.keySaved)).toBeInTheDocument();
    await user.click(screen.getByRole("tab", { name: dict.pulsar.admin.tabAccounts }));
    expect(screen.getByText("owner@example.com")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: dict.pulsar.admin.owners.approved })).toBeInTheDocument();
  });
});

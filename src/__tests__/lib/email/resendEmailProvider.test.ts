/** @vitest-environment node */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { Resend } from "resend";

const sendMock = vi.fn();
const reserveMock = vi.fn();
const releaseMock = vi.fn();
const loadPulsarMailMock = vi.fn();

vi.mock("resend", () => ({
  Resend: vi.fn().mockImplementation(() => ({
    emails: { send: (...a: unknown[]) => sendMock(...a) },
  })),
}));

vi.mock("@/lib/pulsar/tenantPulsarMailQuota", () => ({
  reservePulsarMailSend: (...args: unknown[]) => reserveMock(...args),
  releasePulsarMailSend: (...args: unknown[]) => releaseMock(...args),
}));

vi.mock("@/lib/pulsar/pulsarMail", () => ({
  loadPulsarOutboundMailAccount: () => loadPulsarMailMock(),
}));

const nago = {
  slug: "nago",
  hosts: ["capoeiranago.cl"],
  supabaseUrl: "https://nago.supabase.co",
  supabaseAnonKey: "anon-nago",
  supabaseServiceRoleKey: "service-nago",
  resendApiKey: "re_nago",
  resendFromEmail: "Nago <notify@nago.cl>",
};

describe("ResendEmailProvider", () => {
  const prevKey = process.env.RESEND_API_KEY;
  const prevFrom = process.env.RESEND_FROM_EMAIL;
  const prevTenants = process.env.TENANTS_CONFIG_JSON;

  beforeEach(async () => {
    vi.resetModules();
    sendMock.mockReset();
    reserveMock.mockReset();
    releaseMock.mockReset();
    loadPulsarMailMock.mockReset();
    vi.mocked(Resend).mockClear();
    delete process.env.PULSAR_SUPABASE_URL;
    delete process.env.PULSAR_SUPABASE_SERVICE_ROLE_KEY;
    process.env.RESEND_API_KEY = "re_test_key";
    process.env.RESEND_FROM_EMAIL = "notify@example.com";
  });

  afterEach(() => {
    process.env.RESEND_API_KEY = prevKey;
    process.env.RESEND_FROM_EMAIL = prevFrom;
    if (prevTenants === undefined) delete process.env.TENANTS_CONFIG_JSON;
    else process.env.TENANTS_CONFIG_JSON = prevTenants;
  });

  it("returns error when RESEND_API_KEY is missing", async () => {
    process.env.RESEND_API_KEY = "";
    const { ResendEmailProvider } = await import("@/lib/email/resendEmailProvider");
    const p = new ResendEmailProvider();
    const r = await p.sendEmail({ to: "a@b.com", subject: "s", html: "<p>x</p>" });
    expect(r).toEqual({ ok: false, error: "RESEND_API_KEY missing" });
  });

  it("returns error when RESEND_FROM_EMAIL is missing", async () => {
    process.env.RESEND_FROM_EMAIL = "  ";
    const { ResendEmailProvider } = await import("@/lib/email/resendEmailProvider");
    const p = new ResendEmailProvider();
    const r = await p.sendEmail({ to: "a@b.com", subject: "s", html: "<p>x</p>" });
    expect(r.ok).toBe(false);
    expect((r as { error: string }).error).toContain("RESEND_FROM_EMAIL");
  });

  it("returns ok when Resend succeeds", async () => {
    sendMock.mockResolvedValue({ data: {}, error: null });
    const { ResendEmailProvider } = await import("@/lib/email/resendEmailProvider");
    const p = new ResendEmailProvider();
    const r = await p.sendEmail({ to: "a@b.com", subject: "s", html: "<p>x</p>" });
    expect(r).toEqual({ ok: true });
    expect(sendMock).toHaveBeenCalled();
  });

  it("sends with the tenant resend api key", async () => {
    process.env.TENANTS_CONFIG_JSON = JSON.stringify([nago]);
    process.env.RESEND_API_KEY = "re_shared";
    sendMock.mockResolvedValue({ data: {}, error: null });
    const { ResendEmailProvider } = await import("@/lib/email/resendEmailProvider");
    const { getTenantBySlug } = await import("@/lib/tenant/tenantRegistry");
    const { runWithTenant } = await import("@/lib/tenant/tenantAls");
    const tenant = getTenantBySlug("nago");
    expect(tenant).not.toBeNull();
    const p = new ResendEmailProvider();
    const r = await runWithTenant(tenant!, () =>
      p.sendEmail({ to: "a@b.com", subject: "s", html: "<p>x</p>" }),
    );
    expect(r).toEqual({ ok: true });
    expect(Resend).toHaveBeenCalledWith("re_nago");
    expect(sendMock).toHaveBeenCalledWith(expect.objectContaining({ from: "Nago <notify@nago.cl>" }));
  });

  it("ignores the shared Resend key when the tenant omits its own", async () => {
    process.env.TENANTS_CONFIG_JSON = JSON.stringify([
      { ...nago, resendApiKey: undefined, resendFromEmail: undefined },
    ]);
    process.env.RESEND_API_KEY = "re_shared";
    process.env.RESEND_FROM_EMAIL = "shared@example.com";
    const { ResendEmailProvider } = await import("@/lib/email/resendEmailProvider");
    const { getTenantBySlug } = await import("@/lib/tenant/tenantRegistry");
    const { runWithTenant } = await import("@/lib/tenant/tenantAls");
    const tenant = getTenantBySlug("nago");
    expect(tenant?.resendApiKey).toBeNull();
    const p = new ResendEmailProvider();
    const r = await runWithTenant(tenant!, () =>
      p.sendEmail({ to: "a@b.com", subject: "s", html: "<p>x</p>" }),
    );
    expect(r).toEqual({ ok: false, error: "RESEND_API_KEY missing" });
    expect(Resend).not.toHaveBeenCalled();
  });

  it("sends through the Pulsar account when the institute has no Resend key", async () => {
    process.env.TENANTS_CONFIG_JSON = JSON.stringify([
      { ...nago, resendApiKey: undefined, resendFromEmail: undefined },
    ]);
    process.env.PULSAR_SUPABASE_URL = "https://pulsar.supabase.co";
    process.env.PULSAR_SUPABASE_SERVICE_ROLE_KEY = "service-pulsar";
    process.env.RESEND_API_KEY = "re_shared";
    loadPulsarMailMock.mockResolvedValue({
      key: "re_pulsar",
      from: "Pulsar <mail@centrolisto.cl>",
    });
    reserveMock.mockResolvedValue("reserved");
    sendMock.mockResolvedValue({ data: {}, error: null });
    const { ResendEmailProvider } = await import("@/lib/email/resendEmailProvider");
    const { getTenantBySlug } = await import("@/lib/tenant/tenantRegistry");
    const { runWithTenant } = await import("@/lib/tenant/tenantAls");
    const tenant = getTenantBySlug("nago");
    const p = new ResendEmailProvider();
    const r = await runWithTenant(tenant!, () =>
      p.sendEmail({ to: "a@b.com", subject: "s", html: "<p>x</p>" }),
    );
    expect(r).toEqual({ ok: true });
    expect(Resend).toHaveBeenCalledWith("re_pulsar");
    expect(sendMock).toHaveBeenCalledWith(
      expect.objectContaining({ from: "Pulsar <mail@centrolisto.cl>" }),
    );
    expect(reserveMock).toHaveBeenCalledWith("nago");
    expect(releaseMock).not.toHaveBeenCalled();
  });

  it("stops at the Pulsar mail cap and releases a slot when Resend rejects the send", async () => {
    process.env.TENANTS_CONFIG_JSON = JSON.stringify([
      { ...nago, resendApiKey: undefined, resendFromEmail: undefined },
    ]);
    process.env.PULSAR_SUPABASE_URL = "https://pulsar.supabase.co";
    process.env.PULSAR_SUPABASE_SERVICE_ROLE_KEY = "service-pulsar";
    loadPulsarMailMock.mockResolvedValue({
      key: "re_pulsar",
      from: "Pulsar <mail@centrolisto.cl>",
    });
    reserveMock.mockResolvedValueOnce("quota");
    const { ResendEmailProvider } = await import("@/lib/email/resendEmailProvider");
    const { getTenantBySlug } = await import("@/lib/tenant/tenantRegistry");
    const { runWithTenant } = await import("@/lib/tenant/tenantAls");
    const tenant = getTenantBySlug("nago");
    const blocked = new ResendEmailProvider();
    const blockedResult = await runWithTenant(tenant!, () =>
      blocked.sendEmail({ to: "a@b.com", subject: "s", html: "<p>x</p>" }),
    );
    expect(blockedResult).toEqual({ ok: false, error: "pulsar_mail_quota" });
    expect(sendMock).not.toHaveBeenCalled();

    reserveMock.mockResolvedValueOnce("reserved");
    sendMock.mockResolvedValue({ data: null, error: { message: "blocked" } });
    const failed = new ResendEmailProvider();
    const failedResult = await runWithTenant(tenant!, () =>
      failed.sendEmail({ to: "a@b.com", subject: "s", html: "<p>x</p>" }),
    );
    expect(failedResult).toEqual({ ok: false, error: "blocked" });
    expect(releaseMock).toHaveBeenCalledWith("nago");
  });

  it("returns error when Resend returns error", async () => {
    sendMock.mockResolvedValue({ data: null, error: { message: "blocked" } });
    const { ResendEmailProvider } = await import("@/lib/email/resendEmailProvider");
    const p = new ResendEmailProvider();
    const r = await p.sendEmail({ to: "a@b.com", subject: "s", html: "<p>x</p>" });
    expect(r).toEqual({ ok: false, error: "blocked" });
  });
});

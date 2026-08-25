import { beforeEach, describe, expect, it, vi } from "vitest";

const mockAssertAdmin = vi.fn();
const mockCreateClient = vi.fn();
const recordSystemAudit = vi.fn();
const revalidatePath = vi.fn();

vi.mock("@/lib/dashboard/assertAdmin", () => ({
  assertAdmin: () => mockAssertAdmin(),
}));
vi.mock("@/lib/supabase/server", () => ({
  createClient: () => mockCreateClient(),
}));
vi.mock("@/lib/analytics/server/recordSystemAudit", () => ({
  recordSystemAudit,
}));
vi.mock("next/cache", () => ({
  revalidatePath,
}));

function clientWithMap(value: unknown, upsertImpl?: ReturnType<typeof vi.fn>) {
  const upsert = upsertImpl ?? vi.fn().mockResolvedValue({ error: null });
  return {
    upsert,
    client: {
      from: () => ({
        select: () => ({
          eq: () => ({
            maybeSingle: async () => ({ data: { value }, error: null }),
          }),
        }),
        upsert,
      }),
    },
  };
}

describe("setEmailSendEnabledAction", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns ok false when admin check fails", async () => {
    mockAssertAdmin.mockRejectedValue(new Error("no"));
    const { setEmailSendEnabledAction } = await import(
      "@/app/[locale]/dashboard/admin/settings/emailSendsSettingsActions"
    );
    expect(
      await setEmailSendEnabledAction({
        locale: "es",
        templateKey: "churn.inactivity",
        enabled: false,
      }),
    ).toEqual({ ok: false });
  });

  it("rejects an unknown template key without writing", async () => {
    mockAssertAdmin.mockResolvedValue({});
    const { upsert, client } = clientWithMap({});
    mockCreateClient.mockResolvedValue(client);
    const { setEmailSendEnabledAction } = await import(
      "@/app/[locale]/dashboard/admin/settings/emailSendsSettingsActions"
    );
    expect(
      await setEmailSendEnabledAction({
        locale: "es",
        templateKey: "does.not.exist",
        enabled: false,
      }),
    ).toEqual({ ok: false });
    expect(upsert).not.toHaveBeenCalled();
  });

  it("merges the map and upserts email_sends_enabled", async () => {
    mockAssertAdmin.mockResolvedValue({});
    const { upsert, client } = clientWithMap({ "churn.inactivity": true });
    mockCreateClient.mockResolvedValue(client);
    const { setEmailSendEnabledAction } = await import(
      "@/app/[locale]/dashboard/admin/settings/emailSendsSettingsActions"
    );
    expect(
      await setEmailSendEnabledAction({
        locale: "es",
        templateKey: "billing.overdue_balance_reminder",
        enabled: false,
      }),
    ).toEqual({ ok: true });
    expect(upsert).toHaveBeenCalledTimes(1);
    const row = upsert.mock.calls[0][0] as { key: string; value: Record<string, boolean> };
    expect(row.key).toBe("email_sends_enabled");
    expect(row.value).toEqual({
      "churn.inactivity": true,
      "billing.overdue_balance_reminder": false,
    });
    expect(recordSystemAudit).toHaveBeenCalledWith(
      expect.objectContaining({
        action: "email_sends_enabled_upsert",
        resourceType: "site_settings",
        payload: { templateKey: "billing.overdue_balance_reminder", enabled: false },
      }),
    );
    expect(revalidatePath).toHaveBeenCalledWith("/es/dashboard/admin/settings");
  });

  it("dual-writes class_reminders_enabled for the class-reminder template", async () => {
    mockAssertAdmin.mockResolvedValue({});
    const { upsert, client } = clientWithMap({});
    mockCreateClient.mockResolvedValue(client);
    const { setEmailSendEnabledAction } = await import(
      "@/app/[locale]/dashboard/admin/settings/emailSendsSettingsActions"
    );
    expect(
      await setEmailSendEnabledAction({
        locale: "en",
        templateKey: "notifications.class_reminder_prep",
        enabled: true,
      }),
    ).toEqual({ ok: true });
    const keys = upsert.mock.calls.map((c) => (c[0] as { key: string }).key);
    expect(keys).toEqual(["email_sends_enabled", "class_reminders_enabled"]);
    expect((upsert.mock.calls[1][0] as { value: boolean }).value).toBe(true);
  });
});

/** @vitest-environment node */
import { beforeEach, describe, expect, it, vi } from "vitest";

const { requireAdminEventActor, createAdminClient, inserted } = vi.hoisted(() => {
  const inserted: unknown[] = [];
  return {
    inserted,
    requireAdminEventActor: vi.fn(async () => "admin-1"),
    createAdminClient: vi.fn(),
  };
});

vi.mock("@/app/[locale]/dashboard/admin/events/eventActionsShared", () => ({
  requireAdminEventActor: () => requireAdminEventActor(),
  adminEventsPath: (locale: string) => `/${locale}/dashboard/admin/events`,
}));

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => createAdminClient(),
}));

vi.mock("@/lib/analytics/server/recordSystemAudit", () => ({
  recordSystemAudit: vi.fn(async () => ({ ok: true })),
}));

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

vi.mock("@/lib/logging/serverActionLog", () => ({
  logSupabaseClientError: vi.fn(),
  logServerException: vi.fn(),
}));

import { saveEventEmailTemplateAction } from "@/app/[locale]/dashboard/admin/events/eventEmailTemplateActions";

const eventId = "11111111-1111-4111-8111-111111111111";

describe("saveEventEmailTemplateAction", () => {
  beforeEach(() => {
    inserted.length = 0;
    requireAdminEventActor.mockResolvedValue("admin-1");
    createAdminClient.mockReset();
    createAdminClient.mockReturnValue({
      from: () => ({
        select: () => ({
          eq: () => ({
            eq: () => ({
              eq: () => ({
                is: () => ({
                  maybeSingle: async () => ({ data: null, error: null }),
                }),
              }),
            }),
          }),
        }),
        insert: async (row: unknown) => {
          inserted.push(row);
          return { error: null };
        },
      }),
    });
  });

  it("rejects a flow id on the reminder", async () => {
    const result = await saveEventEmailTemplateAction({
      eventId,
      templateKey: "events.reminder",
      locale: "es",
      flowId: "22222222-2222-4222-8222-222222222222",
      subject: "Recordatorio",
      bodyHtml: "<p>Hola</p>",
    });
    expect(result).toEqual({ ok: false, message: "validation_failed" });
    expect(createAdminClient).not.toHaveBeenCalled();
  });

  it("rejects a body that sanitizes to empty", async () => {
    const result = await saveEventEmailTemplateAction({
      eventId,
      templateKey: "events.registered",
      locale: "es",
      flowId: null,
      subject: "Hola",
      bodyHtml: "<script>alert(1)</script>",
    });
    expect(result).toEqual({ ok: false, message: "invalid_html" });
    expect(inserted).toHaveLength(0);
  });

  it("stores the message without a script", async () => {
    const result = await saveEventEmailTemplateAction({
      eventId,
      templateKey: "events.registered",
      locale: "es",
      flowId: null,
      subject: "Hola",
      bodyHtml: "<p>Hola</p><script>alert(1)</script>",
    });
    expect(result).toEqual({ ok: true });
    expect(JSON.stringify(inserted[0])).toContain("Hola");
    expect(JSON.stringify(inserted[0])).not.toContain("<script");
  });

  it("rejects a caller who is not an admin and a payload that fails validation", async () => {
    requireAdminEventActor.mockResolvedValueOnce(null);
    await expect(
      saveEventEmailTemplateAction({
        eventId,
        templateKey: "events.registered",
        locale: "es",
        flowId: null,
        subject: "Hola",
        bodyHtml: "<p>Hola</p>",
      }),
    ).resolves.toEqual({ ok: false, message: "forbidden" });

    await expect(
      saveEventEmailTemplateAction({
        eventId,
        templateKey: "events.registered",
        locale: "es",
        flowId: null,
        subject: " ",
        bodyHtml: "<p>Hola</p>",
      }),
    ).resolves.toEqual({ ok: false, message: "validation_failed" });
  });

  it("rejects a flow that does not belong to the event", async () => {
    createAdminClient.mockReturnValue(adminClient({ flow: { data: null, error: null } }));
    const result = await saveEventEmailTemplateAction(flowInput());
    expect(result).toEqual({ ok: false, message: "validation_failed" });
  });

  it("updates an existing flow copy", async () => {
    const updated: unknown[] = [];
    createAdminClient.mockReturnValue(
      adminClient({
        flow: { data: { id: "22222222-2222-4222-8222-222222222222" }, error: null },
        existing: { data: { id: "row-1" }, error: null },
        onUpdate: (row) => updated.push(row),
      }),
    );
    const result = await saveEventEmailTemplateAction(flowInput());
    expect(result).toEqual({ ok: true });
    expect(updated[0]).toEqual(expect.objectContaining({ subject: "Flujo" }));
  });

  it("returns save_failed when the lookup or the write fails", async () => {
    createAdminClient.mockReturnValue(
      adminClient({ existing: { data: null, error: { message: "lookup" } } }),
    );
    await expect(
      saveEventEmailTemplateAction(eventInput()),
    ).resolves.toEqual({ ok: false, message: "save_failed" });

    createAdminClient.mockReturnValue(adminClient({ writeError: { message: "write" } }));
    await expect(
      saveEventEmailTemplateAction(eventInput()),
    ).resolves.toEqual({ ok: false, message: "save_failed" });
  });

  it("returns save_failed when the admin client throws", async () => {
    createAdminClient.mockImplementation(() => {
      throw new Error("no admin");
    });
    await expect(
      saveEventEmailTemplateAction(eventInput()),
    ).resolves.toEqual({ ok: false, message: "save_failed" });
  });
});

function eventInput() {
  return {
    eventId,
    templateKey: "events.registered" as const,
    locale: "es" as const,
    flowId: null,
    subject: "Hola",
    bodyHtml: "<p>Hola</p>",
  };
}

function flowInput() {
  return {
    ...eventInput(),
    subject: "Flujo",
    flowId: "22222222-2222-4222-8222-222222222222",
  };
}

function adminClient(options: {
  flow?: { data: { id: string } | null; error: { message: string } | null };
  existing?: { data: { id: string } | null; error: { message: string } | null };
  writeError?: { message: string } | null;
  onUpdate?: (row: unknown) => void;
}) {
  let reads = 0;
  return {
    from: () => {
      const self = {
        select() {
          return self;
        },
        eq() {
          return self;
        },
        is() {
          return self;
        },
        maybeSingle: async () => {
          reads += 1;
          if (options.flow && reads === 1) return options.flow;
          return options.existing ?? { data: null, error: null };
        },
        insert: async (row: unknown) => {
          inserted.push(row);
          return { error: options.writeError ?? null };
        },
        update: (row: unknown) => ({
          eq: async () => {
            options.onUpdate?.(row);
            return { error: options.writeError ?? null };
          },
        }),
      };
      return self;
    },
  };
}

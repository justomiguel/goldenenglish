/** @vitest-environment node */
import { beforeEach, describe, expect, it, vi } from "vitest";

const { state, loadEmailTemplate } = vi.hoisted(() => {
  const state = {
    rows: [] as Array<Record<string, unknown>> | null,
    error: null as { message: string } | null,
    explode: false,
  };
  return { state, loadEmailTemplate: vi.fn() };
});

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => {
    if (state.explode) throw new Error("no admin");
    const builder = {
      select() {
        return builder;
      },
      eq() {
        return builder;
      },
      then(resolve: (value: unknown) => void) {
        resolve({ data: state.rows, error: state.error });
      },
    };
    return { from: () => builder };
  },
}));

vi.mock("@/lib/email/templates/loadEmailTemplate", () => ({
  loadEmailTemplate: (...args: unknown[]) => loadEmailTemplate(...args),
}));

vi.mock("@/lib/logging/serverActionLog", () => ({
  logSupabaseClientError: vi.fn(),
  logServerException: vi.fn(),
}));

import { loadResolvedEventEmail } from "@/lib/events/server/loadResolvedEventEmail";

describe("loadResolvedEventEmail", () => {
  beforeEach(() => {
    state.rows = [];
    state.error = null;
    state.explode = false;
    loadEmailTemplate.mockReset();
  });

  it("uses the flow copy and escapes variables", async () => {
    state.rows = [
      {
        template_key: "events.registered",
        locale: "es",
        flow_id: null,
        subject: "Evento",
        body_html: "<p>evento</p>",
      },
      {
        template_key: "events.registered",
        locale: "es",
        flow_id: "flow-1",
        subject: "Hola {{firstName}}",
        body_html: "<p>{{firstName}}</p>",
      },
    ];

    const resolved = await loadResolvedEventEmail({
      eventId: "event-1",
      templateKey: "events.registered",
      locale: "es",
      flowId: "flow-1",
      vars: { firstName: "A<na" },
    });

    expect(resolved).toEqual({
      subject: "Hola A&lt;na",
      bodyHtml: "<p>A&lt;na</p>",
      fromOverride: true,
    });
    expect(loadEmailTemplate).not.toHaveBeenCalled();
  });

  it("falls through to the institute template when the event has no copy", async () => {
    loadEmailTemplate.mockResolvedValue({
      subject: "Instituto",
      bodyHtml: "<p>Ana</p>",
      fromOverride: false,
    });

    const resolved = await loadResolvedEventEmail({
      eventId: "event-1",
      templateKey: "events.registered",
      locale: "es",
      vars: { firstName: "A<na" },
    });

    expect(resolved?.subject).toBe("Instituto");
    expect(loadEmailTemplate).toHaveBeenCalledWith(
      expect.objectContaining({ vars: expect.objectContaining({ firstName: "A&lt;na" }) }),
    );
  });

  it("ignores a flow row for the reminder", async () => {
    state.rows = [
      {
        template_key: "events.reminder",
        locale: "es",
        flow_id: "flow-1",
        subject: "Flujo",
        body_html: "<p>flujo</p>",
      },
      {
        template_key: "events.reminder",
        locale: "es",
        flow_id: null,
        subject: "Evento",
        body_html: "<p>evento</p>",
      },
    ];

    const resolved = await loadResolvedEventEmail({
      eventId: "event-1",
      templateKey: "events.reminder",
      locale: "es",
      flowId: "flow-1",
    });

    expect(resolved?.subject).toBe("Evento");
  });

  it("returns null when the institute template is missing", async () => {
    loadEmailTemplate.mockResolvedValue(null);
    const resolved = await loadResolvedEventEmail({
      eventId: "event-1",
      templateKey: "events.registered",
      locale: "pt",
    });
    expect(resolved).toBeNull();
  });

  it("falls back to the institute template when the copy query fails", async () => {
    state.error = { message: "db down" };
    loadEmailTemplate.mockResolvedValue({
      subject: "Instituto",
      bodyHtml: "<p></p>",
      fromOverride: false,
    });
    const resolved = await loadResolvedEventEmail({
      eventId: "event-1",
      templateKey: "events.registered",
      locale: "es",
    });
    expect(resolved?.subject).toBe("Instituto");
  });

  it("falls back when the admin client cannot be created", async () => {
    state.explode = true;
    loadEmailTemplate.mockResolvedValue({
      subject: "Instituto",
      bodyHtml: "<p></p>",
      fromOverride: true,
    });
    const resolved = await loadResolvedEventEmail({
      eventId: "event-1",
      templateKey: "events.registered",
      locale: "es",
    });
    expect(resolved?.fromOverride).toBe(true);
  });

  it("treats a missing row list and blank fields as empty copy", async () => {
    state.rows = [
      {
        template_key: "events.registered",
        locale: "es",
        flow_id: null,
        subject: null,
        body_html: null,
      },
    ];
    const resolved = await loadResolvedEventEmail({
      eventId: "event-1",
      templateKey: "events.registered",
      locale: "es",
    });
    expect(resolved).toEqual({ subject: "", bodyHtml: "", fromOverride: true });

    state.rows = null;
    loadEmailTemplate.mockResolvedValue({
      subject: "Instituto",
      bodyHtml: "<p></p>",
      fromOverride: false,
    });
    const fallback = await loadResolvedEventEmail({
      eventId: "event-1",
      templateKey: "events.registered",
      locale: "es",
    });
    expect(fallback?.subject).toBe("Instituto");
  });
});

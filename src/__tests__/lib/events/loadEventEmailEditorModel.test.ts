/** @vitest-environment node */
import { beforeEach, describe, expect, it, vi } from "vitest";

const { scene } = vi.hoisted(() => ({
  scene: {
    copies: [] as Array<Record<string, unknown>> | null,
    catalog: [] as Array<Record<string, unknown>> | null,
    copiesError: null as { message: string } | null,
    catalogError: null as { message: string } | null,
    explode: false,
  },
}));

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => {
    if (scene.explode) throw new Error("no admin");
    return {
      from: (table: string) => {
        const builder = {
          select() {
            return builder;
          },
          eq() {
            return builder;
          },
          in() {
            return builder;
          },
          limit() {
            return builder;
          },
          then(resolve: (value: unknown) => void) {
            resolve(
              table === "event_email_templates"
                ? { data: scene.copies, error: scene.copiesError }
                : { data: scene.catalog, error: scene.catalogError },
            );
          },
        };
        return builder;
      },
    };
  },
}));

vi.mock("@/lib/logging/serverActionLog", () => ({
  logSupabaseClientError: vi.fn(),
}));

import { loadEventEmailEditorModel } from "@/lib/events/server/loadEventEmailEditorModel";

describe("loadEventEmailEditorModel", () => {
  beforeEach(() => {
    scene.copies = [];
    scene.catalog = [];
    scene.copiesError = null;
    scene.catalogError = null;
    scene.explode = false;
  });

  it("keeps saved copies and institute overrides", async () => {
    scene.copies = [
      {
        template_key: "events.registered",
        locale: "es",
        flow_id: "flow-1",
        subject: "Flujo",
        body_html: "<p>Flujo</p>",
      },
      {
        template_key: "not-a-mail",
        locale: "es",
        flow_id: null,
        subject: null,
        body_html: null,
      },
    ];
    scene.catalog = [
      {
        template_key: "events.reminder",
        locale: "en",
        subject: "Override",
        body_html: "<p>Override</p>",
      },
      { template_key: "events.reminder", locale: "fr", subject: "No", body_html: "<p>No</p>" },
      { template_key: "other", locale: "es", subject: "No", body_html: "<p>No</p>" },
    ];

    const model = await loadEventEmailEditorModel("event-1");
    expect(model.copies).toEqual([
      {
        templateKey: "events.registered",
        locale: "es",
        flowId: "flow-1",
        subject: "Flujo",
        bodyHtml: "<p>Flujo</p>",
      },
    ]);
    expect(model.fallbacks["events.reminder"].en.subject).toBe("Override");
    expect(model.fallbacks["events.registered"].es.subject.length).toBeGreaterThan(0);
  });

  it("returns registry defaults when the queries fail or the client throws", async () => {
    scene.copiesError = { message: "copies" };
    scene.catalogError = { message: "catalog" };
    scene.copies = null;
    scene.catalog = null;
    const failed = await loadEventEmailEditorModel("event-1");
    expect(failed.copies).toEqual([]);
    expect(failed.fallbacks["events.registered"].pt.subject.length).toBeGreaterThan(0);

    scene.explode = true;
    const thrown = await loadEventEmailEditorModel("event-1");
    expect(thrown.copies).toEqual([]);
  });
});

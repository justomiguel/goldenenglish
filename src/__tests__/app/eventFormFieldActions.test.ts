/** @vitest-environment node */
// REGRESSION CHECK: Updating event form fields must not change field_key/field_type,
// must merge locale label/options into existing JSONB, and must revalidate public register.
import { beforeEach, describe, expect, it, vi } from "vitest";
import { updateEventFormFieldAction } from "@/app/[locale]/dashboard/admin/events/eventFormFieldActions";

const {
  mockRequireAdminEventActor,
  createAdminClient,
  recordSystemAudit,
  revalidatePath,
} = vi.hoisted(() => ({
  mockRequireAdminEventActor: vi.fn(),
  createAdminClient: vi.fn(),
  recordSystemAudit: vi.fn().mockResolvedValue({ ok: true }),
  revalidatePath: vi.fn(),
}));

vi.mock("@/app/[locale]/dashboard/admin/events/eventActionsShared", async (importOriginal) => {
  const actual = await importOriginal<
    typeof import("@/app/[locale]/dashboard/admin/events/eventActionsShared")
  >();
  return {
    ...actual,
    requireAdminEventActor: () => mockRequireAdminEventActor(),
  };
});

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => createAdminClient(),
}));

vi.mock("@/lib/analytics/server/recordSystemAudit", () => ({
  recordSystemAudit,
}));

vi.mock("next/cache", () => ({
  revalidatePath,
}));

const FIELD_ID = "00000000-0000-4000-8000-0000000000a1";
const EVENT_ID = "00000000-0000-4000-8000-0000000000e1";
const ACTOR = "00000000-0000-4000-8000-0000000000u1";

function buildAdminClient(opts: {
  field?: Record<string, unknown> | null;
  lookupError?: { message: string } | null;
  updateError?: { message: string } | null;
  slug?: string | null;
} = {}) {
  const field =
    "field" in opts
      ? opts.field
      : {
          id: FIELD_ID,
          event_id: EVENT_ID,
          field_key: "school_name",
          field_type: "select",
          label_i18n: { es: "Colegio", en: "School" },
          options_i18n: { es: ["A", "B"], en: ["A", "B"] },
          required: false,
          allowed_mime_types: [],
          archived_at: null,
        };
  const update = vi.fn().mockReturnValue({
    eq: vi.fn().mockResolvedValue({ error: opts.updateError ?? null }),
  });
  const from = vi.fn((table: string) => {
    if (table === "event_form_fields") {
      return {
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            maybeSingle: vi.fn().mockResolvedValue({
              data: field,
              error: opts.lookupError ?? null,
            }),
          }),
        }),
        update,
      };
    }
    if (table === "events") {
      return {
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            maybeSingle: vi.fn().mockResolvedValue({
              data: opts.slug === null ? null : { slug: opts.slug ?? "summer-camp" },
              error: null,
            }),
          }),
        }),
      };
    }
    throw new Error(`unexpected table ${table}`);
  });
  return { from, update };
}

describe("updateEventFormFieldAction", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRequireAdminEventActor.mockResolvedValue(ACTOR);
  });

  it("rejects when not admin", async () => {
    mockRequireAdminEventActor.mockResolvedValue(null);
    const res = await updateEventFormFieldAction({
      locale: "es",
      fieldId: FIELD_ID,
      label: "Colegio",
      required: true,
    });
    expect(res).toEqual({ ok: false, message: "forbidden" });
  });

  it("rejects invalid payload", async () => {
    const res = await updateEventFormFieldAction({
      locale: "es",
      fieldId: "not-a-uuid",
      label: "Colegio",
      required: true,
    });
    expect(res).toEqual({ ok: false, message: "validation_failed" });
  });

  it("rejects archived fields", async () => {
    createAdminClient.mockReturnValue(
      buildAdminClient({
        field: {
          id: FIELD_ID,
          event_id: EVENT_ID,
          field_key: "school_name",
          field_type: "text",
          label_i18n: { es: "Colegio" },
          options_i18n: {},
          required: false,
          allowed_mime_types: [],
          archived_at: "2026-01-01T00:00:00Z",
        },
      }),
    );
    const res = await updateEventFormFieldAction({
      locale: "es",
      fieldId: FIELD_ID,
      label: "Nuevo",
      required: false,
    });
    expect(res).toEqual({ ok: false, message: "field_archived" });
  });

  it("rejects select updates with fewer than two options", async () => {
    createAdminClient.mockReturnValue(buildAdminClient());
    const res = await updateEventFormFieldAction({
      locale: "es",
      fieldId: FIELD_ID,
      label: "Colegio",
      required: false,
      selectOptions: ["Solo una"],
    });
    expect(res).toEqual({ ok: false, message: "invalid_select_options" });
  });

  it("merges select options for active locale, audits, and revalidates public register", async () => {
    const client = buildAdminClient();
    createAdminClient.mockReturnValue(client);

    const res = await updateEventFormFieldAction({
      locale: "es",
      fieldId: FIELD_ID,
      label: "Colegio actualizado",
      required: true,
      selectOptions: ["A", "B", "C"],
    });

    expect(res).toEqual({ ok: true });
    expect(client.update).toHaveBeenCalledWith({
      label_i18n: { es: "Colegio actualizado", en: "School" },
      options_i18n: { es: ["A", "B", "C"], en: ["A", "B"] },
      required: true,
      allowed_mime_types: [],
    });
    expect(recordSystemAudit).toHaveBeenCalledWith(
      expect.objectContaining({
        action: "event_form_field_updated",
        resourceType: "event_form_field",
        resourceId: FIELD_ID,
        payload: expect.objectContaining({
          event_id: EVENT_ID,
          field_key: "school_name",
          field_type: "select",
        }),
      }),
    );
    expect(revalidatePath).toHaveBeenCalledWith("/es/dashboard/admin/events", "page");
    expect(revalidatePath).toHaveBeenCalledWith(`/es/dashboard/admin/events/${EVENT_ID}`, "page");
    expect(revalidatePath).toHaveBeenCalledWith("/es/events/summer-camp", "page");
    expect(revalidatePath).toHaveBeenCalledWith("/es/events/summer-camp/register", "page");
  });

  it("updates file mime types without touching options", async () => {
    const client = buildAdminClient({
      field: {
        id: FIELD_ID,
        event_id: EVENT_ID,
        field_key: "receipt",
        field_type: "file",
        label_i18n: { es: "Comprobante" },
        options_i18n: {},
        required: true,
        allowed_mime_types: ["application/pdf"],
        archived_at: null,
      },
    });
    createAdminClient.mockReturnValue(client);

    const res = await updateEventFormFieldAction({
      locale: "es",
      fieldId: FIELD_ID,
      label: "Comprobante",
      required: true,
      allowedMimeTypes: ["image/jpeg", "image/png"],
    });

    expect(res).toEqual({ ok: true });
    expect(client.update).toHaveBeenCalledWith({
      label_i18n: { es: "Comprobante" },
      options_i18n: {},
      required: true,
      allowed_mime_types: ["image/jpeg", "image/png"],
    });
  });
});

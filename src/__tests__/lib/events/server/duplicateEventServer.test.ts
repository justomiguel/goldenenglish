/** @vitest-environment node */
import { describe, expect, it, vi } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";

vi.mock("server-only", () => ({}));
vi.mock("@/lib/logging/serverActionLog", () => ({ logSupabaseClientError: vi.fn() }));

import { duplicateEventServer } from "@/lib/events/server/duplicateEventServer";

interface Row {
  id: string;
  [key: string]: unknown;
}

function memoryAdmin(seed: Record<string, Row[]>) {
  const tables: Record<string, Row[]> = {
    events: [],
    event_registration_flows: [],
    event_form_fields: [],
    event_ticket_packages: [],
    event_email_templates: [],
    event_translations: [],
    event_attendees: [],
    event_discount_codes: [],
    ...seed,
  };
  let seq = 1;
  const inserted: string[] = [];

  function from(table: string) {
    const filters: Array<[string, unknown]> = [];
    const api = {
      select() {
        return api;
      },
      eq(column: string, value: unknown) {
        filters.push([column, value]);
        return api;
      },
      or() {
        return api;
      },
      delete() {
        return api;
      },
      insert(payload: Row | Row[]) {
        const rows = (Array.isArray(payload) ? payload : [payload]).map((row) => ({
          ...row,
          id: String(row.id ?? `${table}-${seq++}`),
        }));
        tables[table] = [...(tables[table] ?? []), ...rows];
        inserted.push(table);
        const written = {
          select() {
            return written;
          },
          single: async () => ({ data: rows[0], error: null }),
        };
        return Object.assign(Promise.resolve({ data: rows, error: null }), written);
      },
      maybeSingle: async () => {
        const data = (tables[table] ?? []).find((row) => filters.every(([column, value]) => row[column] === value)) ?? null;
        return { data, error: null };
      },
      then(resolve: (value: { data: Row[]; error: null }) => void) {
        const data = (tables[table] ?? []).filter((row) => filters.every(([column, value]) => row[column] === value));
        return Promise.resolve({ data, error: null }).then(resolve);
      },
    };
    return api;
  }

  return { admin: { from } as unknown as SupabaseClient, tables, inserted };
}

const sourceEvent: Row = {
  id: "event-1",
  title: "Taller",
  description: "<p>Hola</p>",
  event_date: "2026-11-01T15:00:00.000Z",
  location: "Sala 1",
  section_id: null,
  private_to_section: false,
  capacity: 20,
  price: 10000,
  price_local: 10000,
  price_non_local: 12000,
  currency: "CLP",
  default_locale: "es",
  cover_image_path: null,
  bank_transfer_instructions: null,
  collect_birth_date: false,
  require_phone: false,
  require_birth_date: false,
  registration_field_order: [],
  price_by_flow: true,
  allow_multiple_tickets: false,
  max_tickets_per_registration: null,
  companion_collect_dni: false,
  companion_collect_birth_date: false,
  companion_collect_email: false,
};

describe("duplicateEventServer", () => {
  it("copies the flow, the field, the package, and the email, and skips people and codes", async () => {
    const { admin, tables, inserted } = memoryAdmin({
      events: [sourceEvent],
      event_registration_flows: [
        { id: "flow-1", event_id: "event-1", name_i18n: { es: "Presencial" }, position: 0, price: 8000, field_order: ["field:size"], archived_at: null },
      ],
      event_form_fields: [
        {
          id: "field-1",
          event_id: "event-1",
          flow_id: "flow-1",
          field_key: "size",
          field_type: "text",
          label_i18n: { es: "Talle" },
          help_text_i18n: {},
          options_i18n: {},
          required: false,
          position: 1,
          max_file_size_bytes: 1000,
          allowed_mime_types: [],
          archived_at: null,
          collect_for_companions: false,
        },
      ],
      event_ticket_packages: [
        { id: "pkg-1", event_id: "event-1", name: "General", price: 8000, capacity: 10, benefits: ["Café"], position: 0, archived_at: null },
      ],
      event_email_templates: [
        {
          id: "mail-1",
          event_id: "event-1",
          flow_id: "flow-1",
          template_key: "events.registered",
          locale: "es",
          subject: "Listo",
          body_html: "<p>Ok</p>",
        },
      ],
      event_translations: [
        { id: "tr-1", event_id: "event-1", locale: "es", title: "Taller", description: "<p>Hola</p>", location: "Sala 1" },
      ],
      event_attendees: [{ id: "att-1", event_id: "event-1", email: "ana@example.com" }],
      event_discount_codes: [{ id: "code-1", event_id: "event-1", code: "SAVE10" }],
    });

    const result = await duplicateEventServer(admin, { eventId: "event-1", actorId: "admin-1" });
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    const copy = tables.events.find((row) => row.id === result.eventId);
    expect(copy).toMatchObject({
      status: "draft",
      show_on_home: false,
      created_by: "admin-1",
      title: "Taller (copia)",
    });

    const flow = tables.event_registration_flows.find((row) => row.event_id === result.eventId);
    const field = tables.event_form_fields.find((row) => row.event_id === result.eventId);
    const email = tables.event_email_templates.find((row) => row.event_id === result.eventId);
    expect(flow?.price).toBe(8000);
    expect(field?.flow_id).toBe(flow?.id);
    expect(field?.field_key).toBe("size");
    expect(tables.event_ticket_packages.some((row) => row.event_id === result.eventId && row.name === "General")).toBe(true);
    expect(email?.flow_id).toBe(flow?.id);
    expect(tables.event_attendees.every((row) => row.event_id === "event-1")).toBe(true);
    expect(tables.event_discount_codes.every((row) => row.event_id === "event-1")).toBe(true);
    expect(inserted).not.toContain("event_attendees");
    expect(inserted).not.toContain("event_discount_codes");
  });

  it("returns not_found when the source event is missing", async () => {
    const { admin } = memoryAdmin({ events: [] });
    const result = await duplicateEventServer(admin, { eventId: "missing", actorId: "admin-1" });
    expect(result).toEqual({ ok: false, code: "not_found" });
  });
});

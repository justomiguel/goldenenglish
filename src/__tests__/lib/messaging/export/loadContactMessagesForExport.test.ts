// REGRESSION CHECK: Contact export dedupes one submission per admin and honors the 2000 cap.
import { describe, expect, it, vi } from "vitest";
import { logServerWarn } from "@/lib/logging/serverActionLog";
import { appendUniqueContactMessageSources, loadContactMessagesForExport } from "@/lib/messaging/export/loadContactMessagesForExport";
import { CONTACT_MESSAGE_EXPORT_PAGE_SIZE } from "@/lib/messaging/export/contactMessageExportContract";
import { PUBLIC_SITE_CONTACT_SENDER_PROFILE_ID } from "@/lib/site/publicSiteContactSenderId";
import type { ContactMessageExportSource } from "@/lib/messaging/export/parseContactMessageExportRow";

vi.mock("@/lib/logging/serverActionLog", () => ({
  logSupabaseClientError: vi.fn(),
  logServerWarn: vi.fn(),
}));

function source(id: string, batch: string | null): ContactMessageExportSource {
  return {
    id,
    createdAt: "2026-11-05T15:04:00.000Z",
    broadcastBatchId: batch,
    displayName: "Ada",
    replyEmail: "ada@example.com",
    bodyHtml: "<p>Hola</p>",
  };
}

function raw(id: string, batch: string | null) {
  return {
    id,
    created_at: "2026-11-05T15:04:00.000Z",
    broadcast_batch_id: batch,
    external_contact_display_name: "Ada",
    external_contact_reply_email: "ada@example.com",
    body_html: "<p>Hola</p>",
  };
}

function client(pages: Record<number, ReturnType<typeof raw>[]>, errorAt?: number) {
  const filters: Array<[string, string]> = [];
  return {
    filters,
    from() {
      return {
        select() {
          return {
            eq(column: string, value: string) {
              filters.push([column, value]);
              return this;
            },
            order() {
              return {
                range(from: number) {
                  if (errorAt === from) return Promise.resolve({ data: null, error: { message: "db" } });
                  return Promise.resolve({ data: pages[from] ?? [], error: null });
                },
              };
            },
          };
        },
      };
    },
  };
}

describe("appendUniqueContactMessageSources", () => {
  it("keeps one row per batch and stops at the limit", () => {
    const state = { seen: new Set<string>(), rows: [] as ContactMessageExportSource[] };
    appendUniqueContactMessageSources(state, [source("a1", "batch"), source("a2", "batch"), source("b", null)], 2);
    expect(state.rows.map((row) => row.id)).toEqual(["a1", "b"]);
  });

  it("stops before adding a row when the limit is already full", () => {
    const state = { seen: new Set(["a"]), rows: [source("a", "batch-a")] };
    const reached = appendUniqueContactMessageSources(state, [source("b", "batch-b")], 1);
    expect(reached).toBe(true);
    expect(state.rows.map((row) => row.id)).toEqual(["a"]);
  });
});

describe("loadContactMessagesForExport", () => {
  it("reads every page for scope all and drops duplicate batches", async () => {
    const page = Array.from({ length: CONTACT_MESSAGE_EXPORT_PAGE_SIZE }, (_, index) =>
      raw(`p1-${index}`, index === 0 ? "same" : `p1-${index}`),
    );
    const first = page.slice(0, CONTACT_MESSAGE_EXPORT_PAGE_SIZE);
    first[1] = raw("copy", "same");
    const db = client({
      0: first,
      200: [raw("last", "last-batch")],
    });

    const result = await loadContactMessagesForExport(db as never, "admin-1", "all");

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.rows).toHaveLength(CONTACT_MESSAGE_EXPORT_PAGE_SIZE);
    expect(result.rows.filter((row) => row.broadcastBatchId === "same")).toHaveLength(1);
    expect(result.rows.at(-1)?.id).toBe("last");
    expect(db.filters).toEqual([
      ["sender_id", PUBLIC_SITE_CONTACT_SENDER_PROFILE_ID],
      ["recipient_id", "admin-1"],
      ["sender_id", PUBLIC_SITE_CONTACT_SENDER_PROFILE_ID],
      ["recipient_id", "admin-1"],
    ]);
  });

  it("stops after 2000 unique rows", async () => {
    let calls = 0;
    const db = {
      from() {
        return {
          select() {
            return {
              eq() {
                return this;
              },
              order() {
                return {
                  range() {
                    calls += 1;
                    const start = (calls - 1) * CONTACT_MESSAGE_EXPORT_PAGE_SIZE;
                    const data = Array.from({ length: CONTACT_MESSAGE_EXPORT_PAGE_SIZE }, (_, index) =>
                      raw(`row-${start + index}`, `batch-${start + index}`),
                    );
                    return Promise.resolve({ data, error: null });
                  },
                };
              },
            };
          },
        };
      },
    };

    const result = await loadContactMessagesForExport(db as never, "admin-1", "latest_2000");
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.rows).toHaveLength(2000);
    expect(calls).toBe(10);
  });

  it("returns ok false when the query fails", async () => {
    const db = client({}, 0);
    const result = await loadContactMessagesForExport(db as never, "admin-1", "all");
    expect(result).toEqual({ ok: false });
  });

  it("returns no rows when the first page is empty", async () => {
    const db = {
      from() {
        return {
          select() {
            return {
              eq() {
                return this;
              },
              order() {
                return { range: () => Promise.resolve({ data: null, error: null }) };
              },
            };
          },
        };
      },
    };
    const result = await loadContactMessagesForExport(db as never, "admin-1", "all");
    expect(result).toEqual({ ok: true, rows: [] });
  });

  it("maps a row that has no contact columns", async () => {
    const db = client({ 0: [{ body_html: "<p>Hola</p>" }] });
    const result = await loadContactMessagesForExport(db as never, "admin-1", "all");
    expect(result).toEqual({
      ok: true,
      rows: [
        {
          id: "",
          createdAt: "",
          broadcastBatchId: null,
          displayName: null,
          replyEmail: null,
          bodyHtml: "<p>Hola</p>",
        },
      ],
    });
  });

  it("stops when the next page repeats the first id", async () => {
    const page = Array.from({ length: CONTACT_MESSAGE_EXPORT_PAGE_SIZE }, (_, index) =>
      raw(`p-${index}`, `b-${index}`),
    );
    const db = client({ 0: page, 200: page });
    const result = await loadContactMessagesForExport(db as never, "admin-1", "all");
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.rows).toHaveLength(CONTACT_MESSAGE_EXPORT_PAGE_SIZE);
    expect(logServerWarn).toHaveBeenCalledWith(
      "loadContactMessagesForExport:repeatedPage",
      expect.objectContaining({ scope: "all", from: 200 }),
    );
  });
});

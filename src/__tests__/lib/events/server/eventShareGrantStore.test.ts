import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/logging/serverActionLog", () => ({
  logSupabaseClientError: vi.fn(),
  logServerError: vi.fn(),
}));

vi.mock("@/lib/supabase/pulsar", () => ({
  createPulsarAdminClient: vi.fn(),
}));

import { insertShareRequest } from "@/lib/events/server/eventShareGrantStore";

// REGRESSION CHECK: A self-share never inserts. A unique violation stays share_already_open.

type Row = {
  id: string;
  owner_slug: string;
  owner_event_id: string;
  guest_slug: string;
  status: string;
  requested_by: string;
  reviewed_by: string | null;
};

function fakeClient(input: { existing?: Row[]; insertError?: { code: string; message: string } }) {
  const inserts: unknown[] = [];
  const client = {
    from() {
      return {
        select() {
          const chain = {
            eq() {
              return chain;
            },
            in() {
              return chain;
            },
            order: async () => ({ data: input.existing ?? [], error: null }),
          };
          return chain;
        },
        insert(row: unknown) {
          inserts.push(row);
          return {
            select() {
              return {
                single: async () =>
                  input.insertError
                    ? { data: null, error: input.insertError }
                    : { data: { id: "grant-1" }, error: null },
              };
            },
          };
        },
      };
    },
  };
  return { client, inserts };
}

describe("insertShareRequest", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("does not insert when the guest is the owner", async () => {
    const { client, inserts } = fakeClient({});
    const result = await insertShareRequest(client as never, {
      ownerSlug: "liora",
      ownerEventId: "evt-1",
      guestSlug: "liora",
      requestedBy: "admin-1",
      enabledSlugs: ["liora", "matiss"],
    });
    expect(result).toEqual({ ok: false, code: "share_self" });
    expect(inserts).toEqual([]);
  });

  it("inserts a pending row for an enabled guest", async () => {
    const { client, inserts } = fakeClient({});
    const result = await insertShareRequest(client as never, {
      ownerSlug: "liora",
      ownerEventId: "evt-1",
      guestSlug: "matiss",
      requestedBy: "admin-1",
      enabledSlugs: ["liora", "matiss"],
    });
    expect(result).toEqual({ ok: true, id: "grant-1" });
    expect(inserts).toEqual([
      {
        owner_slug: "liora",
        owner_event_id: "evt-1",
        guest_slug: "matiss",
        status: "pending",
        requested_by: "admin-1",
      },
    ]);
  });

  it("maps a unique violation to share_already_open", async () => {
    const { client } = fakeClient({
      insertError: { code: "23505", message: "duplicate" },
    });
    const result = await insertShareRequest(client as never, {
      ownerSlug: "liora",
      ownerEventId: "evt-1",
      guestSlug: "matiss",
      requestedBy: "admin-1",
      enabledSlugs: ["liora", "matiss"],
    });
    expect(result).toEqual({ ok: false, code: "share_already_open" });
  });
});

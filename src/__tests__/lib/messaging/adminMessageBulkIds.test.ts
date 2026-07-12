import { describe, expect, it } from "vitest";
import {
  ADMIN_MESSAGE_BULK_ID_CAP,
  normalizeAdminMessageBulkIds,
} from "@/lib/messaging/adminMessageBulkIds";

describe("normalizeAdminMessageBulkIds", () => {
  const a = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
  const b = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";

  it("returns unique uuids within the cap", () => {
    expect(normalizeAdminMessageBulkIds([a, a, b])).toEqual({ ok: true, ids: [a, b] });
  });

  it("rejects empty input", () => {
    expect(normalizeAdminMessageBulkIds([])).toEqual({ ok: false, code: "empty" });
  });

  it("rejects invalid uuid", () => {
    expect(normalizeAdminMessageBulkIds([a, "not-a-uuid"])).toEqual({
      ok: false,
      code: "invalid_id",
    });
  });

  it("rejects more than the cap after dedupe", () => {
    const ids = Array.from({ length: ADMIN_MESSAGE_BULK_ID_CAP + 1 }, (_, i) => {
      const n = (i + 1).toString(16).padStart(12, "0");
      return `aaaaaaaa-aaaa-4aaa-8aaa-${n}`;
    });
    expect(normalizeAdminMessageBulkIds(ids)).toEqual({ ok: false, code: "too_many" });
  });
});

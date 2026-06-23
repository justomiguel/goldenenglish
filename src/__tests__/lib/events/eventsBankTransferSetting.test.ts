import { describe, expect, it, vi } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import {
  EVENTS_BANK_TRANSFER_ENABLED_DEFAULT,
  EVENTS_BANK_TRANSFER_ENABLED_KEY,
  parseEventsBankTransferEnabled,
} from "@/lib/events/eventsBankTransferSetting";
import { updateEventsBankTransferEnabledSetting } from "@/lib/events/server/updateEventsBankTransferEnabledSetting";

describe("parseEventsBankTransferEnabled", () => {
  it("parses explicit boolean and string values", () => {
    expect(parseEventsBankTransferEnabled(true)).toBe(true);
    expect(parseEventsBankTransferEnabled("true")).toBe(true);
    expect(parseEventsBankTransferEnabled(false)).toBe(false);
    expect(parseEventsBankTransferEnabled("false")).toBe(false);
  });

  it("returns null when unset or unknown so callers can fall back", () => {
    expect(parseEventsBankTransferEnabled(null)).toBeNull();
    expect(parseEventsBankTransferEnabled(undefined)).toBeNull();
    expect(parseEventsBankTransferEnabled("")).toBeNull();
    expect(parseEventsBankTransferEnabled(1)).toBeNull();
  });

  it("defaults to enabled so transfer coexists with online gateways", () => {
    expect(EVENTS_BANK_TRANSFER_ENABLED_DEFAULT).toBe(true);
  });
});

describe("updateEventsBankTransferEnabledSetting", () => {
  it("upserts the boolean value under the canonical key", async () => {
    const upsert = vi.fn().mockResolvedValue({ error: null });
    const supabase = {
      from: vi.fn().mockReturnValue({ upsert }),
    } as unknown as SupabaseClient;

    const result = await updateEventsBankTransferEnabledSetting(supabase, false);

    expect(result.ok).toBe(true);
    expect(supabase.from).toHaveBeenCalledWith("site_settings");
    expect(upsert).toHaveBeenCalledWith(
      expect.objectContaining({ key: EVENTS_BANK_TRANSFER_ENABLED_KEY, value: false }),
      { onConflict: "key" },
    );
  });

  it("reports db_error when the upsert fails", async () => {
    const upsert = vi.fn().mockResolvedValue({ error: { message: "boom" } });
    const supabase = {
      from: vi.fn().mockReturnValue({ upsert }),
    } as unknown as SupabaseClient;

    const result = await updateEventsBankTransferEnabledSetting(supabase, true);

    expect(result).toEqual({ ok: false, error: "db_error" });
  });
});

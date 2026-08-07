// REGRESSION CHECK: Load falls back when row missing; update requires all locales.
import { describe, expect, it, vi } from "vitest";
import { loadMessagingDefaultReplyTemplate } from "@/lib/messaging/loadMessagingDefaultReplyTemplate";
import { updateMessagingDefaultReplyTemplate } from "@/lib/messaging/updateMessagingDefaultReplyTemplate";
import {
  MESSAGING_DEFAULT_REPLY_FACTORY_TEMPLATES,
  MESSAGING_DEFAULT_REPLY_MAX_LENGTH,
  MESSAGING_DEFAULT_REPLY_SETTING_KEY,
} from "@/lib/messaging/messagingDefaultReplyConstants";

describe("loadMessagingDefaultReplyTemplate", () => {
  it("returns factory defaults when no row", async () => {
    const maybeSingle = vi.fn().mockResolvedValue({ data: null, error: null });
    const supabase = {
      from: vi.fn(() => ({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({ maybeSingle })),
        })),
      })),
    };

    const r = await loadMessagingDefaultReplyTemplate(supabase as never);
    expect(r.templates).toEqual(MESSAGING_DEFAULT_REPLY_FACTORY_TEMPLATES);
  });

  it("returns stored templates", async () => {
    const maybeSingle = vi.fn().mockResolvedValue({
      data: {
        value: {
          templates: { es: "ES {{instituteName}}", en: "EN", pt: "PT" },
        },
      },
      error: null,
    });
    const supabase = {
      from: vi.fn(() => ({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({ maybeSingle })),
        })),
      })),
    };

    const r = await loadMessagingDefaultReplyTemplate(supabase as never);
    expect(r.templates.es).toBe("ES {{instituteName}}");
    expect(r.templates.en).toBe("EN");
    expect(r.templates.pt).toBe("PT");
  });
});

describe("updateMessagingDefaultReplyTemplate", () => {
  it("rejects empty and too_long", async () => {
    const supabase = { from: vi.fn() };
    expect(
      await updateMessagingDefaultReplyTemplate(supabase as never, {
        es: "ok",
        en: "  ",
        pt: "ok",
      }),
    ).toEqual({ ok: false, error: "empty" });
    expect(
      await updateMessagingDefaultReplyTemplate(supabase as never, {
        es: "ok",
        en: "x".repeat(MESSAGING_DEFAULT_REPLY_MAX_LENGTH + 1),
        pt: "ok",
      }),
    ).toEqual({ ok: false, error: "too_long" });
    expect(supabase.from).not.toHaveBeenCalled();
  });

  it("upserts JSON templates on success", async () => {
    const upsert = vi.fn().mockResolvedValue({ error: null });
    const supabase = {
      from: vi.fn(() => ({ upsert })),
    };

    const r = await updateMessagingDefaultReplyTemplate(supabase as never, {
      es: " Hola {{phone}} ",
      en: "Hi {{phone}}",
      pt: "Olá {{phone}}",
    });
    expect(r).toEqual({ ok: true });
    expect(upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        key: MESSAGING_DEFAULT_REPLY_SETTING_KEY,
        value: {
          templates: {
            es: "Hola {{phone}}",
            en: "Hi {{phone}}",
            pt: "Olá {{phone}}",
          },
        },
      }),
      { onConflict: "key" },
    );
  });
});

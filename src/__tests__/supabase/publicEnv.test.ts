import { describe, it, expect, beforeEach, afterEach } from "vitest";
import {
  hasSupabasePublicEnv,
  readSupabasePublicEnv,
} from "@/lib/supabase/publicEnv";

describe("readSupabasePublicEnv", () => {
  const prev = { ...process.env };

  beforeEach(() => {
    delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  });

  afterEach(() => {
    process.env = { ...prev };
  });

  it("reads primary env names", () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://x.supabase.co";
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "anon";
    expect(readSupabasePublicEnv()).toEqual({
      url: "https://x.supabase.co",
      anonKey: "anon",
    });
  });

  it("reads url from SUPABASE_URL when NEXT_PUBLIC url missing", () => {
    delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    process.env.SUPABASE_URL = "https://server-only.test";
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "anon";
    expect(readSupabasePublicEnv().url).toBe("https://server-only.test");
  });

  it("treats whitespace-only NEXT_PUBLIC url as empty and falls back", () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = "   ";
    process.env.SUPABASE_URL = "https://fallback-url.test";
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "k";
    expect(readSupabasePublicEnv().url).toBe("https://fallback-url.test");
  });

  it("falls back to SUPABASE_URL when NEXT_PUBLIC url is empty string", () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = "";
    process.env.SUPABASE_URL = "https://empty-next.test";
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "k";
    expect(readSupabasePublicEnv().url).toBe("https://empty-next.test");
  });

  it("treats whitespace-only NEXT_PUBLIC anon key as empty and falls back", () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://a";
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "  \t  ";
    process.env.SUPABASE_ANON_KEY = "anon-fallback";
    expect(readSupabasePublicEnv().anonKey).toBe("anon-fallback");
  });

  it("falls back when NEXT_PUBLIC anon is empty string after trim", () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://a";
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "";
    process.env.SUPABASE_ANON_KEY = "anon-empty-trim";
    expect(readSupabasePublicEnv().anonKey).toBe("anon-empty-trim");
  });

  it("reads NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY as third anon fallback", () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://a";
    delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    delete process.env.SUPABASE_ANON_KEY;
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = "only-np-pub";
    delete process.env.SUPABASE_PUBLISHABLE_KEY;
    delete process.env.NEXT_PUBLIC_SUPABASE_PUBLIC_KEY;
    expect(readSupabasePublicEnv().anonKey).toBe("only-np-pub");
  });

  it("falls back to non-prefixed Supabase env names", () => {
    delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    process.env.SUPABASE_URL = "  https://srv.test  ";
    process.env.SUPABASE_PUBLISHABLE_KEY = "pk";
    expect(readSupabasePublicEnv()).toEqual({
      url: "https://srv.test",
      anonKey: "pk",
    });
  });

  it("reads alternate NEXT_PUBLIC publishable key names", () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://a";
    delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    process.env.NEXT_PUBLIC_SUPABASE_PUBLIC_KEY = "pub";
    expect(readSupabasePublicEnv().anonKey).toBe("pub");
  });

  it("reads server-only SUPABASE_ANON_KEY when public anon missing", () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://a";
    delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    delete process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
    delete process.env.NEXT_PUBLIC_SUPABASE_PUBLIC_KEY;
    process.env.SUPABASE_ANON_KEY = "srv-anon";
    expect(readSupabasePublicEnv().anonKey).toBe("srv-anon");
  });

  it("reads server-only SUPABASE_PUBLISHABLE_KEY as fallback anon key", () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://a";
    delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    delete process.env.SUPABASE_ANON_KEY;
    delete process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
    delete process.env.NEXT_PUBLIC_SUPABASE_PUBLIC_KEY;
    process.env.SUPABASE_PUBLISHABLE_KEY = "srv-pub";
    expect(readSupabasePublicEnv().anonKey).toBe("srv-pub");
  });

  it("reads NEXT_PUBLIC_SUPABASE_PUBLIC_KEY as last resort anon alias", () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://a";
    delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    delete process.env.SUPABASE_ANON_KEY;
    delete process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
    delete process.env.SUPABASE_PUBLISHABLE_KEY;
    process.env.NEXT_PUBLIC_SUPABASE_PUBLIC_KEY = "only-public";
    expect(readSupabasePublicEnv().anonKey).toBe("only-public");
  });

  it("returns empty url when no Supabase URL env is set", () => {
    delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    delete process.env.SUPABASE_URL;
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "k";
    expect(readSupabasePublicEnv().url).toBe("");
  });

  it("returns empty anonKey when no key env is set", () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://a";
    delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    delete process.env.SUPABASE_ANON_KEY;
    delete process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
    delete process.env.SUPABASE_PUBLISHABLE_KEY;
    delete process.env.NEXT_PUBLIC_SUPABASE_PUBLIC_KEY;
    expect(readSupabasePublicEnv().anonKey).toBe("");
  });
});

describe("hasSupabasePublicEnv", () => {
  const prev = { ...process.env };

  afterEach(() => {
    process.env = { ...prev };
  });

  it("is false when incomplete", () => {
    delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    expect(hasSupabasePublicEnv()).toBe(false);
  });

  it("is true when both set", () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://a";
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "b";
    expect(hasSupabasePublicEnv()).toBe(true);
  });

  it("is false when url is set but anon key is missing", () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://a";
    delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    delete process.env.SUPABASE_ANON_KEY;
    delete process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
    delete process.env.SUPABASE_PUBLISHABLE_KEY;
    delete process.env.NEXT_PUBLIC_SUPABASE_PUBLIC_KEY;
    expect(hasSupabasePublicEnv()).toBe(false);
  });

  it("is false when anon is set but url is missing", () => {
    delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    delete process.env.SUPABASE_URL;
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "only-key";
    expect(hasSupabasePublicEnv()).toBe(false);
  });
});

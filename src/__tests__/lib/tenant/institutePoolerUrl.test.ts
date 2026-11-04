import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it, vi } from "vitest";
import {
  projectRefFromDirectHost,
  readPoolerHostCache,
  resolveInstituteDatabaseUrl,
  toSessionPoolerUrl,
  writePoolerHostCache,
} from "@/lib/tenant/institutePoolerUrl";

const DIRECT = "postgresql://postgres:p%40ss@db.abcproject.supabase.co:5432/postgres";

describe("institutePoolerUrl", () => {
  it("reads the project ref only from a direct Supabase host", () => {
    expect(projectRefFromDirectHost("db.abcproject.supabase.co")).toBe("abcproject");
    expect(projectRefFromDirectHost("aws-1-us-east-1.pooler.supabase.com")).toBeNull();
  });

  it("rewrites a direct URL to the session pooler user and host", () => {
    const next = new URL(toSessionPoolerUrl(DIRECT, "aws-1-us-east-1.pooler.supabase.com"));
    expect(next.hostname).toBe("aws-1-us-east-1.pooler.supabase.com");
    expect(next.username).toBe("postgres.abcproject");
    expect(decodeURIComponent(next.password)).toBe("p@ss");
    expect(next.port).toBe("5432");
    expect(next.searchParams.get("sslmode")).toBe("no-verify");
  });

  it("keeps a URL that already has IPv4", async () => {
    const result = await resolveInstituteDatabaseUrl(DIRECT, {
      hasIpv4: async () => true,
      canConnect: async () => false,
      readCache: () => null,
      writeCache: () => {},
    });
    expect(result).toBe(DIRECT);
  });

  it("uses the cached pooler host and writes a new one when the cache misses", async () => {
    const dir = mkdtempSync(join(tmpdir(), "pooler-"));
    const file = join(dir, "hosts.json");
    writePoolerHostCache(file, "abcproject", "aws-1-us-east-2.pooler.supabase.com");
    expect(readPoolerHostCache(file, "abcproject")).toBe("aws-1-us-east-2.pooler.supabase.com");

    const writeCache = vi.fn();
    const cached = await resolveInstituteDatabaseUrl(DIRECT, {
      hasIpv4: async () => false,
      canConnect: async (url) => url.includes("aws-1-us-east-2"),
      readCache: (ref) => readPoolerHostCache(file, ref),
      writeCache,
    });
    expect(new URL(cached).hostname).toBe("aws-1-us-east-2.pooler.supabase.com");
    expect(writeCache).not.toHaveBeenCalled();

    const probed = await resolveInstituteDatabaseUrl(DIRECT, {
      hasIpv4: async () => false,
      canConnect: async (url) => url.includes("aws-1-us-east-1.pooler"),
      readCache: () => null,
      writeCache,
    });
    expect(new URL(probed).hostname).toBe("aws-1-us-east-1.pooler.supabase.com");
    expect(writeCache).toHaveBeenCalledWith("abcproject", "aws-1-us-east-1.pooler.supabase.com");
  });

  it("leaves a pooler URL unchanged", async () => {
    const pooler = "postgresql://postgres.abc:secret@aws-1-us-west-2.pooler.supabase.com:5432/postgres";
    const result = await resolveInstituteDatabaseUrl(pooler, {
      hasIpv4: async () => false,
      canConnect: async () => false,
      readCache: () => null,
      writeCache: () => {},
    });
    expect(result).toBe(pooler);
  });
});

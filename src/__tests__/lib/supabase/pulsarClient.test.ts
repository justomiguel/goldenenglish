/** @vitest-environment node */
import { afterEach, describe, expect, it } from "vitest";
import {
  createPulsarAdminClient,
  isPulsarSupabaseConfigured,
  readPulsarSupabasePublicEnv,
} from "@/lib/supabase/pulsar";

describe("pulsar supabase env", () => {
  const prevUrl = process.env.PULSAR_SUPABASE_URL;
  const prevAnon = process.env.PULSAR_SUPABASE_ANON_KEY;
  const prevKey = process.env.PULSAR_SUPABASE_SERVICE_ROLE_KEY;

  afterEach(() => {
    if (prevUrl === undefined) delete process.env.PULSAR_SUPABASE_URL;
    else process.env.PULSAR_SUPABASE_URL = prevUrl;
    if (prevAnon === undefined) delete process.env.PULSAR_SUPABASE_ANON_KEY;
    else process.env.PULSAR_SUPABASE_ANON_KEY = prevAnon;
    if (prevKey === undefined) delete process.env.PULSAR_SUPABASE_SERVICE_ROLE_KEY;
    else process.env.PULSAR_SUPABASE_SERVICE_ROLE_KEY = prevKey;
  });

  it("reads empty public env and refuses an admin client without keys", () => {
    delete process.env.PULSAR_SUPABASE_URL;
    delete process.env.PULSAR_SUPABASE_ANON_KEY;
    delete process.env.PULSAR_SUPABASE_SERVICE_ROLE_KEY;
    expect(readPulsarSupabasePublicEnv()).toEqual({ url: "", anonKey: "" });
    expect(isPulsarSupabaseConfigured()).toBe(false);
    expect(() => createPulsarAdminClient()).toThrow(/PULSAR_SUPABASE_URL/);
  });
});

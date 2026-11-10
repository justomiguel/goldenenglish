import { describe, expect, it } from "vitest";
import {
  PLATFORM_OPERATOR_ADMIN_EMAIL,
  ensurePlatformOperatorAdmin,
  type SqlClient,
} from "@/lib/pulsar/platformOperatorAdmin";

const TEST_PASSWORD = "operator-test-password";

// REGRESSION CHECK: Generated institutes must keep this operator as admin.
// A missing profile insert or a password baked into the SQL string breaks sign-in.

type Call = { text: string; params: readonly unknown[] | undefined };

function scriptedClient(rowsFor: (text: string) => Array<Record<string, unknown>>): SqlClient & {
  calls: Call[];
} {
  const calls: Call[] = [];
  return {
    calls,
    query: async (text, params) => {
      calls.push({ text, params });
      return { rows: rowsFor(text) };
    },
  };
}

describe("ensurePlatformOperatorAdmin", () => {
  it("rejects a schema name that is not public or tenant_*", async () => {
    const client = scriptedClient(() => []);
    await expect(ensurePlatformOperatorAdmin(client, "tenant_bad;drop", TEST_PASSWORD)).rejects.toThrow(
      "invalid_schema",
    );
    expect(client.calls).toHaveLength(0);
  });

  it("stops before any query when the password is missing", async () => {
    const client = scriptedClient(() => []);
    await expect(ensurePlatformOperatorAdmin(client, "public", null)).rejects.toThrow(
      "operator_admin_missing_password",
    );
    expect(client.calls).toHaveLength(0);
  });

  it("creates the auth user and an admin profile when the email is new", async () => {
    const client = scriptedClient((text) => (text.includes("RETURNING id") ? [{ id: "user-1" }] : []));
    await ensurePlatformOperatorAdmin(client, "tenant_matiss", TEST_PASSWORD);

    const insertUser = client.calls.find((call) => call.text.includes("INSERT INTO auth.users"));
    expect(insertUser?.params?.[0]).toBe(PLATFORM_OPERATOR_ADMIN_EMAIL);
    expect(insertUser?.params?.[1]).toBe(TEST_PASSWORD);
    expect(insertUser?.text).not.toContain(TEST_PASSWORD);

    const profile = client.calls.find((call) => call.text.includes("tenant_matiss.profiles"));
    expect(profile?.text).toContain("'admin'");
    expect(profile?.params?.[0]).toBe("user-1");
  });

  it("resets the password and keeps the admin role when the user already exists", async () => {
    const client = scriptedClient((text) =>
      text.includes("SELECT id FROM auth.users") ? [{ id: "user-9" }] : [],
    );
    await ensurePlatformOperatorAdmin(client, "public", TEST_PASSWORD);

    expect(client.calls.some((call) => call.text.includes("INSERT INTO auth.users"))).toBe(false);
    const update = client.calls.find((call) => call.text.includes("UPDATE auth.users"));
    expect(update?.params?.[0]).toBe("user-9");
    expect(update?.params?.[1]).toBe(TEST_PASSWORD);
    expect(update?.text).toContain("$2::text");
    const profile = client.calls.find((call) => call.text.includes("public.profiles"));
    expect(profile?.text).toContain("SET role = 'admin'");
  });
});

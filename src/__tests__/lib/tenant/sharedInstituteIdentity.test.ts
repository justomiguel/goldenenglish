import { describe, expect, it } from "vitest";
import { bindInstituteDataPlane } from "@/lib/supabase/bindInstituteDataPlane";
import {
  instituteAuthEmail,
  instituteStoragePath,
} from "@/lib/tenant/instituteAuthEmail";
import { postgresSchemaForInstituteSlug } from "@/lib/tenant/postgresSchemaForInstituteSlug";

describe("shared institute identity", () => {
  it("keeps project emails and tags shared emails", () => {
    expect(instituteAuthEmail("Maria@Mail.com", "public")).toBe("maria@mail.com");
    expect(instituteAuthEmail("maria@mail.com", "tenant_acme")).toBe(
      "maria+tenantacme@mail.com",
    );
    expect(instituteAuthEmail("maria+news@mail.com", "tenant_acme")).toBe(
      "maria+news.tenantacme@mail.com",
    );
  });

  it("turns a slug into a schema name", () => {
    expect(postgresSchemaForInstituteSlug("acme-norte")).toBe("tenant_acme_norte");
  });

  it("prefixes storage keys once", () => {
    expect(instituteStoragePath("public", "avatars/a.png")).toBe("avatars/a.png");
    expect(instituteStoragePath("tenant_acme", "avatars/a.png")).toBe(
      "tenant_acme/avatars/a.png",
    );
    expect(instituteStoragePath("tenant_acme", "tenant_acme/avatars/a.png")).toBe(
      "tenant_acme/avatars/a.png",
    );
  });

  it("sends sign-in and table reads to the institute schema", async () => {
    const seen: { schema?: string; email?: string; path?: string } = {};
    const client = {
      schema(name: string) {
        return {
          from(table: string) {
            seen.schema = `${name}.${table}`;
            return seen.schema;
          },
          rpc(fn: string) {
            return fn;
          },
        };
      },
      from(table: string) {
        return `public.${table}`;
      },
      storage: {
        from() {
          return {
            upload(path: string) {
              seen.path = path;
              return path;
            },
          };
        },
      },
      auth: {
        signInWithPassword(input: { email: string }) {
          seen.email = input.email;
          return input.email;
        },
      },
    };
    const bound = bindInstituteDataPlane(client, {
      dataMode: "shared_schema",
      postgresSchema: "tenant_acme",
    });
    expect(bound.from("profiles")).toBe("tenant_acme.profiles");
    await bound.storage.from("avatars").upload("a.png");
    await bound.auth.signInWithPassword({ email: "maria@mail.com" });
    expect(seen.path).toBe("tenant_acme/a.png");
    expect(seen.email).toBe("maria+tenantacme@mail.com");
    expect(bindInstituteDataPlane(client, { dataMode: "project" }).from("profiles")).toBe(
      "public.profiles",
    );
  });
});

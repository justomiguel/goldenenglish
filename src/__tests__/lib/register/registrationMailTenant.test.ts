import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { getRegistrationMailTenantDomain } from "@/lib/register/registrationMailTenant";

describe("getRegistrationMailTenantDomain", () => {
  beforeEach(() => {
    vi.stubEnv("MAIL_TENANT", "");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("returns null when unset", () => {
    vi.stubEnv("MAIL_TENANT", "");
    expect(getRegistrationMailTenantDomain()).toBeNull();
  });

  it("normalizes stripping leading @ and mailto:", () => {
    vi.stubEnv("MAIL_TENANT", "@Alumnos.Example.Co");
    expect(getRegistrationMailTenantDomain()).toBe("alumnos.example.co");
  });

  it("returns null for invalid-looking domains", () => {
    vi.stubEnv("MAIL_TENANT", "nodots");
    expect(getRegistrationMailTenantDomain()).toBeNull();
  });
});

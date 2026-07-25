// REGRESSION CHECK: Parent synthetic Auth emails must use parents.<MAIL_TENANT>
// (multi-tenant). Legacy @parents.goldenenglish.local stays only as detection fallback.
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  isParentSyntheticEmail,
  parentDefaultEmail,
  parentSyntheticMailDomain,
} from "@/lib/import/parentDefaultEmail";

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("parentSyntheticMailDomain", () => {
  it("returns null when MAIL_TENANT is unset", () => {
    vi.stubEnv("MAIL_TENANT", "");
    expect(parentSyntheticMailDomain()).toBeNull();
  });

  it("prefixes parents. onto the registration mail tenant", () => {
    vi.stubEnv("MAIL_TENANT", "alumnos.nago.cl");
    expect(parentSyntheticMailDomain()).toBe("parents.alumnos.nago.cl");
  });

  it("does not double-prefix when MAIL_TENANT already starts with parents.", () => {
    vi.stubEnv("MAIL_TENANT", "parents.institute.cl");
    expect(parentSyntheticMailDomain()).toBe("parents.institute.cl");
  });
});

describe("parentDefaultEmail", () => {
  it("returns null when MAIL_TENANT is missing", () => {
    vi.stubEnv("MAIL_TENANT", "");
    expect(parentDefaultEmail("12.345.678")).toBeNull();
  });

  it("builds {dni}@parents.<MAIL_TENANT>", () => {
    vi.stubEnv("MAIL_TENANT", "alumnos.test");
    expect(parentDefaultEmail("12.345.678")).toBe("12345678@parents.alumnos.test");
  });

  it("uses sin-doc placeholder when DNI strips to empty", () => {
    vi.stubEnv("MAIL_TENANT", "alumnos.test");
    expect(parentDefaultEmail("@@@")).toBe("sin-doc@parents.alumnos.test");
  });
});

describe("isParentSyntheticEmail", () => {
  it("recognizes legacy Golden English parent synthetics", () => {
    expect(isParentSyntheticEmail("999@parents.goldenenglish.local")).toBe(true);
  });

  it("recognizes tenant parents.<MAIL_TENANT> addresses", () => {
    expect(isParentSyntheticEmail("123@parents.alumnos.nago.cl")).toBe(true);
  });

  it("rejects real mailboxes", () => {
    expect(isParentSyntheticEmail("parent@gmail.com")).toBe(false);
    expect(isParentSyntheticEmail("a@alumnos.nago.cl")).toBe(false);
  });
});

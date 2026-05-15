import { describe, expect, it } from "vitest";
import type { CompleteInitialSiteSetupInput } from "@/lib/site/siteSetupCompletionSchema";
import { buildSiteSetupOperationalRows } from "@/lib/site/persistSiteSetupOperationalSettings";

function baseInput(
  override: Partial<CompleteInitialSiteSetupInput> = {},
): CompleteInitialSiteSetupInput {
  return {
    mode: "edit",
    locale: "es",
    themeId: "00000000-0000-0000-0000-000000000000",
    appName: "Test",
    legalName: "Test legal",
    tagline: "tagline",
    logoAlt: "logo",
    contactEmail: "info@test.com",
    contactPhone: "+5400000000",
    contactAddress: "calle 1",
    faviconKind: "none",
    ...override,
  } as CompleteInitialSiteSetupInput;
}

describe("buildSiteSetupOperationalRows", () => {
  it("returns an empty array when no operational fields are set", () => {
    const rows = buildSiteSetupOperationalRows(baseInput());
    expect(rows).toEqual([]);
  });

  it("emits legal_age_majority row when value is provided", () => {
    const rows = buildSiteSetupOperationalRows(
      baseInput({ legalAgeMajority: "18" }),
    );
    expect(rows).toContainEqual({
      key: "legal_age_majority",
      value: { value: 18 },
    });
  });

  it("skips legal_age_majority when value isn't numeric", () => {
    const rows = buildSiteSetupOperationalRows(
      baseInput({ legalAgeMajority: "abc" }),
    );
    expect(
      rows.find((r) => r.key === "legal_age_majority"),
    ).toBeUndefined();
  });

  it("emits billing_terms when at least one term is provided", () => {
    const rows = buildSiteSetupOperationalRows(
      baseInput({
        billingTermEnrollment: "Matrícula",
        billingTermEnrollmentEn: "Enrollment fee",
      }),
    );
    const billing = rows.find((r) => r.key === "billing_terms");
    expect(billing).toBeDefined();
    expect(
      (billing!.value as { enrollment: { es: string | null; en: string | null } }).enrollment,
    ).toEqual({ es: "Matrícula", en: "Enrollment fee" });
  });

  it("emits academics_section_defaults with parsed teacherPortalRoles", () => {
    const rows = buildSiteSetupOperationalRows(
      baseInput({
        academicsSectionMaxStudents: "45",
        academicsTeacherPortalRoles: "teacher, assistant",
      }),
    );
    const academic = rows.find((r) => r.key === "academics_section_defaults");
    expect(academic).toBeDefined();
    expect(academic!.value).toEqual({
      maxStudents: 45,
      teacherPortalRoles: ["teacher", "assistant"],
    });
  });

  it("emits analytics_config when any field is provided", () => {
    const rows = buildSiteSetupOperationalRows(
      baseInput({
        analyticsTimezone: "Europe/Madrid",
      }),
    );
    const analytics = rows.find((r) => r.key === "analytics_config");
    expect(analytics).toBeDefined();
    expect(
      (analytics!.value as { timezone: string | null }).timezone,
    ).toBe("Europe/Madrid");
  });
});

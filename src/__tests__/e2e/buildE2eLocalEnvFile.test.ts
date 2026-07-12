// REGRESSION CHECK: local supabase status → .env.local.e2e mapping (no Docker).
import { describe, expect, it } from "vitest";
import {
  buildE2eLocalEnvFileContents,
  parseStatusEnv,
  E2E_LOCAL_DEFAULT_SEED,
} from "../../../e2e/buildE2eLocalEnvFile";

describe("buildE2eLocalEnvFileContents", () => {
  it("maps supabase status -o env keys into e2e file body", () => {
    const status = parseStatusEnv(`
API_URL=http://127.0.0.1:54321
ANON_KEY=anon-test
SERVICE_ROLE_KEY=service-test
DB_URL=postgresql://postgres:postgres@127.0.0.1:54322/postgres
`);
    const body = buildE2eLocalEnvFileContents(status);
    expect(body).toContain("NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321");
    expect(body).toContain("NEXT_PUBLIC_SUPABASE_ANON_KEY=anon-test");
    expect(body).toContain("SUPABASE_SERVICE_ROLE_KEY=service-test");
    expect(body).toContain("DATABASE_URL=postgresql://postgres:postgres@127.0.0.1:54322/postgres");
    expect(body).toContain("E2E_STACK=isolated");
    expect(body).toContain(`E2E_ADMIN_EMAIL=${E2E_LOCAL_DEFAULT_SEED.adminEmail}`);
    expect(body).toContain(`E2E_STUDENT_EMAIL=${E2E_LOCAL_DEFAULT_SEED.studentEmail}`);
    expect(body).toContain("PLAYWRIGHT_BASE_URL=http://127.0.0.1:3100");
    expect(body).toContain("SKIP_INITIAL_SITE_SETUP=1");
  });

  it("includes cohort and section ids when provided", () => {
    const status = parseStatusEnv(`
API_URL=http://127.0.0.1:54321
ANON_KEY=anon-test
SERVICE_ROLE_KEY=service-test
`);
    const body = buildE2eLocalEnvFileContents(status, {
      cohortId: "cohort-uuid",
      sectionId: "section-uuid",
    });
    expect(body).toContain("E2E_COHORT_ID=cohort-uuid");
    expect(body).toContain("E2E_SECTION_ID=section-uuid");
  });

  it("throws when required keys are missing", () => {
    expect(() => buildE2eLocalEnvFileContents({})).toThrow(/API_URL/);
  });
});

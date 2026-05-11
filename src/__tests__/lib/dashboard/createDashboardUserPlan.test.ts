// REGRESSION CHECK: Admin create user must mirror registration — minor → MAIL_TENANT synthetic
// email + guardian input; registration_accept route must skip guardian in plan.

import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import en from "@/dictionaries/en.json";
import type { Dictionary } from "@/types/i18n";
import {
  createDashboardUserSchema,
  planCreateDashboardUserInvite,
} from "@/lib/dashboard/createDashboardUserPlan";

const dict = en as unknown as Dictionary;

describe("planCreateDashboardUserInvite", () => {
  beforeEach(() => {
    vi.stubEnv("MAIL_TENANT", "alumnos.test");
  });
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("requires guardian mode for minor via admin_ui", () => {
    const raw = createDashboardUserSchema.parse({
      email: "",
      password: "",
      first_name: "Ana",
      last_name: "Garcia",
      dni_or_passport: "12345678-9",
      phone: "",
      birth_date: "2018-01-10",
      role: "student",
    });
    const plan = planCreateDashboardUserInvite(dict, raw);
    expect(plan.ok).toBe(false);
    if (plan.ok) return;
    expect(plan.message).toBe(dict.admin.users.errCreateGuardianModeRequired);
  });

  it("builds synthetic email and minor link input when guardian is new", () => {
    const raw = createDashboardUserSchema.parse({
      email: "",
      password: "",
      first_name: "Ana",
      last_name: "Garcia",
      dni_or_passport: "12345678-9",
      phone: "",
      birth_date: "2018-01-10",
      role: "student",
      student_guardian_mode: "new",
      tutor_dni: "98765432-1",
      tutor_first_name: "Luis",
      tutor_last_name: "Garcia",
      tutor_email: "luis@example.com",
      tutor_relationship: "father",
    });
    const plan = planCreateDashboardUserInvite(dict, raw);
    expect(plan.ok).toBe(true);
    if (!plan.ok) return;
    expect(plan.effectiveEmail).toMatch(/@alumnos\.test$/);
    expect(plan.minorSyntheticEmailSource).toEqual({
      first_name: "Ana",
      last_name: "Garcia",
      dni: "12345678-9",
      domain: "alumnos.test",
    });
    expect(plan.effectivePhone).toBeNull();
    expect(plan.minorLinkInput?.guardianMode).toBe("new");
    expect(plan.minorLinkInput?.relationship).toBe("father");
  });

  it("uses supplied email for registration_accept minors (no guardian in plan)", () => {
    const raw = createDashboardUserSchema.parse({
      email: "synthetic.minor@test.local",
      password: "",
      first_name: "Ana",
      last_name: "Garcia",
      dni_or_passport: "12345678-9",
      phone: "",
      birth_date: "2018-01-10",
      role: "student",
      provisioning_route: "registration_accept",
    });
    const plan = planCreateDashboardUserInvite(dict, raw);
    expect(plan.ok).toBe(true);
    if (!plan.ok) return;
    expect(plan.effectiveEmail).toBe("synthetic.minor@test.local");
    expect(plan.minorSyntheticEmailSource).toBeNull();
    expect(plan.minorLinkInput).toBeNull();
  });
});

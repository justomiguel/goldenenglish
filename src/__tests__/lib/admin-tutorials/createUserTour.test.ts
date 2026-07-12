// REGRESSION CHECK: Create-user tour step order and birth-path branch flag are the
// Driver.js contract; renaming anchors or dropping studentBirthPathBranch breaks the FAB tours.
import { describe, expect, it } from "vitest";
import {
  buildCreateStudentAdultPathSteps,
  buildCreateStudentMinorPathSteps,
  buildCreateStudentPreBranchSteps,
  type CreateStudentTourCopy,
} from "@/lib/admin-tutorials/createStudentTour";
import {
  buildCreateStaffUserTourSteps,
  type CreateStaffUserTourCopy,
} from "@/lib/admin-tutorials/createStaffUserTour";
import { createUserPath, isCreateUserPath } from "@/lib/admin-tutorials/createUserPath";
import { ADMIN_TOUR_ANCHORS } from "@/lib/admin-tutorials/selectors";

const step = (title: string) => ({ title, description: `${title} body` });

const studentCopy: CreateStudentTourCopy = {
  intro: step("intro"),
  navUsers: step("navUsers"),
  navAdd: step("navAdd"),
  role: step("role"),
  nameFields: step("name"),
  dni: step("dni"),
  birthDate: step("birth"),
  birthDateBranch: {
    title: "branch",
    description: "branch body",
    minorPath: "minor",
    adultPath: "adult",
  },
  minorHint: step("hint"),
  guardianPanel: step("guardian"),
  guardianMode: step("mode"),
  guardianExistingVsNew: step("existing"),
  relationship: step("rel"),
  adultEmail: step("email"),
  phone: step("phone"),
  password: step("password"),
  submitGuide: step("submit"),
  doneBtn: "Done",
  nextBtn: "Next",
  prevBtn: "Back",
  closeBtn: "Close",
  progressText: "{{current}} of {{total}}",
};

const staffCopy: CreateStaffUserTourCopy = {
  intro: step("intro"),
  navUsers: step("navUsers"),
  navAdd: step("navAdd"),
  role: step("role"),
  nameFields: step("name"),
  email: step("email"),
  password: step("password"),
  submitGuide: step("submit"),
  doneBtn: "Done",
  nextBtn: "Next",
  prevBtn: "Back",
  closeBtn: "Close",
  progressText: "{{current}} of {{total}}",
};

describe("createUserPath", () => {
  it("builds and matches the create-user route", () => {
    expect(createUserPath("es")).toBe("/es/dashboard/admin/users/new");
    expect(isCreateUserPath("/es/dashboard/admin/users/new", "es")).toBe(true);
    expect(isCreateUserPath("/es/dashboard/admin/users/new/", "es")).toBe(true);
    expect(isCreateUserPath("/es/dashboard/admin/users", "es")).toBe(false);
  });
});

describe("createStudentTour", () => {
  it("builds pre-branch steps ending with birth path branch", () => {
    const steps = buildCreateStudentPreBranchSteps(studentCopy, { includeNavSteps: false });
    expect(steps[0]?.anchor).toBeNull();
    expect(steps.some((s) => s.setCreateUserRole === "student")).toBe(true);
    const branch = steps.find((s) => s.studentBirthPathBranch);
    expect(branch?.anchor).toBe(ADMIN_TOUR_ANCHORS.createUserBirth);
  });

  it("includes optional nav steps when requested", () => {
    const steps = buildCreateStudentPreBranchSteps(studentCopy, { includeNavSteps: true });
    expect(steps.some((s) => s.anchor === ADMIN_TOUR_ANCHORS.navUsers)).toBe(true);
    expect(steps.some((s) => s.anchor === ADMIN_TOUR_ANCHORS.usersNavAdd)).toBe(true);
  });

  it("builds minor and adult path steps with submit guide", () => {
    const minor = buildCreateStudentMinorPathSteps(studentCopy);
    expect(minor.some((s) => s.anchor === ADMIN_TOUR_ANCHORS.createUserGuardian)).toBe(true);
    expect(minor.at(-1)?.anchor).toBe(ADMIN_TOUR_ANCHORS.createUserSubmit);

    const adult = buildCreateStudentAdultPathSteps(studentCopy);
    expect(adult.some((s) => s.anchor === ADMIN_TOUR_ANCHORS.createUserEmail)).toBe(true);
    expect(adult.at(-1)?.anchor).toBe(ADMIN_TOUR_ANCHORS.createUserSubmit);
  });
});

describe("createStaffUserTour", () => {
  it("sets teacher or admin role and ends on submit guide", () => {
    const teacher = buildCreateStaffUserTourSteps(staffCopy, {
      includeNavSteps: false,
      role: "teacher",
    });
    expect(teacher.some((s) => s.setCreateUserRole === "teacher")).toBe(true);
    expect(teacher.at(-1)?.anchor).toBe(ADMIN_TOUR_ANCHORS.createUserSubmit);

    const admin = buildCreateStaffUserTourSteps(staffCopy, {
      includeNavSteps: true,
      role: "admin",
    });
    expect(admin.some((s) => s.setCreateUserRole === "admin")).toBe(true);
    expect(admin.some((s) => s.anchor === ADMIN_TOUR_ANCHORS.navUsers)).toBe(true);
  });
});

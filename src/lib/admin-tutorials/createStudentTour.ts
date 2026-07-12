import type { AdminTourStepDef } from "@/lib/admin-tutorials/adminTourStepDef";
import { ADMIN_TOUR_ANCHORS } from "@/lib/admin-tutorials/selectors";

export type CreateStudentTourStepCopy = {
  title: string;
  description: string;
};

export type CreateStudentTourCopy = {
  intro: CreateStudentTourStepCopy;
  navUsers: CreateStudentTourStepCopy;
  navAdd: CreateStudentTourStepCopy;
  role: CreateStudentTourStepCopy;
  nameFields: CreateStudentTourStepCopy;
  dni: CreateStudentTourStepCopy;
  birthDate: CreateStudentTourStepCopy;
  birthDateBranch: {
    title: string;
    description: string;
    minorPath: string;
    adultPath: string;
  };
  minorHint: CreateStudentTourStepCopy;
  guardianPanel: CreateStudentTourStepCopy;
  guardianMode: CreateStudentTourStepCopy;
  guardianExistingVsNew: CreateStudentTourStepCopy;
  relationship: CreateStudentTourStepCopy;
  adultEmail: CreateStudentTourStepCopy;
  phone: CreateStudentTourStepCopy;
  password: CreateStudentTourStepCopy;
  submitGuide: CreateStudentTourStepCopy;
  doneBtn: string;
  nextBtn: string;
  prevBtn: string;
  closeBtn: string;
  progressText: string;
};

/** Phase A: up to and including the birth-date branch popover. */
export function buildCreateStudentPreBranchSteps(
  copy: CreateStudentTourCopy,
  opts: { includeNavSteps: boolean },
): AdminTourStepDef[] {
  const steps: AdminTourStepDef[] = [
    {
      anchor: null,
      title: copy.intro.title,
      description: copy.intro.description,
    },
  ];

  if (opts.includeNavSteps) {
    steps.push(
      {
        anchor: ADMIN_TOUR_ANCHORS.navUsers,
        title: copy.navUsers.title,
        description: copy.navUsers.description,
        optional: true,
      },
      {
        anchor: ADMIN_TOUR_ANCHORS.usersNavAdd,
        title: copy.navAdd.title,
        description: copy.navAdd.description,
        optional: true,
      },
    );
  }

  steps.push(
    {
      anchor: ADMIN_TOUR_ANCHORS.createUserRole,
      title: copy.role.title,
      description: copy.role.description,
      setCreateUserRole: "student",
    },
    {
      anchor: ADMIN_TOUR_ANCHORS.createUserLastName,
      title: copy.nameFields.title,
      description: copy.nameFields.description,
    },
    {
      anchor: ADMIN_TOUR_ANCHORS.createUserDni,
      title: copy.dni.title,
      description: copy.dni.description,
    },
    {
      anchor: ADMIN_TOUR_ANCHORS.createUserBirth,
      title: copy.birthDate.title,
      description: copy.birthDate.description,
    },
    {
      anchor: ADMIN_TOUR_ANCHORS.createUserBirth,
      title: copy.birthDateBranch.title,
      description: copy.birthDateBranch.description,
      studentBirthPathBranch: true,
    },
  );

  return steps;
}

/** Phase B — minor path after guardian panel is visible. */
export function buildCreateStudentMinorPathSteps(copy: CreateStudentTourCopy): AdminTourStepDef[] {
  return [
    {
      anchor: ADMIN_TOUR_ANCHORS.createUserMinorHint,
      title: copy.minorHint.title,
      description: copy.minorHint.description,
      optional: true,
    },
    {
      anchor: ADMIN_TOUR_ANCHORS.createUserGuardian,
      title: copy.guardianPanel.title,
      description: copy.guardianPanel.description,
    },
    {
      anchor: ADMIN_TOUR_ANCHORS.createUserGuardianMode,
      title: copy.guardianMode.title,
      description: copy.guardianMode.description,
    },
    {
      anchor: ADMIN_TOUR_ANCHORS.createUserGuardianSearch,
      title: copy.guardianExistingVsNew.title,
      description: copy.guardianExistingVsNew.description,
      optional: true,
    },
    {
      anchor: ADMIN_TOUR_ANCHORS.createUserRelationship,
      title: copy.relationship.title,
      description: copy.relationship.description,
    },
    {
      anchor: ADMIN_TOUR_ANCHORS.createUserPassword,
      title: copy.password.title,
      description: copy.password.description,
    },
    {
      anchor: ADMIN_TOUR_ANCHORS.createUserSubmit,
      title: copy.submitGuide.title,
      description: copy.submitGuide.description,
    },
  ];
}

/** Phase B — adult path after email field is visible. */
export function buildCreateStudentAdultPathSteps(copy: CreateStudentTourCopy): AdminTourStepDef[] {
  return [
    {
      anchor: ADMIN_TOUR_ANCHORS.createUserEmail,
      title: copy.adultEmail.title,
      description: copy.adultEmail.description,
    },
    {
      anchor: ADMIN_TOUR_ANCHORS.createUserPassword,
      title: copy.password.title,
      description: copy.password.description,
    },
    {
      anchor: ADMIN_TOUR_ANCHORS.createUserPhone,
      title: copy.phone.title,
      description: copy.phone.description,
      optional: true,
    },
    {
      anchor: ADMIN_TOUR_ANCHORS.createUserSubmit,
      title: copy.submitGuide.title,
      description: copy.submitGuide.description,
    },
  ];
}

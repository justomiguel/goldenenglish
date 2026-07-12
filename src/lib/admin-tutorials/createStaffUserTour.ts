import type { AdminTourStepDef } from "@/lib/admin-tutorials/adminTourStepDef";
import { ADMIN_TOUR_ANCHORS } from "@/lib/admin-tutorials/selectors";

export type CreateStaffUserRole = "teacher" | "admin";

export type CreateStaffUserTourStepCopy = {
  title: string;
  description: string;
};

export type CreateStaffUserTourCopy = {
  intro: CreateStaffUserTourStepCopy;
  navUsers: CreateStaffUserTourStepCopy;
  navAdd: CreateStaffUserTourStepCopy;
  role: CreateStaffUserTourStepCopy;
  nameFields: CreateStaffUserTourStepCopy;
  email: CreateStaffUserTourStepCopy;
  password: CreateStaffUserTourStepCopy;
  submitGuide: CreateStaffUserTourStepCopy;
  doneBtn: string;
  nextBtn: string;
  prevBtn: string;
  closeBtn: string;
  progressText: string;
};

/** Shared staff (teacher/admin) create-user tour steps. Guide-only — no submit. */
export function buildCreateStaffUserTourSteps(
  copy: CreateStaffUserTourCopy,
  opts: { includeNavSteps: boolean; role: CreateStaffUserRole },
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
      setCreateUserRole: opts.role,
    },
    {
      anchor: ADMIN_TOUR_ANCHORS.createUserLastName,
      title: copy.nameFields.title,
      description: copy.nameFields.description,
    },
    {
      anchor: ADMIN_TOUR_ANCHORS.createUserEmail,
      title: copy.email.title,
      description: copy.email.description,
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
  );

  return steps;
}

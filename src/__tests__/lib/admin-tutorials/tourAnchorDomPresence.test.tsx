// REGRESSION CHECK: L2 tour staleness — mount real admin shells with fixtures (no Supabase).
// Shared matrix: listTourRuntimeChecks (rule 33 / isolated E2E harness).
import { describe, expect, it, vi } from "vitest";
import { render } from "@testing-library/react";
import { dictEn } from "@/test/dictEn";
import { listTourRuntimeChecks } from "@/lib/admin-tutorials/listTourRuntimeChecks";
import { expectTourAnchorsInDocument } from "@/lib/admin-tutorials/expectTourAnchorsInDocument";
import { ADMIN_TOUR_ANCHORS } from "@/lib/admin-tutorials/selectors";
import { AdminSidebar } from "@/components/dashboard/AdminSidebar";
import { AdminChromeHeader } from "@/components/dashboard/AdminChromeHeader";
import { AdminHubHome } from "@/components/dashboard/AdminHubHome";
import { AcademicHubToolbar } from "@/components/organisms/AcademicHubToolbar";
import { AcademicCohortDetailShell } from "@/components/organisms/AcademicCohortDetailShell";
import { CohortSectionsToolbar } from "@/components/organisms/CohortSectionsToolbar";
import { AdminSectionSubnav } from "@/components/dashboard/AdminSectionSubnav";
import { AdminCreateUserForm } from "@/components/dashboard/AdminCreateUserForm";
import type { AdminHubSummary } from "@/lib/dashboard/loadAdminHubSummary";
import type { BrandPublic } from "@/lib/brand/server";
import type { AcademicNewSectionModalDict } from "@/components/organisms/AcademicNewSectionModal.types";
import type { AcademicRolloverWizardDict } from "@/components/organisms/AcademicRolloverWizard";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn(), replace: vi.fn() }),
  usePathname: () => "/en/dashboard/admin",
}));

vi.mock("next/image", () => ({
  default: (props: { alt?: string }) => <img alt={props.alt ?? ""} />,
}));

vi.mock("@/app/[locale]/dashboard/admin/academics/actions", () => ({
  createAcademicCohortAction: vi.fn(),
}));

vi.mock("@/components/organisms/AcademicRolloverWizard", () => ({
  AcademicRolloverWizard: () => null,
}));

vi.mock("@/components/organisms/AcademicNewSectionModal", () => ({
  AcademicNewSectionModal: () => null,
}));

vi.mock("@/hooks/useAdminCreateUserForm", () => ({
  useAdminCreateUserForm: () => ({
    onSubmit: (e: { preventDefault: () => void }) => e.preventDefault(),
    firstName: "",
    lastName: "",
    setFirstName: vi.fn(),
    setLastName: vi.fn(),
    showBirth: true,
    birthDate: "2010-01-15",
    setBirthDate: vi.fn(),
    resetGuardianUi: vi.fn(),
    showMinor: false,
    showMinorSyntheticHint: false,
    showAdultStudentEmail: true,
    isStudent: true,
    email: "",
    setEmail: vi.fn(),
    password: "",
    setPassword: vi.fn(),
    passwordHintId: "pw-hint",
    role: "student" as const,
    setRole: vi.fn(),
    dni: "",
    setDni: vi.fn(),
    phone: "",
    setPhone: vi.fn(),
    guardianMode: "existing" as const,
    setGuardianMode: vi.fn(),
    pickedGuardian: null,
    setPickedGuardian: vi.fn(),
    guardianSearchKey: 0,
    setGuardianSearchKey: vi.fn(),
    tutorDni: "",
    setTutorDni: vi.fn(),
    tutorFirstName: "",
    setTutorFirstName: vi.fn(),
    tutorLastName: "",
    setTutorLastName: vi.fn(),
    tutorEmail: "",
    setTutorEmail: vi.fn(),
    tutorPhone: "",
    setTutorPhone: vi.fn(),
    relationship: "" as const,
    setRelationship: vi.fn(),
    reuseConfirm: null,
    setReuseConfirm: vi.fn(),
    reuseBusy: false,
    feedback: null,
    busy: false,
    searchParents: vi.fn(),
    confirmReuseLink: vi.fn(),
  }),
}));

const brand: BrandPublic = {
  name: "E2E Institute",
  legalName: "E2E Institute",
  tagline: "tag",
  taglineEn: "tag",
  legalRegistry: "",
  logoPath: "/images/logo.png",
  logoAlt: "logo",
  faviconPath: "/favicon.ico",
  faviconBundlePrefix: null,
  contactEmail: "",
  contactPhone: "",
  contactAddress: "",
  socialFacebook: "",
  socialInstagram: "",
  socialWhatsapp: "",
};

const summary: AdminHubSummary = {
  traffic: { totalHits: 1, authenticatedHits: 1, guestHits: 0 },
  trafficWeekOverWeek: { thisWeek: 1, lastWeek: 1 },
  users: { total: 1, byRole: [{ role: "student", count: 1 }] },
  payments: { pendingCount: 0 },
  registrations: { newCount: 0, totalCount: 0 },
  studentsWithoutSection: 0,
  messages: { recentCount: 0, latestPreview: null },
};

const academicDict = {
  newCohort: "New cohort",
  newCohortTip: "tip",
  newCohortModal: {
    title: "Create",
    nameLabel: "Name",
    slugLabel: "Slug",
    slugHint: "hint",
    submit: "Create",
    cancel: "Cancel",
    error: "Error",
  },
};

const sectionModalDict = {
  title: "t",
  nameLabel: "n",
  teacherLabel: "te",
  teacherPlaceholder: "p",
  maxStudentsLabel: "m",
  maxStudentsDefaultHint: "h",
  maxStudentsCustomize: "c",
  maxStudentsCustomLabel: "cl",
  maxStudentsCustomHint: "ch",
  maxStudentsInvalid: "inv",
  submit: "ok",
  cancel: "c",
  error: "err",
  noTeachers: "nt",
  scheduleTitle: "st",
  scheduleHint: "sh",
  scheduleAddSlot: "add",
  scheduleRemoveSlot: "rm",
  scheduleDayLabel: "day",
  scheduleStartLabel: "start",
  scheduleEndLabel: "end",
  scheduleInvalid: "si",
  weekdays: { sun: "s", mon: "m", tue: "t", wed: "w", thu: "th", fri: "f", sat: "sa" },
  sectionPeriodStartsLabel: "ps",
  sectionPeriodEndsLabel: "pe",
} satisfies AcademicNewSectionModalDict;

const rolloverDict = {
  openButton: "Rollover",
  title: "t",
  step1Title: "1",
  step2Title: "2",
  step3Title: "3",
  sourceSection: "src",
  targetSection: "tgt",
  next: "n",
  back: "b",
  confirm: "c",
  cancel: "x",
  close: "cl",
  error: "e",
  success: "s",
  emptyStudents: "empty",
  loadingStudents: "load",
  filterPlaceholder: "f",
} satisfies AcademicRolloverWizardDict;

function anchorsFor(id: string) {
  const check = listTourRuntimeChecks().find((c) => c.id === id);
  if (!check) throw new Error(`missing runtime check ${id}`);
  return check.anchors;
}

describe("tourAnchorDomPresence (L2 isolated)", () => {
  it("screen:admin-home mounts chrome + hub anchors from listTourRuntimeChecks", () => {
    render(
      <>
        <AdminSidebar
          locale="en"
          dict={dictEn.dashboard.adminNav}
          newRegistrationsCount={0}
          recentInboundMessagesCount={0}
        />
        <AdminChromeHeader
          locale="en"
          brand={brand}
          dict={dictEn}
          adminProfileRole="admin"
          teacherPortalAllowed={false}
        />
        <AdminHubHome
          locale="en"
          dict={dictEn}
          summary={summary}
          birthdayRows={[]}
          birthdaysDict={dictEn.dashboard.birthdays}
        />
      </>,
    );
    expectTourAnchorsInDocument(anchorsFor("screen:admin-home"));
  });

  it("task:create-cohort mounts new-cohort + academic nav anchors", () => {
    render(
      <>
        <AdminSidebar
          locale="en"
          dict={dictEn.dashboard.adminNav}
          newRegistrationsCount={0}
          recentInboundMessagesCount={0}
        />
        <AcademicHubToolbar locale="en" dict={academicDict} />
      </>,
    );
    expectTourAnchorsInDocument(anchorsFor("task:create-cohort"));
  });

  it("task:create-section mounts cohort shell + sections toolbar anchors", () => {
    render(
      <AcademicCohortDetailShell
        labels={{
          tablistAria: "tabs",
          overview: "Overview",
          overviewLead: "lead",
          sections: "Sections",
          retention: "Retention",
          retentionLead: "r",
          transfers: "Transfers",
          transfersLead: "t",
        }}
        defaultTab="sections"
        overview={<div />}
        sections={
          <CohortSectionsToolbar
            locale="en"
            cohortId="11111111-1111-4111-8111-111111111111"
            newSectionButton="New section"
            newSectionModalDict={sectionModalDict}
            defaultSectionMaxStudents={20}
            teachers={[]}
            rollover={{
              dict: rolloverDict,
              sourceSectionOptions: [],
              targetSectionOptions: [],
            }}
          />
        }
        retention={<div />}
        transferInbox={<div />}
      />,
    );
    expectTourAnchorsInDocument(anchorsFor("task:create-section"));
    expect(
      document.querySelector(`[data-tour="${ADMIN_TOUR_ANCHORS.cohortSectionsTab}"]`),
    ).toBeTruthy();
  });

  it("task:create-user mounts form + users nav anchors", () => {
    render(
      <>
        <AdminSidebar
          locale="en"
          dict={dictEn.dashboard.adminNav}
          newRegistrationsCount={0}
          recentInboundMessagesCount={0}
        />
        <AdminSectionSubnav
          ariaLabel={dictEn.admin.usersNav.aria}
          items={[
            {
              href: "/en/dashboard/admin/users",
              label: dictEn.admin.usersNav.list,
              icon: "list",
            },
            {
              href: "/en/dashboard/admin/users/new",
              label: dictEn.admin.usersNav.add,
              icon: "userPlus",
              tourId: ADMIN_TOUR_ANCHORS.usersNavAdd,
            },
          ]}
        />
        <AdminCreateUserForm
          locale="en"
          legalAgeMajority={18}
          labels={dictEn.admin.users}
          birthLabels={dictEn.register}
          birthDateIncompleteMessage="incomplete"
        />
      </>,
    );
    expectTourAnchorsInDocument(anchorsFor("task:create-user"));
  });
});

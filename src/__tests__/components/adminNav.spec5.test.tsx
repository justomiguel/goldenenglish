/**
 * Spec 5 — Admin menu design
 * Tests for the 7 spec groups:
 *  1. No orphan groups
 *  2. No near-duplicate names (F07 invariant)
 *  3. Every destination survives
 *  4. Label matches heading (same value as page key)
 *  5. Teacher card gone, link not
 *  6. Tour anchors intact
 *  7. Locale parity
 */
import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { buildAdminSidebarNavGroups } from "@/components/dashboard/adminSidebarNavGroups";
import { AdminSidebarNavContent } from "@/components/dashboard/AdminSidebarNavContent";
import { AdminChromeHeader } from "@/components/dashboard/AdminChromeHeader";
import { dictEn } from "@/test/dictEn";
import en from "@/dictionaries/en.json";
import es from "@/dictionaries/es.json";
import pt from "@/dictionaries/pt.json";

// ─── Shared mocks ────────────────────────────────────────────────────────────

vi.mock("next/navigation", () => ({
  usePathname: () => "/es/dashboard/admin",
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn(), replace: vi.fn() }),
}));

vi.mock("next/image", () => ({
  default: ({ alt }: { alt?: string }) => <img alt={alt ?? ""} />,
}));

vi.mock("@/lib/dashboard/viewAsActions", () => ({
  clearViewAsAction: vi.fn(async () => ({ href: "/en/dashboard/admin" })),
  openOwnTeacherAction: vi.fn(async () => ({ href: "/en/dashboard/teacher" })),
  searchViewAsPeopleAction: vi.fn(async () => ({ rows: [] })),
  startViewAsAction: vi.fn(async () => ({ href: "/en/dashboard/student", started: true })),
}));

// ─── Helpers ─────────────────────────────────────────────────────────────────

const BASE = "/es/dashboard/admin";
const PROFILE = "/es/dashboard/profile";
const BADGES_ZERO = { newRegistrations: 0, recentInboundMessages: 0 };

/** Normalize a nav-item label for near-duplicate detection:
 *  lowercase each word, strip trailing 's', return word array. */
function normalizeWords(label: string): string[] {
  return label
    .toLowerCase()
    .split(/\s+/)
    .map((w) => w.replace(/s$/, ""));
}

/** True if `a` is a word-sequence prefix of `b` (a.length ≤ b.length). */
function isWordSequencePrefix(a: string[], b: string[]): boolean {
  if (a.length > b.length) return false;
  return a.every((word, i) => b[i] === word);
}

/** Returns all colliding pairs: one is a word-sequence prefix of the other. */
function findPrefixPairs(labels: string[]): Array<[string, string]> {
  const collisions: Array<[string, string]> = [];
  for (let i = 0; i < labels.length; i++) {
    for (let j = i + 1; j < labels.length; j++) {
      const a = normalizeWords(labels[i]);
      const b = normalizeWords(labels[j]);
      if (isWordSequencePrefix(a, b) || isWordSequencePrefix(b, a)) {
        collisions.push([labels[i], labels[j]]);
      }
    }
  }
  return collisions;
}

function allItemLabels(dict: typeof en["dashboard"]["adminNav"]): string[] {
  const groups = buildAdminSidebarNavGroups(BASE, PROFILE, dict as never, BADGES_ZERO);
  return groups.flatMap((g) => g.items.map((i) => i.label));
}

function canonicalDailyHrefs(base: string): Set<string> {
  return new Set([
    base,
    `${base}/students`,
    `${base}/teachers`,
    `${base}/parents`,
    `${base}/users`,
    `${base}/registrations`,
    `${base}/academic`,
    `${base}/finance`,
    `${base}/messages`,
    `${base}/events`,
    `${base}/institute`,
  ]);
}

// ─── Test 1: No orphan groups ─────────────────────────────────────────────────

describe("1 – No orphan groups", () => {
  it("every group in ES has a non-null label", () => {
    const groups = buildAdminSidebarNavGroups(BASE, PROFILE, es.dashboard.adminNav as never, BADGES_ZERO);
    const nullGroups = groups.filter((g) => g.label == null || g.label === "");
    expect(nullGroups).toHaveLength(0);
  });

  it("every group in EN has a non-null label", () => {
    const groups = buildAdminSidebarNavGroups(BASE, PROFILE, en.dashboard.adminNav as never, BADGES_ZERO);
    const nullGroups = groups.filter((g) => g.label == null || g.label === "");
    expect(nullGroups).toHaveLength(0);
  });

  it("every group in PT has a non-null label", () => {
    const groups = buildAdminSidebarNavGroups(BASE, PROFILE, pt.dashboard.adminNav as never, BADGES_ZERO);
    const nullGroups = groups.filter((g) => g.label == null || g.label === "");
    expect(nullGroups).toHaveLength(0);
  });
});

// ─── Test 2: No near-duplicate names ─────────────────────────────────────────

describe("2 – No near-duplicate item labels (F07 invariant)", () => {
  it("ES labels have no word-sequence prefix collisions", () => {
    const labels = allItemLabels(es.dashboard.adminNav as never);
    const collisions = findPrefixPairs(labels);
    expect(collisions).toHaveLength(0);
  });

  it("EN labels have no word-sequence prefix collisions", () => {
    const labels = allItemLabels(en.dashboard.adminNav as never);
    const collisions = findPrefixPairs(labels);
    expect(collisions).toHaveLength(0);
  });

  it("PT labels have no word-sequence prefix collisions", () => {
    const labels = allItemLabels(pt.dashboard.adminNav as never);
    const collisions = findPrefixPairs(labels);
    expect(collisions).toHaveLength(0);
  });
});

// ─── Test 3: Every destination survives ──────────────────────────────────────

describe("3 – Daily list is the operations destinations", () => {
  it("the set of hrefs is exactly the daily destinations", () => {
    const groups = buildAdminSidebarNavGroups(BASE, PROFILE, en.dashboard.adminNav as never, BADGES_ZERO);
    const actual = new Set(groups.flatMap((g) => g.items.map((i) => i.href)));
    expect(actual).toEqual(canonicalDailyHrefs(BASE));
  });
});

// ─── Test 4: Label matches heading ───────────────────────────────────────────

describe("4 – Menu label matches page heading for renamed routes", () => {
  it("ES: /admin home — adminNav.home === admin.home.title", () => {
    expect(es.dashboard.adminNav.home).toBe(es.admin.home.title);
  });

  it("ES: /admin/academic — adminNav.academics === academicHub.title", () => {
    expect(es.dashboard.adminNav.academics).toBe(es.dashboard.academicHub.title);
  });

  it("ES: /admin/academic/contents — adminNav.contents === adminContents.title", () => {
    expect(es.dashboard.adminNav.contents).toBe(es.dashboard.adminContents.title);
  });

  it("ES: /admin/cms — adminNav.cms === admin.cms.hubTitle", () => {
    expect(es.dashboard.adminNav.cms).toBe(es.admin.cms.hubTitle);
  });

  it("ES: /admin/registrations — adminNav.registrations === admin.registrations.title", () => {
    expect(es.dashboard.adminNav.registrations).toBe(es.admin.registrations.title);
  });

  it("ES: /admin/analytics — adminNav.analytics === admin.analytics.title", () => {
    expect(es.dashboard.adminNav.analytics).toBe(es.admin.analytics.title);
  });

  it("ES: /admin/changelog — adminNav.changelog === adminChangelogPage.title", () => {
    expect(es.dashboard.adminNav.changelog).toBe(es.dashboard.adminChangelogPage.title);
  });
});

// ─── Test 5: Teacher card gone, header link not ───────────────────────────────

describe("5 – Teacher card gone from sidebar; header link survives", () => {
  const navDict = dictEn.dashboard.adminNav;
  const teacherHref = "/en/dashboard/teacher";

  it("AdminSidebarNavContent renders no link to the teacher portal even when teacherNav data is provided", () => {
    // Before the change, passing teacherNav causes TeacherSwitchCard to render a link.
    // After removal of the card, no teacher portal link should ever appear in the sidebar.
    const fakeTeacherNav = {
      href: teacherHref,
      hint: "Hint",
      cta: "Open teacher portal",
      ctaAria: "Open teacher portal",
      switchHint: "Switch",
    };
    render(
      <AdminSidebarNavContent
        locale="en"
        dict={navDict}
        newRegistrationsCount={0}
        recentInboundMessagesCount={0}
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        {...({ teacherNav: fakeTeacherNav } as any)}
      />,
    );
    const teacherLinks = screen.queryAllByRole("link").filter(
      (l) => l.getAttribute("href") === teacherHref,
    );
    expect(teacherLinks).toHaveLength(0);
  });

  it("AdminChromeHeader renders the workspace role selector", () => {
    const brand = {
      name: "Test",
      tagline: "tagline",
      taglineEn: "tagline",
      logoPath: "/logo.png",
      logoAlt: "logo",
    };
    render(
      <AdminChromeHeader
        locale="en"
        brand={brand as never}
        dict={dictEn}
        adminProfileRole="admin"
        teacherPortalAllowed={true}
      />,
    );
    expect(
      screen.getByRole("button", { name: dictEn.dashboard.viewAs.ariaSelector }),
    ).toBeTruthy();
  });
});

// ─── Test 6: Tour anchors intact ─────────────────────────────────────────────

describe("6 – data-tour anchors survive", () => {
  it("admin-nav-users is present in sidebar", () => {
    const groups = buildAdminSidebarNavGroups(BASE, PROFILE, en.dashboard.adminNav as never, BADGES_ZERO);
    const usersItem = groups
      .flatMap((g) => g.items)
      .find((i) => i.href === `${BASE}/students`);
    expect(usersItem?.tourId).toBe("admin-nav-users");
  });

  it("admin-nav-academic is present in sidebar", () => {
    const groups = buildAdminSidebarNavGroups(BASE, PROFILE, en.dashboard.adminNav as never, BADGES_ZERO);
    const academicItem = groups
      .flatMap((g) => g.items)
      .find((i) => i.href === `${BASE}/academic`);
    expect(academicItem?.tourId).toBe("admin-nav-academic");
  });

  it("admin-chrome-teacher-portal anchor is on the header link", () => {
    const brand = {
      name: "Test",
      tagline: "t",
      taglineEn: "t",
      logoPath: "/logo.png",
      logoAlt: "logo",
    };
    const { container } = render(
      <AdminChromeHeader
        locale="en"
        brand={brand as never}
        dict={dictEn}
        adminProfileRole="admin"
        teacherPortalAllowed={true}
      />,
    );
    const el = container.querySelector('[data-tour="admin-chrome-teacher-portal"]');
    expect(el).not.toBeNull();
  });
});

// ─── Test 7: Locale parity ───────────────────────────────────────────────────

describe("7 – Locale parity: dictionaries share the same structure", () => {
  function getAdminNavKeys(dict: typeof en) {
    return Object.keys(dict.dashboard.adminNav).sort();
  }

  it("ES and EN have the same adminNav keys", () => {
    expect(getAdminNavKeys(es as typeof en)).toEqual(getAdminNavKeys(en));
  });

  it("PT and EN have the same adminNav keys", () => {
    expect(getAdminNavKeys(pt as typeof en)).toEqual(getAdminNavKeys(en));
  });
});

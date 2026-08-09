// REGRESSION CHECK: Parent screen path matching must stay exact (no inherit to
// task detail / payment return) so Help Explain CTA and L3 matrix stay aligned.
import { describe, expect, it } from "vitest";
import {
  resolveParentScreenTour,
  parentHomePath,
} from "@/lib/parent-tutorials/screenCatalog";

describe("resolveParentScreenTour", () => {
  const locale = "es";

  it("matches parent home exactly", () => {
    expect(resolveParentScreenTour(parentHomePath(locale), locale)?.id).toBe(
      "parent-home",
    );
    expect(resolveParentScreenTour(`/${locale}/dashboard/parent/`, locale)?.scope).toBe(
      "chrome-and-content",
    );
  });

  it("matches top-level and secondary hubs as content-only", () => {
    const cases: Array<[string, string]> = [
      [`/${locale}/dashboard/parent/calendar`, "parent-calendar"],
      [`/${locale}/dashboard/parent/child`, "parent-child"],
      [`/${locale}/dashboard/parent/payments`, "parent-payments"],
      [`/${locale}/dashboard/parent/messages`, "parent-messages"],
      [`/${locale}/dashboard/parent/account`, "parent-account"],
      [`/${locale}/dashboard/parent/billing`, "parent-billing"],
      [`/${locale}/dashboard/profile`, "parent-profile"],
    ];
    for (const [path, id] of cases) {
      const match = resolveParentScreenTour(path, locale);
      expect(match?.id, path).toBe(id);
      expect(match?.scope, path).toBe("content-only");
    }
  });

  it("matches billing on legacy path and payments fees tab", () => {
    expect(
      resolveParentScreenTour(`/${locale}/dashboard/parent/payments?tab=fees`, locale)?.id,
    ).toBe("parent-billing");
  });

  it("gives each child section its own tour instead of a tab on a hub", () => {
    const cases: Array<[string, string]> = [
      [`/${locale}/dashboard/parent/child/attendance`, "parent-attendance"],
      [`/${locale}/dashboard/parent/child/grades`, "parent-grades"],
      [`/${locale}/dashboard/parent/child/tasks`, "parent-tasks"],
      [`/${locale}/dashboard/parent/child/feedback`, "parent-feedback"],
      [`/${locale}/dashboard/parent/child/badges`, "parent-badges"],
      [`/${locale}/dashboard/parent/child/edit`, "parent-child-detail"],
    ];
    for (const [path, id] of cases) {
      const match = resolveParentScreenTour(path, locale);
      expect(match?.id, path).toBe(id);
      expect(match?.scope, path).toBe("content-only");
    }
  });

  it("keeps the child screen's own tour when a section is not the exact path", () => {
    expect(
      resolveParentScreenTour(`/${locale}/dashboard/parent/child?studentId=abc`, locale)?.id,
    ).toBe("parent-child");
    expect(
      resolveParentScreenTour(`/${locale}/dashboard/parent/child/unknown`, locale),
    ).toBeNull();
  });

  it("no longer resolves the retired progress and settings screens", () => {
    expect(resolveParentScreenTour(`/${locale}/dashboard/parent/progress`, locale)).toBeNull();
    expect(resolveParentScreenTour(`/${locale}/dashboard/parent/settings`, locale)).toBeNull();
  });

  it("does not match nested payment returns or task detail", () => {
    expect(
      resolveParentScreenTour(
        `/${locale}/dashboard/parent/payments/mp-return`,
        locale,
      ),
    ).toBeNull();
    expect(
      resolveParentScreenTour(
        `/${locale}/dashboard/parent/tasks/task-instance-1`,
        locale,
      ),
    ).toBeNull();
  });
});

import { describe, expect, it } from "vitest";
import {
  adminUsersProfileSortColumns,
  adminUsersSortCriteriaToParams,
  cycleAdminUsersSortCriterion,
  moveAdminUsersSortCriterion,
  addAdminUsersSortCriterion,
  parseAdminUsersSortCriteria,
  replaceAdminUsersSortKey,
  setAdminUsersSortChecked,
} from "@/lib/dashboard/adminUsersSortCriteria";

describe("parseAdminUsersSortCriteria", () => {
  it("reads order before the single sort params", () => {
    expect(
      parseAdminUsersSortCriteria({
        order: "name:asc,monthlyStatus:desc",
        sort: "email",
        dir: "asc",
      }),
    ).toEqual([
      { key: "name", dir: "asc" },
      { key: "monthlyStatus", dir: "desc" },
    ]);
  });

  it("falls back to one criterion", () => {
    expect(parseAdminUsersSortCriteria({ sort: "phone", dir: "desc" })).toEqual([
      { key: "phone", dir: "desc" },
    ]);
  });
});

describe("adminUsersSortCriteriaToParams", () => {
  it("omits params for the default name order", () => {
    expect(adminUsersSortCriteriaToParams([{ key: "name", dir: "asc" }])).toEqual({
      order: undefined,
      sort: undefined,
      dir: undefined,
    });
  });

  it("keeps the first criterion in sort and dir", () => {
    expect(
      adminUsersSortCriteriaToParams([
        { key: "name", dir: "asc" },
        { key: "monthlyStatus", dir: "desc" },
      ]),
    ).toEqual({
      order: "name:asc,monthlyStatus:desc",
      sort: "name",
      dir: undefined,
    });
  });
});

describe("sort checklist edits", () => {
  it("appends a checked criterion and moves it", () => {
    const checked = setAdminUsersSortChecked([{ key: "name", dir: "asc" }], "monthlyStatus", true);
    expect(checked).toEqual([
      { key: "name", dir: "asc" },
      { key: "monthlyStatus", dir: "asc" },
    ]);
    expect(moveAdminUsersSortCriterion(checked, "monthlyStatus", -1)[0]?.key).toBe("monthlyStatus");
  });

  it("resets to name when the last criterion is cleared", () => {
    expect(setAdminUsersSortChecked([{ key: "phone", dir: "desc" }], "phone", false)).toEqual([
      { key: "name", dir: "asc" },
    ]);
  });

  it("replaces the first field without keeping name", () => {
    expect(
      replaceAdminUsersSortKey([{ key: "name", dir: "asc" }], 0, "monthlyStatus"),
    ).toEqual([{ key: "monthlyStatus", dir: "asc" }]);
  });

  it("appends the next unused field", () => {
    expect(
      addAdminUsersSortCriterion([{ key: "monthlyStatus", dir: "desc" }], ["name", "monthlyStatus", "sections"]),
    ).toEqual([
      { key: "monthlyStatus", dir: "desc" },
      { key: "name", dir: "asc" },
    ]);
  });

  it("flips direction when the column is already selected", () => {
    expect(cycleAdminUsersSortCriterion([{ key: "name", dir: "asc" }], "name")).toEqual([
      { key: "name", dir: "desc" },
    ]);
  });
});

describe("adminUsersProfileSortColumns", () => {
  it("orders profile columns once and ends with id", () => {
    expect(
      adminUsersProfileSortColumns([
        { key: "name", dir: "asc" },
        { key: "email", dir: "desc" },
        { key: "monthlyStatus", dir: "asc" },
      ]),
    ).toEqual([
      { column: "last_name", ascending: true },
      { column: "first_name", ascending: true },
      { column: "id", ascending: true },
    ]);
  });
});

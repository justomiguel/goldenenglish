"use client";

import type { Dictionary } from "@/types/i18n";
import type { ViewAsSelectorRole, ViewAsSubject, ViewAsSubjectRole } from "@/lib/dashboard/viewAsTypes";
import { adminUserRoleOptionLabel } from "@/lib/dashboard/adminUserRoleOptionLabel";
import type { ViewAsPersonHit } from "@/lib/dashboard/viewAsActions";

export const WORKSPACE_SELECTOR_ROLES: ViewAsSelectorRole[] = [
  "admin",
  "teacher",
  "student",
  "parent",
  "assistant",
  "all",
];

export function workspaceSelectorLabel(
  role: ViewAsSelectorRole,
  chrome: Dictionary["dashboard"]["adminChrome"],
  roleLabels: Dictionary["admin"]["users"],
): string {
  if (role === "admin") return chrome.workspaceAdmin;
  if (role === "teacher") return chrome.workspaceTeacher;
  if (role === "all") return roleLabels.roleFilterAll;
  return adminUserRoleOptionLabel(roleLabels, role);
}

export function StaffWorkspaceSwitchMenu({
  labels,
  roleLabels,
  chrome,
  activeRole,
  viewAs,
  searchRole,
  query,
  hits,
  searching,
  showRoles,
  showSearch,
  rowClassName,
  onPickRole,
  onQueryChange,
  onPickPerson,
  onOwnTeacher,
}: {
  labels: Dictionary["dashboard"]["viewAs"];
  roleLabels: Dictionary["admin"]["users"];
  chrome: Dictionary["dashboard"]["adminChrome"];
  activeRole: "admin" | ViewAsSubjectRole;
  viewAs: ViewAsSubject | null;
  searchRole: ViewAsSelectorRole | null;
  query: string;
  hits: ViewAsPersonHit[];
  searching: boolean;
  showRoles: boolean;
  showSearch: boolean;
  rowClassName: string;
  onPickRole: (role: ViewAsSelectorRole) => void;
  onQueryChange: (value: string) => void;
  onPickPerson: (id: string) => void;
  onOwnTeacher: () => void;
}) {
  return (
    <>
      {showRoles ? (
        <div className="grid gap-1">
          {WORKSPACE_SELECTOR_ROLES.map((role) => (
            <button
              key={role}
              type="button"
              role="option"
              aria-selected={searchRole === role || (!searchRole && !viewAs && activeRole === role)}
              className={rowClassName}
              onClick={() => onPickRole(role)}
            >
              {workspaceSelectorLabel(role, chrome, roleLabels)}
            </button>
          ))}
        </div>
      ) : null}
      {showSearch && searchRole && searchRole !== "admin" ? (
        <div className={showRoles ? "mt-2 border-t border-[var(--color-border)] pt-2" : ""}>
          {searchRole === "teacher" ? (
            <button
              type="button"
              data-tour="admin-chrome-teacher-portal"
              className="mb-2 min-h-11 w-full rounded-xl px-3 py-2 text-left text-sm font-semibold text-[var(--color-primary)] hover:bg-[var(--color-muted)]"
              onClick={onOwnTeacher}
            >
              {labels.ownTeacher}
            </button>
          ) : null}
          <input
            type="search"
            value={query}
            onChange={(event) => onQueryChange(event.target.value)}
            placeholder={labels.searchPlaceholder}
            aria-label={labels.searchPlaceholder}
            className="w-full rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2 text-sm"
          />
          <p className="mt-1 px-1 text-xs text-[var(--color-muted-foreground)]">
            {searching ? "…" : hits.length === 0 ? labels.searchEmpty : labels.searchHint}
          </p>
          <ul className="mt-1 max-h-56 overflow-y-auto">
            {hits.map((hit) => (
              <li key={hit.id}>
                <button
                  type="button"
                  className="min-h-11 w-full rounded-xl px-3 py-2 text-left hover:bg-[var(--color-muted)]"
                  onClick={() => onPickPerson(hit.id)}
                >
                  <span className="block truncate text-sm font-medium">{hit.displayName}</span>
                  <span className="block truncate text-xs text-[var(--color-muted-foreground)]">
                    {adminUserRoleOptionLabel(roleLabels, hit.role)}
                    {hit.email && hit.email !== "—" ? ` · ${hit.email}` : ""}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </>
  );
}

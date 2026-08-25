"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { ChevronDown } from "lucide-react";
import type { Dictionary } from "@/types/i18n";
import type { ViewAsSelectorRole, ViewAsSubject, ViewAsSubjectRole } from "@/lib/dashboard/viewAsTypes";
import { adminUserRoleOptionLabel } from "@/lib/dashboard/adminUserRoleOptionLabel";
import {
  clearViewAsAction,
  openOwnTeacherAction,
  searchViewAsPeopleAction,
  startViewAsAction,
  type ViewAsPersonHit,
} from "@/lib/dashboard/viewAsActions";

const SELECTOR_ROLES: ViewAsSelectorRole[] = ["admin", "teacher", "student", "parent", "assistant", "all"];

export function StaffWorkspaceSwitch({
  locale,
  dict,
  activeRole,
  viewAs,
}: {
  locale: string;
  dict: Dictionary;
  activeRole: "admin" | ViewAsSubjectRole;
  viewAs: ViewAsSubject | null;
}) {
  const router = useRouter();
  const labels = dict.dashboard.viewAs;
  const roleLabels = dict.admin.users;
  const chrome = dict.dashboard.adminChrome;
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const panelRef = useRef<HTMLDivElement | null>(null);
  const [open, setOpen] = useState(false);
  const [searchRole, setSearchRole] = useState<ViewAsSelectorRole | null>(null);
  const [query, setQuery] = useState("");
  const [hits, setHits] = useState<ViewAsPersonHit[]>([]);
  const [searching, setSearching] = useState(false);
  const [box, setBox] = useState<{ top: number; left: number; width: number } | null>(null);

  const triggerLabel = viewAs
    ? viewAs.displayName
    : activeRole === "teacher"
      ? chrome.workspaceTeacher
      : chrome.workspaceAdmin;

  function measureBox() {
    const el = triggerRef.current;
    if (!el) return null;
    const rect = el.getBoundingClientRect();
    const viewportWidth = document.documentElement.clientWidth;
    const width = Math.min(320, Math.max(rect.width, viewportWidth - 32));
    const left = Math.min(Math.max(16, rect.left), viewportWidth - width - 16);
    return { top: rect.bottom + 8, left, width };
  }

  useLayoutEffect(() => {
    if (!open) return;
    const onViewport = () => {
      const next = measureBox();
      if (next) setBox(next);
    };
    window.addEventListener("resize", onViewport);
    window.addEventListener("scroll", onViewport, true);
    return () => {
      window.removeEventListener("resize", onViewport);
      window.removeEventListener("scroll", onViewport, true);
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onDoc = (event: MouseEvent) => {
      const target = event.target as Node;
      if (triggerRef.current?.contains(target) || panelRef.current?.contains(target)) return;
      setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  useEffect(() => {
    if (!searchRole || searchRole === "admin") return;
    const handle = window.setTimeout(() => {
      setSearching(true);
      void searchViewAsPeopleAction(query, searchRole)
        .then((result) => setHits(result.rows))
        .catch(() => setHits([]))
        .finally(() => setSearching(false));
    }, 250);
    return () => window.clearTimeout(handle);
  }, [query, searchRole]);

  async function go(href: string) {
    setOpen(false);
    router.push(href);
    router.refresh();
  }

  function selectorLabel(role: ViewAsSelectorRole): string {
    if (role === "admin") return chrome.workspaceAdmin;
    if (role === "teacher") return chrome.workspaceTeacher;
    if (role === "all") return roleLabels.roleFilterAll;
    return adminUserRoleOptionLabel(roleLabels, role);
  }

  const panel =
    open && box && typeof document !== "undefined" ? (
      createPortal(
        <div
          ref={panelRef}
          role="listbox"
          aria-label={labels.ariaSelector}
          style={{ position: "fixed", top: box.top, left: box.left, width: box.width, zIndex: 200 }}
          className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-background)] p-2 shadow-[var(--shadow-soft)]"
        >
          <div className="grid gap-1">
            {SELECTOR_ROLES.map((role) => (
              <button
                key={role}
                type="button"
                role="option"
                aria-selected={searchRole === role || (!searchRole && !viewAs && activeRole === role)}
                className="rounded-xl px-3 py-2 text-left text-sm font-medium text-[var(--color-foreground)] hover:bg-[var(--color-muted)]"
                onClick={() => {
                  if (role === "admin") {
                    void clearViewAsAction(locale).then((result) => go(result.href));
                    return;
                  }
                  setSearchRole(role);
                  setQuery("");
                  setHits([]);
                  const next = measureBox();
                  if (next) setBox(next);
                }}
              >
                {selectorLabel(role)}
              </button>
            ))}
          </div>
          {searchRole && searchRole !== "admin" ? (
            <div className="mt-2 border-t border-[var(--color-border)] pt-2">
              {searchRole === "teacher" ? (
                <button
                  type="button"
                  data-tour="admin-chrome-teacher-portal"
                  className="mb-2 w-full rounded-xl px-3 py-2 text-left text-sm font-semibold text-[var(--color-primary)] hover:bg-[var(--color-muted)]"
                  onClick={() => {
                    void openOwnTeacherAction(locale).then((result) => go(result.href));
                  }}
                >
                  {labels.ownTeacher}
                </button>
              ) : null}
              <input
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
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
                      className="w-full rounded-xl px-3 py-2 text-left hover:bg-[var(--color-muted)]"
                      onClick={() => {
                        void startViewAsAction(locale, hit.id).then((result) => go(result.href));
                      }}
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
        </div>,
        document.body,
      )
    ) : null;

  return (
    <div className="relative min-w-0">
      <button
        ref={triggerRef}
        type="button"
        aria-label={labels.ariaSelector}
        aria-expanded={open}
        data-tour="admin-chrome-teacher-portal"
        onClick={() => {
          if (open) {
            setOpen(false);
            return;
          }
          const measured = measureBox();
          if (measured) setBox(measured);
          setOpen(true);
        }}
        className="inline-flex min-h-10 max-w-full items-center gap-1.5 rounded-full bg-[var(--color-primary)] px-4 py-2 text-xs font-bold uppercase tracking-wide text-[var(--color-primary-foreground)] shadow-sm sm:text-sm"
      >
        <span className="truncate">{triggerLabel}</span>
        <ChevronDown className="h-4 w-4 shrink-0" aria-hidden />
      </button>
      {panel}
    </div>
  );
}

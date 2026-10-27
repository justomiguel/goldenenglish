"use client";

import { useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { ChevronDown, Eye } from "lucide-react";
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
import { StaffWorkspaceSwitchMenu, workspaceSelectorLabel } from "@/components/dashboard/StaffWorkspaceSwitchMenu";
import { StaffWorkspaceSwitchSheet } from "@/components/dashboard/StaffWorkspaceSwitchSheet";

const NARROW_QUERY = "(max-width: 767px)";

function isNarrowViewport(): boolean {
  if (typeof window.matchMedia !== "function") return false;
  return window.matchMedia(NARROW_QUERY).matches;
}

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
  const titleId = useId();
  const labels = dict.dashboard.viewAs;
  const roleLabels = dict.admin.users;
  const chrome = dict.dashboard.adminChrome;
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const panelRef = useRef<HTMLDivElement | null>(null);
  const [open, setOpen] = useState<"popover" | "sheet" | null>(null);
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
  const eyebrow = viewAs
    ? adminUserRoleOptionLabel(roleLabels, viewAs.role)
    : labels.barEyebrow;

  function measureBox() {
    const el = triggerRef.current;
    if (!el) return null;
    const rect = el.getBoundingClientRect();
    const viewportWidth = document.documentElement.clientWidth;
    const width = Math.min(320, Math.max(rect.width, viewportWidth - 32));
    const left = Math.min(Math.max(16, rect.left), viewportWidth - width - 16);
    return { top: rect.bottom + 8, left, width };
  }

  function close() {
    setOpen(null);
  }

  useLayoutEffect(() => {
    if (open !== "popover") return;
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
      close();
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") close();
    };
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
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
    close();
    router.push(href);
    router.refresh();
  }

  function pickRole(role: ViewAsSelectorRole) {
    if (role === "admin") {
      void clearViewAsAction(locale).then((result) => go(result.href));
      return;
    }
    setSearchRole(role);
    setQuery("");
    setHits([]);
    if (open === "popover") {
      const next = measureBox();
      if (next) setBox(next);
    }
  }

  const menu = (
    <StaffWorkspaceSwitchMenu
      labels={labels}
      roleLabels={roleLabels}
      chrome={chrome}
      activeRole={activeRole}
      viewAs={viewAs}
      searchRole={searchRole}
      query={query}
      hits={hits}
      searching={searching}
      showRoles={open !== "sheet" || !searchRole}
      showSearch={Boolean(searchRole)}
      rowClassName="min-h-11 rounded-xl px-3 py-2 text-left text-sm font-medium text-[var(--color-foreground)] hover:bg-[var(--color-muted)]"
      onPickRole={pickRole}
      onQueryChange={setQuery}
      onPickPerson={(id) => {
        void startViewAsAction(locale, id).then((result) => go(result.href));
      }}
      onOwnTeacher={() => {
        void openOwnTeacherAction(locale).then((result) => go(result.href));
      }}
    />
  );

  const sheetTitle = searchRole
    ? workspaceSelectorLabel(searchRole, chrome, roleLabels)
    : labels.sheetTitle;

  const panel =
    open === "sheet" && typeof document !== "undefined"
      ? createPortal(
          <StaffWorkspaceSwitchSheet
            panelRef={panelRef}
            title={sheetTitle}
            titleId={titleId}
            closeLabel={labels.close}
            backLabel={searchRole ? labels.backToRoles : null}
            onBack={
              searchRole
                ? () => {
                    setSearchRole(null);
                    setQuery("");
                    setHits([]);
                  }
                : null
            }
            onClose={close}
          >
            {menu}
          </StaffWorkspaceSwitchSheet>,
          document.body,
        )
      : open === "popover" && box && typeof document !== "undefined"
        ? createPortal(
            <div
              ref={panelRef}
              role="listbox"
              aria-label={labels.ariaSelector}
              style={{ position: "fixed", top: box.top, left: box.left, width: box.width, zIndex: 200 }}
              className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-background)] p-2 shadow-[var(--shadow-soft)]"
            >
              {menu}
            </div>,
            document.body,
          )
        : null;

  return (
    <div className="relative min-w-0 w-full md:w-auto" data-tour="admin-chrome-teacher-portal">
      <button
        ref={triggerRef}
        type="button"
        aria-label={labels.ariaSelector}
        aria-expanded={open !== null}
        onClick={() => {
          if (open) {
            close();
            return;
          }
          if (isNarrowViewport()) {
            setSearchRole(null);
            setQuery("");
            setHits([]);
            setOpen("sheet");
            return;
          }
          const measured = measureBox();
          if (measured) setBox(measured);
          setOpen("popover");
        }}
        className="flex w-full min-h-[52px] items-center gap-3 rounded-2xl border border-[var(--color-border)] bg-[var(--color-background)] px-3 text-left shadow-sm transition-colors hover:bg-[var(--color-muted)] md:inline-flex md:w-auto md:min-h-11 md:gap-1.5 md:rounded-full md:border-transparent md:bg-[var(--color-primary)] md:px-4 md:py-2 md:text-[var(--color-primary-foreground)] md:shadow-sm md:hover:bg-[var(--color-primary-dark)]"
      >
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--color-primary)] text-[var(--color-primary-foreground)] md:hidden">
          <Eye className="h-4 w-4" aria-hidden />
        </span>
        <span className="min-w-0 flex-1 md:flex-none">
          <span className="block truncate text-[0.6875rem] font-medium text-[var(--color-muted-foreground)] md:hidden">
            {eyebrow}
          </span>
          <span className="block truncate text-sm font-semibold text-[var(--color-foreground)] md:text-xs md:font-bold md:uppercase md:tracking-wide md:text-[var(--color-primary-foreground)]">
            {triggerLabel}
          </span>
        </span>
        <ChevronDown className="h-4 w-4 shrink-0 text-[var(--color-muted-foreground)] md:text-[var(--color-primary-foreground)]" aria-hidden />
      </button>
      {panel}
    </div>
  );
}

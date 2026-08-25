# Admin view-as role Implementation Plan

> **For agentic workers:** Execute inline in this session. Do not commit unless the user asks.

**Goal:** Replace the Admin / Área docente pills with a role selector that can open another person’s existing portal in read-only view-as.

**Architecture:** The admin session stays. A signed `ge_view_as` cookie names the subject. `getDashboardActor` (React `cache`) returns `{ sessionUserId, viewerId, viewAs }`. Portal layouts allow an admin when `viewAs.role` matches. Loaders that already take a user id receive `viewerId`. Mutations call `assertNotViewAs`.

**Tech Stack:** Next.js App Router, server actions, HMAC (`CRON_SECRET`, same style as blog preview tokens), Vitest.

**Spec:** [`../specs/2026-08-22-admin-view-as-role-design.md`](../specs/2026-08-22-admin-view-as-role-design.md)

## Global Constraints

- Session stays the admin. No token swap. No service-role-as-user.
- Read-only while view-as is set.
- Never view-as another admin or `site_contact`.
- Self-pick is own workspace, not a preview.
- Cookie name `ge_view_as`, `httpOnly`, HMAC with `CRON_SECRET`; fail closed if secret missing.
- No database migration.
- No git commit unless asked.

## File map

| File | Role |
|------|------|
| `src/lib/dashboard/viewAsTypes.ts` | Roles, subject, actor types |
| `src/lib/dashboard/viewAsCookie.ts` | Sign / verify payload |
| `src/lib/dashboard/resolveDashboardActor.ts` | Pure actor + portal allow rules |
| `src/lib/dashboard/getDashboardActor.ts` | Cached server wiring |
| `src/lib/dashboard/assertNotViewAs.ts` | Mutation gate |
| `src/lib/dashboard/viewAsActions.ts` | `startViewAs`, `clearViewAs`, `searchViewAsPeople` |
| `src/components/dashboard/StaffWorkspaceSwitch.tsx` | Role selector + person search |
| `src/components/dashboard/ViewAsBanner.tsx` | Persistent banner |
| `src/components/dashboard/ViewAsEndedNotice.tsx` | Admin toast from `?viewAs=ended` |
| Portal layouts + shells | Allow rules, banner, selector, hide escapes |
| Portal pages that pass `user.id` into loaders | Use `viewerId` |
| Portal `*actions.ts` | `assertNotViewAs` first |

## Tasks

1. Pure cookie + actor + portal rules + tests
2. Server actor, actions, write gate + tests
3. Dictionary + selector + banner
4. Layouts, chrome, hide sign-out / profile / teacher blog
5. Pass `viewerId` on in-scope portal pages
6. Guard portal mutations
7. Update existing switch / layout tests and run them

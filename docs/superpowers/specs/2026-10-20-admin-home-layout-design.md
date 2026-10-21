# Admin home layout — each admin arranges their own cards

**Date:** 2026-10-20
**Status:** Approved
**Kind:** Feature specification
**Works with:** [Admin PWA program](2026-10-20-admin-pwa-mobile-overhaul-program-design.md)
**Replaces on the home screen:** Phase 4 §3.1 in [phase 4](2026-10-20-admin-pwa-phase4-home-academic-events-design.md) (the fixed mobile reorder of `AdminHubHomeOpsGrid`). Phase 4 §3.2 and §3.3 (events and academic) stay as written.
**ADR:** `docs/adr/2026-10-20-admin-home-layout.md` (required: new table and RLS)

---

## 1. Intent

Let each admin arrange the cards on `/dashboard/admin`. Every admin starts from the same factory order. A change belongs to that admin only.

The phone and the computer share that order. The phone stacks every card at full width. The computer places cards on a 12-column grid using a size the admin picked from a menu.

The factory order puts urgent work first. A new admin on a phone sees payments, registrations, and messages before the traffic chart. That closes defect **D09** in the PWA program without a second, hidden order.

---

## 2. What the admin does

### 2.1 Look

The greeting stays at the top. It is not a card.

Under it, the cards follow the saved order. A card that has nothing to show does not leave a hole. The next card moves up.

A card is still a link. A tap or click opens the same screen as today.

### 2.2 Edit

1. The admin taps **Edit**.
2. Each card shows a **⋯** button.
3. The admin opens **⋯** and picks a size, moves the card, or hides it.
4. On a wide screen the admin can also drag a card to a new place, or right-click the card to open the same menu.
5. **Done** saves. **Cancel** throws the draft away.

Nothing is written until **Done**. A refresh before **Done** keeps the last saved home.

### 2.3 Start over

**Edit** also offers four layouts under **Layouts**. Each control is a miniature of the first two rows. The block width is the card size. Choosing one replaces the draft: which cards show, the size of each card, and the order. The admin can still move cards, then taps **Done**.

- **Operations** puts payments and registrations first. Payments is Large. Registrations is Medium.
- **People** puts birthdays and the people card first. Birthdays is Large. People is Medium.
- **Compact** makes every remaining card Small and hides the shortcut band. A card with a minimum stays at that minimum.
- **Back to the start** deletes this admin's saved row and restores the factory order.

---

## 3. One order, two presentations

There is one layout per admin. There is no institute layout and no lock.

| Surface | How the cards look | How the admin edits |
|---|---|---|
| `web-desktop` and width `>= 1024px` (`lg`) | 12-column grid. The saved size is the width. | Drag the grip to reorder. Drag the trailing edge to snap the width. **⋯** or right-click opens the size menu. |
| `web-desktop` and width `< 1024px` | One column, saved order. Size is kept in the data and is not drawn. | Same menu as the wide desktop. Drag reorders the column. |
| `web-mobile` and `pwa-mobile` | One column, saved order. Size is not drawn. | No drag. **⋯** opens a bottom sheet. Move up, move down, size, hide. |

Surface comes from `useAppSurface()`. Do not add a `window.innerWidth` listener. The `lg` grid is a CSS breakpoint, the same `1024px` line the PWA program uses for desktop invariance.

The phone does not invent a different order. If the admin put the traffic chart first, the phone shows the chart first. The factory order is what makes a new phone open on urgent cards.

---

## 4. How the grid fills itself

Sizes:

| Menu label | Stored value | Columns |
|---|---|---|
| Small | `s` | 4 |
| Medium | `m` | 6 |
| Large | `l` | 8 |
| Row | `full` | 12 |

Cards flow left to right. A card that does not fit the rest of the row starts the next row. Cards do not overlap. A card does not span two rows of height.

Example. Payments, Registrations, and Messages are Small. They share one row (4 + 4 + 4). Traffic is Large. It takes the next row with whatever Small card still fits beside it (8 + 4).

Each widget has a minimum size. The menu shows smaller sizes disabled. Traffic cannot be smaller than Large. Collections cannot be smaller than Medium.

On a wide screen, drag the trailing edge of a card. The width snaps to Small, Medium, Large, or Row. It does not stop between those sizes. A size under the minimum stays unavailable. The phone does not show the edge, because the phone does not draw the size.

A hidden card, or a card with nothing to show, is skipped. The packer does not reserve its slot.

---

## 5. Factory order

This is the home when `admin_home_layouts` has no row for that admin.

| # | Widget | Id | Size | Skip when |
|---|---|---|---|---|
| 1 | First-class checklist | `checklist` | Row | Every item is done |
| 2 | Students without a section | `studentsWithoutSection` | Row | Count is 0 |
| 3 | Pending payments | `payments` | Small | — |
| 4 | New registrations | `registrations` | Small | — |
| 5 | Messages | `messages` | Small | — |
| 6 | People by role | `people` | Small | — |
| 7 | Birthdays | `birthdays` | Small | — |
| 8 | People pulse | `peoplePulse` | Small | — |
| 9 | Current-cohort collections | `collections` | Medium | No cohort with `is_current` |
| 10 | Upcoming events | `upcomingEvents` | Medium | — |
| 11 | Traffic | `traffic` | Large | — |
| 12 | Shop orders | `shopOrders` | Small | Shop flag is off. The id is absent from the catalog. |
| 13 | System news | `changelog` | Medium | — |
| 14 | Shortcuts | `shortcuts` | Row | — |

On a phone this stack starts with payments, registrations, and messages, then people and birthdays, then the chart. That is the Phase 4 mobile goal, expressed as data instead of a hardcoded DOM order.

On a wide screen the first data row is the three urgent cards side by side. The chart is lower and wide. An admin who wants the chart on top moves it.

Widgets 1–7 and 14 already exist in [src/components/dashboard/AdminHubHome.tsx](../../src/components/dashboard/AdminHubHome.tsx) and [src/components/dashboard/AdminHubHomeOpsGrid.tsx](../../src/components/dashboard/AdminHubHomeOpsGrid.tsx). They become widgets. Widgets 8–13 are new.

---

## 6. New widgets

Each new card is a number or a short list, plus a link. It is not a table.

**People pulse (`peoplePulse`).** Two counts from `loadAdminPeoplePageStats` for role `student`: sign-ups in the last 30 days, and accounts that never started a session. Link: Students. Minimum size: Small.

**Current-cohort collections (`collections`).** The cohort from `loadCurrentCohort`. Show expected, paid, pending review, and overdue, with the same meaning as Finance. Link: Finance. Minimum size: Medium. Call `loadAdminCohortCollectionsOverview` only when this card is visible. Do not run that loader on every home visit.

**Upcoming events (`upcomingEvents`).** At most three published events with a future date, ordered by date. Show title, date, and seats. Link: Events. Query uses a limit of 3. Minimum size: Small. Default size: Medium.

**Shop orders (`shopOrders`).** A `head` count of orders in `pending_payment`, `paid`, or `ready_for_pickup`. Link: Shop. Present only when the shop flag is on. Minimum size: Small.

**System news (`changelog`).** The first three entries from `listProductChangelogEntries()`. No database read. Link: System news. Minimum size: Small. Default size: Medium.

---

## 7. Shortcuts

Every shortcut keeps `checklist` and `studentsWithoutSection` at the top, at Row, with the same skip rules. The lists below are the cards after those two.

**Operations.** `payments` Large, `registrations` Medium, `messages` Small, `collections` Medium, `upcomingEvents` Medium, `traffic` Large, then `people`, `birthdays`, `peoplePulse`, `shopOrders` at Small, `changelog` Medium, `shortcuts` Row.

**People.** `birthdays` Large, `people` Medium, `peoplePulse` Small, then `payments`, `registrations`, `messages`, `shopOrders` at Small, `collections` Medium, `upcomingEvents` Medium, `traffic` Large, `changelog` Medium, `shortcuts` Row.

**Compact.** Every remaining card Small. `shortcuts` is hidden.

**Back to the start.** Delete this admin's row. The factory order returns. This still needs **Done** if it is only a draft. The delete runs when the admin confirms **Done** on that draft. **Cancel** keeps the previous row.

A size in a shortcut that is under the widget minimum is raised to the minimum.

---

## 8. Edit mode

### 8.1 Shared rules

- **Edit** is a button with a leading Lucide icon. It sits in the greeting row.
- The draft lives in client state. **Done** calls the server action. **Cancel** restores the snapshot from when edit mode opened.
- Outside edit mode there is no **⋯**, no drag handle, and no custom right-click menu.
- The first card does not offer Move up. The last card does not offer Move down.
- The current size is marked. Sizes under the minimum are disabled, not omitted, so the admin sees why a size is unavailable.
- **Layouts** and **Cards** are buttons in the edit bar. Each button opens a popup. **Cards** is a checklist. Each row says what that card does. A checked row is on the home. Clear the check and that card leaves the home. An empty card stays off this list.

### 8.2 Wide desktop (`web-desktop` and `>= lg`)

- Each card shows a drag handle and **⋯**.
- Right-click on the card opens the same menu. The menu is a `role="menu"` list next to the button. Escape closes it and returns focus to **⋯**.
- Drag uses `@dnd-kit` with `rectSortingStrategy`. Drop rewrites the order array. The packer places the cards again. The admin does not drop a card on an x/y coordinate.
- **Done** and **Cancel** sit in a bar under the greeting.

### 8.3 Phone and installed PWA (`web-mobile`, `pwa-mobile`)

Follow the sheets already specified for directories and registrations.

- **⋯** is at least 44×44px (`min-h-11 min-w-11`) with an `aria-label` from the dictionary. Icon: `MoreHorizontal`.
- The menu is a `Modal` bottom sheet, the same primitive as `AdminUsersFilterSortSheet` and `AdminRegistrationActionsSheet`. Do not use a floating menu that fights the thumb zone or `AdminPwaTabBar`.
- Sheet rows are at least 44px: Small, Medium, Large, Row, Move up, Move down, Hide.
- One line in the sheet says the size is used on a large screen. On the phone every card uses the full width.
- No drag. A drag fights vertical scroll.
- **Done** and **Cancel** are a bar above the tab bar, same idea as `AdminUsersBulkBarMobile`:

  `fixed inset-x-3 bottom-[calc(4.75rem+env(safe-area-inset-bottom,0px))] z-30`

  Phase 1 already pads `data-admin-main` so the last card clears the tab bar. This bar uses that same clearance. It does not cover **Home** or **More**. The help FAB stays on the offset from Phase 1.
- While edit mode is open, pull-to-refresh does not run. A pull must not discard the draft. `PwaPullToRefresh` from Phase 1 stays on for the normal home.

### 8.4 What stays out of the grid

- The greeting and its lead.
- `AdminPwaTabBar`, `AdminChromeHeader`, and `AdminHelpLauncher`.
- Do not wrap the home in a second `PwaPageShell` or a second `min-h-dvh` (Phase 1, D01).

---

## 9. Data

Additive migration `supabase/migrations/217_admin_home_layouts.sql`. `216` is already `parent_reply_to_sender`. Update `supabase/migrations/masterdb.sql` in the same change. Do not add a column on `profiles`.

`public.admin_home_layouts`

| Column | Rule |
|---|---|
| `profile_id` | Primary key. References `profiles`. Delete the profile, delete the row. |
| `layout` | `jsonb`. Shape below. |
| `updated_at` | Timestamp. |

```json
{
  "version": 1,
  "items": [
    { "id": "payments", "size": "s", "hidden": false }
  ]
}
```

`size` is `s`, `m`, `l`, or `full`. Array order is card order.

RLS: an authenticated admin may select, insert, update, and delete only the row where `profile_id = auth.uid()` and `is_current_user_admin()` is true. Anonymous clients have no access.

The server action checks `assertAdmin` again and writes only the session user id.

Read rules:

- An unknown id is ignored.
- A catalog id missing from the array is appended, visible, at its default size. A new widget shows up for an admin who already saved a layout.
- A size under the minimum is raised to the minimum.
- A `shopOrders` item is ignored when the shop flag is off.

Save path: `revalidatePath` for `/${locale}/dashboard/admin`, then `router.refresh()` on **Done**. This is a personal preference. Do not call `recordSystemAudit`. A failed save logs `[ge:server]`.

---

## 10. Relationship to the PWA program

| Program rule | How this spec follows it |
|---|---|
| Phase 1 shell, tab bar, safe area, no nested `dvh` | The home stays inside `AdminDashboardShell`. The edit bar sits above `AdminPwaTabBar`. |
| Phase 2 and Phase 3 sheets | Phone actions use `Modal`, 44px rows, and a `⋯` button. |
| Phase 4 D09, urgent cards before the chart | Factory order does this on every surface. A saved order replaces it for that admin only. |
| Phase 4 §3.2 and §3.3 | Unchanged. This spec does not touch events or the academic hub. |
| `useAppSurface()` | Chooses sheet vs desktop menu. It does not choose a second card order. |
| Desktop invariance of other admin screens | Students, finance, registrations, and the shell stay as their phase specs say. This feature changes the home on purpose. |
| Tour anchors | The factory home mounts every anchor in `ADMIN_HOME_RUNTIME_ANCHORS`. E2E uses an admin with no saved row. |
| File size | No file over 250 lines. Split the packer, the menu, the sheet, and each new card. |

Phase 4 §3.1 (hardcoded `AdminHubWorkQueuesRow` above the chart) is not implemented as a separate reorder. The factory layout is that reorder.

---

## 11. Dictionary keys

Add `admin.home.layout` in `en.json`, `es.json`, and `pt.json`.

| Key | es | en | pt |
|---|---|---|---|
| `arrange` | Editar | Edit | Editar |
| `done` | Listo | Done | Pronto |
| `cancel` | Cancelar | Cancel | Cancelar |
| `cardMenuAria` | Opciones de {{name}} | Options for {{name}} | Opções de {{name}} |
| `sizeSmall` | Chica | Small | Pequena |
| `sizeMedium` | Media | Medium | Média |
| `sizeLarge` | Grande | Large | Grande |
| `sizeRow` | Fila | Row | Linha |
| `moveUp` | Subir | Move up | Subir |
| `moveDown` | Bajar | Move down | Descer |
| `hide` | Ocultar | Hide | Ocultar |
| `sizeOnLargeScreen` | El tamaño se aplica en una pantalla grande. En el teléfono cada tarjeta usa todo el ancho. | The size applies on a large screen. On a phone, each card uses the full width. | O tamanho vale em uma tela grande. No telefone, cada cartão usa a largura toda. |
| `presetOperations` | Operación | Operations | Operação |
| `presetPeople` | Personas | People | Pessoas |
| `presetCompact` | Compacto | Compact | Compacto |
| `presetReset` | Volver al inicio | Back to the start | Voltar ao início |
| `presetsTitle` | Diseños | Layouts | Modelos |
| `presetOperationsHint` | Pagos queda grande y va primero. | Payments stays large and comes first. | Pagamentos fica grande e vem primeiro. |
| `presetPeopleHint` | Cumpleaños queda grande y va primero. | Birthdays stays large and comes first. | Aniversários fica grande e vem primeiro. |
| `presetCompactHint` | Las tarjetas quedan chicas y los accesos se ocultan. | Cards stay small. Shortcuts stay hidden. | Os cartões ficam pequenos. Os atalhos ficam ocultos. |
| `presetResetHint` | Vuelve al orden de fábrica. | Back to the factory order. | Volta à ordem de fábrica. |
| `dragHandleAria` | Mover {{name}} | Move {{name}} | Mover {{name}} |

Spanish is neutral Latin American tuteo. English sentences stay short.

Widget titles that already exist stay on their current keys. New widget titles and empty lines go in the same `admin.home.layout.widgets` object, in all three locales, in the implementation. Do not hardcode them in JSX.

---

## 12. Tours

These anchors stay on the widget component, not on a grid slot:

`admin-hub-title`, `admin-hub-payments`, `admin-hub-registrations`, `admin-hub-messages`, `admin-hub-traffic`, `admin-hub-users`, `admin-hub-birthdays`.

The factory order mounts all of them. Payments stay before birthdays in that order, which keeps the existing home-order check true for an admin with no saved row.

A card the admin hid is not mounted. The isolated tour admin has no saved row, so the tour still finds the anchors.

Do not add tour steps for the new widgets in this change.

---

## 13. Modules

Pure, no Supabase and no React:

- `src/lib/dashboard/adminHomeLayout.ts` — catalog, minimums, factory order, shortcuts, JSON reader, packer.

Server:

- `src/lib/dashboard/loadAdminHomeLayout.ts`
- `src/lib/dashboard/loadAdminHomeExtraWidgets.ts` — pulse, events, shop count, and collections only when that card is visible.
- `src/app/[locale]/dashboard/admin/adminHomeLayoutActions.ts`

UI:

- `src/components/dashboard/AdminHubHomeArrange.tsx` — draft, Done, Cancel, shortcuts.
- `src/components/dashboard/AdminHubHomeGrid.tsx` — CSS grid and drag on the wide surface.
- `src/components/dashboard/AdminHubCardMenu.tsx` — desktop menu.
- `src/components/pwa/molecules/AdminHubCardSheet.tsx` — phone sheet on `Modal`.
- One file per new card under `src/components/dashboard/`.

[src/app/[locale]/dashboard/admin/page.tsx](../../src/app/[locale]/dashboard/admin/page.tsx) loads the layout and the extra widget data and passes them into `AdminHubHome`.

---

## 14. Tests

- Packer: a full row, a card that wraps, a skipped hidden card, a size raised to the minimum.
- JSON reader: unknown id dropped, missing catalog id appended, shop id dropped when the flag is off.
- Shortcuts: Operations and People keep checklist and students-without-section first. Compact hides shortcuts.
- Server action: a non-admin is rejected. A `profile_id` that is not the session user is rejected.
- Factory render: payments, registrations, and messages mount before traffic and before birthdays. Every `ADMIN_HOME_RUNTIME_ANCHORS` entry is present.
- Sheet: on a mobile surface the size list includes the large-screen sentence. Move up is absent on the first card.
- Desktop menu: the current size is marked. A size under the minimum is disabled.

---

## 15. Done when

1. An admin with no saved row sees the factory order on the phone and on a wide screen.
2. On a phone, payments, registrations, and messages are above the traffic chart.
3. On a wide screen, those three cards share the first row, and the chart is Large below them.
4. **Edit**, a size change, a move, and **Done** change only that admin's next visit.
5. **Cancel** leaves the saved home as it was.
6. **Back to the start** restores the factory order after **Done**.
7. A hidden or empty card leaves no gap.
8. The phone editor is a bottom sheet above the tab bar. Targets are at least 44px. Pull-to-refresh is off while editing.
9. Copy is in `en`, `es`, and `pt`.
10. The ADR and migration `217` exist. `masterdb.sql` matches.
11. Touched files stay at or under 250 lines.
12. A product-changelog entry is prepended when this ships. Staff will see the new home.

---

## 16. Out of scope

- One layout for the whole institute, or a lock that blocks other admins.
- A free pixel resize. The edge drag snaps to Small, Medium, Large, or Row.
- A card that is two rows tall.
- Retention, today's attendance, transfer inbox, NPS, blog review, expiring coupons, and special calendar days.
- A different card order on the phone than on the computer.
- Phase 4 work on the events list, event tabs, or the academic hub.

---

## 17. Manual QA (user)

1. Open `/es/dashboard/admin` at `390×844` with a new admin. Confirm payments, registrations, and messages sit above the chart. Confirm the bottom tabs are not covered.
2. Tap **Edit**, open **⋯** on Payments, choose Row, tap **Done**. Reload. The card is full width on the phone. Open the same admin on a wide window and confirm the card is a full row.
3. Tap **Cancel** after a move and confirm the home did not change.
4. On a wide window, drag Traffic above Payments, tap **Done**, then open the phone. Confirm the phone shows Traffic first.
5. Use **Back to the start** and confirm the factory order returns on both surfaces.
6. Sign in as a second admin and confirm that admin still has the factory order.
7. On a wide window, open **Edit** and drag the right edge of Payments. Confirm the card jumps among Small, Medium, Large, and Row. Confirm it does not stop between those widths.

# Admin mobile hamburger menu

**Intent:** The button next to the logo opens a full-screen menu. The menu shows the signed-in person, a search field, and a two-column grid. It does not copy the desktop sidebar.

**Done when:**

- On a narrow admin screen, the header button and the bottom **More** tab open this screen.
- The screen shows the institute logo, the person, a local search field, and destination tiles.
- Tiles that match the bottom bar are absent.
- A tap on a tile navigates and closes the screen.
- Sign out and the public-site link stay available.
- The desktop sidebar is unchanged.
- The bottom tab bar is unchanged.
- Vitest covers the tile set, the search filter, and close-on-navigate.

**Out of scope:**

- A new bottom tab bar.
- A change to the desktop `AdminSidebar`.
- Teacher, assistant, or workplace drawers.
- A server search of students or messages.
- New routes or new permissions.

## Context

`AdminMobileDrawer` is a full-screen portal. It repeats the brand, the profile block, the language switcher, the public-site link, and the full daily list from `buildAdminDailyNavItems`. The bottom `AdminPwaTabBar` already has Home, Registrations, Finance, and Students. Its More tab opens the same drawer and shows the unread-messages badge.

The user chose model B: a screen of its own. After seeing it, they asked for the institute logo back. The logo is the large `StaffSidebarBrand` block. The screen still does not copy the desktop list.

## Surfaces (Web vs PWA)

Admin is Tier B. This screen already has a mobile tree. Desktop and mobile stay separate.

- **Web (`web-desktop`, `md` and up):** `AdminSidebar` stays. The hamburger stays `md:hidden`. No grid on desktop.
- **PWA / narrow (`web-mobile` and `pwa-mobile`):** Replace the body of `AdminMobileDrawer`. Keep `DashboardMobileDrawerPortal`, `useAdminMobileShell`, and `AdminPwaTabBar`. The More tab still calls `openDrawer()`.
- Shared nav data stays in `buildAdminDailyNavItems`. The mobile screen filters that list. It does not fork labels, hrefs, or badges.

## Screen

The portal fills the viewport. Respect safe areas. The page behind it is not visible.

1. **Brand.** When `brand` is present, show `StaffSidebarBrand` with `fit`. The logo fills the free height. It grows when the screen has room and shrinks, down to a 5.5rem header, so the tiles and footer stay on screen. The grid scrolls only after the logo is at that minimum. The logo links to the admin home and closes the screen. The close button sits in the top corner. If `brand` is absent, show the dictionary title instead. Desktop `StaffSidebarBrand` stays 128px.
2. **Person.** Reuse the profile data already passed into the drawer: photo or initial, display name, role. The row links to `/${locale}/dashboard/profile`, same as `AdminSidebarProfileFooter`.
3. **Language.** Keep `LanguageSwitcher` compact on this row. It is not a tile.
4. **Search.** One text field. It filters tile labels on the client. Empty query shows every tile. No match shows one dictionary empty line. It does not query the server.
5. **Grid.** Two columns. Each tile is at least 44px tall. Show the existing Lucide icon, the label, and the badge when the count is above zero. The current route uses `aria-current="page"` and the primary token. A tap runs the same close-then-navigate path as today.
6. **Footer.** The public-site link uses the secondary button fill, full width, at least 44px tall. Sign out uses the primary button fill, centered, with the primary foreground. Both keep a leading icon. Do not use opacity for hover.

## Tiles

Start from `buildAdminDailyNavItems`. Drop these hrefs because the tab bar already has them:

- admin home
- `/students`
- `/registrations`
- finance (`financeHrefForPathname`)

Keep the rest, in the same order:

- parents, teachers, users, messages, academic, events
- blog, only when `includeBlogNav` is true
- merch, only when `includeMerchNav` is true
- institute

Messages stays in the grid. The tab bar only shows its badge on More. The messages tile shows `recentInboundMessagesCount`.

`includeEmailTemplatesNav` does not add a tile today. `buildAdminSidebarNavGroups` ignores that flag. Do not add a tile for it in this change.

## Files

- `src/components/dashboard/AdminMobileDrawer.tsx` — new body. Stay at or under 250 lines. Extract the grid if needed.
- `src/lib/dashboard/` — pure helper that drops tab-bar hrefs and filters by query. No React and no Supabase.
- `src/dictionaries/en.json` and `es.json` — menu title, search placeholder, empty search. Spanish uses neutral tuteo.
- `src/__tests__/dashboard/AdminMobileDrawer.test.tsx` — update for the new screen.
- New test for the pure helper.

Do not change `AdminPwaTabBar` behavior, `AdminSidebar`, or `AdminChromeHeader` beyond the drawer it already mounts.

## Tests

- Helper drops home, students, registrations, and finance.
- Helper keeps messages, parents, and institute.
- Helper keeps blog only when the flag is on.
- Helper match is case-insensitive on the label.
- Drawer renders the person and `StaffSidebarBrand` when `brand` is passed.
- Search with no match shows the empty line and hides tiles.
- A tile click calls `onNavigate` / close.

## Manual QA (user)

- Open the menu from the header button and from More.
- Confirm Home, Registrations, Finance, and Students are only on the bottom bar.
- Open Messages from a tile. Confirm the unread badge matches the More badge.
- Switch language, open the public site, and sign out.
- Confirm the desktop sidebar is the same list as before.

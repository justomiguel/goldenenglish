# Admin weekly digest mail

**Intent:** Every Monday, email each admin a branded report for the week that just closed. The first block is work waiting today. Charts use the institute colors. The same numbers are written in HTML.

**ADR:** [docs/adr/2026-10-27-admin-weekly-digest.md](../../adr/2026-10-27-admin-weekly-digest.md)

**Done when:**

- `vercel.json` schedules `GET /api/cron/admin-weekly-digest` at `0 12 * * 1` (Monday 12:00 UTC). The route runs once per tenant through `runCronAcrossTenants`.
- For a tenant on UTC−3, that instant is 09:00 local. The week bounds use that tenant's `analytics.timezone`.
- The closed week is the previous Monday 00:00 through Sunday 23:59:59.999 in that timezone.
- Each profile with role `admin` receives one mail, using the same admin list as `sendRegistrationAdminEmails`.
- The mail is Spanish (`es`). The template registry also has `en` and `pt`.
- Template key is `admin.weekly_digest`. The existing email gate can turn it off. A disabled gate sends nothing and writes no send row.
- A second cron run for the same week does not send again to an admin who already received it.
- A failed aggregate does not send a mail of zeros.
- A failed chart image does not block the mail. The HTML numbers still go out.
- A failed send to one admin is logged and does not stop the other admins.
- Copy for labels lives in the template registry. Visible Spanish uses neutral tuteo.

**Out of scope:**

- Anonymous public visits. `POST /api/analytics/events` stores signed-in users only.
- Chart.js, or any script, inside the mail.
- A new admin screen for this report.
- A per-admin mute switch beyond the existing template gate.
- An in-app portal message.

## Mail order

The subject is the most urgent waiting item. Priority is pending receipts, then family messages without a reply, then silent families. When all three counts are zero, the subject is the percent of parents who had a session in the closed week.

1. Header in `color.primary`, with the tenant logo, the tenant name, and the week range. Text on that bar uses `color.primary.foreground`.
2. **Hoy.** Three counts, each with a link to the existing admin list:
   - Receipts still waiting for staff review. This is the sum of pending monthly invoice receipts, enrollment-fee receipts, and event transfer receipts.
   - Parent portal messages that are still open and have no staff reply.
   - Silent families. A family is silent when the student and a linked parent have no `session_start` in the 7 days before the cron instant. A student with no linked parent counts when that student is silent.
3. **Cobro.** Donut for the percent of current-month tuition invoices that are paid at send time. The HTML states the collected amount, the expected amount, and the counts paid, pending, and in review. The funnel lists four numbers that are not a strict subset of each other: invoices in that month, distinct parents or students who opened the payments section during the closed week, online checkouts started during the closed week, and month invoices that are paid at send time. A paid receipt can exist without a checkout start. The arrow versus last week is omitted when no prior digest row exists.
4. **Padres.** Line of the parent session percent for the last four closed weeks. HTML states this week's percent and the three parents with the most `session_start` rows in the closed week. Names use surname then given name. The mail does not include email addresses.
5. **Día pico.** Bars for Monday through Sunday, counted in the tenant timezone, from parent and student `session_start` rows in the closed week. One sentence names the peak day.
6. **Aula.** Percent of sections that had a meeting in the closed week and a saved attendance mark. Percent of learning tasks due in the closed week that are still incomplete. A zero denominator omits that bar and states that nothing was due.
7. **Entrada.** Registration rows created in the closed week, event enrollments created in the closed week, and distinct signed-in users with a `session_start` in the closed week. Signed-in page views on blog and event routes are the public-site line. This is not anonymous traffic.
8. One button to the most urgent **Hoy** list. When nothing is waiting, the button opens the admin home.

A quiet week still sends. **Hoy** shows zeros and says nothing is waiting. The other blocks still show their numbers.

Colors come from the effective theme (`color.primary`, `color.primary.light`, `color.primary.dark`, `color.primary.foreground`, `color.background`). The legal footer still shows the tenant contact fields.

## Data and send

One SQL function returns the digest JSON for a week window. The function is granted to the service role only. It filters `user_events` and the payment, message, attendance, task, registration, and event tables by time. It does not scan those tables without a bound.

The cron loads the institute timezone, calls the function, and builds the mail. Chart SVG is pure and uses the theme hex values. `@resvg/resvg-js` (MIT, server-only) rasterizes each chart to PNG. The PNG is embedded in the mail. The HTML repeats every number.

`week_start` is unique. Before the first send attempt, the cron inserts a send row for that week if absent. The row stores the recipient ids that succeeded and the payload used for the next week's arrows. A retry sends only to admins missing from that id list. If every send fails, the row remains with an empty recipient list so a later cron can retry. The row does not store email addresses.

Logs use `[ge:server]` and scope `admin.weekly_digest`. Metadata includes the week start and recipient count. Logs do not include names or mailboxes. No new `user_events` type is added.

The cron rejects a secret passed in the query string and returns 401. The check uses `verifyCronRequest`.

## Tests

- The aggregate parser accepts a fixture payload and rejects a payload that is missing a required count.
- The HTML builder includes the three **Hoy** counts, the parent percent, and the urgent subject. It does not include a raw email address.
- A quiet fixture still produces a mail whose **Hoy** counts are zero.
- Chart SVG uses the theme primary hex. A raster failure is represented as "no image" and the HTML numbers remain.
- The cron route returns 401 when the secret is only in the query string.
- A second run does not call the mail sender for an admin id already stored on the week row.

## Manual QA (user)

- On one tenant, confirm the Monday mail shows that tenant's logo and primary color.
- Open each **Hoy** link while signed in as an admin and confirm it lands on the matching list.

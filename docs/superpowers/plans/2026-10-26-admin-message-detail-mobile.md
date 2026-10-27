# Admin Message Detail Mobile, Direct Notification Link, and Read-Unanswered State Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make `/dashboard/admin/messages/[messageId]` feel native on mobile, link contact-form admin notification emails directly to the message detail URL, and visually distinguish read-but-unanswered rows in the admin mailbox.

**Architecture:**
1. `AdminPortalMessageDetailView` and `src/app/[locale]/dashboard/admin/messages/[messageId]/page.tsx` drop mobile nested cards, decorative headers, and wide vertical margins while keeping a single-row bottom action bar and all `ADMIN_TOUR_ANCHORS`.
2. `deliverPublicSiteContactToAdmins` generates a UUID `id` per inserted `portal_messages` row and passes `messageId` to `notifyPortalRecipientForStaffMessage`, which appends `/${messageId}` for admin recipients.
3. `AdminMessageCard` and `src/dictionaries/{es,en,pt}.json` add `badgeRead` and distinct styling + `data-attention-state` for `unread`, `read-needs-reply`, and `handled`.

**Tech Stack:** Next.js App Router, React, Tailwind CSS, Vitest, Testing Library.

---

### Task 1: Direct message link in admin contact-form notification email

**Files:**
- Modify: `src/__tests__/lib/messaging/notifyMessagingEmails.test.ts`
- Modify: `src/__tests__/lib/messaging/deliverPublicSiteContactToAdmins.test.ts`
- Modify: `src/lib/messaging/notifyMessagingEmails.ts`
- Modify: `src/lib/messaging/deliverPublicSiteContactToAdmins.ts`

- [ ] Write failing tests for `messageId` deep link in `notifyMessagingEmails.test.ts` and `deliverPublicSiteContactToAdmins.test.ts`.
- [ ] Update `notifyPortalRecipientForStaffMessage` and `deliverPublicSiteContactToAdmins`.
- [ ] Run Vitest on both test files.

### Task 2: Distinct visual state for read-but-unanswered messages

**Files:**
- Modify: `src/dictionaries/es.json`
- Modify: `src/dictionaries/en.json`
- Modify: `src/dictionaries/pt.json`
- Modify: `src/__tests__/components/AdminMessageCard.test.tsx`
- Modify: `src/components/dashboard/AdminMessageCard.tsx`

- [ ] Add `badgeRead` to `es.json`, `en.json`, and `pt.json`.
- [ ] Add failing tests in `AdminMessageCard.test.tsx` for `unread`, `read-needs-reply`, and `handled` states.
- [ ] Update `AdminMessageCard.tsx` to render distinct border, surface, typography, `badgeRead` chip, and `data-attention-state`.
- [ ] Run Vitest on `AdminMessageCard.test.tsx`.

### Task 3: Native mobile reading layout on admin message detail

**Files:**
- Modify: `src/__tests__/components/AdminPortalMessageDetailView.test.tsx`
- Modify: `src/components/dashboard/AdminPortalMessageDetailView.tsx`
- Modify: `src/app/[locale]/dashboard/admin/messages/[messageId]/page.tsx`

- [ ] Add failing tests in `AdminPortalMessageDetailView.test.tsx` for compact mobile metadata header, unboxed mobile body container, and tour anchors.
- [ ] Update `AdminPortalMessageDetailView.tsx` and `src/app/[locale]/dashboard/admin/messages/[messageId]/page.tsx`.
- [ ] Run Vitest on `AdminPortalMessageDetailView.test.tsx` and tutorial contract tests.

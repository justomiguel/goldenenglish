# Parent message reply Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let a parent reply to the admin or teacher who sent a portal message, with no linked student required.

**Architecture:** The timeline exposes the sender id and role. A reply form calls `sendParentReply`. The use case checks a prior inbound row and the recipient role, then inserts one message. RLS allows the same case through `parent_may_reply_to_sender`.

**Tech Stack:** Next.js App Router, Supabase RLS, Vitest, dictionaries `en` / `es` / `pt`.

## Global Constraints

- Reply recipient is the sender of that message.
- Recipient role is `admin` or `teacher`.
- No linked student is required for the reply.
- Broadcast to administration still requires a linked student.
- Desktop and mobile both get the button.
- Copy comes from dictionaries. Spanish uses neutral tuteo.
- Button has a leading Lucide icon.
- Files stay at or under 250 lines.
- Do not add a `reply_to` column.

---

### Task 1: Timeline sender

- [ ] Add `peer_id` and `peer_role` on timeline lines.
- [ ] Pass them through `buildParentPortalMessageLines`.
- [ ] Fill missing peer role and name on the parent messages page.

### Task 2: Server reply

- [ ] Add `sendParentReplyUseCase` and `sendParentReply`.
- [ ] Reject when no prior inbound row exists.
- [ ] Reject when the recipient role is not `admin` or `teacher`.
- [ ] Insert one row and notify that recipient.
- [ ] Add migration `216_parent_reply_to_sender.sql` and regenerate `masterdb.sql`.

### Task 3: Reply button

- [ ] Show **Reply** on incoming admin and teacher rows.
- [ ] Open a reply form on desktop and in the mobile modal.
- [ ] Allow the form when general compose is unavailable.
- [ ] Add dictionary keys and update the parent messages tour copy.
- [ ] Add a product changelog row.

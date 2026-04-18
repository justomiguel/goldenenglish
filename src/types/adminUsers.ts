/**
 * Shared types for admin users area. These cannot live in the `"use server"` action
 * modules under `src/app/[locale]/dashboard/admin/users/*Actions.ts` because Next.js
 * Server Actions only allow async function exports — re-exporting types from those
 * files breaks module evaluation at runtime (`ReferenceError: ... is not defined`).
 */

export type AdminParentSearchHit = {
  id: string;
  label: string;
};

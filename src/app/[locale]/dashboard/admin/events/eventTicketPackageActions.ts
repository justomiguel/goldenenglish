"use server";

import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { recordSystemAudit } from "@/lib/analytics/server/recordSystemAudit";
import { logSupabaseClientError } from "@/lib/logging/serverActionLog";
import {
  requireAdminEventActor,
  revalidateEventFormSurfaces,
  type EventMutationResult,
} from "@/app/[locale]/dashboard/admin/events/eventActionsShared";

const packageSchema = z.object({
  locale: z.string().min(2),
  eventId: z.string().uuid(),
  name: z.string().trim().min(1).max(120),
  price: z.number().min(0),
  /** Null means the package has no capacity of its own. */
  capacity: z.number().int().positive().nullable(),
  benefits: z.array(z.string()).max(20),
});

const updateSchema = packageSchema.extend({ packageId: z.string().uuid() });

const moveSchema = z.object({
  locale: z.string().min(2),
  packageId: z.string().uuid(),
  direction: z.enum(["up", "down"]),
});

/** Blank bullets are dropped; the order the admin chose is the order buyers see. */
function cleanBenefits(benefits: string[]): string[] {
  return benefits.map((b) => b.trim()).filter(Boolean);
}

export async function addEventTicketPackageAction(raw: unknown): Promise<EventMutationResult> {
  const actorId = await requireAdminEventActor();
  if (!actorId) return { ok: false, message: "forbidden" };

  const parsed = packageSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, message: "validation_failed" };

  const { locale, eventId, name, price, capacity, benefits } = parsed.data;
  const admin = createAdminClient();
  const position = await nextPosition(admin, eventId);

  const { error } = await admin.from("event_ticket_packages").insert({
    event_id: eventId,
    name,
    price,
    capacity,
    benefits: cleanBenefits(benefits),
    position,
  });

  if (error) {
    logSupabaseClientError("addEventTicketPackageAction:insert", error, { eventId });
    return { ok: false, message: "save_failed" };
  }

  void recordSystemAudit({
    action: "event_ticket_package_added",
    resourceType: "event_ticket_package",
    resourceId: eventId,
    payload: { event_id: eventId, name, price, capacity },
  });

  await revalidateEventFormSurfaces(locale, eventId);
  return { ok: true };
}

export async function updateEventTicketPackageAction(raw: unknown): Promise<EventMutationResult> {
  const actorId = await requireAdminEventActor();
  if (!actorId) return { ok: false, message: "forbidden" };

  const parsed = updateSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, message: "validation_failed" };

  const { locale, eventId, packageId, name, price, capacity, benefits } = parsed.data;
  const admin = createAdminClient();
  const existing = await loadPackage(admin, packageId);
  if (!existing || existing.eventId !== eventId) {
    return { ok: false, message: "package_not_found" };
  }
  if (existing.archivedAt) return { ok: false, message: "package_archived" };

  const { error } = await admin
    .from("event_ticket_packages")
    .update({ name, price, capacity, benefits: cleanBenefits(benefits) })
    .eq("id", packageId);

  if (error) {
    logSupabaseClientError("updateEventTicketPackageAction:update", error, { packageId, eventId });
    return { ok: false, message: "save_failed" };
  }

  void recordSystemAudit({
    action: "event_ticket_package_updated",
    resourceType: "event_ticket_package",
    resourceId: packageId,
    payload: { event_id: eventId, name, price, capacity },
  });

  await revalidateEventFormSurfaces(locale, eventId);
  return { ok: true };
}

export async function moveEventTicketPackageAction(raw: unknown): Promise<EventMutationResult> {
  const actorId = await requireAdminEventActor();
  if (!actorId) return { ok: false, message: "forbidden" };

  const parsed = moveSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, message: "validation_failed" };

  const { locale, packageId, direction } = parsed.data;
  const admin = createAdminClient();
  const existing = await loadPackage(admin, packageId);
  if (!existing) return { ok: false, message: "package_not_found" };

  const siblings = await listActivePackages(admin, existing.eventId);
  const index = siblings.findIndex((s) => s.id === packageId);
  const swapWith = direction === "up" ? siblings[index - 1] : siblings[index + 1];
  // Already at the edge: nothing to swap with, and nothing to report as an error.
  if (index < 0 || !swapWith) return { ok: true };

  const current = siblings[index]!;
  const { error } = await admin
    .from("event_ticket_packages")
    .update({ position: swapWith.position })
    .eq("id", current.id);
  if (error) {
    logSupabaseClientError("moveEventTicketPackageAction:update", error, { packageId });
    return { ok: false, message: "save_failed" };
  }

  const { error: swapError } = await admin
    .from("event_ticket_packages")
    .update({ position: current.position })
    .eq("id", swapWith.id);
  if (swapError) {
    logSupabaseClientError("moveEventTicketPackageAction:swap", swapError, { packageId });
    return { ok: false, message: "save_failed" };
  }

  await revalidateEventFormSurfaces(locale, existing.eventId);
  return { ok: true };
}

export async function archiveEventTicketPackageAction(
  locale: string,
  packageId: string,
): Promise<EventMutationResult> {
  const actorId = await requireAdminEventActor();
  if (!actorId) return { ok: false, message: "forbidden" };

  const admin = createAdminClient();
  const existing = await loadPackage(admin, packageId);
  if (!existing) return { ok: false, message: "package_not_found" };

  const { error } = await admin
    .from("event_ticket_packages")
    .update({ archived_at: new Date().toISOString() })
    .eq("id", packageId);

  if (error) {
    logSupabaseClientError("archiveEventTicketPackageAction:update", error, { packageId });
    return { ok: false, message: "save_failed" };
  }

  // Archiving the last active package returns the event to residency pricing,
  // which changes what the public page charges — so the count is audited.
  const remaining = await listActivePackages(admin, existing.eventId);
  void recordSystemAudit({
    action: "event_ticket_package_archived",
    resourceType: "event_ticket_package",
    resourceId: packageId,
    payload: {
      event_id: existing.eventId,
      remaining_active_packages: remaining.filter((p) => p.id !== packageId).length,
    },
  });

  await revalidateEventFormSurfaces(locale, existing.eventId);
  return { ok: true };
}

type AdminClient = ReturnType<typeof createAdminClient>;

async function loadPackage(
  admin: AdminClient,
  packageId: string,
): Promise<{ eventId: string; position: number; archivedAt: string | null } | null> {
  const { data, error } = await admin
    .from("event_ticket_packages")
    .select("id, event_id, position, archived_at")
    .eq("id", packageId)
    .maybeSingle();

  if (error) {
    logSupabaseClientError("eventTicketPackageActions:lookup", error, { packageId });
    return null;
  }
  if (!data?.event_id) return null;

  return {
    eventId: String(data.event_id),
    position: Number(data.position ?? 0),
    archivedAt: data.archived_at == null ? null : String(data.archived_at),
  };
}

async function listActivePackages(
  admin: AdminClient,
  eventId: string,
): Promise<{ id: string; position: number }[]> {
  const { data } = await admin
    .from("event_ticket_packages")
    .select("id, position")
    .eq("event_id", eventId)
    .is("archived_at", null)
    .order("position", { ascending: true });

  return (data ?? []).map((row) => ({
    id: String(row.id),
    position: Number(row.position ?? 0),
  }));
}

async function nextPosition(admin: AdminClient, eventId: string): Promise<number> {
  const active = await listActivePackages(admin, eventId);
  return active.length === 0 ? 0 : Math.max(...active.map((p) => p.position)) + 1;
}

import type { SupabaseClient } from "@supabase/supabase-js";
import { logSupabaseClientError } from "@/lib/logging/serverActionLog";

export interface LoadedRegistrationFlow {
  id: string;
  nameI18n: Record<string, string>;
  position: number;
  price: number | null;
  fieldOrder: string[];
}

export async function loadActiveRegistrationFlows(
  client: SupabaseClient,
  eventId: string,
): Promise<LoadedRegistrationFlow[]> {
  const { data, error } = await client
    .from("event_registration_flows")
    .select("id, name_i18n, position, price, field_order")
    .eq("event_id", eventId)
    .is("archived_at", null)
    .order("position", { ascending: true });

  if (error) {
    logSupabaseClientError("loadActiveRegistrationFlows", error, { eventId });
    return [];
  }

  return (data ?? []).map((row) => ({
    id: String(row.id),
    nameI18n: (row.name_i18n as Record<string, string>) ?? {},
    position: Number(row.position ?? 0),
    price: row.price == null ? null : Number(row.price),
    fieldOrder: Array.isArray(row.field_order) ? row.field_order.map((token) => String(token)) : [],
  }));
}

export function registrationFlowName(
  nameI18n: Record<string, string>,
  locale: string,
  fallback: string,
): string {
  return nameI18n[locale] ?? nameI18n[fallback] ?? Object.values(nameI18n)[0] ?? "";
}

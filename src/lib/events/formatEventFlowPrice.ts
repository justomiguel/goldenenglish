import { formatEventMoneyAmount } from "@/lib/events/resolveEventPublicPriceDisplay";

export interface EventFlowPrice {
  id: string;
  name: string;
  price: number | null;
}

export interface RegistrationFlowPriceSource {
  id: string;
  eventId: string;
  nameI18n: Record<string, string>;
  position: number;
  price: number | null;
}

export function formatEventFlowPriceLabel(input: {
  price: number | null;
  currency: string;
  locale: string;
  freeLabel: string;
}): string {
  if (input.price == null || input.price === 0) return input.freeLabel;
  return formatEventMoneyAmount(input.price, input.currency, input.locale);
}

function flowDisplayName(nameI18n: Record<string, string>, locale: string, fallback: string): string {
  return nameI18n[locale] ?? nameI18n[fallback] ?? Object.values(nameI18n)[0] ?? "";
}

/** Active flows for events priced by flow, ordered for display. */
export function registrationFlowPricesByEvent(
  flows: readonly RegistrationFlowPriceSource[],
  locale: string,
  fallbackByEvent: ReadonlyMap<string, string>,
): Map<string, EventFlowPrice[]> {
  const grouped = new Map<string, RegistrationFlowPriceSource[]>();
  for (const flow of flows) {
    const list = grouped.get(flow.eventId) ?? [];
    list.push(flow);
    grouped.set(flow.eventId, list);
  }

  const result = new Map<string, EventFlowPrice[]>();
  for (const [eventId, list] of grouped) {
    const fallback = fallbackByEvent.get(eventId) ?? "es";
    result.set(
      eventId,
      list.toSorted((a, b) => a.position - b.position).map((flow) => ({
        id: flow.id,
        name: flowDisplayName(flow.nameI18n, locale, fallback),
        price: flow.price,
      })),
    );
  }
  return result;
}

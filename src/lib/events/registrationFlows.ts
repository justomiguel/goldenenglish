import {
  resolveRegistrationFieldOrder,
  type RegistrationFieldToken,
} from "@/lib/events/registrationFieldOrder";

export interface RegistrationFlowDefinition {
  id: string;
  position: number;
  price: number | null;
  fieldOrder: readonly string[];
}

export interface RegistrationFlowExtra {
  id: string;
  position: number;
  flowId: string | null;
}

export interface RegistrationFlowView {
  askFlow: boolean;
  flows: RegistrationFlowDefinition[];
  flowId: string | null;
  questionOrder: RegistrationFieldToken[];
}

function byPosition<T extends { position: number }>(items: readonly T[]): T[] {
  return items.toSorted((a, b) => a.position - b.position);
}

function flowFieldTokens(
  flow: RegistrationFlowDefinition,
  extras: readonly RegistrationFlowExtra[],
): RegistrationFieldToken[] {
  const owned = extras.filter((extra) => extra.flowId === flow.id);
  const activeIds = new Set(owned.map((extra) => extra.id));
  const seen = new Set<string>();
  const result: RegistrationFieldToken[] = [];
  for (const raw of flow.fieldOrder) {
    if (!raw.startsWith("field:") || seen.has(raw)) continue;
    const id = raw.slice("field:".length);
    if (!activeIds.has(id)) continue;
    result.push(raw as RegistrationFieldToken);
    seen.add(raw);
  }
  for (const extra of byPosition(owned)) {
    const token = `field:${extra.id}` as RegistrationFieldToken;
    if (!seen.has(token)) result.push(token);
  }
  return result;
}

export function fieldsForRegistrationFlow<T extends { flowId?: string | null }>(input: {
  fields: readonly T[];
  flowIds: readonly string[];
  flowId?: string | null;
}): { flowId: string | null; fields: T[] } {
  if (input.flowIds.length === 0) {
    return { flowId: null, fields: [...input.fields] };
  }
  const resolved = input.flowIds.length === 1 ? input.flowIds[0] : (input.flowId ?? null);
  if (!resolved || !input.flowIds.includes(resolved)) {
    return { flowId: null, fields: [] };
  }
  return {
    flowId: resolved,
    fields: input.fields.filter((field) => field.flowId == null || field.flowId === resolved),
  };
}

export function resolveRegistrationFlowView(input: {
  flows: readonly RegistrationFlowDefinition[];
  extras: readonly RegistrationFlowExtra[];
  sharedOrder: readonly string[];
  selectedFlowId?: string | null;
  collectBirthDate: boolean;
}): RegistrationFlowView {
  const flows = byPosition(input.flows);
  const sharedExtras =
    flows.length === 0
      ? input.extras.map((extra) => ({ id: extra.id, position: extra.position }))
      : input.extras
          .filter((extra) => extra.flowId == null)
          .map((extra) => ({ id: extra.id, position: extra.position }));
  const shared = resolveRegistrationFieldOrder({
    stored: input.sharedOrder,
    extras: sharedExtras,
    collectBirthDate: input.collectBirthDate,
  });

  if (flows.length === 0) {
    return { askFlow: false, flows, flowId: null, questionOrder: shared };
  }

  const chosen =
    flows.length === 1
      ? flows[0]
      : flows.find((flow) => flow.id === input.selectedFlowId) ?? null;
  const flowTokens = chosen ? flowFieldTokens(chosen, input.extras) : [];
  return {
    askFlow: flows.length > 1,
    flows,
    flowId: chosen?.id ?? null,
    questionOrder: [...shared, ...flowTokens],
  };
}

/** Seat total for a flow. Waitlist stays waitlist; a zero price confirms the seat. */
export function registrationFlowCharge(input: {
  price: number;
  seats: number;
  status: string | null;
}): { totalAmount: number; status: string; paymentRequired: boolean } | null {
  if (input.status === "waitlist") return null;
  const totalAmount = input.price * Math.max(input.seats, 1);
  const status = totalAmount > 0 ? "pending_payment" : "confirmed";
  return { totalAmount, status, paymentRequired: totalAmount > 0 };
}

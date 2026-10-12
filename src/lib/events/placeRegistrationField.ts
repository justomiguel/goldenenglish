export const SHARED_FIELD_CONTAINER = "shared";

export function flowFieldContainerId(flowId: string): string {
  return `flow:${flowId}`;
}

export function flowIdFromFieldContainer(containerId: string): string | null {
  return containerId.startsWith("flow:") ? containerId.slice("flow:".length) : null;
}

export function containerOf(containers: Record<string, string[]>, id: string): string | null {
  if (Object.prototype.hasOwnProperty.call(containers, id)) return id;
  for (const [key, items] of Object.entries(containers)) {
    if (items.includes(id)) return key;
  }
  return null;
}

function moveToken(items: readonly string[], from: number, to: number): string[] {
  const next = items.slice();
  const [item] = next.splice(from, 1);
  if (!item) return items.slice();
  next.splice(to, 0, item);
  return next;
}

/** Drop a question onto a container. Default questions never leave the shared container. */
export function placeRegistrationField(input: {
  containers: Record<string, string[]>;
  activeId: string;
  overId: string;
}): Record<string, string[]> | null {
  if (input.activeId === input.overId) return null;
  const from = containerOf(input.containers, input.activeId);
  const overContainer = containerOf(input.containers, input.overId);
  if (!from || !overContainer) return null;
  if (input.activeId.startsWith("base:") && overContainer !== SHARED_FIELD_CONTAINER) return null;

  if (from === overContainer) {
    const items = input.containers[from] ?? [];
    const oldIndex = items.indexOf(input.activeId);
    const newIndex = items.indexOf(input.overId);
    if (oldIndex < 0 || newIndex < 0) return null;
    return { ...input.containers, [from]: moveToken(items, oldIndex, newIndex) };
  }

  const source = (input.containers[from] ?? []).filter((item) => item !== input.activeId);
  const target = (input.containers[overContainer] ?? []).slice();
  const overIndex = target.indexOf(input.overId);
  target.splice(overIndex < 0 ? target.length : overIndex, 0, input.activeId);
  return { ...input.containers, [from]: source, [overContainer]: target };
}

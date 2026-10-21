let editing = false;
const listeners = new Set<() => void>();

export function setAdminHomeEditMode(next: boolean): void {
  if (editing === next) return;
  editing = next;
  for (const listener of listeners) listener();
}

export function getAdminHomeEditMode(): boolean {
  return editing;
}

export function subscribeAdminHomeEditMode(onChange: () => void): () => void {
  listeners.add(onChange);
  return () => listeners.delete(onChange);
}

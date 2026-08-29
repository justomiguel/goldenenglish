export const PARENT_BULK_CAP = 200;

export type NameSortableParent = {
  id: string;
  lastName: string;
  firstName: string;
};

export function capParentRecipients<T extends NameSortableParent>(rows: T[]): T[] {
  const copy = [...rows];
  copy.sort((a, b) => {
    const last = a.lastName.localeCompare(b.lastName, undefined, { sensitivity: "base" });
    if (last !== 0) return last;
    const first = a.firstName.localeCompare(b.firstName, undefined, { sensitivity: "base" });
    if (first !== 0) return first;
    return a.id.localeCompare(b.id);
  });
  return copy.slice(0, PARENT_BULK_CAP);
}

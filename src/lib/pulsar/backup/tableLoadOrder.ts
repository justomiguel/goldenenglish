export type TableForeignKeys = {
  name: string;
  references: readonly string[];
};

/**
 * Orders tables so a referenced table loads first.
 * A table that references itself does not wait on itself.
 * A cycle keeps the remaining names in alphabetical order.
 */
export function tableLoadOrder(tables: readonly TableForeignKeys[]): string[] {
  const names = tables.map((table) => table.name);
  const known = new Set(names);
  const pending = new Map<string, Set<string>>();
  for (const table of tables) {
    const deps = new Set(
      table.references.filter((name) => name !== table.name && known.has(name)),
    );
    pending.set(table.name, deps);
  }
  const ordered: string[] = [];
  while (pending.size > 0) {
    const ready = [...pending.entries()]
      .filter(([, deps]) => deps.size === 0)
      .map(([name]) => name)
      .sort();
    const next = ready.length > 0 ? ready : [...pending.keys()].sort();
    for (const name of next) {
      pending.delete(name);
      ordered.push(name);
    }
    if (ready.length === 0) break;
    for (const deps of pending.values()) {
      for (const name of next) deps.delete(name);
    }
  }
  return ordered;
}

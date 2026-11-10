import { INSTITUTE_SCHEMA } from "@/lib/pulsar/tenantDeleteScope";

export type StorageListItem = {
  name: string;
  id?: string | null;
};

function safePart(name: string): boolean {
  return Boolean(name) && !name.includes("/") && !name.includes("..") && !name.includes("\\");
}

/**
 * Lists every file under `tenant_<slug>/`.
 * An item with a null id is a folder. A name that climbs out of the folder is skipped.
 */
export async function collectTenantStoragePaths(
  list: (prefix: string, offset: number) => Promise<StorageListItem[]>,
  schema: string,
): Promise<string[]> {
  if (!INSTITUTE_SCHEMA.test(schema)) return [];
  const files: string[] = [];
  const folders = [schema];
  const seen = new Set<string>();
  while (folders.length > 0) {
    const prefix = folders.shift();
    if (!prefix || seen.has(prefix)) continue;
    seen.add(prefix);
    const items: StorageListItem[] = [];
    for (let offset = 0; offset < 10_000; offset += 100) {
      const page = await list(prefix, offset);
      items.push(...page);
      if (page.length < 100) break;
    }
    for (const item of items) {
      if (!safePart(item.name)) continue;
      const path = `${prefix}/${item.name}`;
      if (item.id == null) folders.push(path);
      else files.push(path);
    }
  }
  return files;
}

const SCHEMA_NAME = /^tenant_[a-z0-9_]{1,50}$/;

/** `acme-norte` becomes `tenant_acme_norte`. */
export function postgresSchemaForInstituteSlug(slug: string): string {
  const safe = slug.trim().toLowerCase().replace(/-/g, "_");
  const name = `tenant_${safe}`;
  if (!SCHEMA_NAME.test(name)) {
    throw new Error(`invalid_tenant_schema:${name}`);
  }
  return name;
}

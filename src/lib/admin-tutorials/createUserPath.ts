/** Admin create-user page path helpers (pure). */

export function createUserPath(locale: string): string {
  return `/${locale}/dashboard/admin/users/new`;
}

export function isCreateUserPath(pathname: string, locale: string): boolean {
  const base = createUserPath(locale);
  return pathname === base || pathname === `${base}/`;
}

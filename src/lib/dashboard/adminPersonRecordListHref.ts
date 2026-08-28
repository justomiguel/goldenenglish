/** List the admin opened this person record from, based on the profile role. */
export function adminPersonRecordListHref(locale: string, role: string): string {
  if (role === "student") return `/${locale}/dashboard/admin/students`;
  if (role === "teacher") return `/${locale}/dashboard/admin/teachers`;
  return `/${locale}/dashboard/admin/users`;
}

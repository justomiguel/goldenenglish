import Link from "next/link";

export interface AdminUserNameLinkProps {
  locale: string;
  userId: string;
  name: string;
  className?: string;
}

/** Admin list name. The click opens that person's profile. */
export function AdminUserNameLink({ locale, userId, name, className }: AdminUserNameLinkProps) {
  return (
    <Link
      href={`/${locale}/dashboard/admin/users/${userId}`}
      className={
        className ??
        "font-medium text-[var(--color-primary)] underline-offset-2 hover:underline"
      }
    >
      {name}
    </Link>
  );
}

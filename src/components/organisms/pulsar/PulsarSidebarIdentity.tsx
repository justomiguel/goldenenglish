import Link from "next/link";

export function PulsarSidebarIdentity({
  name,
  email,
  phone = "",
  avatarUrl,
  profileHref,
}: {
  name: string;
  email: string;
  phone?: string;
  avatarUrl: string | null;
  profileHref: string;
}) {
  const initial = (name || email).slice(0, 1).toUpperCase();
  return (
    <Link href={profileHref} className="flex flex-col items-start gap-1 px-4 py-3">
      {avatarUrl ? (
        <img src={avatarUrl} alt="" className="h-14 w-14 rounded-full object-cover" />
      ) : (
        <span className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-[var(--color-primary)] text-lg font-semibold text-[var(--color-primary-foreground)]">
          {initial}
        </span>
      )}
      <span className="max-w-full truncate text-sm font-semibold text-[var(--color-foreground)]">{name}</span>
      <span className="max-w-full truncate text-xs text-[var(--color-muted-foreground)]">{email}</span>
      {phone ? <span className="max-w-full truncate text-xs text-[var(--color-muted-foreground)]">{phone}</span> : null}
    </Link>
  );
}

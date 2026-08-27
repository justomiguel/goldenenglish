import Link from "next/link";

export function ParentMonthlyPayReviewCta(props: { href: string; label: string }) {
  return (
    <p className="mt-3">
      <Link
        href={props.href}
        className="inline-flex min-h-[44px] items-center justify-center rounded-[var(--layout-border-radius)] bg-[var(--color-primary)] px-4 py-2 text-sm font-medium text-[var(--color-primary-foreground)]"
      >
        {props.label}
      </Link>
    </p>
  );
}

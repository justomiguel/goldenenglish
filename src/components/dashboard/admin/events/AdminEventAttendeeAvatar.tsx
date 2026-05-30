import { buildAttendeeInitials } from "@/lib/events/resolveAttendeePresentation";

interface AdminEventAttendeeAvatarProps {
  firstName: string;
  lastName: string;
  expanded?: boolean;
  size?: "md" | "sm";
}

export function AdminEventAttendeeAvatar({
  firstName,
  lastName,
  expanded = false,
  size = "md",
}: AdminEventAttendeeAvatarProps) {
  const initials = buildAttendeeInitials(firstName, lastName);
  const sizeClass =
    size === "sm"
      ? "h-9 w-9 text-xs"
      : "h-11 w-11 text-sm";

  return (
    <div
      className={`flex shrink-0 items-center justify-center rounded-full font-bold transition-all duration-200 ${sizeClass} ${
        expanded
          ? "bg-[var(--color-primary)] text-[var(--color-primary-foreground)] shadow-sm ring-2 ring-[var(--color-primary)]/30"
          : "bg-[color-mix(in_srgb,var(--color-primary)_14%,var(--color-surface))] text-[var(--color-primary-dark)] ring-2 ring-[color-mix(in_srgb,var(--color-primary)_22%,transparent)]"
      }`}
      aria-hidden
    >
      {initials}
    </div>
  );
}

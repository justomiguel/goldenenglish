"use client";

interface EventRegisterConsentProps {
  checked: boolean;
  onChange: (next: boolean) => void;
  label: string;
}

export function EventRegisterConsent({ checked, onChange, label }: EventRegisterConsentProps) {
  return (
    <label className="flex items-start gap-2 text-sm text-[var(--color-foreground)]">
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.currentTarget.checked)}
      />
      <span>{label}</span>
    </label>
  );
}

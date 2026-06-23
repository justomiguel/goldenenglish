"use client";

interface EventRegisterConsentProps {
  checked: boolean;
  onChange: (next: boolean) => void;
  label: string;
  className?: string;
}

export function EventRegisterConsent({ checked, onChange, label, className = "" }: EventRegisterConsentProps) {
  return (
    <label className={`flex items-start gap-2 ${className}`.trim()}>
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.currentTarget.checked)}
      />
      <span>{label}</span>
    </label>
  );
}

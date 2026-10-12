"use client";

interface EventRegisterFlowChoiceProps {
  label: string;
  flows: Array<{ id: string; name: string }>;
  value: string | null;
  onChange: (flowId: string) => void;
  disabled?: boolean;
}

export function EventRegisterFlowChoice({
  label,
  flows,
  value,
  onChange,
  disabled,
}: EventRegisterFlowChoiceProps) {
  return (
    <fieldset className="space-y-2" disabled={disabled}>
      <legend className="text-sm font-medium text-[var(--color-foreground)]">{label}</legend>
      <div className="space-y-2">
        {flows.map((flow) => (
          <label
            key={flow.id}
            className="flex min-h-[44px] items-center gap-2 text-sm text-[var(--color-foreground)]"
          >
            <input
              type="radio"
              name="registration-flow"
              value={flow.id}
              required
              checked={value === flow.id}
              onChange={() => onChange(flow.id)}
            />
            {flow.name}
          </label>
        ))}
      </div>
    </fieldset>
  );
}

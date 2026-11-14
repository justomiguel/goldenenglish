const stroke = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.25,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

export function NagoIconDeporte({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 48 48" aria-hidden>
      <path {...stroke} d="M10 34c6-2 10-10 14-18 3 7 8 14 14 18" />
      <path {...stroke} d="M24 8v8M16 22h16" />
    </svg>
  );
}

export function NagoIconDisciplina({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 48 48" aria-hidden>
      <path {...stroke} d="M14 10v28M24 10v28M34 10v28" />
      <path {...stroke} d="M10 18h28" />
    </svg>
  );
}

export function NagoIconConfianza({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 48 48" aria-hidden>
      <path {...stroke} d="M12 34 24 10l12 24" />
      <path {...stroke} d="M18 26h12" />
    </svg>
  );
}

export function NagoIconCultura({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 48 48" aria-hidden>
      <path {...stroke} d="M12 36c8-18 16-26 24-28" />
      <path {...stroke} d="M12 36c3 0 5-3 8-3s5 4 8 4 5-3 8-3" />
      <circle {...stroke} cx="12" cy="36" r="3" />
    </svg>
  );
}

export function NagoIconSuperacion({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 48 48" aria-hidden>
      <path {...stroke} d="M10 34h8v-8h8v-8h8V10" />
      <path {...stroke} d="M28 10h10v10" />
    </svg>
  );
}

export function NagoIconMovimiento({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 48 48" aria-hidden>
      <path {...stroke} d="M8 30c8-14 16-14 24 0 4 7 8 8 8 8" />
      <path {...stroke} d="M14 18c4-6 10-8 16-4" />
    </svg>
  );
}

export function NagoIconMusica({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 48 48" aria-hidden>
      <path {...stroke} d="M20 36V14l16-4v22" />
      <circle {...stroke} cx="16" cy="36" r="4" />
      <circle {...stroke} cx="32" cy="32" r="4" />
    </svg>
  );
}

export function NagoIconDesarrollo({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 48 48" aria-hidden>
      <circle {...stroke} cx="24" cy="16" r="6" />
      <path {...stroke} d="M12 38c2-8 8-12 12-12s10 4 12 12" />
    </svg>
  );
}

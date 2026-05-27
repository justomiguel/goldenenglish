/** Hand-drawn-feeling butterfly. Decorative only. */
export function MiMundoButterflyIcon({
  size,
  color,
}: {
  size: number;
  color: string;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 80 64"
      fill="none"
      aria-hidden
      xmlns="http://www.w3.org/2000/svg"
      style={{ color }}
    >
      <path
        d="M 40 32 C 18 6, 4 14, 4 30 C 4 44, 22 40, 40 32 Z"
        fill="currentColor"
        opacity="0.92"
      />
      <path
        d="M 40 32 C 62 6, 76 14, 76 30 C 76 44, 58 40, 40 32 Z"
        fill="currentColor"
        opacity="0.78"
      />
      <path
        d="M 40 34 C 22 44, 10 56, 22 60 C 32 62, 40 50, 40 34 Z"
        fill="currentColor"
        opacity="0.66"
      />
      <path
        d="M 40 34 C 58 44, 70 56, 58 60 C 48 62, 40 50, 40 34 Z"
        fill="currentColor"
        opacity="0.58"
      />
      <circle cx="18" cy="24" r="2.2" fill="#FFF8EC" opacity="0.85" />
      <circle cx="62" cy="24" r="2.2" fill="#FFF8EC" opacity="0.85" />
      <circle cx="22" cy="50" r="1.5" fill="#FFF8EC" opacity="0.8" />
      <circle cx="58" cy="50" r="1.5" fill="#FFF8EC" opacity="0.8" />
      <ellipse cx="40" cy="34" rx="2.6" ry="14" fill="#3B2F2A" />
      <path
        d="M 38 22 C 34 16, 32 12, 28 10"
        stroke="#3B2F2A"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
      <path
        d="M 42 22 C 46 16, 48 12, 52 10"
        stroke="#3B2F2A"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  );
}

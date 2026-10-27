interface TheaterSeatIconProps {
  seatNumber?: number | string;
  crossed?: boolean;
  className?: string;
}

export function TheaterSeatIcon({
  seatNumber,
  crossed = false,
  className = "h-8 w-8",
}: TheaterSeatIconProps) {
  return (
    <svg
      data-testid="theater-seat-svg"
      viewBox="0 0 36 34"
      fill="none"
      aria-hidden="true"
      className={className}
    >
      {/* Backrest */}
      <path
        d="M8 7C8 3.8 11.5 2 18 2C24.5 2 28 3.8 28 7V12H8V7Z"
        fill="currentColor"
        fillOpacity={0.82}
        stroke="currentColor"
        strokeWidth={1.6}
        strokeLinejoin="round"
      />
      {/* Left armrest */}
      <rect
        x={2.5}
        y={10.5}
        width={5}
        height={16}
        rx={2.2}
        fill="currentColor"
        fillOpacity={0.7}
        stroke="currentColor"
        strokeWidth={1.5}
      />
      {/* Right armrest */}
      <rect
        x={28.5}
        y={10.5}
        width={5}
        height={16}
        rx={2.2}
        fill="currentColor"
        fillOpacity={0.7}
        stroke="currentColor"
        strokeWidth={1.5}
      />
      {/* Seat cushion */}
      <rect
        x={7}
        y={10}
        width={22}
        height={19.5}
        rx={4}
        fill="currentColor"
        stroke="currentColor"
        strokeWidth={1.6}
      />
      {/* Cushion front lip */}
      <path
        d="M9.5 26.8H26.5"
        stroke="var(--color-background)"
        strokeOpacity={0.45}
        strokeWidth={1.4}
        strokeLinecap="round"
      />
      { crossed ? (
        <path
          d="M13 15L23 24M23 15L13 24"
          stroke="var(--color-background)"
          strokeWidth={2.2}
          strokeLinecap="round"
        />
      ) : seatNumber !== undefined ? (
        <text
          x={18}
          y={22.2}
          textAnchor="middle"
          fill="var(--color-background)"
          className="text-[10px] font-extrabold select-none"
        >
          {seatNumber}
        </text>
      ) : null}
    </svg>
  );
}

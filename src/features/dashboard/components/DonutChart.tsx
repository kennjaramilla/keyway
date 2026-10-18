export type DonutSlice = { label: string; value: number; color: string };

const RADIUS = 52;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

/** A ring of slices with the headline in the middle. The legend carries every value as text. */
export function DonutChart({
  slices,
  centerValue,
  centerLabel,
}: {
  slices: DonutSlice[];
  centerValue: string;
  centerLabel: string;
}) {
  const total = slices.reduce((sum, slice) => sum + slice.value, 0);
  let offset = 0;

  return (
    <div className="flex flex-col items-center gap-5">
      <div className="relative size-44">
        <svg viewBox="0 0 140 140" className="size-full -rotate-90" aria-hidden focusable="false">
          <circle
            cx="70"
            cy="70"
            r={RADIUS}
            fill="none"
            stroke="var(--surface-muted)"
            strokeWidth="16"
          />
          {total > 0 &&
            slices
              .filter((slice) => slice.value > 0)
              .map((slice) => {
                const length = (slice.value / total) * CIRCUMFERENCE;
                const dash = `${length} ${CIRCUMFERENCE - length}`;
                const circle = (
                  <circle
                    key={slice.label}
                    cx="70"
                    cy="70"
                    r={RADIUS}
                    fill="none"
                    stroke={slice.color}
                    strokeWidth="16"
                    strokeDasharray={dash}
                    strokeDashoffset={-offset}
                  />
                );
                offset += length;
                return circle;
              })}
        </svg>
        <p className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-3xl font-semibold text-fg tabular-nums">{centerValue}</span>
          <span className="text-xs text-fg-muted">{centerLabel}</span>
        </p>
      </div>
      <ul className="grid w-full gap-2 text-sm">
        {slices.map((slice) => (
          <li key={slice.label} className="flex items-center gap-2">
            <span
              aria-hidden
              className="size-2.5 rounded-full"
              style={{ background: slice.color }}
            />
            <span className="flex-1 text-fg-muted">{slice.label}</span>
            <span className="font-medium text-fg tabular-nums">
              {slice.value}
              <span className="ml-1.5 text-fg-muted">
                ({total ? Math.round((slice.value / total) * 100) : 0}%)
              </span>
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

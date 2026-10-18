import { useId } from "react";

export type TrendPoint = { label: string; opened: number; resolved: number };

const WIDTH = 640;
const HEIGHT = 220;
const PAD = { top: 12, right: 12, bottom: 28, left: 32 };

/** Smooth path through points (Catmull-Rom converted to cubic Béziers). */
function smoothPath(points: [number, number][]) {
  if (points.length === 0) return "";
  let path = `M${points[0]![0]},${points[0]![1]}`;
  for (let index = 0; index < points.length - 1; index++) {
    const [x0, y0] = points[index - 1] ?? points[index]!;
    const [x1, y1] = points[index]!;
    const [x2, y2] = points[index + 1]!;
    const [x3, y3] = points[index + 2] ?? points[index + 1]!;
    const c1 = [x1 + (x2 - x0) / 6, y1 + (y2 - y0) / 6];
    const c2 = [x2 - (x3 - x1) / 6, y2 - (y3 - y1) / 6];
    path += ` C${c1[0]},${Math.min(c1[1]!, HEIGHT - PAD.bottom)} ${c2[0]},${Math.min(c2[1]!, HEIGHT - PAD.bottom)} ${x2},${y2}`;
  }
  return path;
}

/** Opened (filled area) and resolved (dashed line) per day. Values are also in the legend and table. */
export function TrendChart({ points }: { points: TrendPoint[] }) {
  const gradientId = useId();
  const max = Math.max(4, ...points.flatMap((point) => [point.opened, point.resolved]));
  const top = Math.ceil(max / 4) * 4;
  const innerWidth = WIDTH - PAD.left - PAD.right;
  const innerHeight = HEIGHT - PAD.top - PAD.bottom;
  const x = (index: number) => PAD.left + (innerWidth * index) / Math.max(1, points.length - 1);
  const y = (value: number) => PAD.top + innerHeight - (innerHeight * value) / top;
  const opened = points.map((point, index) => [x(index), y(point.opened)] as [number, number]);
  const resolved = points.map((point, index) => [x(index), y(point.resolved)] as [number, number]);
  const baseline = y(0);
  const ticks = [0, 1, 2, 3, 4].map((step) => (top / 4) * step);

  return (
    <div className="grid gap-3">
      <ul className="flex flex-wrap gap-x-5 gap-y-1 text-sm text-fg-muted">
        <li className="flex items-center gap-2">
          <span aria-hidden className="h-0.5 w-5 rounded-full bg-chart-1" />
          Opened
        </li>
        <li className="flex items-center gap-2">
          <span aria-hidden className="w-5 border-t-2 border-dashed border-chart-2" />
          Resolved
        </li>
      </ul>
      <svg
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        className="h-auto w-full overflow-visible"
        aria-hidden
        focusable="false"
      >
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--chart-1)" stopOpacity="0.28" />
            <stop offset="100%" stopColor="var(--chart-1)" stopOpacity="0" />
          </linearGradient>
        </defs>
        {ticks.map((tick) => (
          <g key={tick}>
            <line
              x1={PAD.left}
              x2={WIDTH - PAD.right}
              y1={y(tick)}
              y2={y(tick)}
              stroke="var(--border)"
              strokeDasharray={tick === 0 ? undefined : "3 4"}
            />
            <text
              x={PAD.left - 8}
              y={y(tick)}
              textAnchor="end"
              dominantBaseline="middle"
              className="fill-fg-subtle text-[11px]"
            >
              {tick}
            </text>
          </g>
        ))}
        <path
          d={`${smoothPath(opened)} L${x(points.length - 1)},${baseline} L${x(0)},${baseline} Z`}
          fill={`url(#${gradientId})`}
        />
        <path d={smoothPath(opened)} fill="none" stroke="var(--chart-1)" strokeWidth="2.5" />
        <path
          d={smoothPath(resolved)}
          fill="none"
          stroke="var(--chart-2)"
          strokeWidth="2"
          strokeDasharray="6 5"
        />
        {opened.map(([cx, cy], index) => (
          <circle
            key={index}
            cx={cx}
            cy={cy}
            r="3.5"
            fill="var(--surface)"
            stroke="var(--chart-1)"
            strokeWidth="2"
          />
        ))}
        {points.map((point, index) => (
          <text
            key={point.label}
            x={x(index)}
            y={HEIGHT - 8}
            textAnchor="middle"
            className="fill-fg-subtle text-[11px]"
          >
            {point.label}
          </text>
        ))}
      </svg>
    </div>
  );
}

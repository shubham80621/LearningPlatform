type DonutSegment = {
  value: number;
  color: string;
  label: string;
};

type DonutChartProps = {
  segments: DonutSegment[];
  title: string;
  centerValue: string;
  centerLabel: string;
  size?: number;
  thickness?: number;
};

export default function DonutChart({
  segments,
  title,
  centerValue,
  centerLabel,
  size = 168,
  thickness = 18,
}: DonutChartProps) {
  const total = segments.reduce((sum, segment) => sum + Math.max(segment.value, 0), 0);
  const radius = (size - thickness) / 2;
  const circumference = 2 * Math.PI * radius;
  const center = size / 2;

  let offset = 0;
  const arcs =
    total <= 0
      ? [
          {
            color: '#e7e5e4',
            dash: circumference,
            offset: 0,
            key: 'empty',
          },
        ]
      : segments
          .filter((segment) => segment.value > 0)
          .map((segment, index) => {
            const length = (segment.value / total) * circumference;
            const arc = {
              color: segment.color,
              dash: length,
              offset,
              key: `${segment.label}-${index}`,
            };
            offset += length;
            return arc;
          });

  return (
    <div className="rounded-xl border border-stone-200 bg-white p-4">
      <h3 className="text-sm font-semibold text-ink">{title}</h3>
      <div className="mt-4 flex flex-col items-center gap-4 sm:flex-row sm:items-center">
        <div className="relative shrink-0" style={{ width: size, height: size }}>
          <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden>
            <g transform={`rotate(-90 ${center} ${center})`}>
              {arcs.map((arc) => (
                <circle
                  key={arc.key}
                  cx={center}
                  cy={center}
                  r={radius}
                  fill="none"
                  stroke={arc.color}
                  strokeWidth={thickness}
                  strokeDasharray={`${arc.dash} ${circumference - arc.dash}`}
                  strokeDashoffset={-arc.offset}
                  strokeLinecap="butt"
                />
              ))}
            </g>
          </svg>
          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
            <p className="text-2xl font-semibold text-ink">{centerValue}</p>
            <p className="text-xs text-stone-500">{centerLabel}</p>
          </div>
        </div>
        <ul className="w-full space-y-2 text-sm">
          {segments.map((segment) => (
            <li key={segment.label} className="flex items-center justify-between gap-3">
              <span className="flex items-center gap-2 text-stone-600">
                <span
                  className="h-2.5 w-2.5 shrink-0 rounded-full"
                  style={{ backgroundColor: segment.color }}
                />
                {segment.label}
              </span>
              <span className="font-medium text-ink">{segment.value}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

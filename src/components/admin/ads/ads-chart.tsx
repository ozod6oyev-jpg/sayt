import type { DailyInsightRow } from "@/lib/meta-ads";

function shortDate(value: string): string {
  const [, month, day] = value.split("-");
  return day && month ? `${day}.${month}` : value;
}

/** Kunlik sarf (ustunlar) va bosishlar (chiziq) — tashqi kutubxonasiz SVG grafik */
export function AdsChart({
  rows,
  currency,
  labels,
}: {
  rows: DailyInsightRow[];
  currency: string;
  labels: { spend: string; clicks: string; empty: string };
}) {
  if (rows.length === 0) {
    return <p className="mt-3 rounded-lg bg-slate-50 px-3 py-6 text-center text-xs text-slate-500">{labels.empty}</p>;
  }

  const width = 640;
  const height = 180;
  const padX = 12;
  const top = 12;
  const bottom = 34;
  const chartHeight = height - top - bottom;

  const maxSpend = Math.max(...rows.map((row) => row.spend), 1);
  const maxClicks = Math.max(...rows.map((row) => row.clicks), 1);
  const slot = (width - padX * 2) / rows.length;
  const barWidth = Math.max(Math.min(slot * 0.55, 34), 3);

  const points = rows
    .map((row, index) => {
      const cx = padX + index * slot + slot / 2;
      const cy = top + chartHeight - (row.clicks / maxClicks) * chartHeight;
      return `${cx.toFixed(1)},${cy.toFixed(1)}`;
    })
    .join(" ");

  const labelStep = Math.max(Math.ceil(rows.length / 7), 1);

  return (
    <div>
      <div className="flex flex-wrap items-center gap-4 text-[11px] text-slate-500">
        <span className="flex items-center gap-1.5">
          <span className="size-2.5 rounded-sm bg-blue-500/40" />
          {labels.spend} · {currency}
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-0.5 w-4 rounded-full bg-blue-700" />
          {labels.clicks}
        </span>
      </div>

      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="mt-2 h-44 w-full"
        role="img"
        aria-label={labels.spend}
      >
        {[0.25, 0.5, 0.75, 1].map((part) => (
          <line
            key={part}
            x1={padX}
            x2={width - padX}
            y1={top + chartHeight * (1 - part)}
            y2={top + chartHeight * (1 - part)}
            stroke="#e2e8f0"
            strokeWidth="1"
          />
        ))}

        {rows.map((row, index) => {
          const barHeight = (row.spend / maxSpend) * chartHeight;
          const x = padX + index * slot + slot / 2 - barWidth / 2;

          return (
            <g key={row.date}>
              <rect
                x={x}
                y={top + chartHeight - barHeight}
                width={barWidth}
                height={Math.max(barHeight, 1)}
                rx={Math.min(barWidth / 3, 4)}
                fill="#3b82f6"
                fillOpacity="0.38"
              >
                <title>
                  {shortDate(row.date)} — {row.spend.toFixed(2)} {currency}
                </title>
              </rect>

              {index % labelStep === 0 && (
                <text
                  x={padX + index * slot + slot / 2}
                  y={height - 12}
                  textAnchor="middle"
                  fontSize="10"
                  fill="#94a3b8"
                >
                  {shortDate(row.date)}
                </text>
              )}
            </g>
          );
        })}

        <polyline
          points={points}
          fill="none"
          stroke="#1d4ed8"
          strokeWidth="2"
          strokeLinejoin="round"
          strokeLinecap="round"
        />

        {rows.map((row, index) => {
          const cx = padX + index * slot + slot / 2;
          const cy = top + chartHeight - (row.clicks / maxClicks) * chartHeight;

          return (
            <circle key={`dot-${row.date}`} cx={cx} cy={cy} r="2.5" fill="#1d4ed8">
              <title>
                {shortDate(row.date)} — {row.clicks} {labels.clicks.toLowerCase()}
              </title>
            </circle>
          );
        })}
      </svg>
    </div>
  );
}

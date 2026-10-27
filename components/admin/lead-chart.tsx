import type { LeadChartRow } from "@/lib/overview";
import { sourceColors } from "@/components/admin/ui";
export function LeadChart({
  rows,
  start,
  end,
  buckets,
}: {
  rows: LeadChartRow[];
  start: number;
  end: number;
  buckets: number;
}) {
  const step = (end - start) / buckets;
  const bins = Array.from({ length: buckets }, (_, i) => ({
    start: start + i * step,
    counts: {} as Record<string, number>,
  }));
  for (const row of rows) {
    const index = Math.floor((Date.parse(row.created_at) - start) / step);
    if (bins[index])
      bins[index].counts[row.source] =
        (bins[index].counts[row.source] || 0) + 1;
  }
  const sources = [
    "google",
    "form",
    "chatbot",
    ...Array.from(new Set(rows.map((r) => r.source))).filter(
      (s) => !["google", "form", "chatbot"].includes(s),
    ),
  ];
  const max =
    Math.ceil(
      Math.max(
        4,
        ...bins.map((b) => Object.values(b.counts).reduce((a, b) => a + b, 0)),
      ) / 4,
    ) * 4;
  const cw = 718 / buckets,
    bw = Math.max(4, cw * 0.66);
  return (
    <svg
      className="chart"
      viewBox="0 0 760 250"
      role="img"
      aria-label={`Leads over time, stacked by source. ${rows.length} leads in the chart window.`}
    >
      {Array.from({ length: 5 }, (_, i) => (
        <g key={i}>
          <line
            x1={34}
            x2={752}
            y1={224 - i * 53.5}
            y2={224 - i * 53.5}
            stroke="rgba(20,34,27,.1)"
          />
          <text
            x={26}
            y={228 - i * 53.5}
            textAnchor="end"
            fontSize={11}
            fill="#6a746d"
          >
            {(max * i) / 4}
          </text>
        </g>
      ))}
      {bins.map((bin, i) => {
        let y = 224;
        const label = new Date(bin.start).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          timeZone: "UTC",
        });
        return (
          <g key={i}>
            <title>
              {label}: {Object.values(bin.counts).reduce((a, b) => a + b, 0)}{" "}
              leads
            </title>
            {sources.map((source) => {
              const h = ((bin.counts[source] || 0) / max) * 214;
              y -= h;
              return h > 0 ? (
                <rect
                  key={source}
                  x={34 + i * cw + (cw - bw) / 2}
                  y={y}
                  width={bw}
                  height={Math.max(1, h - 1)}
                  rx={2}
                  fill={sourceColors[source] || "#6a746d"}
                />
              ) : null;
            })}
            {i % Math.ceil(buckets / 7) === 0 && (
              <text
                x={34 + i * cw + cw / 2}
                y={242}
                textAnchor="middle"
                fontSize={11}
                fill="#6a746d"
              >
                {label}
              </text>
            )}
          </g>
        );
      })}
    </svg>
  );
}

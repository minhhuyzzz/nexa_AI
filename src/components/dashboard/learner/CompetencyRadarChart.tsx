'use client';

import React from 'react';

export interface DomainScore {
  code: string;
  name: string;
  score: number; // 0 to 100
  target: number; // baseline benchmark
  level?: string;
}

interface CompetencyRadarChartProps {
  data?: DomainScore[];
  size?: number;
}

const defaultDomains: DomainScore[] = [
  { code: 'D1', name: 'Thông tin & Dữ liệu', score: 85, target: 70 },
  { code: 'D2', name: 'Giao tiếp & Hợp tác', score: 78, target: 70 },
  { code: 'D3', name: 'Sáng tạo Nội dung số', score: 62, target: 70 },
  { code: 'D4', name: 'An toàn & Bảo mật', score: 90, target: 70 },
  { code: 'D5', name: 'Giải quyết Vấn đề', score: 70, target: 70 },
];

export function CompetencyRadarChart({ data = defaultDomains }: CompetencyRadarChartProps) {
  const viewBoxWidth = 460;
  const viewBoxHeight = 330;
  const centerX = viewBoxWidth / 2; // 230
  const centerY = 165;
  const radius = 95;
  const count = data.length;

  // Compute coordinates for a given index and normalized value [0..1]
  const getPoint = (index: number, value: number) => {
    const angle = -Math.PI / 2 + (index * 2 * Math.PI) / count;
    const x = centerX + radius * value * Math.cos(angle);
    const y = centerY + radius * value * Math.sin(angle);
    return { x, y };
  };

  // Generate web background polygons (20%, 40%, 60%, 80%, 100%)
  const gridLevels = [0.2, 0.4, 0.6, 0.8, 1.0];
  const gridPolygons = gridLevels.map((lvl) => {
    return Array.from({ length: count })
      .map((_, i) => {
        const { x, y } = getPoint(i, lvl);
        return `${x.toFixed(1)},${y.toFixed(1)}`;
      })
      .join(' ');
  });

  // Target baseline polygon (70%)
  const targetPolygon = Array.from({ length: count })
    .map((_, i) => {
      const { x, y } = getPoint(i, (data[i]?.target ?? 70) / 100);
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(' ');

  // Actual score polygon
  const scorePolygon = data
    .map((d, i) => {
      const { x, y } = getPoint(i, d.score / 100);
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(' ');

  // Calibrated positions for each domain label to ensure text never touches or overlaps the chart
  const getLabelConfig = (index: number) => {
    switch (index) {
      case 0: // Top (D1: Thông tin & Dữ liệu)
        return {
          x: centerX,
          titleY: 34,
          scoreY: 50,
          anchor: 'middle' as const,
        };
      case 1: // Top-Right (D2: Giao tiếp & Hợp tác)
        return {
          x: 336,
          titleY: 136,
          scoreY: 152,
          anchor: 'start' as const,
        };
      case 2: // Bottom-Right (D3: Sáng tạo Nội dung số)
        return {
          x: 298,
          titleY: 254,
          scoreY: 270,
          anchor: 'start' as const,
        };
      case 3: // Bottom-Left (D4: An toàn & Bảo mật)
        return {
          x: 162,
          titleY: 254,
          scoreY: 270,
          anchor: 'end' as const,
        };
      case 4: // Top-Left (D5: Giải quyết Vấn đề)
        return {
          x: 124,
          titleY: 136,
          scoreY: 152,
          anchor: 'end' as const,
        };
      default:
        return {
          x: centerX,
          titleY: 34,
          scoreY: 50,
          anchor: 'middle' as const,
        };
    }
  };

  return (
    <div className="flex flex-col items-center justify-center select-none w-full">
      <svg
        viewBox={`0 0 ${viewBoxWidth} ${viewBoxHeight}`}
        className="w-full max-w-[420px] h-auto overflow-visible"
      >
        {/* Background Web Polygons */}
        {gridPolygons.map((points, idx) => (
          <polygon
            key={idx}
            points={points}
            fill="none"
            stroke="#E2E8F0"
            strokeWidth={idx === 4 ? '1.5' : '1'}
            strokeDasharray={idx === 4 ? undefined : '2,2'}
          />
        ))}

        {/* Ring percentage indicators (20%, 40%, 60%, 80%, 100%) */}
        {gridLevels.map((lvl) => {
          const yPos = centerY - radius * lvl;
          return (
            <text
              key={lvl}
              x={centerX + 5}
              y={lvl === 1.0 ? yPos + 11 : yPos - 2}
              className="text-[9px] fill-slate-400 font-medium select-none"
            >
              {Math.round(lvl * 100)}%
            </text>
          );
        })}

        {/* Axis Lines */}
        {Array.from({ length: count }).map((_, i) => {
          const { x, y } = getPoint(i, 1.0);
          return (
            <line
              key={i}
              x1={centerX}
              y1={centerY}
              x2={x}
              y2={y}
              stroke="#E2E8F0"
              strokeWidth="1"
            />
          );
        })}

        {/* Target Benchmark (dashed slate line) */}
        <polygon
          points={targetPolygon}
          fill="none"
          stroke="#94A3B8"
          strokeWidth="1.25"
          strokeDasharray="4,3"
          opacity={0.7}
        />

        {/* Learner Score Polygon */}
        <polygon
          points={scorePolygon}
          fill="rgba(2, 132, 199, 0.14)"
          stroke="#0284C7"
          strokeWidth="2"
        />

        {/* Points and Standardized Clean Labels */}
        {data.map((d, i) => {
          const pt = getPoint(i, d.score / 100);
          const cfg = getLabelConfig(i);

          return (
            <g key={d.code}>
              {/* Vertex circle */}
              <circle
                cx={pt.x}
                cy={pt.y}
                r="4.5"
                className="fill-sky-600 stroke-white stroke-2"
              >
                <title>{`${d.name}: ${d.score}%`}</title>
              </circle>

              {/* Domain Name */}
              <text
                x={cfg.x}
                y={cfg.titleY}
                textAnchor={cfg.anchor}
                dominantBaseline="central"
                className="text-[11px] font-sans fill-slate-800 font-semibold"
              >
                {d.name}
              </text>

              {/* Standardized Percentage Only - Removed descriptors like 'Thành thạo', 'Đạt chuẩn' */}
              <text
                x={cfg.x}
                y={cfg.scoreY}
                textAnchor={cfg.anchor}
                dominantBaseline="central"
                className="text-[11px] font-sans fill-sky-600 font-bold"
              >
                {d.score}%
              </text>
            </g>
          );
        })}
      </svg>

      {/* Legend */}
      <div className="flex items-center gap-6 mt-3 text-xs text-slate-500">
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-0.5 bg-sky-600 rounded-full" />
          <span className="text-slate-700 font-medium">Năng lực thực tế</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-0.5 border-t border-dashed border-slate-400" />
          <span className="text-slate-500">Chuẩn mục tiêu (70%)</span>
        </div>
      </div>
    </div>
  );
}

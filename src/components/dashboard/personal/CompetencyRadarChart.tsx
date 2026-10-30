'use client';

import React from 'react';

export interface DomainScore {
  code: string;
  name: string;
  score: number | null; // 0 to 100 or null if unassessed
  target: number; // baseline benchmark
  level?: string;
}

interface CompetencyRadarChartProps {
  data?: DomainScore[];
  size?: number;
  showLegend?: boolean;
  showPercentages?: boolean;
  variant?: 'default' | 'hero';
}

const defaultDomains: DomainScore[] = [
  { code: 'D1', name: 'Thông tin & Dữ liệu', score: 0, target: 70 },
  { code: 'D2', name: 'Giao tiếp & Hợp tác', score: 0, target: 70 },
  { code: 'D3', name: 'Sáng tạo Nội dung số', score: 0, target: 70 },
  { code: 'D4', name: 'An toàn & Bảo mật', score: 0, target: 70 },
  { code: 'D5', name: 'Giải quyết Vấn đề', score: 0, target: 70 },
];

export function CompetencyRadarChart({
  data = defaultDomains,
  showLegend = true,
  showPercentages = true,
  variant = 'default',
}: CompetencyRadarChartProps) {
  const isHero = variant === 'hero';
  const viewBoxWidth = isHero ? 620 : 460;
  const viewBoxHeight = isHero ? 440 : 330;
  const centerX = viewBoxWidth / 2;
  const centerY = isHero ? 220 : 165;
  const radius = isHero ? 155 : 95;
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

  // Actual score polygon (only when score is not null)
  const scorePolygon = data
    .map((d, i) => {
      const val = d.score !== null ? d.score / 100 : 0;
      const { x, y } = getPoint(i, val);
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(' ');

  // Calibrated positions for each domain label
  const getLabelConfig = (index: number) => {
    if (isHero) {
      switch (index) {
        case 0: // Top (D1: Thông tin & Dữ liệu)
          return {
            x: centerX,
            titleY: showPercentages ? 28 : 34,
            scoreY: 48,
            anchor: 'middle' as const,
          };
        case 1: // Top-Right (D2: Giao tiếp & Hợp tác)
          return {
            x: 476,
            titleY: showPercentages ? 162 : 172,
            scoreY: 182,
            anchor: 'start' as const,
          };
        case 2: // Bottom-Right (D3: Sáng tạo Nội dung số)
          return {
            x: 416,
            titleY: showPercentages ? 354 : 366,
            scoreY: 374,
            anchor: 'start' as const,
          };
        case 3: // Bottom-Left (D4: An toàn & Bảo mật)
          return {
            x: 204,
            titleY: showPercentages ? 354 : 366,
            scoreY: 374,
            anchor: 'end' as const,
          };
        case 4: // Top-Left (D5: Giải quyết Vấn đề)
          return {
            x: 144,
            titleY: showPercentages ? 162 : 172,
            scoreY: 182,
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
    }

    switch (index) {
      case 0: // Top (D1: Thông tin & Dữ liệu)
        return {
          x: centerX,
          titleY: showPercentages ? 34 : 44,
          scoreY: 50,
          anchor: 'middle' as const,
        };
      case 1: // Top-Right (D2: Giao tiếp & Hợp tác)
        return {
          x: 336,
          titleY: showPercentages ? 136 : 142,
          scoreY: 152,
          anchor: 'start' as const,
        };
      case 2: // Bottom-Right (D3: Sáng tạo Nội dung số)
        return {
          x: 298,
          titleY: showPercentages ? 254 : 260,
          scoreY: 270,
          anchor: 'start' as const,
        };
      case 3: // Bottom-Left (D4: An toàn & Bảo mật)
        return {
          x: 162,
          titleY: showPercentages ? 254 : 260,
          scoreY: 270,
          anchor: 'end' as const,
        };
      case 4: // Top-Left (D5: Giải quyết Vấn đề)
        return {
          x: 124,
          titleY: showPercentages ? 136 : 142,
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
        className={
          isHero
            ? 'w-full max-w-[540px] xl:max-w-[600px] h-auto overflow-visible'
            : 'w-full max-w-[420px] h-auto overflow-visible'
        }
      >
        <defs>
          {/* Depth gradient for score polygon */}
          <linearGradient id="radarScoreElevationGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#0284C7" stopOpacity="0.32" />
            <stop offset="60%" stopColor="#0284C7" stopOpacity="0.16" />
            <stop offset="100%" stopColor="#0284C7" stopOpacity="0.06" />
          </linearGradient>

          {/* Elevated soft drop shadow for data polygon layer */}
          <filter id="radarScoreShadow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="8" stdDeviation="10" floodColor="#0284C7" floodOpacity="0.28" />
          </filter>

          {/* Depth vignette backdrop for 3D grounding */}
          <radialGradient id="radarAmbientGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#0284C7" stopOpacity="0.05" />
            <stop offset="50%" stopColor="#F8FAFC" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* Ambient atmospheric depth circle behind web */}
        {isHero && (
          <circle
            cx={centerX}
            cy={centerY}
            r={radius * 1.15}
            fill="url(#radarAmbientGlow)"
          />
        )}

        {/* Background Web Polygons with alternating depth shading */}
        {gridPolygons.map((points, idx) => {
          let ringFill = 'none';
          if (isHero) {
            if (idx === 4) ringFill = 'rgba(248, 250, 252, 0.7)';
            else if (idx === 2) ringFill = 'rgba(241, 245, 249, 0.4)';
            else if (idx === 0) ringFill = 'rgba(241, 245, 249, 0.6)';
          }

          return (
            <polygon
              key={idx}
              points={points}
              fill={ringFill}
              className="stroke-slate-200 dark:stroke-zinc-800"
              strokeWidth={idx === 4 ? (isHero ? '1.75' : '1.5') : '1'}
              strokeDasharray={idx === 4 ? undefined : (isHero ? '3,3' : '2,2')}
            />
          );
        })}

        {/* Ring percentage indicators (20%, 40%, 60%, 80%, 100%) */}
        {showPercentages &&
          gridLevels.map((lvl) => {
            const yPos = centerY - radius * lvl;
            return (
              <text
                key={lvl}
                x={centerX + 6}
                y={yPos - 3}
                className="text-[9px] fill-slate-400 dark:fill-zinc-500 font-medium select-none"
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
              className="stroke-slate-200 dark:stroke-zinc-800"
              strokeWidth={isHero ? '1.25' : '1'}
            />
          );
        })}

        {/* Center Precision Hub */}
        {isHero && (
          <g>
            <circle cx={centerX} cy={centerY} r="6" fill="#FFFFFF" stroke="#CBD5E1" strokeWidth="1.5" />
            <circle cx={centerX} cy={centerY} r="2.5" fill="#0284C7" />
          </g>
        )}

        {/* Target Benchmark (dashed slate line) */}
        <polygon
          points={targetPolygon}
          fill="none"
          className="stroke-slate-400 dark:stroke-zinc-600"
          strokeWidth={isHero ? '1.5' : '1.25'}
          strokeDasharray="4,3"
          opacity={0.7}
        />

        {/* Learner Score Polygon with true visual depth */}
        {!data.every((d) => d.score === null || d.score === 0) ? (
          <polygon
            points={scorePolygon}
            fill={isHero ? 'url(#radarScoreElevationGrad)' : 'rgba(2, 132, 199, 0.16)'}
            stroke="#0284C7"
            strokeWidth={isHero ? '2.5' : '2'}
            filter={isHero ? 'url(#radarScoreShadow)' : undefined}
          />
        ) : (
          <circle
            cx={centerX}
            cy={centerY}
            r="3.5"
            className="fill-sky-600 stroke-white stroke-2"
          />
        )}

        {/* Points and Standardized Clean Labels */}
        {data.map((d, i) => {
          const isUnassessed = d.score === null;
          const isZero = isUnassessed || d.score === 0;
          const pt = getPoint(i, d.score !== null ? d.score / 100 : 0);
          const cfg = getLabelConfig(i);

          return (
            <g key={d.code}>
              {/* Vertex depth layers */}
              {!isZero && (
                <>
                  {/* Outer soft halo for depth */}
                  {isHero && (
                    <circle
                      cx={pt.x}
                      cy={pt.y}
                      r="9"
                      fill="rgba(2, 132, 199, 0.16)"
                    />
                  )}
                  {/* Elevated tactile point */}
                  <circle
                    cx={pt.x}
                    cy={pt.y}
                    r={isHero ? '5.5' : '4.5'}
                    className="fill-sky-600 stroke-white dark:stroke-zinc-900 stroke-2"
                    style={isHero ? { filter: 'drop-shadow(0px 2px 4px rgba(2, 132, 199, 0.45))' } : undefined}
                  >
                    <title>{`${d.name}: ${d.score}%`}</title>
                  </circle>
                  {/* Center micro core dot */}
                  {isHero && (
                    <circle
                      cx={pt.x}
                      cy={pt.y}
                      r="1.75"
                      fill="#FFFFFF"
                    />
                  )}
                </>
              )}

              {/* Domain Name */}
              <text
                x={cfg.x}
                y={cfg.titleY}
                textAnchor={cfg.anchor}
                dominantBaseline="central"
                className={
                  isHero
                    ? 'text-[13px] sm:text-[14px] font-sans fill-slate-800 dark:fill-zinc-200 font-semibold'
                    : 'text-[11px] font-sans fill-slate-800 dark:fill-zinc-200 font-semibold'
                }
              >
                {d.name}
              </text>

              {/* Standardized Percentage Only */}
              {showPercentages && (
                <text
                  x={cfg.x}
                  y={cfg.scoreY}
                  textAnchor={cfg.anchor}
                  dominantBaseline="central"
                  className={`text-[11px] font-sans font-bold ${
                    d.score === null ? 'fill-slate-400 dark:fill-zinc-500' : 'fill-sky-600 dark:fill-sky-400'
                  }`}
                >
                  {d.score !== null ? `${d.score}%` : '—'}
                </text>
              )}
            </g>
          );
        })}
      </svg>

      {/* Legend */}
      {showLegend && (
        <div className="flex items-center gap-6 mt-3 text-xs text-slate-500 dark:text-zinc-400">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-0.5 bg-sky-600 dark:bg-sky-400 rounded-full" />
            <span className="text-slate-700 dark:text-zinc-200 font-medium">Năng lực thực tế</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-0.5 border-t border-dashed border-slate-400 dark:border-zinc-600" />
            <span className="text-slate-500 dark:text-zinc-400">Chuẩn mục tiêu (70%)</span>
          </div>
        </div>
      )}
    </div>
  );
}

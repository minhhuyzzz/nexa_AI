'use client';

import React, { useState, useRef } from 'react';

interface DomainDef {
  code: string;
  name: string;
}

const DOMAINS: DomainDef[] = [
  { code: 'D1', name: 'Thông tin & Dữ liệu' },
  { code: 'D2', name: 'Giao tiếp & Hợp tác' },
  { code: 'D3', name: 'Sáng tạo Nội dung số' },
  { code: 'D4', name: 'An toàn & Bảo mật' },
  { code: 'D5', name: 'Giải quyết Vấn đề' },
];

const DEFAULT_SCORES = [84, 78, 68, 92, 74];

export function HeroRadarInteractive() {
  const [scores, setScores] = useState<number[]>(DEFAULT_SCORES);
  const [draggingIdx, setDraggingIdx] = useState<number | null>(null);
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);
  const svgRef = useRef<SVGSVGElement | null>(null);

  // SVG Geometry Constants
  const viewBoxWidth = 600;
  const viewBoxHeight = 500;
  const centerX = viewBoxWidth / 2; // 300
  const centerY = 250;
  const radius = 160;
  const count = 5;

  // Calculate coordinates for a point along domain axis
  const getPoint = (index: number, normalizedValue: number) => {
    const angle = -Math.PI / 2 + (index * 2 * Math.PI) / count;
    const x = centerX + radius * normalizedValue * Math.cos(angle);
    const y = centerY + radius * normalizedValue * Math.sin(angle);
    return { x, y };
  };

  // Generate 5 concentric pentagon rings (20%, 40%, 60%, 80%, 100%)
  const gridLevels = [0.2, 0.4, 0.6, 0.8, 1.0];
  const gridPolygons = gridLevels.map((lvl) => {
    return Array.from({ length: count })
      .map((_, i) => {
        const { x, y } = getPoint(i, lvl);
        return `${x.toFixed(1)},${y.toFixed(1)}`;
      })
      .join(' ');
  });

  // Current score polygon
  const scorePolygon = scores
    .map((score, i) => {
      const { x, y } = getPoint(i, score / 100);
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(' ');

  // Domain labels positioning around vertices with comfortable margin
  const getLabelConfig = (index: number) => {
    switch (index) {
      case 0: // Top (D1: Thông tin & Dữ liệu)
        return {
          x: centerX,
          y: 50,
          anchor: 'middle' as const,
        };
      case 1: // Top-Right (D2: Giao tiếp & Hợp tác)
        return {
          x: 475,
          y: 200,
          anchor: 'start' as const,
        };
      case 2: // Bottom-Right (D3: Sáng tạo Nội dung số)
        return {
          x: 415,
          y: 410,
          anchor: 'start' as const,
        };
      case 3: // Bottom-Left (D4: An toàn & Bảo mật)
        return {
          x: 185,
          y: 410,
          anchor: 'end' as const,
        };
      case 4: // Top-Left (D5: Giải quyết Vấn đề)
        return {
          x: 125,
          y: 200,
          anchor: 'end' as const,
        };
      default:
        return {
          x: centerX,
          y: 50,
          anchor: 'middle' as const,
        };
    }
  };

  // Pointer drag handling directly on radar vertices
  const handlePointerDown = (index: number, e: React.PointerEvent) => {
    e.preventDefault();
    (e.target as Element).setPointerCapture(e.pointerId);
    setDraggingIdx(index);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (draggingIdx === null || !svgRef.current) return;
    const rect = svgRef.current.getBoundingClientRect();
    const scaleX = viewBoxWidth / rect.width;
    const scaleY = viewBoxHeight / rect.height;
    const svgX = (e.clientX - rect.left) * scaleX;
    const svgY = (e.clientY - rect.top) * scaleY;

    const dx = svgX - centerX;
    const dy = svgY - centerY;
    const axisAngle = -Math.PI / 2 + (draggingIdx * 2 * Math.PI) / count;
    const projectedDistance = dx * Math.cos(axisAngle) + dy * Math.sin(axisAngle);

    const clampedPct = Math.round(Math.max(15, Math.min(100, (projectedDistance / radius) * 100)));
    setScores((prev) => {
      const next = [...prev];
      next[draggingIdx] = clampedPct;
      return next;
    });
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (draggingIdx !== null) {
      try {
        (e.target as Element).releasePointerCapture(e.pointerId);
      } catch {
        // ignore
      }
      setDraggingIdx(null);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center w-full max-w-[560px]">
      <svg
        ref={svgRef}
        viewBox={`0 0 ${viewBoxWidth} ${viewBoxHeight}`}
        className="w-full h-auto overflow-visible select-none touch-none"
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
      >
        {/* Subtle translucent drop shadow for depth */}
        <defs>
          <filter id="heroRadarDropShadow" x="-10%" y="-10%" width="120%" height="120%">
            <feDropShadow dx="0" dy="4" stdDeviation="6" floodColor="#0284C7" floodOpacity="0.22" />
          </filter>
        </defs>

        {/* Outer Background Subtle Base */}
        <polygon
          points={gridPolygons[4]}
          fill="rgba(248, 250, 252, 0.6)"
          stroke="#94A3B8"
          strokeWidth="1.5"
        />

        {/* 4 Inner Concentric Rings (100% visible, no fills covering each other) */}
        {gridPolygons.slice(0, 4).map((points, idx) => (
          <polygon
            key={idx}
            points={points}
            fill="none"
            stroke="#CBD5E1"
            strokeWidth="1"
          />
        ))}

        {/* 5 Radial Axis Tracks */}
        {Array.from({ length: count }).map((_, i) => {
          const { x, y } = getPoint(i, 1.0);
          return (
            <g key={i}>
              <line
                x1={centerX}
                y1={centerY}
                x2={x}
                y2={y}
                stroke="#CBD5E1"
                strokeWidth="1.5"
              />
              {/* Calibration tick marks on the axis spokes for depth */}
              {gridLevels.slice(0, 4).map((lvl, lIdx) => {
                const tick = getPoint(i, lvl);
                return (
                  <circle
                    key={lIdx}
                    cx={tick.x}
                    cy={tick.y}
                    r="1.75"
                    fill="#94A3B8"
                  />
                );
              })}
            </g>
          );
        })}

        {/* Center Pivot Point */}
        <circle cx={centerX} cy={centerY} r="3.5" fill="#64748B" />

        {/* Active Data Polygon */}
        <polygon
          points={scorePolygon}
          fill="rgba(2, 132, 199, 0.16)"
          stroke="#0284C7"
          strokeWidth="2.5"
          filter="url(#heroRadarDropShadow)"
        />

        {/* Draggable Vertex Knobs & Domain Names */}
        {DOMAINS.map((domain, i) => {
          const pt = getPoint(i, scores[i] / 100);
          const cfg = getLabelConfig(i);
          const isDragging = draggingIdx === i;
          const isHovered = hoveredIdx === i;

          return (
            <g key={domain.code}>
              {/* Domain Name Label - Pure Text, No % */}
              <text
                x={cfg.x}
                y={cfg.y}
                textAnchor={cfg.anchor}
                dominantBaseline="central"
                className={`text-[13px] font-sans font-semibold transition-colors ${
                  isDragging || isHovered
                    ? 'fill-sky-700 font-bold'
                    : 'fill-slate-800'
                }`}
              >
                {domain.name}
              </text>

              {/* Touch/pointer grab target rail along vertex */}
              <circle
                cx={pt.x}
                cy={pt.y}
                r="24"
                fill="transparent"
                className="cursor-grab active:cursor-grabbing"
                onPointerDown={(e) => handlePointerDown(i, e)}
                onMouseEnter={() => setHoveredIdx(i)}
                onMouseLeave={() => setHoveredIdx(null)}
              />

              {/* Active Halo while dragging or hovering */}
              {(isDragging || isHovered) && (
                <circle
                  cx={pt.x}
                  cy={pt.y}
                  r="14"
                  fill="rgba(2, 132, 199, 0.25)"
                  className="pointer-events-none"
                />
              )}

              {/* Tactile Draggable Knob */}
              <circle
                cx={pt.x}
                cy={pt.y}
                r={isDragging ? 7.5 : 6}
                fill="#0284C7"
                stroke="#FFFFFF"
                strokeWidth="2.5"
                className="pointer-events-none transition-transform"
              />

              {/* Center dot in knob */}
              <circle
                cx={pt.x}
                cy={pt.y}
                r="2"
                fill="#FFFFFF"
                className="pointer-events-none"
              />

              {/* Value indicator tooltip only while dragging/hovering - Clean number without % */}
              {(isDragging || isHovered) && (
                <g className="pointer-events-none">
                  <rect
                    x={pt.x - 16}
                    y={pt.y - 28}
                    width="32"
                    height="18"
                    rx="4"
                    fill="#0F172A"
                  />
                  <text
                    x={pt.x}
                    y={pt.y - 17}
                    textAnchor="middle"
                    dominantBaseline="central"
                    className="text-[11px] font-mono font-bold fill-white"
                  >
                    {scores[i]}
                  </text>
                </g>
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
}
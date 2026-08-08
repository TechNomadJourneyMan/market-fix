'use client';

import * as React from 'react';
import type { TimeSeriesPoint } from '@/types';
import { cn } from '@/lib/utils';
import { formatCompactNumber, formatDate, formatPriceCompact } from '@/lib/format';

/**
 * Лёгкие SVG-графики без сторонних библиотек.
 * Их достаточно для MVP-дашборда и они не тянут лишние килобайты в бандл.
 */

interface AreaChartProps {
  data: TimeSeriesPoint[];
  className?: string;
  /** Формат подписи значения в тултипе. */
  format?: 'number' | 'money';
  height?: number;
}

export function AreaChart({
  data,
  className,
  format = 'number',
  height = 200,
}: AreaChartProps) {
  const [hovered, setHovered] = React.useState<number | null>(null);

  if (data.length === 0) return null;

  const values = data.map((point) => point.value);
  const max = Math.max(...values);
  const min = Math.min(...values);
  const span = max - min || 1;

  const width = 100;
  const points = data.map((point, index) => ({
    x: (index / (data.length - 1 || 1)) * width,
    y: 100 - ((point.value - min) / span) * 82 - 9,
    point,
  }));

  const line = points
    .map((item, index) => `${index === 0 ? 'M' : 'L'} ${item.x.toFixed(2)} ${item.y.toFixed(2)}`)
    .join(' ');
  const area = `${line} L ${width} 100 L 0 100 Z`;

  const active = hovered !== null ? points[hovered] : null;
  const formatValue = (value: number) =>
    format === 'money' ? formatPriceCompact(value) : formatCompactNumber(value);

  return (
    <div className={cn('relative', className)} style={{ height }}>
      <svg
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        className="size-full overflow-visible"
        onMouseLeave={() => setHovered(null)}
      >
        <defs>
          <linearGradient id="area-fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0.28" />
            <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="0" />
          </linearGradient>
        </defs>

        {[25, 50, 75].map((y) => (
          <line
            key={y}
            x1="0"
            y1={y}
            x2="100"
            y2={y}
            className="stroke-border"
            strokeWidth="0.3"
            strokeDasharray="1 1.5"
            vectorEffect="non-scaling-stroke"
          />
        ))}

        <path d={area} fill="url(#area-fill)" />
        <path
          d={line}
          fill="none"
          className="stroke-primary"
          strokeWidth="2"
          strokeLinejoin="round"
          strokeLinecap="round"
          vectorEffect="non-scaling-stroke"
        />

        {active ? (
          <>
            <line
              x1={active.x}
              y1="0"
              x2={active.x}
              y2="100"
              className="stroke-primary/40"
              strokeWidth="1"
              vectorEffect="non-scaling-stroke"
            />
            <circle
              cx={active.x}
              cy={active.y}
              r="3"
              className="fill-background stroke-primary"
              strokeWidth="2"
              vectorEffect="non-scaling-stroke"
            />
          </>
        ) : null}

        {/* Прозрачные зоны наведения */}
        {points.map((item, index) => (
          <rect
            key={index}
            x={item.x - width / data.length / 2}
            y="0"
            width={width / data.length}
            height="100"
            fill="transparent"
            onMouseEnter={() => setHovered(index)}
          />
        ))}
      </svg>

      {active ? (
        <div
          className="pointer-events-none absolute -translate-x-1/2 rounded-lg border bg-popover px-2.5 py-1.5 text-xs shadow-lift"
          style={{ left: `${active.x}%`, top: 0 }}
        >
          <p className="font-semibold">{formatValue(active.point.value)}</p>
          <p className="text-muted-foreground">{formatDate(active.point.date)}</p>
        </div>
      ) : null}
    </div>
  );
}

/** Столбчатая диаграмма загрузки по часам. */
export function BarChart({
  data,
  className,
  height = 160,
}: {
  data: { label: string; value: number }[];
  className?: string;
  height?: number;
}) {
  const max = Math.max(...data.map((item) => item.value), 1);

  return (
    <div className={cn('flex items-end gap-1', className)} style={{ height }}>
      {data.map((item) => (
        <div key={item.label} className="group flex flex-1 flex-col items-center gap-1.5">
          <div className="relative flex w-full flex-1 items-end">
            <div
              className="w-full rounded-t-[3px] bg-primary/25 transition-all group-hover:bg-primary"
              style={{ height: `${(item.value / max) * 100}%` }}
            />
            <span className="pointer-events-none absolute -top-6 left-1/2 -translate-x-1/2 rounded-md border bg-popover px-1.5 py-0.5 text-[10px] font-medium opacity-0 shadow-soft transition-opacity group-hover:opacity-100">
              {item.value}
            </span>
          </div>
          <span className="text-[9px] text-muted-foreground">{item.label}</span>
        </div>
      ))}
    </div>
  );
}

/** Горизонтальные полосы — источники трафика. */
export function BarList({
  data,
  className,
}: {
  data: { label: string; value: number }[];
  className?: string;
}) {
  const total = data.reduce((sum, item) => sum + item.value, 0) || 1;

  return (
    <ul className={cn('space-y-2.5', className)}>
      {data.map((item) => {
        const percent = (item.value / total) * 100;
        return (
          <li key={item.label} className="space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span>{item.label}</span>
              <span className="font-medium tabular-nums">{Math.round(percent)}%</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-secondary">
              <div
                className="h-full rounded-full brand-gradient transition-all"
                style={{ width: `${percent}%` }}
              />
            </div>
          </li>
        );
      })}
    </ul>
  );
}

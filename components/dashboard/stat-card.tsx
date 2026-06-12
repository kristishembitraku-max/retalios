'use client';

import { useEffect, useRef, useState } from 'react';
import { TrendingUp, TrendingDown, Minus, type LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StatCardProps {
  title: string;
  value: number | string;
  change?: number;
  trend?: 'up' | 'down' | 'neutral';
  icon: LucideIcon;
  description?: string;
  prefix?: string;
  suffix?: string;
  formatValue?: (v: number) => string;
}

function useCountUp(target: number, duration = 800) {
  const [current, setCurrent] = useState(0);
  const rafRef = useRef<number | null>(null);
  const startRef = useRef<number | null>(null);

  useEffect(() => {
    if (typeof target !== 'number') return;

    const animate = (timestamp: number) => {
      if (!startRef.current) startRef.current = timestamp;
      const elapsed = timestamp - startRef.current;
      const progress = Math.min(elapsed / duration, 1);
      // ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setCurrent(Math.round(eased * target));
      if (progress < 1) {
        rafRef.current = requestAnimationFrame(animate);
      }
    };

    rafRef.current = requestAnimationFrame(animate);
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
  }, [target, duration]);

  return current;
}

export function StatCard({
  title,
  value,
  change,
  trend = 'neutral',
  icon: Icon,
  description,
  prefix = '',
  suffix = '',
  formatValue,
}: StatCardProps) {
  const numericValue = typeof value === 'number' ? value : parseFloat(String(value));
  const isNumeric = !isNaN(numericValue);
  const animated = useCountUp(isNumeric ? numericValue : 0);

  const displayValue = isNumeric
    ? formatValue
      ? formatValue(animated)
      : `${prefix}${animated.toLocaleString()}${suffix}`
    : String(value);

  const TrendIcon =
    trend === 'up' ? TrendingUp : trend === 'down' ? TrendingDown : Minus;

  const trendColor =
    trend === 'up'
      ? 'text-emerald-400'
      : trend === 'down'
      ? 'text-red-400'
      : 'text-gray-400';

  const trendBg =
    trend === 'up'
      ? 'bg-emerald-500/10'
      : trend === 'down'
      ? 'bg-red-500/10'
      : 'bg-gray-700/30';

  return (
    <div className="rounded-xl border border-gray-800 bg-gray-900 p-5 flex flex-col gap-4 hover:border-gray-700 transition-colors">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500/20 to-violet-500/20 border border-indigo-500/20">
          <Icon className="h-5 w-5 text-indigo-400" />
        </div>
        {change !== undefined && (
          <span
            className={cn(
              'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium',
              trendBg,
              trendColor
            )}
          >
            <TrendIcon className="h-3 w-3" />
            {Math.abs(change).toFixed(1)}%
          </span>
        )}
      </div>

      {/* Value */}
      <div>
        <p className="text-2xl font-bold text-white tabular-nums leading-tight">
          {displayValue}
        </p>
        <p className="mt-1 text-sm font-medium text-gray-400">{title}</p>
        {description && (
          <p className="mt-0.5 text-xs text-gray-500">{description}</p>
        )}
      </div>
    </div>
  );
}

import React from 'react';
import type { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  description?: string;
  trend?: {
    value: string;
    isPositive?: boolean;
  };
  accentColor?: 'indigo' | 'emerald' | 'amber' | 'violet' | 'cyan';
  isLoading?: boolean;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  icon: Icon,
  description,
  trend,
  accentColor = 'indigo',
  isLoading = false,
}) => {
  const accentClasses = {
    indigo: {
      bg: 'bg-indigo-500/10',
      text: 'text-indigo-400',
      border: 'hover:border-indigo-500/40',
      glow: 'group-hover:shadow-[0_0_20px_-3px_rgba(99,102,241,0.2)]',
      gradient: 'from-indigo-500/20 to-transparent',
    },
    emerald: {
      bg: 'bg-emerald-500/10',
      text: 'text-emerald-400',
      border: 'hover:border-emerald-500/40',
      glow: 'group-hover:shadow-[0_0_20px_-3px_rgba(16,185,129,0.2)]',
      gradient: 'from-emerald-500/20 to-transparent',
    },
    amber: {
      bg: 'bg-amber-500/10',
      text: 'text-amber-400',
      border: 'hover:border-amber-500/40',
      glow: 'group-hover:shadow-[0_0_20px_-3px_rgba(245,158,11,0.2)]',
      gradient: 'from-amber-500/20 to-transparent',
    },
    violet: {
      bg: 'bg-violet-500/10',
      text: 'text-violet-400',
      border: 'hover:border-violet-500/40',
      glow: 'group-hover:shadow-[0_0_20px_-3px_rgba(139,92,246,0.2)]',
      gradient: 'from-violet-500/20 to-transparent',
    },
    cyan: {
      bg: 'bg-cyan-500/10',
      text: 'text-cyan-400',
      border: 'hover:border-cyan-500/40',
      glow: 'group-hover:shadow-[0_0_20px_-3px_rgba(6,182,212,0.2)]',
      gradient: 'from-cyan-500/20 to-transparent',
    },
  }[accentColor];

  return (
    <div
      className={`group relative overflow-hidden rounded-xl border border-slate-800/80 bg-slate-900/60 p-5 backdrop-blur-md transition-all duration-300 ${accentClasses.border} ${accentClasses.glow}`}
    >
      {/* Decorative top-right gradient glow */}
      <div
        className={`pointer-events-none absolute -right-6 -top-6 h-24 w-24 rounded-full bg-gradient-to-br ${accentClasses.gradient} blur-xl`}
      />

      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">{title}</p>
        <div className={`rounded-lg p-2.5 ${accentClasses.bg} ${accentClasses.text}`}>
          <Icon className="h-5 w-5" />
        </div>
      </div>

      <div className="mt-4">
        {isLoading ? (
          <div className="h-9 w-28 animate-pulse rounded bg-slate-800" />
        ) : (
          <div className="text-2xl font-bold tracking-tight text-white lg:text-3xl font-mono">{value}</div>
        )}
      </div>

      {(description || trend) && (
        <div className="mt-2.5 flex items-center justify-between text-xs text-slate-400">
          {description && <span className="truncate">{description}</span>}
          {trend && (
            <span
              className={`inline-flex items-center font-medium ${
                trend.isPositive ? 'text-emerald-400' : 'text-slate-400'
              }`}
            >
              {trend.value}
            </span>
          )}
        </div>
      )}
    </div>
  );
};

export default StatCard;

import React from 'react';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ReactNode;
  badge?: string;
  variant?: 'blue' | 'rose' | 'amber' | 'emerald' | 'purple' | 'slate';
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  icon,
  badge,
  variant = 'blue',
}) => {
  const variantStyles = {
    blue: 'border-blue-500/20 bg-[#0f172a]/90 text-blue-400',
    rose: 'border-rose-500/30 bg-[#160f18]/90 text-rose-400',
    amber: 'border-amber-500/30 bg-[#19150d]/90 text-amber-400',
    emerald: 'border-emerald-500/30 bg-[#0d1815]/90 text-emerald-400',
    purple: 'border-purple-500/30 bg-[#161022]/90 text-purple-400',
    slate: 'border-slate-800 bg-[#0f172a]/90 text-slate-400',
  };

  return (
    <div className={`p-4 rounded-xl border ${variantStyles[variant]} shadow-sm relative overflow-hidden transition-all duration-200 hover:border-slate-700`}>
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">{title}</span>
        <div className="p-2 rounded-lg bg-slate-900/80 border border-slate-800 text-slate-300">
          {icon}
        </div>
      </div>
      <div className="mt-2 flex items-baseline justify-between">
        <span className="text-2xl font-bold font-mono text-slate-100 tracking-tight">{value}</span>
        {badge && (
          <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
            {badge}
          </span>
        )}
      </div>
      {subtitle && <p className="mt-1 text-xs text-slate-400 truncate">{subtitle}</p>}
    </div>
  );
};

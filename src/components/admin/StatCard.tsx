import React from 'react';

interface StatCardProps {
  title: string;
  value: number;
  subtitle: string;
  icon: React.ReactNode;
  badge?: string;
  badgeColor?: 'emerald' | 'amber' | 'red' | 'slate';
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  icon,
  badge,
  badgeColor = 'slate',
}) => {
  const badgeColors = {
    emerald: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    amber: 'bg-amber-50 text-amber-700 border-amber-200',
    red: 'bg-red-50 text-red-700 border-red-200',
    slate: 'bg-slate-100 text-slate-700 border-slate-200',
  };

  return (
    <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200/80 hover:shadow-md transition-shadow relative overflow-hidden flex flex-col justify-between">
      <div className="flex items-start justify-between">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
            {title}
          </span>
          <div className="text-3xl font-black text-slate-900 mt-2 tracking-tight">
            {value}
          </div>
        </div>
        <div className="p-3 bg-red-50 text-red-700 rounded-2xl border border-red-100">
          {icon}
        </div>
      </div>

      <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
        <span className="text-slate-500">{subtitle}</span>
        {badge && (
          <span className={`px-2 py-0.5 rounded-md font-bold text-[10px] border ${badgeColors[badgeColor]}`}>
            {badge}
          </span>
        )}
      </div>
    </div>
  );
};

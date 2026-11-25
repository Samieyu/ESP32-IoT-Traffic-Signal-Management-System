import React from 'react';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  variant?: 'blue' | 'green' | 'amber' | 'red' | 'navy';
  className?: string;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  icon: Icon,
  variant = 'blue',
  className = '',
}) => {
  const variantStyles = {
    blue: 'border-l-4 border-l-blue-500 bg-white text-slate-800',
    green: 'border-l-4 border-l-emerald-500 bg-white text-slate-800',
    amber: 'border-l-4 border-l-amber-500 bg-white text-slate-800',
    red: 'border-l-4 border-l-rose-500 bg-white text-slate-800',
    navy: 'border-l-4 border-l-slate-800 bg-white text-slate-800',
  };

  const iconBgStyles = {
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-emerald-50 text-emerald-600',
    amber: 'bg-amber-50 text-amber-600',
    red: 'bg-rose-50 text-rose-600',
    navy: 'bg-slate-100 text-slate-700',
  };

  return (
    <div
      className={`rounded-xl p-5 shadow-sm border border-slate-200/80 transition-all hover:shadow-md ${variantStyles[variant]} ${className}`}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold tracking-wider uppercase text-slate-500 mb-1">{title}</p>
          <h3 className="text-2xl font-bold text-slate-900 tracking-tight">{value}</h3>
          {subtitle && <p className="text-xs text-slate-500 mt-1">{subtitle}</p>}
        </div>
        <div className={`p-3 rounded-lg ${iconBgStyles[variant]}`}>
          <Icon className="w-6 h-6" />
        </div>
      </div>
    </div>
  );
};

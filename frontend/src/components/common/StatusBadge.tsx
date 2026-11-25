import React from 'react';
import { CheckCircle, AlertTriangle, XCircle, Info, Clock, ShieldAlert } from 'lucide-react';

interface StatusBadgeProps {
  status: string;
  type?: 'signal' | 'connection' | 'severity' | 'account' | 'emergency';
  className?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, type, className = '' }) => {
  const normalized = status.toUpperCase();

  let bg = 'bg-slate-100 text-slate-700 border-slate-300';
  let icon = <Info className="w-3.5 h-3.5 mr-1" />;

  // Traffic Signal States
  if (normalized === 'GREEN') {
    bg = 'bg-emerald-100 text-emerald-800 border-emerald-300';
    icon = <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 mr-1.5 inline-block shadow-sm" />;
  } else if (normalized === 'YELLOW') {
    bg = 'bg-amber-100 text-amber-800 border-amber-300';
    icon = <span className="w-2.5 h-2.5 rounded-full bg-amber-500 mr-1.5 inline-block shadow-sm" />;
  } else if (normalized === 'RED') {
    bg = 'bg-rose-100 text-rose-800 border-rose-300';
    icon = <span className="w-2.5 h-2.5 rounded-full bg-rose-500 mr-1.5 inline-block shadow-sm" />;
  }
  // Connection States
  else if (normalized === 'ONLINE') {
    bg = 'bg-emerald-50 text-emerald-700 border-emerald-200';
    icon = <CheckCircle className="w-3.5 h-3.5 mr-1 text-emerald-600" />;
  } else if (normalized === 'OFFLINE') {
    bg = 'bg-rose-50 text-rose-700 border-rose-200';
    icon = <XCircle className="w-3.5 h-3.5 mr-1 text-rose-600" />;
  }
  // Account & General Status
  else if (normalized === 'ACTIVE') {
    bg = 'bg-emerald-50 text-emerald-700 border-emerald-200';
    icon = <CheckCircle className="w-3.5 h-3.5 mr-1 text-emerald-600" />;
  } else if (normalized === 'INACTIVE') {
    bg = 'bg-slate-100 text-slate-600 border-slate-200';
    icon = <Clock className="w-3.5 h-3.5 mr-1 text-slate-500" />;
  }
  // Severity
  else if (normalized === 'CRITICAL') {
    bg = 'bg-rose-100 text-rose-800 border-rose-300 font-semibold';
    icon = <ShieldAlert className="w-3.5 h-3.5 mr-1 text-rose-600" />;
  } else if (normalized === 'HIGH') {
    bg = 'bg-orange-100 text-orange-800 border-orange-300';
    icon = <AlertTriangle className="w-3.5 h-3.5 mr-1 text-orange-600" />;
  } else if (normalized === 'MEDIUM') {
    bg = 'bg-amber-100 text-amber-800 border-amber-300';
    icon = <Info className="w-3.5 h-3.5 mr-1 text-amber-600" />;
  } else if (normalized === 'LOW') {
    bg = 'bg-blue-50 text-blue-700 border-blue-200';
    icon = <Info className="w-3.5 h-3.5 mr-1 text-blue-500" />;
  }
  // Emergency Status
  else if (normalized === 'ACTIVE_EMERGENCY' || (type === 'emergency' && normalized === 'ACTIVE')) {
    bg = 'bg-rose-600 text-white border-rose-700 animate-pulse font-bold';
    icon = <ShieldAlert className="w-3.5 h-3.5 mr-1 text-white" />;
  } else if (normalized === 'COMPLETED') {
    bg = 'bg-emerald-50 text-emerald-700 border-emerald-200';
    icon = <CheckCircle className="w-3.5 h-3.5 mr-1 text-emerald-600" />;
  } else if (normalized === 'AUTO_TERMINATED') {
    bg = 'bg-amber-100 text-amber-800 border-amber-300';
    icon = <Clock className="w-3.5 h-3.5 mr-1 text-amber-600" />;
  }

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${bg} ${className}`}
    >
      {icon}
      <span>{normalized.replace(/_/g, ' ')}</span>
    </span>
  );
};

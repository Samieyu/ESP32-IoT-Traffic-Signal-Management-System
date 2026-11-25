import React from 'react';
import { Clock } from 'lucide-react';

interface CountdownDisplayProps {
  seconds: number;
  label?: string;
  phase?: string;
  isEmergency?: boolean;
  className?: string;
}

export const CountdownDisplay: React.FC<CountdownDisplayProps> = ({
  seconds,
  label = 'Signal Countdown',
  phase,
  isEmergency = false,
  className = '',
}) => {
  return (
    <div
      className={`flex items-center justify-between p-4 rounded-xl border ${
        isEmergency
          ? 'bg-rose-50 border-rose-300 text-rose-900'
          : 'bg-white border-slate-200 text-slate-800'
      } shadow-sm ${className}`}
    >
      <div className="flex items-center space-x-3">
        <div
          className={`p-2.5 rounded-lg ${
            isEmergency ? 'bg-rose-100 text-rose-700' : 'bg-slate-100 text-slate-700'
          }`}
        >
          <Clock className="w-5 h-5" />
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">{label}</p>
          {phase && (
            <p className="text-xs text-slate-600 font-medium capitalize mt-0.5">
              {phase.replace(/_/g, ' ').toLowerCase()}
            </p>
          )}
        </div>
      </div>

      <div className="text-right">
        <span
          className={`font-mono font-black text-3xl tracking-tight ${
            isEmergency ? 'text-rose-600 animate-pulse' : 'text-slate-900'
          }`}
        >
          {String(seconds).padStart(2, '0')}s
        </span>
      </div>
    </div>
  );
};

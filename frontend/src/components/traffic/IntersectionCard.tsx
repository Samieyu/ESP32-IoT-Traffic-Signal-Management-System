import React from 'react';
import { Intersection } from '../../types/index.js';
import { StatusBadge } from '../common/StatusBadge.js';
import { ConnectionStatus } from './ConnectionStatus.js';
import { Activity, ShieldAlert, Settings, FileText, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';

interface IntersectionCardProps {
  intersection: Intersection;
  userRole?: 'ADMIN' | 'TRAFFIC_POLICE';
}

export const IntersectionCard: React.FC<IntersectionCardProps> = ({
  intersection,
  userRole = 'ADMIN',
}) => {
  const isOnline = intersection.controller?.connectionStatus === 'ONLINE';
  const live = intersection.liveStatus;

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-all overflow-hidden flex flex-col justify-between">
      {/* Header */}
      <div className="p-5 border-b border-slate-100">
        <div className="flex items-start justify-between gap-2">
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-mono text-xs font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                {intersection.code}
              </span>
              <StatusBadge status={intersection.status} />
            </div>
            <h3 className="font-bold text-slate-900 text-base mt-2 line-clamp-1">
              {intersection.name}
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              {intersection.city}, {intersection.region}
            </p>
          </div>

          <ConnectionStatus
            status={intersection.controller?.connectionStatus || 'OFFLINE'}
            deviceId={intersection.controller?.deviceId}
          />
        </div>
      </div>

      {/* Live Mini State Display */}
      <div className="px-5 py-4 bg-slate-50/60 flex items-center justify-between border-b border-slate-100">
        <div className="flex items-center space-x-4 text-xs">
          <div>
            <span className="text-slate-500 block text-[10px] uppercase font-semibold">N-S Approach</span>
            <div className="flex items-center space-x-1.5 mt-0.5">
              <span
                className={`w-2.5 h-2.5 rounded-full ${
                  live?.northSignal === 'GREEN'
                    ? 'bg-emerald-500 ring-2 ring-emerald-200'
                    : live?.northSignal === 'YELLOW'
                    ? 'bg-amber-400 ring-2 ring-amber-200'
                    : 'bg-rose-500'
                }`}
              />
              <span className="font-bold text-slate-800">{live?.northSignal || 'RED'}</span>
            </div>
          </div>

          <div className="h-6 w-px bg-slate-200" />

          <div>
            <span className="text-slate-500 block text-[10px] uppercase font-semibold">E-W Approach</span>
            <div className="flex items-center space-x-1.5 mt-0.5">
              <span
                className={`w-2.5 h-2.5 rounded-full ${
                  live?.eastSignal === 'GREEN'
                    ? 'bg-emerald-500 ring-2 ring-emerald-200'
                    : live?.eastSignal === 'YELLOW'
                    ? 'bg-amber-400 ring-2 ring-amber-200'
                    : 'bg-rose-500'
                }`}
              />
              <span className="font-bold text-slate-800">{live?.eastSignal || 'RED'}</span>
            </div>
          </div>
        </div>

        <div className="text-right">
          <span className="text-[10px] text-slate-400 uppercase font-semibold block">Remaining</span>
          <span className="font-mono font-black text-lg text-slate-900">
            {isOnline ? `${live?.countdownRemaining || 0}s` : '--'}
          </span>
        </div>
      </div>

      {/* Card Actions */}
      <div className="p-4 bg-white flex items-center justify-between gap-2 text-xs">
        <div className="flex items-center space-x-1">
          <Link
            to={userRole === 'ADMIN' ? `/admin/monitoring` : `/police/monitoring`}
            className="p-2 rounded-lg text-slate-600 hover:text-blue-600 hover:bg-blue-50 transition-colors"
            title="Live Monitor"
          >
            <Activity className="w-4 h-4" />
          </Link>

          {userRole === 'ADMIN' && (
            <Link
              to={`/admin/signal-configuration?intersectionId=${intersection.id}`}
              className="p-2 rounded-lg text-slate-600 hover:text-blue-600 hover:bg-blue-50 transition-colors"
              title="Configure Timings"
            >
              <Settings className="w-4 h-4" />
            </Link>
          )}

          <Link
            to={userRole === 'ADMIN' ? `/admin/emergency-history` : `/police/emergency-priority?intersectionId=${intersection.id}`}
            className="p-2 rounded-lg text-slate-600 hover:text-rose-600 hover:bg-rose-50 transition-colors"
            title="Emergency Priority"
          >
            <ShieldAlert className="w-4 h-4" />
          </Link>
        </div>

        <Link
          to={userRole === 'ADMIN' ? `/admin/intersections/${intersection.id}` : `/police/monitoring`}
          className="inline-flex items-center font-semibold text-blue-600 hover:text-blue-700 transition-colors"
        >
          <span>View Details</span>
          <ChevronRight className="w-3.5 h-3.5 ml-0.5" />
        </Link>
      </div>
    </div>
  );
};

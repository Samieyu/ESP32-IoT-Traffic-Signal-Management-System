import React from 'react';
import { TrafficStatus, SignalColor } from '../../types/index.js';
import { StatusBadge } from '../common/StatusBadge.js';
import { ShieldAlert, Cpu } from 'lucide-react';

interface TrafficSignalDisplayProps {
  status?: TrafficStatus | null;
  intersectionName?: string;
  intersectionCode?: string;
  isOffline?: boolean;
}

const SignalLightHousing: React.FC<{
  direction: 'North' | 'South' | 'East' | 'West';
  activeColor: SignalColor;
}> = ({ direction, activeColor }) => {
  return (
    <div className="flex flex-col items-center bg-slate-900 border-2 border-slate-700/80 rounded-2xl p-3 shadow-xl w-24">
      <span className="text-[11px] font-bold text-slate-300 uppercase tracking-widest mb-2">
        {direction}
      </span>
      <div className="flex flex-col space-y-2 bg-black/60 p-2 rounded-xl border border-slate-800">
        {/* Red light */}
        <div
          className={`w-7 h-7 rounded-full border border-black/40 transition-all duration-300 ${
            activeColor === 'RED'
              ? 'bg-red-500 signal-active-red shadow-lg shadow-red-500/50'
              : 'bg-red-950/40 opacity-40'
          }`}
        />
        {/* Yellow light */}
        <div
          className={`w-7 h-7 rounded-full border border-black/40 transition-all duration-300 ${
            activeColor === 'YELLOW'
              ? 'bg-amber-400 signal-active-yellow shadow-lg shadow-amber-400/50'
              : 'bg-amber-950/40 opacity-40'
          }`}
        />
        {/* Green light */}
        <div
          className={`w-7 h-7 rounded-full border border-black/40 transition-all duration-300 ${
            activeColor === 'GREEN'
              ? 'bg-emerald-500 signal-active-green shadow-lg shadow-emerald-500/50'
              : 'bg-emerald-950/40 opacity-40'
          }`}
        />
      </div>
      <span className="mt-2 text-[10px] font-mono font-semibold text-slate-400">
        {activeColor}
      </span>
    </div>
  );
};

export const TrafficSignalDisplay: React.FC<TrafficSignalDisplayProps> = ({
  status,
  intersectionName,
  intersectionCode,
  isOffline,
}) => {
  const northSignal = isOffline ? 'RED' : status?.northSignal || 'RED';
  const southSignal = isOffline ? 'RED' : status?.southSignal || 'RED';
  const eastSignal = isOffline ? 'RED' : status?.eastSignal || 'RED';
  const westSignal = isOffline ? 'RED' : status?.westSignal || 'RED';

  return (
    <div className="bg-slate-900 text-white rounded-2xl p-6 shadow-md border border-slate-800 relative overflow-hidden">
      {/* Simulation / Emergency Banner */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6 border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center space-x-2">
            <h3 className="font-bold text-lg text-white">
              {intersectionName || 'Traffic Signal Controller'}
            </h3>
            {intersectionCode && (
              <span className="text-xs bg-slate-800 px-2 py-0.5 rounded text-blue-400 font-mono">
                {intersectionCode}
              </span>
            )}
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Phase: <span className="text-slate-200 font-semibold">{status?.operatingPhase?.replace(/_/g, ' ') || 'STANDBY'}</span>
          </p>
        </div>

        <div className="flex items-center space-x-2">
          {status?.isEmergencyActive && (
            <div className="flex items-center space-x-1.5 bg-rose-900/80 border border-rose-600 text-rose-200 text-xs px-3 py-1 rounded-full font-bold animate-pulse">
              <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
              <span>EMERGENCY PREEMPTION ACTIVE</span>
            </div>
          )}

          {status?.isSimulated && (
            <div className="flex items-center space-x-1 bg-amber-950/80 border border-amber-700/60 text-amber-300 text-xs px-2.5 py-1 rounded-full font-medium">
              <Cpu className="w-3.5 h-3.5 text-amber-400" />
              <span>ESP32 Twin Simulator</span>
            </div>
          )}

          <StatusBadge status={isOffline ? 'OFFLINE' : status?.operatingMode || 'NORMAL'} />
        </div>
      </div>

      {/* 4-Way Traffic Junction Layout */}
      <div className="relative py-4 flex flex-col items-center justify-center">
        {/* North */}
        <div className="mb-4">
          <SignalLightHousing direction="North" activeColor={northSignal} />
        </div>

        {/* East & West & Center Crossroad */}
        <div className="flex items-center justify-center space-x-8 w-full max-w-lg">
          {/* West */}
          <div>
            <SignalLightHousing direction="West" activeColor={westSignal} />
          </div>

          {/* Central Intersection Core & Digital Countdown */}
          <div className="flex flex-col items-center justify-center w-36 h-36 bg-slate-800/90 rounded-2xl border-2 border-slate-700 shadow-inner p-3 text-center">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-0.5">
              CLEARANCE SEC
            </span>
            <span className="text-4xl font-mono font-black text-amber-400 tracking-tight">
              {isOffline ? '--' : status?.countdownRemaining ?? 0}
            </span>
            <span className="text-[11px] font-medium text-slate-300 mt-1">
              {isOffline ? 'CONTROLLER OFFLINE' : status?.operatingMode === 'EMERGENCY_PREEMPTION' ? 'PRIORITY HOLD' : 'COUNTDOWN'}
            </span>
          </div>

          {/* East */}
          <div>
            <SignalLightHousing direction="East" activeColor={eastSignal} />
          </div>
        </div>

        {/* South */}
        <div className="mt-4">
          <SignalLightHousing direction="South" activeColor={southSignal} />
        </div>
      </div>

      {/* Footer Timestamp */}
      <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
        <span>Device ID: <strong className="text-slate-300">{status?.deviceId || 'UNKNOWN'}</strong></span>
        <span>
          Last Updated: {status?.recordedAt ? new Date(status.recordedAt).toLocaleTimeString() : 'N/A'}
        </span>
      </div>
    </div>
  );
};

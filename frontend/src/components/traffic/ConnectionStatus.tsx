import React from 'react';
import { Wifi, WifiOff, Clock } from 'lucide-react';
import { ConnectionStatus as ConnStatusType } from '../../types/index.js';

interface ConnectionStatusProps {
  status: ConnStatusType;
  lastHeartbeatAt?: string | null;
  deviceId?: string;
  className?: string;
}

export const ConnectionStatus: React.FC<ConnectionStatusProps> = ({
  status,
  lastHeartbeatAt,
  deviceId,
  className = '',
}) => {
  const isOnline = status === 'ONLINE';

  return (
    <div
      className={`inline-flex items-center space-x-2 px-3 py-1.5 rounded-lg border text-xs font-medium ${
        isOnline
          ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
          : 'bg-rose-50 text-rose-800 border-rose-200'
      } ${className}`}
    >
      {isOnline ? (
        <Wifi className="w-3.5 h-3.5 text-emerald-600" />
      ) : (
        <WifiOff className="w-3.5 h-3.5 text-rose-600" />
      )}
      <span>{isOnline ? 'ESP32 ONLINE' : 'ESP32 OFFLINE'}</span>

      {deviceId && <span className="font-mono text-slate-500">({deviceId})</span>}

      {lastHeartbeatAt && (
        <span className="flex items-center text-slate-400 pl-1 border-l border-slate-200">
          <Clock className="w-3 h-3 mr-0.5" />
          {new Date(lastHeartbeatAt).toLocaleTimeString()}
        </span>
      )}
    </div>
  );
};

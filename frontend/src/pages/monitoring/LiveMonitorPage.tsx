import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../api/client.js';
import { Intersection, TrafficStatus } from '../../types/index.js';
import { useSocket } from '../../context/SocketContext.js';
import { useAuth } from '../../context/AuthContext.js';
import { PageHeader } from '../../components/common/PageHeader.js';
import { TrafficSignalDisplay } from '../../components/traffic/TrafficSignalDisplay.js';
import { CountdownDisplay } from '../../components/traffic/CountdownDisplay.js';
import { ConnectionStatus } from '../../components/traffic/ConnectionStatus.js';
import { StatusBadge } from '../../components/common/StatusBadge.js';
import { LoadingSkeleton } from '../../components/common/LoadingSkeleton.js';
import { ErrorState } from '../../components/common/ErrorState.js';
import { Activity, ShieldAlert, Cpu, MapPin, RefreshCw } from 'lucide-react';
import { Link } from 'react-router-dom';

export const LiveMonitorPage: React.FC = () => {
  const { user } = useAuth();
  const { socket, joinIntersection, leaveIntersection } = useSocket();
  const [selectedId, setSelectedId] = useState<string>('');
  const [liveStatus, setLiveStatus] = useState<TrafficStatus | null>(null);

  // Fetch authorized intersections
  const {
    data: interData,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['monitoringIntersections'],
    queryFn: () => api.get<{ success: boolean; data: Intersection[] }>('/monitoring/intersections'),
  });

  const intersections = interData?.data || [];

  // Default selection
  useEffect(() => {
    if (intersections.length > 0 && !selectedId) {
      setSelectedId(intersections[0].id);
    }
  }, [intersections, selectedId]);

  // Join room & listen for live Socket.IO events
  useEffect(() => {
    if (!selectedId) return;

    joinIntersection(selectedId);

    // Initial status from current intersection data
    const current = intersections.find((i) => i.id === selectedId);
    if (current?.liveStatus) {
      setLiveStatus(current.liveStatus);
    }

    if (socket) {
      const handleTrafficUpdate = (status: TrafficStatus) => {
        if (status.intersectionId === selectedId) {
          setLiveStatus(status);
        }
      };

      socket.on('traffic_status_update', handleTrafficUpdate);

      return () => {
        socket.off('traffic_status_update', handleTrafficUpdate);
        leaveIntersection(selectedId);
      };
    }
  }, [selectedId, socket, joinIntersection, leaveIntersection, intersections]);

  if (isLoading) return <LoadingSkeleton rows={6} className="py-8" />;
  if (error) return <ErrorState message="Could not connect to live monitoring feed." onRetry={refetch} />;

  const currentIntersection = intersections.find((i) => i.id === selectedId) || intersections[0];
  const isOffline = currentIntersection?.controller?.connectionStatus === 'OFFLINE';

  return (
    <div className="space-y-6">
      <PageHeader
        title="Live Intersection Telemetry & Signal Monitoring"
        subtitle={
          user?.role === 'ADMIN'
            ? 'Central control room monitoring for all registered urban intersections.'
            : 'Field monitoring restricted to your authorized intersection patrol assignments.'
        }
        action={
          <button
            onClick={() => refetch()}
            className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-50 shadow-sm"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Refresh Feed</span>
          </button>
        }
      />

      {/* Intersection Selection Grid Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <Activity className="w-5 h-5 text-emerald-600 animate-pulse" />
          <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
            Active Junction:
          </span>
          <select
            value={selectedId}
            onChange={(e) => setSelectedId(e.target.value)}
            className="text-xs font-bold bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          >
            {intersections.map((inter) => (
              <option key={inter.id} value={inter.id}>
                {inter.code} — {inter.name}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center space-x-3 text-xs">
          <ConnectionStatus
            status={currentIntersection?.controller?.connectionStatus || 'OFFLINE'}
            lastHeartbeatAt={currentIntersection?.controller?.lastHeartbeatAt}
            deviceId={currentIntersection?.controller?.deviceId}
          />

          <StatusBadge status={currentIntersection?.status || 'ACTIVE'} />
        </div>
      </div>

      {/* Main Signal Display and Telemetry Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Visual 4-Way Traffic Signal Housing Display */}
        <div className="lg:col-span-8">
          <TrafficSignalDisplay
            status={liveStatus}
            intersectionName={currentIntersection?.name}
            intersectionCode={currentIntersection?.code}
            isOffline={isOffline}
          />
        </div>

        {/* Live Controller Telemetry & Quick Action Cards */}
        <div className="lg:col-span-4 space-y-4">
          {/* Large Digital Countdown Display */}
          <CountdownDisplay
            seconds={isOffline ? 0 : liveStatus?.countdownRemaining || 0}
            phase={liveStatus?.operatingPhase}
            isEmergency={liveStatus?.isEmergencyActive}
          />

          {/* Operating Mode Card */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Controller Operating State
            </h3>

            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-500">Active Mode:</span>
              <StatusBadge status={isOffline ? 'OFFLINE' : liveStatus?.operatingMode || 'NORMAL'} />
            </div>

            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-500">Current Phase:</span>
              <span className="font-semibold text-slate-800">
                {liveStatus?.operatingPhase?.replace(/_/g, ' ') || 'STANDBY'}
              </span>
            </div>

            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-500">Emergency Override:</span>
              <span
                className={`font-bold ${
                  liveStatus?.isEmergencyActive ? 'text-rose-600 animate-pulse' : 'text-slate-500'
                }`}
              >
                {liveStatus?.isEmergencyActive ? 'ENGAGED' : 'INACTIVE'}
              </span>
            </div>

            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-500">Controller Uptime:</span>
              <span className="font-mono text-slate-700">
                {liveStatus?.uptimeSeconds ? `${Math.floor(liveStatus.uptimeSeconds / 60)} mins` : 'N/A'}
              </span>
            </div>
          </div>

          {/* Emergency Priority Trigger Button */}
          <div className="bg-slate-900 text-white p-5 rounded-2xl border border-slate-800 shadow-md">
            <div className="flex items-center space-x-2 mb-2 text-rose-400">
              <ShieldAlert className="w-5 h-5" />
              <h4 className="text-xs font-bold uppercase tracking-wider text-white">
                Emergency Vehicle Priority
              </h4>
            </div>
            <p className="text-xs text-slate-400 mb-4 leading-relaxed">
              Traffic Police officers can request emergency preemption for approaching ambulances or firefighting vehicles.
            </p>
            <Link
              to={
                user?.role === 'ADMIN'
                  ? `/admin/emergency-history`
                  : `/police/emergency-priority?intersectionId=${currentIntersection?.id}`
              }
              className="w-full inline-flex items-center justify-center space-x-2 py-2.5 px-4 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-colors shadow-md shadow-rose-600/30"
            >
              <ShieldAlert className="w-4 h-4" />
              <span>
                {user?.role === 'ADMIN' ? 'View Emergency Log' : 'Initiate Emergency Priority'}
              </span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

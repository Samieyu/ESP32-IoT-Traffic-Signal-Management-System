import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../api/client.js';
import { PageHeader } from '../../components/common/PageHeader.js';
import { StatusBadge } from '../../components/common/StatusBadge.js';
import { ConnectionStatus } from '../../components/traffic/ConnectionStatus.js';
import { TrafficSignalDisplay } from '../../components/traffic/TrafficSignalDisplay.js';
import { IntersectionMapView } from '../../components/traffic/IntersectionMapView.js';
import { LoadingSkeleton } from '../../components/common/LoadingSkeleton.js';
import { ErrorState } from '../../components/common/ErrorState.js';
import {
  ArrowLeft,
  Settings,
  Activity,
  Users,
  AlertTriangle,
  FileWarning,
  ShieldAlert,
  History,
  Info,
  Sliders,
  MapPin,
  Clock,
} from 'lucide-react';

export const IntersectionDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [activeTab, setActiveTab] = useState<
    'overview' | 'live' | 'config' | 'officers' | 'incidents' | 'problems' | 'emergency' | 'logs'
  >('overview');

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['intersectionDetails', id],
    queryFn: () => api.get<{ success: boolean; data: any }>(`/intersections/${id}`),
  });

  if (isLoading) return <LoadingSkeleton rows={6} className="py-8" />;
  if (error || !data?.data) return <ErrorState message="Intersection details could not be loaded." onRetry={refetch} />;

  const item = data.data;
  const overview = item.overview;
  const controller = item.controller;
  const live = item.liveStatus;
  const config = item.activeConfiguration;
  const officers = item.assignedOfficers || [];
  const incidents = item.recentIncidents || [];
  const problems = item.recentProblems || [];
  const emergencyHistory = item.emergencyHistory || [];
  const activityLogs = item.activityLogs || [];

  const tabs = [
    { id: 'overview', label: 'Overview', icon: Info },
    { id: 'live', label: 'Live Traffic', icon: Activity },
    { id: 'config', label: 'Signal Config', icon: Sliders },
    { id: 'officers', label: `Officers (${officers.length})`, icon: Users },
    { id: 'incidents', label: `Incidents (${incidents.length})`, icon: AlertTriangle },
    { id: 'problems', label: `Problems (${problems.length})`, icon: FileWarning },
    { id: 'emergency', label: `Emergency (${emergencyHistory.length})`, icon: ShieldAlert },
    { id: 'logs', label: 'Activity Logs', icon: History },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title={overview.name}
        subtitle={`${overview.city}, ${overview.region} • ${overview.code}`}
        breadcrumbs={[
          { label: 'Intersections', href: '/admin/intersections' },
          { label: overview.code },
        ]}
        action={
          <div className="flex items-center space-x-2">
            <Link
              to={`/admin/signal-configuration?intersectionId=${overview.id}`}
              className="inline-flex items-center space-x-1.5 px-3.5 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold hover:bg-blue-700 transition-colors shadow-sm"
            >
              <Settings className="w-3.5 h-3.5" />
              <span>Configure Timings</span>
            </Link>

            <Link
              to="/admin/intersections"
              className="inline-flex items-center space-x-1.5 px-3.5 py-2 border border-slate-300 bg-white rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back</span>
            </Link>
          </div>
        }
      />

      {/* Top Header Card */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center space-x-4">
          <div className="p-3 bg-slate-900 text-white rounded-xl font-mono text-sm font-bold">
            {overview.code}
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-lg font-bold text-slate-900">{overview.name}</h2>
              <StatusBadge status={overview.status} />
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Lat: {Number(overview.latitude).toFixed(4)}°, Lng: {Number(overview.longitude).toFixed(4)}° • {overview.approachesCount} Approaches
            </p>
          </div>
        </div>

        <ConnectionStatus
          status={controller?.connectionStatus || 'OFFLINE'}
          lastHeartbeatAt={controller?.lastHeartbeatAt}
          deviceId={controller?.deviceId}
        />
      </div>

      {/* Tabs Bar */}
      <div className="border-b border-slate-200 bg-white px-3 rounded-xl shadow-sm flex space-x-1 overflow-x-auto">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex items-center space-x-2 py-3 px-3.5 border-b-2 text-xs font-bold transition-all whitespace-nowrap ${
              activeTab === tab.id
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Tab 1: Overview */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-6 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <h3 className="font-bold text-slate-900 text-sm border-b border-slate-100 pb-2">
              Asset & Location Information
            </h3>
            <div className="space-y-3 text-xs text-slate-700">
              <div className="flex justify-between">
                <span className="text-slate-400">Intersection Code:</span>
                <span className="font-mono font-bold">{overview.code}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Region & City:</span>
                <span className="font-semibold">{overview.city}, {overview.region}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Approaches:</span>
                <span>{overview.approachesCount} Way Junction</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Registered Controller:</span>
                <span className="font-mono">{controller?.deviceId || 'None'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Controller Firmware:</span>
                <span>{controller?.firmwareVersion || '1.0.0'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Registration Date:</span>
                <span>{new Date(overview.createdAt).toLocaleDateString()}</span>
              </div>
              <div className="pt-2 border-t border-slate-100">
                <span className="text-slate-400 block mb-1">Description:</span>
                <p className="text-slate-600 leading-relaxed bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                  {overview.description || 'No operational description logged.'}
                </p>
              </div>
            </div>
          </div>

          <div className="lg:col-span-6">
            <IntersectionMapView intersections={[overview]} className="h-full min-h-[320px]" />
          </div>
        </div>
      )}

      {/* Tab 2: Live Traffic */}
      {activeTab === 'live' && (
        <div className="max-w-2xl mx-auto">
          <TrafficSignalDisplay
            status={live}
            intersectionName={overview.name}
            intersectionCode={overview.code}
            isOffline={controller?.connectionStatus === 'OFFLINE'}
          />
        </div>
      )}

      {/* Tab 3: Signal Configuration */}
      {activeTab === 'config' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-3">
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Active Traffic Signal Configuration (v{config?.version || 1})</h3>
              <p className="text-xs text-slate-500">Timing parameters verified and applied on ESP32 controller</p>
            </div>
            <Link
              to={`/admin/signal-configuration?intersectionId=${overview.id}`}
              className="px-3.5 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-bold hover:bg-blue-700"
            >
              Modify Timings
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <span className="text-slate-500 block text-[11px] uppercase font-bold">North-South Green</span>
              <span className="text-xl font-bold text-slate-900 mt-1 block">{config?.northSouthGreenDuration || 30}s</span>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <span className="text-slate-500 block text-[11px] uppercase font-bold">East-West Green</span>
              <span className="text-xl font-bold text-slate-900 mt-1 block">{config?.eastWestGreenDuration || 30}s</span>
            </div>
            <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-amber-900">
              <span className="text-amber-700 block text-[11px] uppercase font-bold">Yellow Clearance</span>
              <span className="text-xl font-bold text-amber-900 mt-1 block">{config?.yellowDuration || 4}s</span>
            </div>
            <div className="p-3 bg-rose-50 rounded-xl border border-rose-200 text-rose-900">
              <span className="text-rose-700 block text-[11px] uppercase font-bold">All-Red Deadzone</span>
              <span className="text-xl font-bold text-rose-900 mt-1 block">{config?.allRedClearanceDuration || 2}s</span>
            </div>
          </div>
        </div>
      )}

      {/* Tab 4: Assigned Officers */}
      {activeTab === 'officers' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <h3 className="font-bold text-slate-900 text-sm mb-4">Assigned Traffic Police Officers</h3>
          {officers.length > 0 ? (
            <div className="divide-y divide-slate-100 text-xs">
              {officers.map((off: any) => (
                <div key={off.id} className="py-3 flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 font-bold flex items-center justify-center">
                      {off.fullName.charAt(0)}
                    </div>
                    <div>
                      <span className="font-bold text-slate-900 block">{off.fullName}</span>
                      <span className="text-slate-400 font-mono">@{off.username}</span>
                    </div>
                  </div>
                  <span className="text-slate-500">Assigned: {new Date(off.assignedAt).toLocaleDateString()}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-slate-400 italic py-6 text-center">No officers currently assigned to this intersection.</p>
          )}
        </div>
      )}

      {/* Tab 5: Incidents */}
      {activeTab === 'incidents' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <h3 className="font-bold text-slate-900 text-sm mb-4">Recent Traffic Incidents</h3>
          {incidents.length > 0 ? (
            <div className="divide-y divide-slate-100 text-xs">
              {incidents.map((inc: any) => (
                <div key={inc.id} className="py-3 flex items-start justify-between">
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="font-mono font-bold text-blue-600">{inc.referenceId}</span>
                      <StatusBadge status={inc.severity} />
                      <StatusBadge status={inc.status} />
                    </div>
                    <p className="text-slate-800 font-medium mt-1">{inc.description}</p>
                    <span className="text-slate-400 text-[11px] block mt-0.5">
                      {new Date(inc.incidentTimestamp).toLocaleString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-slate-400 italic py-6 text-center">No incident records at this location.</p>
          )}
        </div>
      )}

      {/* Tab 6: Problems */}
      {activeTab === 'problems' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <h3 className="font-bold text-slate-900 text-sm mb-4">Reported Traffic Problems & Violations</h3>
          {problems.length > 0 ? (
            <div className="divide-y divide-slate-100 text-xs">
              {problems.map((prb: any) => (
                <div key={prb.id} className="py-3 flex items-start justify-between">
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="font-mono font-bold text-amber-600">{prb.referenceId}</span>
                      <StatusBadge status={prb.category} />
                      <StatusBadge status={prb.urgency} />
                    </div>
                    <p className="text-slate-800 font-medium mt-1">{prb.problemType}: {prb.description}</p>
                    {prb.licensePlateNumber && (
                      <span className="text-slate-600 font-mono text-[11px] block mt-0.5">
                        Plate: {prb.licensePlateNumber}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-slate-400 italic py-6 text-center">No problem reports logged.</p>
          )}
        </div>
      )}

      {/* Tab 7: Emergency History */}
      {activeTab === 'emergency' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <h3 className="font-bold text-slate-900 text-sm mb-4">Emergency Priority Operation History</h3>
          {emergencyHistory.length > 0 ? (
            <div className="divide-y divide-slate-100 text-xs">
              {emergencyHistory.map((emg: any) => (
                <div key={emg.id} className="py-3 flex items-start justify-between">
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="font-mono font-bold text-rose-600">{emg.referenceId}</span>
                      <StatusBadge status={emg.status} type="emergency" />
                    </div>
                    <p className="text-slate-800 font-medium mt-1">
                      Preemption Direction: <strong>{emg.direction}</strong> ({emg.movement || 'STRAIGHT'}) • Requested duration: {emg.maxDurationSeconds}s
                    </p>
                    <span className="text-slate-400 text-[11px] block mt-0.5">
                      {new Date(emg.requestedAt).toLocaleString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-slate-400 italic py-6 text-center">No emergency interventions logged for this crossing.</p>
          )}
        </div>
      )}

      {/* Tab 8: Activity Logs */}
      {activeTab === 'logs' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <h3 className="font-bold text-slate-900 text-sm mb-4">Traceable Audit History</h3>
          {activityLogs.length > 0 ? (
            <div className="divide-y divide-slate-100 text-xs">
              {activityLogs.map((log: any) => (
                <div key={log.id} className="py-2.5 flex items-center justify-between">
                  <span className="font-semibold text-slate-800">{log.action.replace(/_/g, ' ')}</span>
                  <span className="text-slate-400">{new Date(log.createdAt).toLocaleString()}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-slate-400 italic py-6 text-center">No audit logs found.</p>
          )}
        </div>
      )}
    </div>
  );
};

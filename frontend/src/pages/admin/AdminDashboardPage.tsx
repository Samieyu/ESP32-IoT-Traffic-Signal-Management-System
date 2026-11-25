import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../api/client.js';
import { DashboardStats, Intersection, TrafficIncident, TrafficProblemReport } from '../../types/index.js';
import { PageHeader } from '../../components/common/PageHeader.js';
import { StatCard } from '../../components/common/StatCard.js';
import { TrafficSignalDisplay } from '../../components/traffic/TrafficSignalDisplay.js';
import { IntersectionMapView } from '../../components/traffic/IntersectionMapView.js';
import { StatusBadge } from '../../components/common/StatusBadge.js';
import { LoadingSkeleton } from '../../components/common/LoadingSkeleton.js';
import { ErrorState } from '../../components/common/ErrorState.js';
import { useSocket } from '../../context/SocketContext.js';
import {
  MapPin,
  Users,
  Wifi,
  WifiOff,
  ShieldAlert,
  AlertTriangle,
  FileWarning,
  Activity,
  ArrowRight,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';

export const AdminDashboardPage: React.FC = () => {
  const { socket, joinIntersection } = useSocket();
  const [selectedIntersectionId, setSelectedIntersectionId] = useState<string>('');

  // Fetch Dashboard Statistics
  const {
    data: statsData,
    isLoading: statsLoading,
    error: statsError,
    refetch: refetchStats,
  } = useQuery({
    queryKey: ['adminDashboardStats'],
    queryFn: () => api.get<{ success: boolean; data: DashboardStats }>('/monitoring/dashboard-stats'),
  });

  // Fetch Intersections
  const {
    data: intersectionsData,
    isLoading: interLoading,
  } = useQuery({
    queryKey: ['adminIntersections'],
    queryFn: () => api.get<{ success: boolean; data: Intersection[] }>('/monitoring/intersections'),
  });

  // Fetch Recent Incidents
  const { data: incidentsData } = useQuery({
    queryKey: ['recentIncidents'],
    queryFn: () => api.get<{ success: boolean; data: TrafficIncident[] }>('/incidents'),
  });

  // Fetch Recent Problems
  const { data: problemsData } = useQuery({
    queryKey: ['recentProblems'],
    queryFn: () => api.get<{ success: boolean; data: TrafficProblemReport[] }>('/traffic-problems'),
  });

  const intersections = intersectionsData?.data || [];
  const stats = statsData?.data;

  // Set default selected intersection for live widget
  useEffect(() => {
    if (intersections.length > 0 && !selectedIntersectionId) {
      setSelectedIntersectionId(intersections[0].id);
      joinIntersection(intersections[0].id);
    }
  }, [intersections, selectedIntersectionId, joinIntersection]);

  const selectedIntersection = intersections.find((i) => i.id === selectedIntersectionId) || intersections[0];

  // Incident chart data
  const incidents = incidentsData?.data || [];
  const incidentChartData = [
    { name: 'Accidents', count: incidents.filter((i) => i.incidentType === 'ROAD_ACCIDENT').length },
    { name: 'Obstructions', count: incidents.filter((i) => i.incidentType === 'ROAD_OBSTRUCTION').length },
    { name: 'Emergency', count: incidents.filter((i) => i.incidentType === 'EMERGENCY_INTERVENTION').length },
    { name: 'Other', count: incidents.filter((i) => i.incidentType === 'OTHER').length },
  ];

  // Problem breakdown data
  const problems = problemsData?.data || [];
  const problemPieData = [
    { name: 'Violations', value: problems.filter((p) => p.category === 'TRAFFIC_VIOLATION').length, color: '#3b82f6' },
    { name: 'Technical', value: problems.filter((p) => p.category === 'TECHNICAL_INFRASTRUCTURE').length, color: '#f59e0b' },
  ];

  if (statsLoading || interLoading) {
    return <LoadingSkeleton rows={6} className="py-8" />;
  }

  if (statsError) {
    return <ErrorState message="Could not fetch dashboard metrics from the centralized server." onRetry={refetchStats} />;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Traffic Control Operations Command"
        subtitle="Real-time intersection monitoring, ESP32 status & operational analytics."
        action={
          <div className="flex items-center space-x-2">
            <Link
              to="/admin/monitoring"
              className="inline-flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold hover:bg-blue-700 transition-colors shadow-sm"
            >
              <Activity className="w-4 h-4" />
              <span>Full Live Monitor</span>
            </Link>
          </div>
        }
      />

      {/* Top Statistical Overview Cards (FR-1 to FR-11 metrics) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Intersections"
          value={stats?.totalIntersections ?? 0}
          subtitle={`${stats?.activeIntersections ?? 0} Active • ${stats?.inactiveIntersections ?? 0} Inactive`}
          icon={MapPin}
          variant="blue"
        />
        <StatCard
          title="ESP32 Controllers"
          value={`${stats?.onlineControllers ?? 0} / ${(stats?.onlineControllers ?? 0) + (stats?.offlineControllers ?? 0)}`}
          subtitle={`${stats?.onlineControllers ?? 0} Online • ${stats?.offlineControllers ?? 0} Offline`}
          icon={Wifi}
          variant={stats?.offlineControllers ? 'amber' : 'green'}
        />
        <StatCard
          title="Active Officers"
          value={stats?.activeOfficers ?? 0}
          subtitle={`${stats?.totalOfficers ?? 0} Registered Personnel`}
          icon={Users}
          variant="navy"
        />
        <StatCard
          title="Emergency Priority"
          value={stats?.activeEmergencies ?? 0}
          subtitle={stats?.activeEmergencies ? 'ACTIVE PREEMPTION ENGAGED' : 'Normal Signal Cycling'}
          icon={ShieldAlert}
          variant={stats?.activeEmergencies ? 'red' : 'green'}
        />
      </div>

      {/* Middle Row: Live Signal Monitor Widget & Interactive Map */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Live Signal Housing & Countdown Display */}
        <div className="lg:col-span-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center space-x-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>Live Crossroad Signal Stream</span>
            </h2>

            <select
              value={selectedIntersectionId}
              onChange={(e) => {
                setSelectedIntersectionId(e.target.value);
                joinIntersection(e.target.value);
              }}
              className="text-xs bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            >
              {intersections.map((inter) => (
                <option key={inter.id} value={inter.id}>
                  {inter.code} - {inter.name}
                </option>
              ))}
            </select>
          </div>

          <TrafficSignalDisplay
            status={selectedIntersection?.liveStatus}
            intersectionName={selectedIntersection?.name}
            intersectionCode={selectedIntersection?.code}
            isOffline={selectedIntersection?.controller?.connectionStatus === 'OFFLINE'}
          />
        </div>

        {/* Leaflet Map Overview */}
        <div className="lg:col-span-6 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
              Geographic Deployment Map
            </h2>
            <span className="text-xs text-slate-500 font-medium">Hosanna Regional Grid</span>
          </div>

          <IntersectionMapView
            intersections={intersections}
            onSelectIntersection={(inter) => {
              setSelectedIntersectionId(inter.id);
              joinIntersection(inter.id);
            }}
            className="flex-1 min-h-[360px]"
          />
        </div>
      </div>

      {/* Analytical Charts: Incidents & Problems */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7 bg-white p-6 rounded-2xl border border-slate-200/90 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Traffic Incidents by Category</h3>
              <p className="text-xs text-slate-500 mt-0.5">Accidents, obstructions, and road interventions</p>
            </div>
            <Link
              to="/admin/incidents"
              className="text-xs text-blue-600 hover:text-blue-700 font-semibold inline-flex items-center"
            >
              <span>View All</span>
              <ArrowRight className="w-3.5 h-3.5 ml-1" />
            </Link>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={incidentChartData}>
                <XAxis dataKey="name" stroke="#64748b" fontSize={11} />
                <YAxis allowDecimals={false} stroke="#64748b" fontSize={11} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    border: 'none',
                    borderRadius: '8px',
                    color: '#fff',
                    fontSize: '12px',
                  }}
                />
                <Bar dataKey="count" fill="#3b82f6" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="lg:col-span-5 bg-white p-6 rounded-2xl border border-slate-200/90 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Problem Reports Composition</h3>
              <p className="text-xs text-slate-500 mt-0.5">Violations vs Technical infrastructure</p>
            </div>
            <Link
              to="/admin/problems"
              className="text-xs text-blue-600 hover:text-blue-700 font-semibold inline-flex items-center"
            >
              <span>View All</span>
              <ArrowRight className="w-3.5 h-3.5 ml-1" />
            </Link>
          </div>

          <div className="h-64 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={problemPieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {problemPieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '11px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Recent Operational History Table */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-bold text-slate-900 text-sm">Recent Administrative & Operational Activities</h3>
            <p className="text-xs text-slate-500 mt-0.5">Traceable audit log of actions and overrides</p>
          </div>
          <Link
            to="/admin/audit-logs"
            className="text-xs text-blue-600 hover:text-blue-700 font-semibold inline-flex items-center"
          >
            <span>Complete Audit Trail</span>
            <ArrowRight className="w-3.5 h-3.5 ml-1" />
          </Link>
        </div>

        <div className="divide-y divide-slate-100 text-xs">
          {stats?.recentActivities && stats.recentActivities.length > 0 ? (
            stats.recentActivities.map((act) => (
              <div key={act.id} className="py-3 flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <span className="font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded text-[11px]">
                    {act.action.replace(/_/g, ' ')}
                  </span>
                  <span className="text-slate-600">{act.entityType} ({act.entityId || 'Global'})</span>
                </div>
                <div className="flex items-center space-x-4 text-slate-400">
                  <span>{act.userRole}</span>
                  <span>{new Date(act.createdAt).toLocaleString()}</span>
                </div>
              </div>
            ))
          ) : (
            <p className="text-center py-6 text-slate-400">No recent activities logged.</p>
          )}
        </div>
      </div>
    </div>
  );
};

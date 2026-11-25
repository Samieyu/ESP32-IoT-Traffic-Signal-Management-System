import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../api/client.js';
import { Intersection, DashboardStats, EmergencyOperation } from '../../types/index.js';
import { useAuth } from '../../context/AuthContext.js';
import { PageHeader } from '../../components/common/PageHeader.js';
import { StatCard } from '../../components/common/StatCard.js';
import { IntersectionCard } from '../../components/traffic/IntersectionCard.js';
import { LoadingSkeleton } from '../../components/common/LoadingSkeleton.js';
import { ErrorState } from '../../components/common/ErrorState.js';
import {
  MapPin,
  AlertTriangle,
  FileWarning,
  ShieldAlert,
  PlusCircle,
  Activity,
} from 'lucide-react';
import { Link } from 'react-router-dom';

export const PoliceDashboardPage: React.FC = () => {
  const { user } = useAuth();

  // Fetch Dashboard Stats (scoped for Traffic Police)
  const { data: statsData, isLoading: statsLoading, error, refetch } = useQuery({
    queryKey: ['policeDashboardStats'],
    queryFn: () => api.get<{ success: boolean; data: DashboardStats }>('/monitoring/dashboard-stats'),
  });

  // Fetch Assigned Intersections
  const { data: interData, isLoading: interLoading } = useQuery({
    queryKey: ['policeAssignedIntersections'],
    queryFn: () => api.get<{ success: boolean; data: Intersection[] }>('/monitoring/intersections'),
  });

  // Fetch Active Emergency Operations
  const { data: emergencyData } = useQuery({
    queryKey: ['policeActiveEmergencies'],
    queryFn: () =>
      api.get<{ success: boolean; data: EmergencyOperation[] }>('/emergency-priorities?status=ACTIVE'),
  });

  const stats = statsData?.data;
  const intersections = interData?.data || [];
  const activeEmergencies = emergencyData?.data || [];

  if (statsLoading || interLoading) return <LoadingSkeleton rows={5} className="py-8" />;
  if (error) return <ErrorState message="Could not load officer dashboard." onRetry={refetch} />;

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Welcome, ${user?.fullName || 'Officer'}`}
        subtitle="Traffic Police Field Command Portal • Department of Software Engineering"
        action={
          <div className="flex items-center space-x-2">
            <Link
              to="/police/emergency-priority"
              className="inline-flex items-center space-x-1.5 px-3.5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-colors shadow-sm"
            >
              <ShieldAlert className="w-3.5 h-3.5" />
              <span>Emergency Priority</span>
            </Link>

            <Link
              to="/police/incidents/new"
              className="inline-flex items-center space-x-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-colors shadow-sm"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>Record Incident</span>
            </Link>
          </div>
        }
      />

      {/* Active Preemption Emergency Alert Banner if any */}
      {activeEmergencies.length > 0 && (
        <div className="bg-rose-600 text-white p-4 rounded-2xl shadow-lg flex items-center justify-between animate-pulse">
          <div className="flex items-center space-x-3">
            <ShieldAlert className="w-6 h-6 text-white" />
            <div>
              <h4 className="font-bold text-sm">Emergency Signal Preemption in Progress</h4>
              <p className="text-xs text-rose-100">
                Priority green engaged at {activeEmergencies[0].intersection?.name || 'Intersection'}{' '}
                ({activeEmergencies[0].direction} Approach).
              </p>
            </div>
          </div>
          <Link
            to={`/police/emergency-priority?intersectionId=${activeEmergencies[0].intersectionId}`}
            className="px-4 py-2 bg-white text-rose-700 rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-rose-50"
          >
            Manage Operation
          </Link>
        </div>
      )}

      {/* Metric Cards (Scoped for Officer) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Assigned Crossings"
          value={intersections.length}
          subtitle="Authorized active posts"
          icon={MapPin}
          variant="blue"
        />
        <StatCard
          title="Controllers Online"
          value={`${stats?.onlineControllers ?? 0} / ${intersections.length}`}
          subtitle={`${stats?.offlineControllers ?? 0} Disconnected`}
          icon={Activity}
          variant={stats?.offlineControllers ? 'amber' : 'green'}
        />
        <StatCard
          title="Incidents Logged"
          value={stats?.totalIncidents ?? 0}
          subtitle="Accidents and obstructions"
          icon={AlertTriangle}
          variant="navy"
        />
        <StatCard
          title="Problems Reported"
          value={stats?.unresolvedProblems ?? 0}
          subtitle="Violations & hardware faults"
          icon={FileWarning}
          variant="amber"
        />
      </div>

      {/* Assigned Intersections Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900">Your Assigned Intersection Posts</h2>
            <p className="text-xs text-slate-500">Live signal and countdown states for your patrol area</p>
          </div>
          <Link
            to="/police/monitoring"
            className="text-xs font-bold text-blue-600 hover:text-blue-700"
          >
            View Live Telemetry
          </Link>
        </div>

        {intersections.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {intersections.map((inter) => (
              <IntersectionCard key={inter.id} intersection={inter} userRole="TRAFFIC_POLICE" />
            ))}
          </div>
        ) : (
          <div className="bg-white p-8 rounded-2xl border border-slate-200 text-center text-slate-400">
            <MapPin className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            <h4 className="font-bold text-slate-700 text-sm">No Intersection Assignments</h4>
            <p className="text-xs text-slate-500 mt-1">
              Contact your System Administrator to be assigned to specific intersection control posts.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../api/client.js';
import { User } from '../../types/index.js';
import { PageHeader } from '../../components/common/PageHeader.js';
import { StatusBadge } from '../../components/common/StatusBadge.js';
import { LoadingSkeleton } from '../../components/common/LoadingSkeleton.js';
import { ErrorState } from '../../components/common/ErrorState.js';
import { ArrowLeft, MapPin, AlertTriangle, FileWarning, ShieldAlert, Calendar, Mail, Phone, User as UserIcon } from 'lucide-react';

export const OfficerDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['officerDetails', id],
    queryFn: () => api.get<{ success: boolean; data: any }>(`/users/${id}`),
  });

  if (isLoading) return <LoadingSkeleton rows={5} className="py-8" />;
  if (error || !data?.data) return <ErrorState message="Officer not found or unauthorized." onRetry={refetch} />;

  const officer = data.data;

  return (
    <div className="space-y-6">
      <PageHeader
        title={officer.fullName}
        subtitle={`Traffic Police Officer • @${officer.username}`}
        breadcrumbs={[
          { label: 'Personnel', href: '/admin/traffic-police' },
          { label: officer.username },
        ]}
        action={
          <Link
            to="/admin/traffic-police"
            className="inline-flex items-center space-x-1.5 px-3.5 py-2 border border-slate-300 bg-white rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Personnel</span>
          </Link>
        }
      />

      {/* Main Profile Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Officer Card */}
        <div className="lg:col-span-4 bg-white p-6 rounded-2xl border border-slate-200/90 shadow-sm space-y-4">
          <div className="flex items-center space-x-3 pb-4 border-b border-slate-100">
            <div className="w-12 h-12 rounded-2xl bg-blue-600 text-white font-bold text-lg flex items-center justify-center uppercase shadow-md shadow-blue-500/20">
              {officer.fullName.charAt(0)}
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">{officer.fullName}</h3>
              <div className="flex items-center space-x-2 mt-1">
                <StatusBadge status={officer.status} />
                <span className="text-xs text-slate-400 font-mono">@{officer.username}</span>
              </div>
            </div>
          </div>

          <div className="space-y-3 text-xs text-slate-600">
            <div className="flex items-center space-x-2.5">
              <Mail className="w-4 h-4 text-slate-400" />
              <span>{officer.email}</span>
            </div>
            <div className="flex items-center space-x-2.5">
              <Phone className="w-4 h-4 text-slate-400" />
              <span>{officer.phoneNumber || 'No phone number on record'}</span>
            </div>
            <div className="flex items-center space-x-2.5">
              <Calendar className="w-4 h-4 text-slate-400" />
              <span>Registered: {new Date(officer.createdAt).toLocaleDateString()}</span>
            </div>
            <div className="flex items-center space-x-2.5">
              <UserIcon className="w-4 h-4 text-slate-400" />
              <span>Last Login: {officer.lastLoginAt ? new Date(officer.lastLoginAt).toLocaleString() : 'Never'}</span>
            </div>
          </div>
        </div>

        {/* Operational Statistics */}
        <div className="lg:col-span-8 space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center space-x-3">
              <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Incidents Logged</p>
                <h4 className="text-2xl font-bold text-slate-900">{officer.stats?.totalIncidentsReported ?? 0}</h4>
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center space-x-3">
              <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
                <FileWarning className="w-6 h-6" />
              </div>
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Problems Reported</p>
                <h4 className="text-2xl font-bold text-slate-900">{officer.stats?.totalProblemsReported ?? 0}</h4>
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center space-x-3">
              <div className="p-3 bg-rose-50 text-rose-600 rounded-xl">
                <ShieldAlert className="w-6 h-6" />
              </div>
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Emergency Priority</p>
                <h4 className="text-2xl font-bold text-slate-900">{officer.stats?.totalEmergencyInterventions ?? 0}</h4>
              </div>
            </div>
          </div>

          {/* Assigned Intersections Card */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <h3 className="font-bold text-slate-900 text-sm mb-3">Assigned Crossroad Locations</h3>
            {officer.assignments && officer.assignments.length > 0 ? (
              <div className="divide-y divide-slate-100">
                {officer.assignments.map((asg: any) => (
                  <div key={asg.id} className="py-3 flex items-center justify-between text-xs">
                    <div className="flex items-center space-x-2.5">
                      <MapPin className="w-4 h-4 text-blue-500" />
                      <div>
                        <span className="font-bold text-slate-800">{asg.intersectionName}</span>
                        <span className="text-slate-400 font-mono ml-2">({asg.intersectionCode})</span>
                      </div>
                    </div>
                    <span className="text-slate-400">Assigned {new Date(asg.assignedAt).toLocaleDateString()}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-400 italic">No active intersection assignments assigned to this officer.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

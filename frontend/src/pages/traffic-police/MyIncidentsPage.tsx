import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../api/client.js';
import { TrafficIncident } from '../../types/index.js';
import { PageHeader } from '../../components/common/PageHeader.js';
import { DataTable, Column } from '../../components/common/DataTable.js';
import { StatusBadge } from '../../components/common/StatusBadge.js';
import { LoadingSkeleton } from '../../components/common/LoadingSkeleton.js';
import { ErrorState } from '../../components/common/ErrorState.js';
import { Plus, AlertTriangle, Eye, Calendar, MapPin } from 'lucide-react';
import { Link } from 'react-router-dom';

export const MyIncidentsPage: React.FC = () => {
  const [typeFilter, setTypeFilter] = useState<string>('');

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['myIncidents', typeFilter],
    queryFn: () =>
      api.get<{ success: boolean; data: TrafficIncident[] }>(
        `/incidents${typeFilter ? `?type=${typeFilter}` : ''}`
      ),
  });

  const incidents = data?.data || [];

  const columns: Column<TrafficIncident>[] = [
    {
      header: 'Reference ID',
      cell: (item) => (
        <span className="font-mono text-xs font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
          {item.referenceId}
        </span>
      ),
    },
    {
      header: 'Type & Description',
      cell: (item) => (
        <div>
          <span className="font-bold text-slate-800 block text-xs">
            {item.incidentType.replace(/_/g, ' ')}
          </span>
          <span className="text-xs text-slate-500 line-clamp-1">{item.description}</span>
        </div>
      ),
    },
    {
      header: 'Intersection',
      cell: (item) => (
        <span className="text-xs font-medium text-slate-700">
          {item.intersection?.name || 'Assigned Crossing'}
        </span>
      ),
    },
    {
      header: 'Severity',
      cell: (item) => <StatusBadge status={item.severity} />,
    },
    {
      header: 'Status',
      cell: (item) => <StatusBadge status={item.status} />,
    },
    {
      header: 'Occurred At',
      cell: (item) => (
        <span className="text-xs text-slate-500">
          {new Date(item.incidentTimestamp).toLocaleString()}
        </span>
      ),
    },
  ];

  if (isLoading) return <LoadingSkeleton rows={5} className="py-8" />;
  if (error) return <ErrorState message="Could not load your incident records." onRetry={refetch} />;

  return (
    <div className="space-y-6">
      <PageHeader
        title="My Recorded Traffic Incidents"
        subtitle="Review incident logs and accident reports submitted from your assigned intersection posts."
        action={
          <Link
            to="/police/incidents/new"
            className="inline-flex items-center space-x-1.5 px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold hover:bg-blue-700 shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Record New Incident</span>
          </Link>
        }
      />

      <DataTable
        columns={columns}
        data={incidents}
        searchPlaceholder="Search incidents by reference ID or description..."
        searchFilter={(item, q) =>
          item.referenceId.toLowerCase().includes(q) ||
          item.description.toLowerCase().includes(q) ||
          item.incidentType.toLowerCase().includes(q)
        }
      />
    </div>
  );
};

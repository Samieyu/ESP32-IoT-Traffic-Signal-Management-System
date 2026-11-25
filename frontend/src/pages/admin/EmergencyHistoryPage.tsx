import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../api/client.js';
import { EmergencyOperation } from '../../types/index.js';
import { PageHeader } from '../../components/common/PageHeader.js';
import { DataTable, Column } from '../../components/common/DataTable.js';
import { StatusBadge } from '../../components/common/StatusBadge.js';
import { LoadingSkeleton } from '../../components/common/LoadingSkeleton.js';
import { ErrorState } from '../../components/common/ErrorState.js';
import { ShieldAlert, Clock } from 'lucide-react';

export const EmergencyHistoryPage: React.FC = () => {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['emergencyHistoryList'],
    queryFn: () => api.get<{ success: boolean; data: EmergencyOperation[] }>('/emergency-priorities'),
  });

  const operations = data?.data || [];

  const columns: Column<EmergencyOperation>[] = [
    {
      header: 'Reference ID',
      cell: (item) => (
        <span className="font-mono text-xs font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
          {item.referenceId}
        </span>
      ),
    },
    {
      header: 'Intersection',
      cell: (item) => (
        <span className="text-xs font-bold text-slate-800">
          {item.intersection?.name || 'Intersection'}
        </span>
      ),
    },
    {
      header: 'Direction & Movement',
      cell: (item) => (
        <span className="text-xs font-bold text-slate-700">
          {item.direction} Approach ({item.movement})
        </span>
      ),
    },
    {
      header: 'Officer',
      cell: (item) => (
        <span className="text-xs text-slate-600">{item.officer?.fullName || 'Field Officer'}</span>
      ),
    },
    {
      header: 'Status',
      cell: (item) => <StatusBadge status={item.status} type="emergency" />,
    },
    {
      header: 'Active Duration',
      cell: (item) => (
        <span className="text-xs font-mono">
          {item.actualDurationSeconds ?? item.maxDurationSeconds}s
        </span>
      ),
    },
    {
      header: 'Requested At',
      cell: (item) => (
        <span className="text-xs text-slate-500">
          {new Date(item.requestedAt).toLocaleString()}
        </span>
      ),
    },
  ];

  if (isLoading) return <LoadingSkeleton rows={5} className="py-8" />;
  if (error) return <ErrorState message="Could not load emergency logs." onRetry={refetch} />;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Emergency Priority Intervention History"
        subtitle="Complete traceable record of green-wave preemption requests, activation durations, and terminations (FR-8, NFR-16)."
      />

      <DataTable
        columns={columns}
        data={operations}
        searchPlaceholder="Search emergency logs by reference ID, direction, or crossing..."
        searchFilter={(item, q) =>
          item.referenceId.toLowerCase().includes(q) ||
          item.direction.toLowerCase().includes(q) ||
          (item.intersection?.name && item.intersection.name.toLowerCase().includes(q))
        }
      />
    </div>
  );
};
